#!/usr/bin/env python3
"""
Pronósticos Elo — genera data.json para el widget del blog.

1. Descarga resultados de las últimas temporadas y los próximos partidos (con cuotas)
   de football-data.co.uk (gratis, sin API key).
2. Calcula un rating Elo para cada equipo.
3. Convierte la diferencia de Elo en probabilidades 1X2 calibradas con el histórico.
4. Compara con las cuotas del mercado: si nuestra probabilidad x cuota > 1 hay "valor".
5. Asigna confianza 1-10, guarda los pronósticos y liquida los antiguos (aciertos y beneficio).

Solo usa la librería estándar de Python.
"""
import csv
import io
import json
import math
import os
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone

BASE = "https://www.football-data.co.uk"
OUT_DIR = os.environ.get("OUT_DIR", os.path.dirname(os.path.abspath(__file__)))
LOCAL_DIR = os.environ.get("LOCAL_DATA")  # para pruebas sin internet

# Ligas principales (archivo por temporada) -> (nombre, país ISO para la bandera, nivel)
MAIN_LEAGUES = {
    "SP1": ("LaLiga", "es", 1), "SP2": ("LaLiga Hypermotion", "es", 2),
    "E0": ("Premier League", "gb-eng", 1), "E1": ("Championship", "gb-eng", 2),
    "E2": ("League One", "gb-eng", 3), "E3": ("League Two", "gb-eng", 4),
    "EC": ("National League", "gb-eng", 5),
    "D1": ("Bundesliga", "de", 1), "D2": ("2. Bundesliga", "de", 2),
    "I1": ("Serie A", "it", 1), "I2": ("Serie B", "it", 2),
    "F1": ("Ligue 1", "fr", 1), "F2": ("Ligue 2", "fr", 2),
    "N1": ("Eredivisie", "nl", 1), "B1": ("Pro League", "be", 1),
    "P1": ("Liga Portugal", "pt", 1), "T1": ("Süper Lig", "tr", 1),
    "G1": ("Super League", "gr", 1),
    "SC0": ("Premiership", "gb-sct", 1), "SC1": ("Championship", "gb-sct", 2),
    "SC2": ("League One", "gb-sct", 3), "SC3": ("League Two", "gb-sct", 4),
}
# Ligas "extra" (un archivo con todas las temporadas) -> código propio
EXTRA_LEAGUES = {
    "ARG": ("Liga Profesional", "ar"), "AUT": ("Bundesliga", "at"),
    "BRA": ("Brasileirão", "br"), "CHN": ("Super League", "cn"),
    "DNK": ("Superliga", "dk"), "FIN": ("Veikkausliiga", "fi"),
    "IRL": ("Premier Division", "ie"), "JPN": ("J1 League", "jp"),
    "MEX": ("Liga MX", "mx"), "NOR": ("Eliteserien", "no"),
    "POL": ("Ekstraklasa", "pl"), "ROU": ("Liga I", "ro"),
    "RUS": ("Premier League", "ru"), "SWE": ("Allsvenskan", "se"),
    "SWZ": ("Super League", "ch"), "USA": ("MLS", "us"),
}

# Parámetros del modelo
K = 20.0
HOME_ADV = 60.0
START_BY_TIER = {1: 1550.0, 2: 1450.0, 3: 1380.0, 4: 1330.0, 5: 1280.0}
SEASONS_BACK = 3
MIN_ODDS, MAX_ODDS = 1.30, 6.00
HISTORY_KEEP = 2000
MODEL_W = 0.45  # peso del Elo frente a la probabilidad implícita del mercado


# ---------------------------------------------------------------- utilidades
def log(*a):
    print(*a, file=sys.stderr, flush=True)


