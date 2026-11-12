# Tuodaan tarvittavat kirjastot
from flask import Flask, request, jsonify, session, redirect, abort
from functools import wraps
from contextlib import closing
from html import escape
from getpass import getpass
from email.message import EmailMessage
from urllib.parse import urlsplit
import hashlib
import hmac
import os
import re
import secrets
import smtplib
import ssl
import sqlite3
import json
import sys
import time
from werkzeug.security import generate_password_hash, check_password_hash

# Luodaan Flask-sovellus
app = Flask(__name__)
app.secret_key = os.environ.get("FULLA_SECRET_KEY") or secrets.token_hex(32)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("FULLA_HTTPS") == "1",
    MAX_CONTENT_LENGTH=64 * 1024,
)
if not os.environ.get("FULLA_SECRET_KEY"):
    app.logger.warning("FULLA_SECRET_KEY puuttuu: istunnot päättyvät palvelimen käynnistyessä uudelleen.")


ROOLIT = ("asiakas", "tyontekija", "admin")
HANKKEET = ("talous", "psyykkinen")
OMISTAJA_SAHKOPOSTI = "rozelinaahmad@gmail.com"


def kelvollinen_sahkoposti(arvo):
    return len(arvo) <= 254 and re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", arvo) is not None


def kelvollinen_puhelin(arvo):
    return 5 <= len(arvo) <= 32 and re.fullmatch(r"[+0-9 ()-]+", arvo) is not None and any(c.isdigit() for c in arvo)

def csrf_token():
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_urlsafe(32)
    return session["csrf_token"]


@app.before_request
def tarkista_sessio_ja_csrf():
    if "kayttaja_id" in session:
        conn = get_db()
        try:
            kayttaja = conn.execute(
                "SELECT kayttajanimi, rooli, hanke, aktiivinen, istunto_versio FROM kayttajat WHERE id = ?",
                (session["kayttaja_id"],),
            ).fetchone()
        finally:
            conn.close()
        if (not kayttaja or not kayttaja["aktiivinen"]
                or session.get("istunto_versio") != kayttaja["istunto_versio"]):
            session.clear()
        else:
            session["kayttaja_nimi"] = kayttaja["kayttajanimi"]
            session["rooli"] = kayttaja["rooli"]
            session["hanke"] = kayttaja["hanke"]

    if request.method in ("POST", "PATCH", "DELETE", "PUT"):
        token = request.headers.get("X-CSRF-Token") or request.form.get("csrf_token", "")
        odotettu = session.get("csrf_token", "")
        if not odotettu or not hmac.compare_digest(token.encode("utf-8"), odotettu.encode("utf-8")):
            return jsonify({"virhe": "Virheellinen CSRF-tunniste. Päivitä sivu ja yritä uudelleen."}), 403


