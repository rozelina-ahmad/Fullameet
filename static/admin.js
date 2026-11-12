let alleVaraukset = [];
let alleKayttajat = [];
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

function naytaToast(teksti, virhe = false) {
    const toast = document.getElementById("toast");
    toast.textContent = teksti;
    toast.className = "show" + (virhe ? " error" : "");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = ""; }, 3000);
}

function paivitaStats(varaukset) {
    const tanaan = new Date().toISOString().slice(0, 10);
    document.getElementById("statTotal").textContent = varaukset.length;
    document.getElementById("statUpcoming").textContent =
        varaukset.filter(v => v.paiva >= tanaan).length;
    document.getElementById("statToday").textContent =
        varaukset.filter(v => v.paiva === tanaan).length;
    document.getElementById("statDate").textContent = new Date().toLocaleDateString("fi-FI", {
        day: "numeric", month: "long", year: "numeric"
    });
}

function muotoilePaiva(paiva) {
    if (!paiva) return "–";
    const [y, m, d] = paiva.split("-");
    return `${d}.${m}.${y}`;
}

function rakennaTaulukko(varaukset) {
    const wrap = document.getElementById("tableWrap");

    if (varaukset.length === 0) {
        wrap.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>Ei varauksia löytynyt.</p>
            </div>`;
        return;
    }

    const rivit = varaukset.map(v => `
        <tr id="row-${v.id}">
            <td class="td-date">${escHtml(muotoilePaiva(v.paiva))}</td>
            <td class="td-name">${escHtml(v.nimi)}</td>
            <td>${escHtml(v.sahkoposti)}</td>
            <td>${escHtml(v.puhelin)}</td>
            <td><span class="td-tag">${escHtml(v.hanke)}</span></td>
            <td>${escHtml(v.aihe)}</td>
            <td class="td-meta">${v.luotu ? escHtml(v.luotu.slice(0, 16)) : "–"}</td>
            <td>
                <button class="btn-delete" onclick="poistaVaraus(${v.id})">Poista</button>
            </td>
        </tr>`).join("");

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Päivä</th>
                    <th>Nimi</th>
                    <th>Sähköposti</th>
                    <th>Puhelin</th>
                    <th>Hanke</th>
                    <th>Aihe</th>
                    <th>Luotu</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${rivit}</tbody>
        </table>`;
}

function suodata() {
    const hakusana = document.getElementById("searchInput").value.toLowerCase();
    if (!hakusana) {
        rakennaTaulukko(alleVaraukset);
        return;
    }
    const suodatetut = alleVaraukset.filter(v =>
        [v.nimi, v.sahkoposti, v.hanke, v.aihe, v.puhelin, v.paiva]
            .some(k => k && k.toLowerCase().includes(hakusana))
    );
    rakennaTaulukko(suodatetut);
}

function lataaVaraukset() {
    const btn = document.getElementById("refreshBtn");
    btn.textContent = "Ladataan…";
    btn.disabled = true;

    fetch("/varaukset")
        .then(r => { if (!r.ok) throw new Error("Varausten lataus epäonnistui"); return r.json(); })
        .then(data => {
            alleVaraukset = data;
            paivitaStats(data);
            suodata();
            btn.textContent = "↻ Päivitä";
            btn.disabled = false;
        })
        .catch(() => {
            naytaToast("Varausten lataaminen epäonnistui", true);
            btn.textContent = "↻ Päivitä";
            btn.disabled = false;
        });
}

function poistaVaraus(id) {
    if (!confirm("Poistetaanko varaus pysyvästi?")) return;

    fetch(`/varaukset/${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfToken } })
        .then(r => r.json())
        .then(json => {
            if (json.virhe) {
                naytaToast(json.virhe, true);
                return;
            }
            alleVaraukset = alleVaraukset.filter(v => v.id !== id);
            paivitaStats(alleVaraukset);
            suodata();
            naytaToast("✓ Varaus poistettu");
        })
        .catch(() => naytaToast("Poistaminen epäonnistui", true));
}

function escHtml(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ---- tab switching ----
function vaihdaValilehti(panel, btn) {
    document.querySelectorAll(".tab-panel").forEach(p => p.style.display = "none");
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("panel-" + panel).style.display = "block";
    btn.classList.add("active");
}

// ---- user management ----
const ROOLI_NIMET = { asiakas: "Asiakas", tyontekija: "Työntekijä", admin: "Ylläpitäjä" };

function kysyHanke() {
    const v = (prompt("Hanke (talous / psyykkinen):") || "").trim().toLowerCase();
    return ["talous", "psyykkinen"].includes(v) ? v : null;
}

function valitseRooli(id, sel) {
    const uusi = sel.value;
    let hanke;
    if (uusi === "tyontekija") {
        hanke = kysyHanke();
        if (!hanke) { naytaToast("Valitse hanke: talous tai psyykkinen", true); suodataKayttajat(); return; }
    }
    vaihdaRooli(id, uusi, hanke);
}

document.addEventListener("DOMContentLoaded", () => {
    const r = document.getElementById("uRooli");
    r.addEventListener("change", () => {
        document.getElementById("uHanke").style.display = r.value === "tyontekija" ? "" : "none";
    });
});
function rakennaKayttajaTaulukko(kayttajat) {
    const wrap = document.getElementById("userTableWrap");
    if (kayttajat.length === 0) {
        wrap.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <p>Ei käyttäjiä löytynyt.</p>
            </div>`;
        return;
    }
    const rivit = kayttajat.map(u => `
        <tr id="urow-${u.id}">
            <td class="td-name">${escHtml(u.kayttajanimi)}</td>
            <td>${escHtml(u.sahkoposti)}</td>
            <td><span class="badge badge-${escHtml(u.rooli)}">${ROOLI_NIMET[u.rooli] || escHtml(u.rooli)}${u.hanke ? ' · ' + escHtml(u.hanke) : ''}</span></td>
            <td><span class="badge ${u.aktiivinen ? 'badge-active' : 'badge-inactive'}">${u.aktiivinen ? 'Aktiivinen' : 'Ei aktiivinen'}</span></td>
            <td class="td-meta">${u.luotu ? escHtml(u.luotu.slice(0, 16)) : '–'}</td>
            <td style="display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center">
                <select class="btn-sm" onchange="valitseRooli(${u.id}, this)">
                    ${Object.entries(ROOLI_NIMET).map(([k, n]) =>
                        `<option value="${k}" ${k === u.rooli ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
                <button class="btn-sm" onclick="vaihdaAktiivinen(${u.id}, ${u.aktiivinen ? 0 : 1})">
                    ${u.aktiivinen ? 'Poista käytöstä' : 'Aktivoi'}
                </button>
                <button class="btn-delete" onclick="poistaKayttaja(${u.id})">Poista</button>
            </td>
        </tr>`).join("");
    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Käyttäjänimi</th>
                    <th>Sähköposti</th>
                    <th>Rooli</th>
                    <th>Tila</th>
                    <th>Luotu</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${rivit}</tbody>
        </table>`;
}

function suodataKayttajat() {
    const hakusana = document.getElementById("userSearchInput").value.toLowerCase();
    if (!hakusana) { rakennaKayttajaTaulukko(alleKayttajat); return; }
    rakennaKayttajaTaulukko(alleKayttajat.filter(u =>
        [u.kayttajanimi, u.sahkoposti, u.rooli].some(k => k && k.toLowerCase().includes(hakusana))
    ));
}

function lataaKayttajat() {
    fetch("/kayttajat")
        .then(r => { if (!r.ok) throw new Error("Käyttäjien lataus epäonnistui"); return r.json(); })
        .then(data => { alleKayttajat = data; suodataKayttajat(); })
        .catch(() => naytaToast("Käyttäjien lataaminen epäonnistui", true));
}

function lisaaKayttaja() {
    const kayttajanimi = document.getElementById("uKayttajanimi").value.trim();
    const sahkoposti   = document.getElementById("uSahkoposti").value.trim();
    const salasana     = document.getElementById("uSalasana").value;
    const rooli        = document.getElementById("uRooli").value;
    const hanke        = document.getElementById("uHanke").value;

    if (!kayttajanimi || !sahkoposti || !salasana) {
        naytaToast("Täytä kaikki kentät", true);
        return;
    }
    fetch("/kayttajat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ kayttajanimi, sahkoposti, salasana, rooli, hanke })
    })
    .then(r => r.json())
    .then(json => {
        if (json.virhe) { naytaToast(json.virhe, true); return; }
        naytaToast("✓ Käyttäjä lisätty");
        document.getElementById("uKayttajanimi").value = "";
        document.getElementById("uSahkoposti").value = "";
        document.getElementById("uSalasana").value = "";
        lataaKayttajat();
    })
    .catch(() => naytaToast("Käyttäjän lisääminen epäonnistui", true));
}

function poistaKayttaja(id) {
    if (!confirm("Poistetaanko käyttäjä pysyvästi?")) return;
    fetch(`/kayttajat/${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfToken } })
        .then(r => r.json())
        .then(json => {
            if (json.virhe) { naytaToast(json.virhe, true); return; }
            alleKayttajat = alleKayttajat.filter(u => u.id !== id);
            suodataKayttajat();
            naytaToast("✓ Käyttäjä poistettu");
        })
        .catch(() => naytaToast("Poistaminen epäonnistui", true));
}

function vaihdaRooli(id, uusiRooli, hanke) {
    fetch(`/kayttajat/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ rooli: uusiRooli, hanke })
    })
    .then(r => r.json())
    .then(json => {
        if (json.virhe) { naytaToast(json.virhe, true); suodataKayttajat(); return; }
        naytaToast("✓ Rooli päivitetty");
        lataaKayttajat();
    })
    .catch(() => { suodataKayttajat(); naytaToast("Päivitys epäonnistui", true); });
}

function vaihdaAktiivinen(id, arvo) {
    fetch(`/kayttajat/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ aktiivinen: arvo })
    })
    .then(r => r.json())
    .then(json => {
        if (json.virhe) { naytaToast(json.virhe, true); return; }
        const u = alleKayttajat.find(u => u.id === id);
        if (u) u.aktiivinen = arvo;
        suodataKayttajat();
        naytaToast("✓ Tila päivitetty");
    })
    .catch(() => naytaToast("Päivitys epäonnistui", true));
}

// Ladataan heti
lataaVaraukset();
lataaKayttajat();