def fetch(path):
    """Descarga un CSV (o lo lee de LOCAL_DATA en pruebas). Devuelve lista de dicts."""
    if LOCAL_DIR:
        fp = os.path.join(LOCAL_DIR, path.replace("/", "_"))
        if not os.path.exists(fp):
            return []
        with open(fp, "rb") as f:
            raw = f.read()
    else:
        req = urllib.request.Request(BASE + "/" + path, headers={"User-Agent": "Mozilla/5.0 pronosticos-elo"})
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                raw = r.read()
        except Exception as e:  # noqa
            log("  ! no se pudo descargar", path, e)
            return []
    for enc in ("utf-8-sig", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    rows = list(csv.DictReader(io.StringIO(text)))
    clean = []
    for r in rows:
        r = {(k or "").strip().lstrip("﻿"): (v or "").strip() for k, v in r.items() if k}
        clean.append(r)
    return clean


def parse_date(s):
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except (ValueError, TypeError):
            pass
    return None


def fnum(r, *keys):
    for k in keys:
        v = r.get(k)
        if v:
            try:
                x = float(v)
                if x > 1.0:
                    return x
            except ValueError:
                pass
    return None


def odds_of(r):
    """Cuotas 1X2: media de mercado si existe, si no Pinnacle / Bet365 / máximas."""
    groups = [("AvgH", "AvgD", "AvgA"), ("BbAvH", "BbAvD", "BbAvA"), ("PSH", "PSD", "PSA"),
              ("B365H", "B365D", "B365A"), ("MaxH", "MaxD", "MaxA"),
              ("AvgCH", "AvgCD", "AvgCA"), ("PSCH", "PSCD", "PSCA")]
    for g in groups:
        o = [fnum(r, k) for k in g]
        if all(o):
            return o
    return None


def season_codes(today):
    start = today.year if today.month >= 7 else today.year - 1
    codes = []
    for i in range(SEASONS_BACK - 1, -1, -1):
        y = start - i
        codes.append(f"{y % 100:02d}{(y + 1) % 100:02d}")
    return codes


# ---------------------------------------------------------------- carga de datos
def load_results(today):
    """Partidos jugados de todas las ligas, ordenados por fecha."""
    matches = []
    for code in season_codes(today):
        for div, (_, _, tier) in MAIN_LEAGUES.items():
            rows = fetch(f"mmz4281/{code}/{div}.csv")
            n = 0
            for r in rows:
                d = parse_date(r.get("Date"))
                hg, ag = r.get("FTHG"), r.get("FTAG")
                if not d or hg in (None, "") or ag in (None, ""):
                    continue
                try:
                    hg, ag = int(float(hg)), int(float(ag))
                except ValueError:
                    continue
                matches.append({"lg": div, "tier": tier, "date": d, "time": r.get("Time", ""),
                                "home": r["HomeTeam"], "away": r["AwayTeam"], "hg": hg, "ag": ag})
                n += 1
            if n:
                log(f"  {code} {div}: {n} partidos")
    for lg in EXTRA_LEAGUES:
        rows = fetch(f"new/{lg}.csv")
        cutoff = today - timedelta(days=365 * SEASONS_BACK)
        n = 0
        for r in rows:
            d = parse_date(r.get("Date"))
            if not d or d < cutoff:
                continue
            try:
                hg, ag = int(float(r.get("HG", ""))), int(float(r.get("AG", "")))
            except ValueError:
                continue
            matches.append({"lg": lg, "tier": 1, "date": d, "time": r.get("Time", ""),
                            "home": r["Home"], "away": r["Away"], "hg": hg, "ag": ag})
            n += 1
        if n:
            log(f"  {lg}: {n} partidos")
    matches.sort(key=lambda m: (m["date"], m["time"]))
    return matches


def load_fixtures(today):
    fx = []
    for path, hk, ak, lgk in (("fixtures.csv", "HomeTeam", "AwayTeam", "Div"),
                              ("new_league_fixtures.csv", "Home", "Away", None)):
        for r in fetch(path):
            d = parse_date(r.get("Date"))
            if not d or d < today or d > today + timedelta(days=8):
                continue
            if lgk:
                lg = r.get(lgk)
            else:
                lg = next((c for c, (n, _) in EXTRA_LEAGUES.items()
                           if r.get("Country", "").lower().startswith(_country_word(c))), None)
                lg = r.get("Div") or lg
            if lg not in MAIN_LEAGUES and lg not in EXTRA_LEAGUES:
                continue
            o = odds_of(r)
            if not o:
                continue
            fx.append({"lg": lg, "date": d, "time": r.get("Time", ""),
                       "home": r.get(hk, ""), "away": r.get(ak, ""), "odds": o})
    log(f"  próximos partidos con cuotas: {len(fx)}")
    return fx


def _country_word(code):
    return {"ARG": "argentina", "AUT": "austria", "BRA": "brazil", "CHN": "china", "DNK": "denmark",
            "FIN": "finland", "IRL": "ireland", "JPN": "japan", "MEX": "mexico", "NOR": "norway",
            "POL": "poland", "ROU": "romania", "RUS": "russia", "SWE": "sweden",
            "SWZ": "switzerland", "USA": "usa"}[code]


# ---------------------------------------------------------------- modelo Elo
def g_mult(gd):
    gd = abs(gd)
    if gd <= 1:
        return 1.0
    if gd == 2:
        return 1.5
    return (11 + gd) / 8.0


def run_elo(matches):
    elo = {}
    trend = defaultdict(list)          # cambios recientes de Elo por equipo
    last_league = {}
    games = defaultdict(int)
    calib = []                         # (diferencia Elo con ventaja local, resultado)
    league_avg = defaultdict(list)
    for m in matches:
        h, a = m["home"], m["away"]
        start = START_BY_TIER.get(m["tier"], 1300.0)
        if m["lg"] in EXTRA_LEAGUES:
            start = 1500.0
        rh, ra = elo.get(h, start), elo.get(a, start)
        dr = rh + HOME_ADV - ra
        exp_h = 1.0 / (1.0 + 10 ** (-dr / 400.0))
        res = 1.0 if m["hg"] > m["ag"] else (0.5 if m["hg"] == m["ag"] else 0.0)
        if games[h] >= 5 and games[a] >= 5:
            calib.append((dr, "H" if res == 1 else ("D" if res == 0.5 else "A")))
        delta = K * g_mult(m["hg"] - m["ag"]) * (res - exp_h)
        elo[h], elo[a] = rh + delta, ra - delta
        trend[h].append(delta)
        trend[a].append(-delta)
        trend[h] = trend[h][-5:]
        trend[a] = trend[a][-5:]
        games[h] += 1
        games[a] += 1
        last_league[h] = m["lg"]
        last_league[a] = m["lg"]
    return elo, trend, last_league, games, calib


class Calibrator:
    """Probabilidades 1X2 según la diferencia de Elo, a partir de lo que pasó en el histórico."""

    def __init__(self, calib):
        self.data = sorted(calib)
        self.n = len(self.data)

    def probs(self, dr):
        if self.n < 300:  # sin histórico suficiente: fórmula genérica
            e = 1.0 / (1.0 + 10 ** (-dr / 400.0))
            pd = max(0.16, 0.29 - 0.00035 * abs(dr))
            ph = max(0.02, e - pd / 2)
            pa = max(0.02, 1 - ph - pd)
            s = ph + pd + pa
            return ph / s, pd / s, pa / s
        # los ~600 partidos más parecidos en diferencia de Elo, ponderados por cercanía
        import bisect
        i = bisect.bisect_left(self.data, (dr, ""))
        w = min(300, self.n // 2)
        lo, hi = max(0, i - w), min(self.n, i + w)
        cnt = {"H": 1.0, "D": 1.0, "A": 1.0}
        bw = max(40.0, abs(self.data[hi - 1][0] - self.data[lo][0]) / 2)
        for d, r in self.data[lo:hi]:
            cnt[r] += math.exp(-((d - dr) / bw) ** 2)
        s = sum(cnt.values())
        return cnt["H"] / s, cnt["D"] / s, cnt["A"] / s


def confidence(edge, prob, sel="1", odds=2.0):
    """Confianza 1-10 a partir del valor (edge) y de lo probable que es el pronóstico."""
    if edge <= 0:
        return max(1, min(4, int(4 + edge * 20)))
    c = 5 + edge / 0.03
    if prob < 0.30:
        c -= 1.5
    elif prob > 0.55:
        c += 0.5
    if sel == "X":  # el empate es lo más difícil de acertar
        c -= 1.5
    if odds > 4.0:  # cuotas altas: más varianza
        c -= 1.0
    return max(5, min(10, int(round(c))))


def arrow(team, trend):
    s = sum(trend.get(team, []))
    return 1 if s > 8 else (-1 if s < -8 else 0)


# ---------------------------------------------------------------- historial de pronósticos
def key_of(lg, d, h, a):
    return f"{lg}|{d}|{h}|{a}"


def settle(history, matches):
    res = {key_of(m["lg"], m["date"].isoformat(), m["home"], m["away"]): m for m in matches}
    for p in history:
        if p.get("result"):
            continue
        m = res.get(p["key"])
        if not m:
            continue
        out = "1" if m["hg"] > m["ag"] else ("X" if m["hg"] == m["ag"] else "2")
        p["score"] = f'{m["hg"]}-{m["ag"]}'
        p["result"] = out
        p["win"] = out == p["pick"]
        p["profit"] = round(p["pick_odds"] - 1, 2) if p["win"] else -1.0


def stats(picks):
    if not picks:
        return {"n": 0, "hits": 0, "hit_rate": 0, "profit": 0, "roi": 0, "avg_odds": 0}
    hits = sum(1 for p in picks if p["win"])
    profit = sum(p["profit"] for p in picks)
    return {"n": len(picks), "hits": hits, "hit_rate": round(100 * hits / len(picks), 1),
            "profit": round(profit, 2), "roi": round(100 * profit / len(picks), 1),
            "avg_odds": round(sum(p["pick_odds"] for p in picks) / len(picks), 2)}


# ---------------------------------------------------------------- principal
def league_info(lg):
    if lg in MAIN_LEAGUES:
        n, c, _ = MAIN_LEAGUES[lg]
    else:
        n, c = EXTRA_LEAGUES[lg]
    return n, c


def main():
    now = datetime.now(timezone.utc)
    today = now.date()
    log("Descargando resultados…")
    matches = load_results(today)
    if len(matches) < 500:
        log("Muy pocos partidos descargados; no se actualiza nada.")
        sys.exit(1)
    log(f"Total partidos: {len(matches)}")
    elo, trend, last_league, games, calib = run_elo(matches)
    cal = Calibrator(calib)

    hist_path = os.path.join(OUT_DIR, "history.json")
    history = []
    if os.path.exists(hist_path):
        with open(hist_path, encoding="utf-8") as f:
            history = json.load(f)
    settle(history, matches)

    log("Descargando próximos partidos…")
    fixtures = load_fixtures(today)
    upcoming = []
    for fx in fixtures:
        h, a, lg = fx["home"], fx["away"], fx["lg"]
        if games.get(h, 0) < 5 or games.get(a, 0) < 5:
            continue
        rh, ra = elo[h], elo[a]
        ph, pd, pa = cal.probs(rh + HOME_ADV - ra)
        oh, od, oa = fx["odds"]
        inv = [1 / oh, 1 / od, 1 / oa]
        over = sum(inv)
        imp = [x / over for x in inv]
        # mezcla modelo + mercado: el mercado sabe cosas que el Elo no (lesiones, rotaciones…)
        bh, bd, ba = (MODEL_W * m + (1 - MODEL_W) * i for m, i in zip((ph, pd, pa), imp))
        cands = []
        for sel, p, o in (("1", bh, oh), ("X", bd, od), ("2", ba, oa)):
            if MIN_ODDS <= o <= MAX_ODDS:
                cands.append((p * o - 1, sel, p, o))
        if not cands:
            continue
        edge, sel, p, o = max(cands)
        conf = confidence(edge, p, sel, o)
        lname, flag = league_info(lg)
        item = {
            "key": key_of(lg, fx["date"].isoformat(), h, a),
            "date": fx["date"].isoformat(), "time": fx["time"], "lg": lg,
            "league": lname, "flag": flag, "home": h, "away": a,
            "elo_h": round(rh), "elo_a": round(ra),
            "tr_h": arrow(h, trend), "tr_a": arrow(a, trend),
            "odds": [round(oh, 2), round(od, 2), round(oa, 2)],
            "prob": [round(100 * ph, 1), round(100 * pd, 1), round(100 * pa, 1)],
            "imp": [round(100 * x, 1) for x in imp],
            "pick": sel, "pick_odds": round(o, 2), "pick_prob": round(100 * p, 1),
            "edge": round(100 * edge, 1), "conf": conf,
        }
        upcoming.append(item)
    upcoming.sort(key=lambda x: (x["date"], x["time"], -x["conf"]))
    log(f"Pronósticos generados: {len(upcoming)}")

    # guardar pronósticos con valor (conf >= 6) en el historial para medir aciertos
    known = {p["key"] for p in history}
    for u in upcoming:
        if u["conf"] >= 6 and u["key"] not in known:
            history.append({k: u[k] for k in ("key", "date", "time", "lg", "league", "flag", "home",
                                              "away", "pick", "pick_odds", "pick_prob", "edge", "conf")}
                           | {"created": now.isoformat(timespec="minutes")})
        elif u["conf"] >= 6:  # actualizar cuota si aún no se ha jugado
            for p in history:
                if p["key"] == u["key"] and not p.get("result"):
                    p["pick_odds"], p["conf"], p["edge"] = u["pick_odds"], u["conf"], u["edge"]
    history.sort(key=lambda p: (p["date"], p.get("time", "")))
    history = history[-HISTORY_KEEP:]

    settled = [p for p in history if p.get("result")]
    sure = [p for p in settled if p["conf"] >= 8]
    month = today.strftime("%Y-%m")

    # ranking Elo por liga (top 20) y general
    by_league = defaultdict(list)
    for t, lg in last_league.items():
        if games[t] >= 10:
            by_league[lg].append((round(elo[t]), t, arrow(t, trend)))
    leagues = []
    for lg in list(MAIN_LEAGUES) + list(EXTRA_LEAGUES):
        if lg not in by_league:
            continue
        n, c = league_info(lg)
        tbl = sorted(by_league[lg], reverse=True)[:24]
        leagues.append({"lg": lg, "league": n, "flag": c,
                        "teams": [{"team": t, "elo": e, "tr": tr} for e, t, tr in tbl]})
    top = sorted(((round(elo[t]), t, last_league[t]) for t in last_league if games[t] >= 10),
                 reverse=True)[:30]

    data = {
        "generated": now.isoformat(timespec="minutes"),
        "upcoming": upcoming,
        "recent": list(reversed(settled[-120:])),
        "stats": {
            "all_250": stats(settled[-250:]),
            "sure_250": stats(sure[-250:]),
            "month": stats([p for p in settled if p["date"].startswith(month)]),
            "sure_month": stats([p for p in sure if p["date"].startswith(month)]),
        },
        "top": [{"team": t, "elo": e, "lg": lg, "league": league_info(lg)[0], "flag": league_info(lg)[1]}
                for e, t, lg in top],
        "leagues": leagues,
        "model": {"k": K, "home_adv": HOME_ADV, "matches": len(matches), "calib": len(calib)},
    }
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "data.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    with open(hist_path, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=0)
    log("OK: data.json y history.json actualizados")


if __name__ == "__main__":
    main()