@app.after_request
def tietoturvaotsakkeet(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Cache-Control"] = "no-store"
    return response


def nayta_sivu(tiedosto):
    with open(tiedosto, encoding="utf-8") as sivu:
        return sivu.read().replace("CSRF_TOKEN_TAHAN", csrf_token())


# Sallii pääsyn vain kirjautuneelle admin-käyttäjälle (rooli tarkistetaan tietokannasta)
def admin_vaaditaan(f):
    @wraps(f)
    def kaare(*args, **kwargs):
        api = request.path.startswith(("/kayttajat", "/varaukset"))
        if "kayttaja_id" not in session:
            if api:
                return jsonify({"virhe": "Kirjaudu ensin sisään."}), 401
            return redirect("/kirjaudu")
        conn = get_db()
        k = conn.execute(
            "SELECT rooli, aktiivinen FROM kayttajat WHERE id = ?", (session["kayttaja_id"],)
        ).fetchone()
        conn.close()
        if not k or k["rooli"] != "admin" or not k["aktiivinen"]:
            if api:
                return jsonify({"virhe": "Vain ylläpitäjä voi tehdä tämän."}), 403
            return redirect("/")
        return f(*args, **kwargs)
    return kaare


# Tämä funktio avaa yhteyden tietokantaan
def get_db():
    conn = sqlite3.connect("varaukset.db", timeout=10)
    conn.row_factory = sqlite3.Row  # mahdollistaa dict(row) käytön
    conn.execute("PRAGMA journal_mode=WAL")  # sallii samanaikaiset luku/kirjoitusyhteydet
    return conn


# Tämä funktio luo tietokantataulut (vain kerran, jos ei ole vielä)
def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS varaukset (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            nimi            TEXT,
            sahkoposti      TEXT,
            puhelin         TEXT,
            paiva           TEXT,
            aika            TEXT DEFAULT '',
            hanke           TEXT,
            aihe            TEXT,
            tila            TEXT DEFAULT 'odottaa',
            tyontekija_nimi TEXT DEFAULT NULL,
            asiakas_id      INTEGER DEFAULT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS kayttajat (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            kayttajanimi  TEXT NOT NULL UNIQUE,
            sahkoposti    TEXT NOT NULL UNIQUE,
            puhelin       TEXT DEFAULT NULL,
            rooli         TEXT NOT NULL DEFAULT 'asiakas',
            hanke         TEXT DEFAULT NULL,
            salasana_hash TEXT NOT NULL,
            luotu         TEXT DEFAULT (datetime('now', 'localtime')),
            aktiivinen    INTEGER DEFAULT 1,
            istunto_versio INTEGER NOT NULL DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS salasanan_palautukset (
            kayttaja_id INTEGER PRIMARY KEY,
            tunniste_hash TEXT NOT NULL UNIQUE,
            istunto_versio INTEGER NOT NULL,
            rooli TEXT NOT NULL,
            luotu INTEGER NOT NULL,
            vanhenee INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()


# Lisää puuttuvat sarakkeet olemassaolevaan tietokantaan (tarvitaan päivityksessä)
def migrate_db():
    conn = get_db()
    uudet = [
        ("varaukset", "aika",            "TEXT DEFAULT ''"),
        ("varaukset", "tila",            "TEXT DEFAULT 'odottaa'"),
        ("varaukset", "tyontekija_nimi", "TEXT DEFAULT NULL"),
        ("varaukset", "asiakas_id",      "INTEGER DEFAULT NULL"),
        ("kayttajat", "hanke",           "TEXT DEFAULT NULL"),
        ("kayttajat", "puhelin",         "TEXT DEFAULT NULL"),
        ("kayttajat", "istunto_versio",  "INTEGER NOT NULL DEFAULT 0"),
    ]
    for taulu, sarake, maaritelma in uudet:
        sarakkeet = {r["name"] for r in conn.execute(f"PRAGMA table_info({taulu})")}
        if sarake not in sarakkeet:
            conn.execute(f"ALTER TABLE {taulu} ADD COLUMN {sarake} {maaritelma}")
    # Muunnetaan vanhat tekstimuotoiset hanke-arvot uuteen formaattiin
    conn.execute("UPDATE varaukset SET hanke = 'talous' WHERE hanke LIKE '%Talous%' OR hanke LIKE '%Financial%' OR hanke LIKE '%\u0645\u0627\u0644\u064a%'")
    conn.execute("UPDATE varaukset SET hanke = 'psyykkinen' WHERE hanke LIKE '%Psyykkinen%' OR hanke LIKE '%Mental%' OR hanke LIKE '%\u0646\u0641\u0633\u064a%'")
    conn.execute("UPDATE varaukset SET hanke = 'muu' WHERE hanke LIKE '%muuhun%' OR hanke LIKE '%Something Else%' OR hanke LIKE '%\u0622\u062e\u0631%'")
    conn.execute("UPDATE kayttajat SET rooli = 'asiakas' WHERE rooli = 'user'")
    conn.commit()
    conn.close()


# Rekisteröitymissivu – uusi käyttäjä luo profiilin tässä
@app.route("/rekisteroidy", methods=["GET", "POST"])
def rekisteroidy():
    # POST: käsitellään lomake kun käyttäjä painaa "Luo profiili"
    if request.method == "POST":
        nimi       = request.form.get("nimi", "").strip()
        sahkoposti = request.form.get("sahkoposti", "").strip().lower()
        puhelin    = request.form.get("puhelin", "").strip()
        salasana   = request.form.get("salasana", "")
        vahvistus  = request.form.get("salasana_vahvistus", "")
        if not nimi or len(nimi) > 100 or not kelvollinen_sahkoposti(sahkoposti) or not kelvollinen_puhelin(puhelin) or not 8 <= len(salasana) <= 128:
            return redirect("/rekisteroidy?virhe=2")
        if salasana != vahvistus:
            return redirect("/rekisteroidy?virhe=3")
        if sahkoposti == OMISTAJA_SAHKOPOSTI:
            return redirect("/rekisteroidy?virhe=4")
        # Julkinen rekisteröinti luo aina asiakkaan; lomakkeen rooli-/hanketietoja ei koskaan käytetä
        rooli      = "asiakas"
        hanke      = None
        salasana_hash = generate_password_hash(salasana)
        try:
            conn = get_db()
            try:
                with conn:
                    conn.execute("BEGIN IMMEDIATE")
                    if conn.execute(
                        "SELECT 1 FROM kayttajat WHERE sahkoposti = ? COLLATE NOCASE", (sahkoposti,)
                    ).fetchone():
                        return redirect("/rekisteroidy?virhe=1")
                    conn.execute(
                        "INSERT INTO kayttajat (kayttajanimi, sahkoposti, puhelin, rooli, hanke, salasana_hash) "
                        "VALUES (?, ?, ?, ?, ?, ?)",
                        (nimi, sahkoposti, puhelin, rooli, hanke, salasana_hash)
                    )
            finally:
                conn.close()
        except sqlite3.IntegrityError:
            return redirect("/rekisteroidy?virhe=5")
        return redirect("/kirjaudu?ok=1")

    # GET: näytetään rekisteröitymislomake
    virhe_html = ""
    if request.args.get("virhe") == "1":
        virhe_html = "<p class='msg-error'>&#10005; Sähköposti on jo käytössä.</p>"
    elif request.args.get("virhe") == "2":
        virhe_html = "<p class='msg-error'>&#10005; Tarkista nimi, sähköposti ja puhelinnumero. Salasanan on oltava 8–128 merkkiä.</p>"
    elif request.args.get("virhe") == "3":
        virhe_html = "<p class='msg-error'>&#10005; Salasanat eivät täsmää.</p>"
    elif request.args.get("virhe") == "4":
        virhe_html = "<p class='msg-error'>&#10005; Tämä osoite on varattu ylläpitäjälle. Ota yhteyttä ylläpitoon.</p>"
    elif request.args.get("virhe") == "5":
        virhe_html = "<p class='msg-error'>&#10005; Nimi on jo käytössä.</p>"
    html = nayta_sivu("rekisteroidy.html")
    return html.replace("<!-- VIESTI -->", virhe_html)


# Kirjautumissivu
@app.route("/kirjaudu", methods=["GET", "POST"])
def kirjaudu():
    # POST: tarkistetaan käyttäjän tunnukset
    if request.method == "POST":
        sahkoposti = request.form.get("sahkoposti", "").strip().lower()
        salasana   = request.form.get("salasana", "")

        conn     = get_db()
        loytyneet = conn.execute(
            "SELECT * FROM kayttajat WHERE sahkoposti = ? COLLATE NOCASE", (sahkoposti,)
        ).fetchall()
        conn.close()
        kayttaja = loytyneet[0] if len(loytyneet) == 1 else None

        if kayttaja and check_password_hash(kayttaja["salasana_hash"], salasana):
            if not kayttaja["aktiivinen"]:
                return redirect("/kirjaudu?virhe=2")
            # Tallennetaan käyttäjän tiedot sessioon (muistetaan kirjautuminen)
            session.clear()
            session["kayttaja_id"]   = kayttaja["id"]
            session["istunto_versio"] = kayttaja["istunto_versio"]
            session["kayttaja_nimi"] = kayttaja["kayttajanimi"]
            session["rooli"]         = kayttaja["rooli"]
            session["hanke"]         = kayttaja["hanke"]

            # Ohjataan oikeaan sivuun roolin mukaan
            if kayttaja["rooli"] == "admin":
                return redirect("/admin")
            if kayttaja["rooli"] == "tyontekija":
                return redirect("/asiakkaat")
            return redirect("/")

        return redirect("/kirjaudu?virhe=1")

    # GET: näytetään kirjautumislomake
    viesti_html = ""
    if request.args.get("virhe") == "2":
        viesti_html = "<p class='msg-error'>&#10005; Tili on poistettu käytöstä.</p>"
    elif request.args.get("virhe"):
        viesti_html = "<p class='msg-error'>&#10005; Väärä sähköposti tai salasana.</p>"
    if request.args.get("ok") == "1":
        viesti_html = "<p class='msg-success'>&#10003; Rekisteröityminen onnistui! Kirjaudu sisään.</p>"
    elif request.args.get("ok") == "2":
        viesti_html = "<p class='msg-success'>&#10003; Salasana vaihdettu. Kirjaudu sisään uudella salasanalla.</p>"
    html = nayta_sivu("kirjaudu.html")
    return html.replace("<!-- VIESTI -->", viesti_html)


def palautusasetukset():
    host = os.environ.get("FULLA_SMTP_HOST", "").strip()
    user = os.environ.get("FULLA_SMTP_USER", "").strip()
    password = os.environ.get("FULLA_SMTP_PASSWORD", "")
    sender = os.environ.get("FULLA_SMTP_FROM", "").strip()
    base = os.environ.get("FULLA_PUBLIC_URL", "").strip().rstrip("/")
    try:
        port = int(os.environ.get("FULLA_SMTP_PORT", "587"))
        url = urlsplit(base)
        url_port = url.port
    except ValueError:
        return None
    if (not host or not user or not password or not kelvollinen_sahkoposti(sender)
            or not 1 <= port <= 65535 or not url.hostname or url.username or url.password
            or url.path or url.query or url.fragment
            or (url.scheme != "https" and not (
                url.scheme == "http" and url.hostname in ("localhost", "127.0.0.1", "::1")
            )) or (url_port is not None and not 1 <= url_port <= 65535)):
        return None
    return host, port, user, password, sender, base


def laheta_palautusviesti(asetukset, vastaanottaja, tunniste):
    host, port, user, password, sender, base = asetukset
    viesti = EmailMessage()
    viesti["Subject"] = "Fulla Meet: salasanan palautus"
    viesti["From"] = sender
    viesti["To"] = vastaanottaja
    viesti.set_content(
        "Avaa seuraava kertakäyttöinen linkki vaihtaaksesi salasanasi. "
        "Linkki on voimassa 30 minuuttia.\n\n"
        f"{base}/palauta-salasana#token={tunniste}\n\n"
        "Jos et pyytänyt salasanan palautusta, voit jättää tämän viestin huomiotta."
    )
    with smtplib.SMTP(host, port, timeout=10) as smtp:
        smtp.starttls(context=ssl.create_default_context())
        smtp.login(user, password)
        smtp.send_message(viesti)


@app.route("/unohtuiko-salasana", methods=["GET", "POST"])
def unohtuiko_salasana():
    if request.method == "POST":
        asetukset = palautusasetukset()
        if not asetukset:
            app.logger.error("Salasanan palautuksen SMTP- tai osoiteasetukset puuttuvat tai ovat virheelliset.")
            html = nayta_sivu("unohtuiko.html")
            return html.replace("<!-- VIESTI -->", "<p class='msg-error'>Salasanan palautus ei ole käytettävissä. Ota yhteyttä ylläpitoon.</p>"), 503
        sahkoposti = request.form.get("sahkoposti", "").strip().lower()
        tunniste = None
        vastaanottaja = None
        if kelvollinen_sahkoposti(sahkoposti):
            nyt = int(time.time())
            with closing(get_db()) as conn, conn:
                conn.execute("BEGIN IMMEDIATE")
                conn.execute("DELETE FROM salasanan_palautukset WHERE vanhenee <= ?", (nyt,))
                rows = conn.execute(
                    "SELECT id, sahkoposti, istunto_versio, rooli, aktiivinen FROM kayttajat "
                    "WHERE sahkoposti = ? COLLATE NOCASE", (sahkoposti,)
                ).fetchall()
                if len(rows) == 1 and rows[0]["aktiivinen"]:
                    kayttaja = rows[0]
                    vanha = conn.execute(
                        "SELECT luotu FROM salasanan_palautukset WHERE kayttaja_id = ?", (kayttaja["id"],)
                    ).fetchone()
                    if not vanha or vanha["luotu"] <= nyt - 60:
                        tunniste = secrets.token_urlsafe(32)
                        conn.execute(
                            "INSERT OR REPLACE INTO salasanan_palautukset "
                            "(kayttaja_id, tunniste_hash, istunto_versio, rooli, luotu, vanhenee) "
                            "VALUES (?, ?, ?, ?, ?, ?)",
                            (kayttaja["id"], hashlib.sha256(tunniste.encode()).hexdigest(),
                             kayttaja["istunto_versio"], kayttaja["rooli"], nyt, nyt + 1800)
                        )
                        vastaanottaja = kayttaja["sahkoposti"]
        if tunniste and vastaanottaja:
            try:
                laheta_palautusviesti(asetukset, vastaanottaja, tunniste)
            except (OSError, smtplib.SMTPException, ValueError):
                app.logger.exception("Palautusviestin lähettäminen epäonnistui.")
        return redirect("/unohtuiko-salasana?lahetetty=1")
    html = nayta_sivu("unohtuiko.html")
    viesti = ""
    if request.args.get("lahetetty") == "1":
        viesti = ("<p class='msg-success'>Jos osoitteella on aktiivinen tili, palautuslinkki lähetetään. "
                  "Jos viestiä ei saavu, tarkista roskaposti tai ota yhteyttä ylläpitoon.</p>")
    return html.replace("<!-- VIESTI -->", viesti)


@app.route("/palauta-salasana", methods=["GET", "POST"])
def palauta_salasana():
    virhe = ""
    tunniste = ""
    if request.method == "POST":
        tunniste = request.form.get("tunniste", "")
        salasana = request.form.get("salasana", "")
        vahvistus = request.form.get("salasana_vahvistus", "")
        if not re.fullmatch(r"[A-Za-z0-9_-]{43}", tunniste):
            virhe = "Palautuslinkki on virheellinen tai vanhentunut. Pyydä uusi linkki."
            tunniste = ""
        elif not 8 <= len(salasana) <= 128 or salasana != vahvistus:
            virhe = "Salasanojen on täsmättävä ja oltava 8–128 merkkiä pitkiä."
        else:
            tunniste_hash = hashlib.sha256(tunniste.encode()).hexdigest()
            uusi_hash = generate_password_hash(salasana)
            with closing(get_db()) as conn, conn:
                conn.execute("BEGIN IMMEDIATE")
                palautus = conn.execute(
                    "SELECT p.kayttaja_id FROM salasanan_palautukset p "
                    "JOIN kayttajat k ON k.id = p.kayttaja_id "
                    "WHERE p.tunniste_hash = ? AND p.vanhenee > ? AND k.aktiivinen = 1 "
                    "AND p.istunto_versio = k.istunto_versio AND p.rooli = k.rooli",
                    (tunniste_hash, int(time.time()))
                ).fetchone()
                if palautus:
                    conn.execute(
                        "UPDATE kayttajat SET salasana_hash = ?, istunto_versio = istunto_versio + 1 WHERE id = ?",
                        (uusi_hash, palautus["kayttaja_id"])
                    )
                    conn.execute("DELETE FROM salasanan_palautukset WHERE kayttaja_id = ?", (palautus["kayttaja_id"],))
                    return redirect("/kirjaudu?ok=2")
            virhe = "Palautuslinkki on virheellinen tai vanhentunut. Pyydä uusi linkki."
            tunniste = ""
    html = nayta_sivu("palauta.html").replace("PALAUTUS_TOKEN_TAHAN", escape(tunniste, quote=True))
    return html.replace("<!-- VIESTI -->", f"<p class='msg-error'>{escape(virhe)}</p>" if virhe else "")


# Uloskirjautuminen – tyhjennetään sessio ja ohjataan kirjautumissivulle
@app.route("/uloskirjautuminen")
def uloskirjautuminen():
    session.clear()
    return redirect("/kirjaudu")


# Etusivu: avataan index.html (vain kirjautuneille asiakkaille)
@app.route("/")
def etusivu():
    # Ei kirjautunut → ohjataan kirjautumissivulle
    if "kayttaja_id" not in session:
        return redirect("/kirjaudu")
    if session.get("rooli") == "admin":
        return redirect("/admin")
    # Työntekijät ohjataan omaan näkymäänsä
    if session.get("rooli") == "tyontekija":
        return redirect("/asiakkaat")
    # Haetaan asiakkaan omat varaukset
    conn = get_db()
    varaukset = conn.execute(
        "SELECT id, paiva, aika, hanke, aihe, tila, tyontekija_nimi "
        "FROM varaukset WHERE asiakas_id = ? ORDER BY paiva ASC",
        (session["kayttaja_id"],)
    ).fetchall()
    conn.close()
    varaukset_json = json.dumps([dict(r) for r in varaukset], ensure_ascii=False).replace("<", "\\u003c")

    # Näytetään asiakkaalle varauslomake, lisätään käyttäjän nimi ja varaukset sivulle
    html = nayta_sivu("index.html")
    html = html.replace("KAYTTAJA_NIMI_TAHAN", escape(session["kayttaja_nimi"]))
    html = html.replace("VARAUKSET_JSON_TAHAN", varaukset_json)
    return html


# Tämä reitti palvelee static-kansiosta tiedostoja (esim. script.js)
@app.route("/static/<path:tiedostonimi>")
def staattiset_tiedostot(tiedostonimi):
    return app.send_static_file(tiedostonimi)


# Tämä reitti vastaanottaa lomakkeen tiedot JavaScriptiltä
@app.route("/tallenna", methods=["POST"])
def tallenna():
    # Varmistetaan että käyttäjä on kirjautunut sisään
    if "kayttaja_id" not in session:
        return jsonify({"virhe": "Kirjaudu ensin sisään."}), 401
    if session.get("rooli") != "asiakas":
        return jsonify({"virhe": "Vain asiakas voi tehdä varauksen."}), 403

    # Luetaan JSON-data jonka JavaScript lähetti
    data = request.get_json(silent=True)
    kentat = ("nimi", "sahkoposti", "puhelin", "paiva", "aika", "hanke", "aihe")
    if not isinstance(data, dict) or any(not isinstance(data.get(k), str) or not data[k].strip() for k in kentat):
        return jsonify({"virhe": "Täytä kaikki varauksen kentät."}), 400
    if data["hanke"] not in (*HANKKEET, "muu"):
        return jsonify({"virhe": "Virheellinen hanke."}), 400

    # Otetaan kentät talteen omiin muuttujiin
    nimi       = data["nimi"]
    sahkoposti = data["sahkoposti"]
    puhelin    = data["puhelin"]
    paiva      = data["paiva"]
    aika       = data.get("aika", "")
    hanke      = data["hanke"]
    aihe       = data["aihe"]
    asiakas_id = session.get("kayttaja_id")

    # Tallennetaan tiedot tietokantaan
    conn = get_db()
    # Tarkistetaan onko sama aika jo varattu samalle hankkeelle
    if aika:
        tayttyy = conn.execute(
            "SELECT id FROM varaukset WHERE paiva = ? AND aika = ? AND hanke = ?",
            (paiva, aika, hanke)
        ).fetchone()
        if tayttyy:
            conn.close()
            return jsonify({"varaus_tayttyy": True}), 409
    conn.execute(
        "INSERT INTO varaukset (nimi, sahkoposti, puhelin, paiva, aika, hanke, aihe, tila, asiakas_id) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, 'odottaa', ?)",
        (nimi, sahkoposti, puhelin, paiva, aika, hanke, aihe, asiakas_id)
    )
    conn.commit()
    conn.close()

    # Lähetetään vastaus takaisin JavaScriptille
    return jsonify({"viesti": "Varaus tallennettu onnistuneesti!"})


# Työntekijän näkymä: näytetään varaukset hankkeen mukaan
@app.route("/asiakkaat")
def nayta_asiakkaat():
    if "kayttaja_id" not in session:
        return redirect("/kirjaudu")
    if session.get("rooli") not in ("tyontekija", "admin"):
        return redirect("/")

    tyontekija_hanke = session.get("hanke") if session.get("rooli") == "tyontekija" else None  # 'talous' tai 'psyykkinen'
    if session["rooli"] == "tyontekija" and tyontekija_hanke not in HANKKEET:
        abort(403, "Työntekijälle ei ole määritetty kelvollista hanketta.")
    conn = get_db()
    if tyontekija_hanke:
        rows = conn.execute(
            "SELECT * FROM varaukset WHERE hanke = ? OR hanke = 'muu' ORDER BY paiva ASC",
            (tyontekija_hanke,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM varaukset ORDER BY paiva ASC").fetchall()
    conn.close()

    hanke_nimet   = {"talous": "💰 Talous hanke", "psyykkinen": "🧠 Psyykkinen hanke"}
    hanke_otsikko = hanke_nimet.get(tyontekija_hanke, "Kaikki hankkeet")

    if len(rows) == 0:
        tyhja = "<tr><td colspan='10' style='text-align:center;padding:2rem;color:#8fa3b0;'>Ei varauksia vielä.</td></tr>"
    else:
        tyhja = ""

    rivit = tyhja
    for r in rows:
        hv = r["hanke"] or ""
        if hv == "talous":
            hanke_nakyma = "💰 Talous hanke"
        elif hv == "psyykkinen":
            hanke_nakyma = "🧠 Psyykkinen hanke"
        elif hv == "muu":
            hanke_nakyma = "🤝 Apua muuhun"
        else:
            hanke_nakyma = hv

        if r["tila"] == "hyvaksytty":
            tila_html     = "<span class='badge-ok'>&#10003; Hyväksytty</span>"
            toiminto_html = "<span style='color:#8fa3b0;font-size:0.8rem;'>—</span>"
        else:
            tila_html     = "<span class='badge-wait'>&#8987; Odottaa</span>"
            toiminto_html = (
                f'<form method="POST" action="/hyvaksy/{r["id"]}" style="margin:0">'
                f'<input type="hidden" name="csrf_token" value="{csrf_token()}">'
                '<button type="submit" class="hyvaksy-btn">&#10003; Hyväksy</button>'
                "</form>"
            )

        rivit += f"""
        <tr>
            <td class='id-cell'>{r['id']}</td>
            <td><strong>{escape(r['nimi'] or '')}</strong></td>
            <td>{escape(r['sahkoposti'] or '')}</td>
            <td>{escape(r['puhelin'] or '')}</td>
            <td>{escape(r['paiva'] or '')}</td>
            <td>{escape(r['aika'] or '—')}</td>
            <td>{escape(hanke_nakyma)}</td>
            <td>{escape(r['aihe'] or '')}</td>
            <td>{tila_html}</td>
            <td>{toiminto_html}</td>
        </tr>"""

    return f"""
    <!DOCTYPE html>
    <html lang="fi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fulla Meet – Työntekijän näkymä</title>
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
                min-height: 100vh;
                padding: 2rem 1rem;
            }}
            .page {{ max-width: 1150px; margin: 0 auto; }}
            .header {{
                display: flex; align-items: center;
                justify-content: space-between;
                margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
            }}
            .header h1 {{ color: white; font-size: 1.6rem; }}
            .header p  {{ color: #a8c0cc; font-size: 0.9rem; margin-top: 0.2rem; }}
            .back-btn {{
                background: rgba(255,255,255,0.15); color: white;
                text-decoration: none; padding: 0.5rem 1.1rem;
                border-radius: 8px; font-size: 0.9rem;
                border: 1px solid rgba(255,255,255,0.25);
            }}
            .back-btn:hover {{ background: rgba(255,255,255,0.25); }}
            .badges {{ margin-bottom: 1.5rem; }}
            .stat-badge {{
                display: inline-block;
                background: rgba(255,255,255,0.12); color: white;
                border-radius: 8px; padding: 0.8rem 1.4rem; font-size: 0.9rem;
            }}
            .stat-badge strong {{ font-size: 1.4rem; display: block; }}
            .hanke-badge {{
                display: inline-block;
                background: rgba(255,255,255,0.18); color: white;
                border-radius: 8px; padding: 0.5rem 1rem;
                margin-left: 0.7rem; font-size: 0.9rem; font-weight: 600;
                vertical-align: top; margin-top: 0.15rem;
            }}
            .card {{
                background: white; border-radius: 16px;
                overflow: hidden; overflow-x: auto;
                box-shadow: 0 20px 50px rgba(0,0,0,0.35);
            }}
            table {{ border-collapse: collapse; width: 100%; }}
            thead {{ background: linear-gradient(135deg, #203a43, #2c5364); }}
            th {{
                color: white; padding: 0.85rem 0.8rem;
                text-align: left; font-size: 0.73rem;
                text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;
            }}
            td {{
                padding: 0.65rem 0.8rem; border-bottom: 1px solid #e8f0f4;
                font-size: 0.87rem; color: #2a3a45; vertical-align: middle;
            }}
            tr:last-child td {{ border-bottom: none; }}
            tr:hover td {{ background: #f4f8fb; }}
            .id-cell {{ color: #8fa3b0; font-size: 0.78rem; }}
            .badge-ok {{
                background: #eafaf1; color: #1e7e4a;
                border: 1px solid #a9dfbf; border-radius: 6px;
                padding: 0.18rem 0.55rem; font-size: 0.75rem;
                font-weight: 700; white-space: nowrap;
            }}
            .badge-wait {{
                background: #fff3e0; color: #b26a00;
                border: 1px solid #ffd699; border-radius: 6px;
                padding: 0.18rem 0.55rem; font-size: 0.75rem;
                font-weight: 700; white-space: nowrap;
            }}
            .hyvaksy-btn {{
                background: linear-gradient(135deg, #203a43, #2c5364);
                color: white; border: none; border-radius: 7px;
                padding: 0.32rem 0.75rem; font-size: 0.8rem;
                font-weight: 700; cursor: pointer; white-space: nowrap;
            }}
            .hyvaksy-btn:hover {{ opacity: 0.85; }}
        </style>
    </head>
    <body>
        <div class="page">
            <div class="header">
                <div>
                    <h1>&#128203; Fulla Meet</h1>
                    <p>Hei, {escape(session['kayttaja_nimi'])} – hankkeen varaukset</p>
                </div>
                <a href="/uloskirjautuminen" class="back-btn">Kirjaudu ulos</a>
            </div>
            <div class="badges">
                <span class="stat-badge">
                    <strong>{len(rows)}</strong>varausta
                </span>
                <span class="hanke-badge">{hanke_otsikko}</span>
            </div>
            <div class="card">
                <table>
                    <thead>
                        <tr>
                            <th>#</th><th>Nimi</th><th>Sähköposti</th>
                            <th>Puhelin</th><th>Päivä</th><th>Aika</th>
                            <th>Hanke</th><th>Aihe</th>
                            <th>Tila</th><th>Toiminto</th>
                        </tr>
                    </thead>
                    <tbody>{rivit}</tbody>
                </table>
            </div>
        </div>
    </body>
    </html>
    """


# Työntekijä hyväksyy varauksen
@app.route("/hyvaksy/<int:varaus_id>", methods=["POST"])
def hyvaksy_varaus(varaus_id):
    if "kayttaja_id" not in session or session.get("rooli") not in ("tyontekija", "admin"):
        return redirect("/kirjaudu")
    conn = get_db()
    if session["rooli"] == "tyontekija":
        hanke = session.get("hanke")
        if hanke not in HANKKEET:
            conn.close()
            abort(403)
        result = conn.execute(
            "UPDATE varaukset SET tila = 'hyvaksytty', tyontekija_nimi = ? "
            "WHERE id = ? AND (hanke = ? OR hanke = 'muu')",
            (session["kayttaja_nimi"], varaus_id, hanke),
        )
    else:
        result = conn.execute(
            "UPDATE varaukset SET tila = 'hyvaksytty', tyontekija_nimi = ? WHERE id = ?",
            (session["kayttaja_nimi"], varaus_id),
        )
    conn.commit()
    conn.close()
    if not result.rowcount:
        abort(404)
    return redirect("/asiakkaat")



# ---------- admin-sivu ja API (vain ylläpitäjälle) ----------

@app.route("/admin")
@admin_vaaditaan
def admin_sivu():
    return nayta_sivu("admin.html")


@app.route("/varaukset", methods=["GET"])
@admin_vaaditaan
def hae_varaukset():
    with closing(get_db()) as conn, conn:
        rows = conn.execute("SELECT * FROM varaukset ORDER BY paiva ASC, aika ASC").fetchall()
    return jsonify([dict(row) for row in rows])


@app.route("/varaukset/<int:varaus_id>", methods=["DELETE"])
@admin_vaaditaan
def poista_varaus(varaus_id):
    with closing(get_db()) as conn, conn:
        result = conn.execute("DELETE FROM varaukset WHERE id = ?", (varaus_id,))
        if result.rowcount == 0:
            return jsonify({"virhe": "Varausta ei löydy"}), 404
    return jsonify({"viesti": "Varaus poistettu"})


@app.route("/kayttajat", methods=["GET"])
@admin_vaaditaan
def hae_kayttajat():
    with closing(get_db()) as conn, conn:
        rows = conn.execute(
            "SELECT id, kayttajanimi, sahkoposti, rooli, hanke, luotu, aktiivinen FROM kayttajat ORDER BY luotu ASC"
        ).fetchall()
    return jsonify([dict(row) for row in rows])


@app.route("/kayttajat", methods=["POST"])
@admin_vaaditaan
def luo_kayttaja():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"virhe": "Virheellinen pyyntö"}), 400

    required = ["kayttajanimi", "sahkoposti", "salasana"]
    missing = [f for f in required if not isinstance(data.get(f), str) or not data[f].strip()]
    if missing:
        return jsonify({"virhe": f"Puuttuvat kentät: {', '.join(missing)}"}), 400

    salasana = data["salasana"]
    if not 8 <= len(salasana) <= 128:
        return jsonify({"virhe": "Salasanan tulee olla 8–128 merkkiä"}), 400
    sahkoposti = data["sahkoposti"].strip().lower()
    if not kelvollinen_sahkoposti(sahkoposti):
        return jsonify({"virhe": "Virheellinen sähköposti"}), 400

    rooli = data.get("rooli", "asiakas")
    if rooli not in ROOLIT:
        return jsonify({"virhe": "Virheellinen rooli"}), 400
    if sahkoposti == OMISTAJA_SAHKOPOSTI and rooli != "admin":
        return jsonify({"virhe": "Osoite on varattu ylläpitäjälle"}), 400
    hanke = data.get("hanke") if rooli == "tyontekija" else None
    if rooli == "tyontekija" and hanke not in HANKKEET:
        return jsonify({"virhe": "Työntekijälle on valittava hanke"}), 400

    salasana_hash = generate_password_hash(salasana)
    try:
        with closing(get_db()) as conn, conn:
            conn.execute("BEGIN IMMEDIATE")
            if conn.execute(
                "SELECT 1 FROM kayttajat WHERE sahkoposti = ? COLLATE NOCASE", (sahkoposti,)
            ).fetchone():
                return jsonify({"virhe": "Sähköposti on jo käytössä"}), 409
            conn.execute(
                "INSERT INTO kayttajat (kayttajanimi, sahkoposti, rooli, hanke, salasana_hash) VALUES (?, ?, ?, ?, ?)",
                (data["kayttajanimi"].strip(), sahkoposti, rooli, hanke, salasana_hash)
            )
    except sqlite3.IntegrityError:
        return jsonify({"virhe": "Käyttäjänimi tai sähköposti on jo käytössä"}), 409

    return jsonify({"viesti": "Käyttäjä luotu onnistuneesti!"})


@app.route("/kayttajat/<int:kayttaja_id>", methods=["DELETE"])
@admin_vaaditaan
def poista_kayttaja(kayttaja_id):
    if kayttaja_id == session["kayttaja_id"]:
        return jsonify({"virhe": "Et voi poistaa omaa tiliäsi"}), 400
    with closing(get_db()) as conn, conn:
        result = conn.execute("DELETE FROM kayttajat WHERE id = ?", (kayttaja_id,))
        if result.rowcount == 0:
            return jsonify({"virhe": "Käyttäjää ei löydy"}), 404
        conn.execute("DELETE FROM salasanan_palautukset WHERE kayttaja_id = ?", (kayttaja_id,))
    return jsonify({"viesti": "Käyttäjä poistettu"})


@app.route("/kayttajat/<int:kayttaja_id>", methods=["PATCH"])
@admin_vaaditaan
def paivita_kayttaja(kayttaja_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not data or set(data) - {"aktiivinen", "rooli", "hanke"}:
        return jsonify({"virhe": "Virheellinen pyyntö"}), 400
    if "aktiivinen" in data and (
        type(data["aktiivinen"]) not in (int, bool) or data["aktiivinen"] not in (0, 1)
    ):
        return jsonify({"virhe": "Virheellinen tilan arvo"}), 400
    if "hanke" in data and "rooli" not in data:
        return jsonify({"virhe": "Hanke edellyttää roolia"}), 400
    if "rooli" in data:
        uusi = data["rooli"]
        if uusi not in ROOLIT:
            return jsonify({"virhe": "Virheellinen rooli"}), 400
        hanke = data.get("hanke") if uusi == "tyontekija" else None
        if uusi == "tyontekija" and hanke not in HANKKEET:
            return jsonify({"virhe": "Työntekijälle on valittava hanke"}), 400
    omaa = kayttaja_id == session["kayttaja_id"]
    if omaa and (data.get("aktiivinen") == 0 or ("rooli" in data and data["rooli"] != "admin")):
        return jsonify({"virhe": "Et voi poistaa omaa tiliäsi käytöstä tai muuttaa sen ylläpitäjäroolia"}), 400
    with closing(get_db()) as conn, conn:
        kohde = conn.execute("SELECT rooli FROM kayttajat WHERE id = ?", (kayttaja_id,)).fetchone()
        if not kohde:
            return jsonify({"virhe": "Käyttäjää ei löydy"}), 404
        if "aktiivinen" in data:
            conn.execute(
                "UPDATE kayttajat SET aktiivinen = ?, istunto_versio = istunto_versio + ? WHERE id = ?",
                (1 if data["aktiivinen"] else 0, 0 if data["aktiivinen"] else 1, kayttaja_id)
            )
        if "rooli" in data:
            conn.execute(
                "UPDATE kayttajat SET rooli = ?, hanke = ?, istunto_versio = istunto_versio + 1 WHERE id = ?",
                (uusi, hanke, kayttaja_id)
            )
    return jsonify({"viesti": "Käyttäjä päivitetty"})


# ---------- käynnistys ----------

def perusta_yllapitaja(nimi, puhelin, salasana):
    nimi = nimi.strip()
    puhelin = puhelin.strip()
    if not nimi or len(nimi) > 100 or not kelvollinen_puhelin(puhelin) or not 8 <= len(salasana) <= 128:
        raise ValueError("Tarkista nimi, puhelinnumero ja salasana.")
    salasana_hash = generate_password_hash(salasana)
    conn = get_db()
    try:
        with conn:
            conn.execute("BEGIN IMMEDIATE")
            rows = conn.execute(
                "SELECT id FROM kayttajat WHERE sahkoposti = ? COLLATE NOCASE", (OMISTAJA_SAHKOPOSTI,)
            ).fetchall()
            if len(rows) > 1:
                raise ValueError("Sähköpostilla löytyy useita tilejä. Selvitä päällekkäiset tilit ensin.")
            if rows:
                conn.execute(
                    "UPDATE kayttajat SET puhelin = ?, rooli = 'admin', hanke = NULL, aktiivinen = 1, "
                    "salasana_hash = ?, istunto_versio = istunto_versio + 1 WHERE id = ?",
                    (puhelin, salasana_hash, rows[0]["id"]),
                )
            else:
                conn.execute(
                    "INSERT INTO kayttajat (kayttajanimi, sahkoposti, puhelin, rooli, salasana_hash) "
                    "VALUES (?, ?, ?, 'admin', ?)",
                    (nimi, OMISTAJA_SAHKOPOSTI, puhelin, salasana_hash),
                )
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()     # Luodaan taulut ennen käynnistystä
    migrate_db()  # Päivitetään sarakkeet jos tietokanta on jo olemassa
    if sys.argv[1:] == ["luo-admin"]:
        print(f"Määritetään ylläpitäjä: {OMISTAJA_SAHKOPOSTI}")
        print("Jos tili on jo olemassa, sen salasana vaihdetaan ja vanhat istunnot suljetaan.")
        if input("Jatketaanko? Kirjoita KYLLÄ: ").strip() != "KYLLÄ":
            sys.exit("Toiminto peruttu.")
        nimi = input("Nimi: ").strip()
        puhelin = input("Puhelinnumero: ").strip()
        salasana = getpass("Salasana (8–128 merkkiä): ")
        vahvistus = getpass("Salasana uudelleen: ")
        if salasana != vahvistus:
            sys.exit("Salasanat eivät täsmää.")
        try:
            perusta_yllapitaja(nimi, puhelin, salasana)
        except (ValueError, sqlite3.IntegrityError) as virhe:
            sys.exit(f"Ylläpitäjää ei luotu: {virhe}")
        print("Ylläpitäjä luotu.")
        sys.exit(0)
    if sys.argv[1:]:
        sys.exit("Käyttö: python app.py [luo-admin]")
    app.run(debug=False, port=5001)
    
