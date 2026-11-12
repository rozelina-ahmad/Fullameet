// =======================================================
// script.js – Fulla Meet
// =======================================================


// -------------------------------------------------------
// 1. TRANSLATIONS (Finnish, English, Arabic)
// -------------------------------------------------------
var t = {
    fi: {
        subtitle:      "Tervetuloa varaamaan aika",
        label_nimi:    "Nimi",
        label_puhelin: "Puhelin",
        label_email:   "S\u00e4hk\u00f6posti",
        label_paiva:   "P\u00e4iv\u00e4",
        label_hanke:   "Hanke",
        label_aihe:    "Aihe",
        ph_nimi:       "Etunimi Sukunimi",
        ph_puhelin:    "+358 40 123 4567",
        ph_email:      "sin\u00e4@esimerkki.fi",
        ph_aihe:       "Tapaamisen aihe",
        hanke1:        "\uD83D\uDCB0 Talous hanke",
        hanke2:        "\uD83E\uDDE0 Psyykkinen hanke",
        hanke3:        "\uD83E\uDD1D Apua muuhun",
        submit:        "Varaa aika",
        logout:        "Kirjaudu ulos",
        err_phone:     "Puhelinnumero voi sis\u00e4lt\u00e4\u00e4 vain numeroita.",
        err_date_past: "Et voi varata menneisyyteen. Valitse tuleva p\u00e4iv\u00e4.",
        err_date_far:  "Aika on liian kauk\u00e4na. Valitse alle 3 kuukauden p\u00e4\u00e4h\u00e4n.",
        err_hanke:     "Valitse hanketyyppi.",
        success:       "\u2713 Varaus tallennettu onnistuneesti!",
        err_generic:   "\u2715 Jotain meni pieleen. Yrit\u00e4 uudelleen.",
        label_aika:       "Aika",
        ph_aika:          "09:00",
        my_bookings:      "\uD83D\uDCCB Omat varaukset",
        no_bookings:      "Ei varauksia viel\u00e4.",
        status_pending:   "\u23F3 Odottaa",
        status_confirmed: "\u2705 Vahvistettu",
        confirmed_msg:    "Varauksesi on vahvistettu. Sinua tapaa {w} {d} klo {t}.",
        err_slot_taken:   "Valittu aika ei ole en\u00e4\u00e4 saatavilla. T\u00e4m\u00e4 aika saattaa olla jo varattu tai ty\u00f6ntekij\u00e4 ei ole k\u00e4ytett\u00e4viss\u00e4.",
        urgent_call:      "\u26a1 Jos asiasi on kiireellinen, soita: 0403782887",
        notif_new_confirm:"\uD83C\uDF89 Varauksesi on vahvistettu!",
        notif_reminder_title: "Muistutus \u2013 Fulla Meet",
        notif_reminder_body:  "Sinulla on varaus {d} klo {t}.",
        view_list:        "\uD83D\uDCCB Lista",
        view_cal:         "\uD83D\uDCC5 Kalenteri",
        cal_prev:         "\u2039",
        cal_next:         "\u203A",
        months:           ["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kes\u00e4kuu","Hein\u00e4kuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"],
        days_short:       ["Ma","Ti","Ke","To","Pe","La","Su"]
    },
    en: {
        subtitle:      "Book your appointment",
        label_nimi:    "Name",
        label_puhelin: "Phone",
        label_email:   "Email",
        label_paiva:   "Date",
        label_hanke:   "Service",
        label_aihe:    "Topic",
        ph_nimi:       "First Last",
        ph_puhelin:    "+358 40 123 4567",
        ph_email:      "you@example.com",
        ph_aihe:       "Meeting topic",
        hanke1:        "\uD83D\uDCB0 Financial Project",
        hanke2:        "\uD83E\uDDE0 Mental Health",
        hanke3:        "\uD83E\uDD1D Help with Something Else",
        submit:        "Book Appointment",
        logout:        "Log out",
        err_phone:     "Phone number can only contain digits.",
        err_date_past: "You cannot book a past date.",
        err_date_far:  "Too far ahead. Please choose within 3 months.",
        err_hanke:     "Please select a service type.",
        success:       "\u2713 Booking saved successfully!",
        err_generic:   "\u2715 Something went wrong. Please try again.",
        label_aika:       "Time",
        ph_aika:          "09:00",
        my_bookings:      "\uD83D\uDCCB My Bookings",
        no_bookings:      "No bookings yet.",
        status_pending:   "\u23F3 Pending",
        status_confirmed: "\u2705 Confirmed",
        confirmed_msg:    "Your booking is confirmed. {w} will see you on {d} at {t}.",
        err_slot_taken:   "The selected time is no longer available. This slot may already be booked or the employee may be unavailable.",
        urgent_call:      "\u26a1 For urgent matters, please call: 0403782887",
        notif_new_confirm:"\uD83C\uDF89 Your booking has been confirmed!",
        notif_reminder_title: "Reminder \u2013 Fulla Meet",
        notif_reminder_body:  "You have an appointment on {d} at {t}.",
        view_list:        "\uD83D\uDCCB List",
        view_cal:         "\uD83D\uDCC5 Calendar",
        cal_prev:         "\u2039",
        cal_next:         "\u203A",
        months:           ["January","February","March","April","May","June","July","August","September","October","November","December"],
        days_short:       ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    },
    ar: {
        subtitle:      "\u0627\u062D\u062C\u0632 \u0645\u0648\u0639\u062F\u0643",
        label_nimi:    "\u0627\u0644\u0627\u0633\u0645",
        label_puhelin: "\u0627\u0644\u0647\u0627\u062A\u0641",
        label_email:   "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
        label_paiva:   "\u0627\u0644\u062A\u0627\u0631\u064A\u062E",
        label_hanke:   "\u0627\u0644\u062E\u062F\u0645\u0629",
        label_aihe:    "\u0627\u0644\u0645\u0648\u0636\u0648\u0639",
        ph_nimi:       "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644",
        ph_puhelin:    "+358 40 123 4567",
        ph_email:      "you@example.com",
        ph_aihe:       "\u0645\u0648\u0636\u0648\u0639 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639",
        hanke1:        "\uD83D\uDCB0 \u0645\u0634\u0631\u0648\u0639 \u0645\u0627\u0644\u064A",
        hanke2:        "\uD83E\uDDE0 \u0635\u062D\u0629 \u0646\u0641\u0633\u064A\u0629",
        hanke3:        "\uD83E\uDD1D \u0645\u0633\u0627\u0639\u062F\u0629 \u0641\u064A \u0634\u064A\u0621 \u0622\u062E\u0631",
        submit:        "\u0627\u062D\u062C\u0632 \u0627\u0644\u0645\u0648\u0639\u062F",
        logout:        "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C",
        err_phone:     "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u064A\u062C\u0628 \u0623\u0646 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0623\u0631\u0642\u0627\u0645 \u0641\u0642\u0637.",
        err_date_past: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u062C\u0632 \u062A\u0627\u0631\u064A\u062E \u0641\u064A \u0627\u0644\u0645\u0627\u0636\u064A.",
        err_date_far:  "\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0628\u0639\u064A\u062F \u062C\u062F\u0627\u064B. \u0627\u062E\u062A\u0631 \u062A\u0627\u0631\u064A\u062E\u0627\u064B \u062E\u0644\u0627\u0644 3 \u0623\u0634\u0647\u0631.",
        err_hanke:     "\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0646\u0648\u0639 \u0627\u0644\u062E\u062F\u0645\u0629.",
        success:       "\u2713 \u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u062D\u062C\u0632 \u0628\u0646\u062C\u0627\u062D!",
        err_generic:   "\u2715 \u062D\u062F\u062B \u062E\u0637\u0623 \u0645\u0627. \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",
        label_aika:       "\u0627\u0644\u0648\u0642\u062A",
        ph_aika:          "09:00",
        my_bookings:      "\uD83D\uDCCB \u062D\u062C\u0648\u0632\u0627\u062A\u064A",
        no_bookings:      "\u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u062C\u0648\u0632\u0627\u062A \u0628\u0639\u062F.",
        status_pending:   "\u23F3 \u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631",
        status_confirmed: "\u2705 \u0645\u0624\u0643\u062F",
        confirmed_msg:    "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u062D\u062C\u0632\u0643. \u0633\u064A\u0644\u062A\u0642\u064A\u0643 {w} \u0641\u064A {d} \u0627\u0644\u0633\u0627\u0639\u0629 {t}.",
        err_slot_taken:   "\u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0645\u062E\u062A\u0627\u0631 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D. \u0631\u0628\u0645\u0627 \u064A\u0643\u0648\u0646 \u0627\u0644\u0648\u0642\u062A \u0645\u062D\u062C\u0648\u0632\u0627\u064B \u0623\u0648 \u0627\u0644\u0645\u0648\u0638\u0641 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D.",
        urgent_call:      "\u26a1 \u0644\u0644\u0623\u0645\u0648\u0631 \u0627\u0644\u0639\u0627\u062C\u0644\u0629\u060C \u0627\u062A\u0635\u0644: 0403782887",
        notif_new_confirm:"\uD83C\uDF89 \u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u062D\u062C\u0632\u0643!",
        notif_reminder_title: "\u062A\u0630\u0643\u064A\u0631 \u2013 Fulla Meet",
        notif_reminder_body:  "\u0644\u062F\u064A\u0643 \u0645\u0648\u0639\u062F \u0641\u064A {d} \u0627\u0644\u0633\u0627\u0639\u0629 {t}.",
        view_list:        "\uD83D\uDCCB \u0642\u0627\u0626\u0645\u0629",
        view_cal:         "\uD83D\uDCC5 \u062A\u0642\u0648\u064A\u0645",
        cal_prev:         "\u203A",
        cal_next:         "\u2039",
        months:           ["\u064A\u0646\u0627\u064A\u0631","\u0641\u0628\u0631\u0627\u064A\u0631","\u0645\u0627\u0631\u0633","\u0623\u0628\u0631\u064A\u0644","\u0645\u0627\u064A\u0648","\u064A\u0648\u0646\u064A\u0648","\u064A\u0648\u0644\u064A\u0648","\u0623\u063A\u0633\u0637\u0633","\u0633\u0628\u062A\u0645\u0628\u0631","\u0623\u0643\u062A\u0648\u0628\u0631","\u0646\u0648\u0641\u0645\u0628\u0631","\u062F\u064A\u0633\u0645\u0628\u0631"],
        days_short:       ["\u0625\u062B","\u062B\u0644\u0627","\u0623\u0631\u0628","\u062E\u0645\u0633","\u062C\u0645\u0639","\u0633\u0628\u062A","\u0623\u062D\u062F"]
    }
};


// -------------------------------------------------------
// 2. LANGUAGE SWITCHER
// -------------------------------------------------------
var currentLang = "fi";

function setLang(lang) {
    currentLang = lang;
    var tr = t[lang];

    // Arabic is right-to-left
    document.documentElement.dir  = (lang === "ar") ? "rtl" : "ltr";
    document.documentElement.lang = lang;

    // Update labels
    document.getElementById("subtitle").textContent          = tr.subtitle;
    document.getElementById("label-nimi").textContent        = tr.label_nimi;
    document.getElementById("label-puhelin").textContent     = tr.label_puhelin;
    document.getElementById("label-sahkoposti").textContent  = tr.label_email;
    document.getElementById("label-paiva").textContent       = tr.label_paiva;
    document.getElementById("label-hanke").textContent       = tr.label_hanke;
    document.getElementById("label-aihe").textContent        = tr.label_aihe;
    document.getElementById("hanke1").textContent            = tr.hanke1;
    document.getElementById("hanke2").textContent            = tr.hanke2;
    document.getElementById("hanke3").textContent            = tr.hanke3;
    document.getElementById("submit-btn").textContent        = tr.submit;
    document.getElementById("logout-link").textContent       = tr.logout;

    // Update placeholders
    document.getElementById("nimi").placeholder       = tr.ph_nimi;
    document.getElementById("puhelin").placeholder    = tr.ph_puhelin;
    document.getElementById("sahkoposti").placeholder = tr.ph_email;
    document.getElementById("aihe").placeholder       = tr.ph_aihe;

    // Highlight active language button
    document.getElementById("lang-fi").classList.toggle("active", lang === "fi");
    document.getElementById("lang-en").classList.toggle("active", lang === "en");
    document.getElementById("lang-ar").classList.toggle("active", lang === "ar");

    document.getElementById("label-aika").textContent      = tr.label_aika;
    document.getElementById("aika").placeholder            = tr.ph_aika;
    document.getElementById("label-oma-varaus").textContent = tr.my_bookings;
    renderVaraukset(tr);

    // Update view toggle button texts (if visible)
    var btnL = document.getElementById("btn-lista");
    var btnK = document.getElementById("btn-kalenteri");
    if (btnL) btnL.textContent = tr.view_list;
    if (btnK) btnK.textContent = tr.view_cal;
    // Re-render calendar if it is currently open
    var kalNakyma = document.getElementById("kalenteri-nakyma");
    if (kalNakyma && kalNakyma.style.display !== "none") {
        renderCalendar(tr);
    }
    // Clear any old error messages when switching language
    var msg = document.getElementById("vahvistus");
    msg.textContent = "";
    msg.className = "vahvistus";
    // Persist chosen language across pages
    try { localStorage.setItem("fulla_lang", lang); } catch(e) {}
}

// Restore language on load
try {
    var savedLang = localStorage.getItem("fulla_lang");
    if (savedLang && t[savedLang]) setLang(savedLang);
} catch(e) {}


// -------------------------------------------------------
// 3. DATE LIMITS: today = min, today + 3 months = max
// -------------------------------------------------------
function setupDateLimits() {
    var today   = new Date();
    var maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);

    // Format a Date as YYYY-MM-DD for the input's min/max
    function fmt(d) {
        var m   = String(d.getMonth() + 1).padStart("0", 2);
        var day = String(d.getDate()).padStart("0", 2);
        // padStart arguments are (maxLength, fillString)
        m   = (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1);
        day = (d.getDate()     < 10 ? "0" : "") + d.getDate();
        return d.getFullYear() + "-" + m + "-" + day;
    }

    var paivaInput = document.getElementById("paiva");
    paivaInput.min = fmt(today);
    paivaInput.max = fmt(maxDate);
}

setupDateLimits();


// -------------------------------------------------------
// 4. PHONE: block letters while typing
// -------------------------------------------------------
document.getElementById("puhelin").addEventListener("input", function() {
    // Remove any character that is a letter (a-z or A-Z)
    this.value = this.value.replace(/[a-zA-Z]/g, "");
});


// -------------------------------------------------------
// 5. FORM SUBMIT
// -------------------------------------------------------
var lomake       = document.getElementById("asiakasLomake");
var viestiLaatikko = document.getElementById("vahvistus");

lomake.addEventListener("submit", function(event) {
    event.preventDefault();

    var tr = t[currentLang];

    // -- Phone: must not contain letters --
    var puhelin = document.getElementById("puhelin").value;
    if (/[a-zA-Z]/.test(puhelin)) {
        viestiLaatikko.textContent = "\u2715 " + tr.err_phone;
        viestiLaatikko.className   = "vahvistus error";
        return;
    }

    // -- Date: not past, not more than 3 months ahead --
    var paivaInput   = document.getElementById("paiva");
    var chosen       = new Date(paivaInput.value + "T00:00:00");
    var today        = new Date();
    today.setHours(0, 0, 0, 0);
    var maxDate      = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    maxDate.setHours(23, 59, 59, 999);

    if (chosen < today) {
        viestiLaatikko.textContent = "\u2715 " + tr.err_date_past;
        viestiLaatikko.className   = "vahvistus error";
        return;
    }
    if (chosen > maxDate) {
        viestiLaatikko.textContent = "\u2715 " + tr.err_date_far;
        viestiLaatikko.className   = "vahvistus error";
        return;
    }

    // -- Hanke: a radio button must be selected --
    var hankeRadio = document.querySelector("input[name='hanke']:checked");
    if (!hankeRadio) {
        viestiLaatikko.textContent = "\u2715 " + tr.err_hanke;
        viestiLaatikko.className   = "vahvistus error";
        return;
    }
    // Save the radio value ('talous', 'psyykkinen', 'muu') – not the display text
    var hankeArvo = hankeRadio.value;

    // -- Collect all field values --
    var data = {
        nimi:       document.getElementById("nimi").value,
        sahkoposti: document.getElementById("sahkoposti").value,
        puhelin:    puhelin,
        paiva:      paivaInput.value,
        aika:       document.getElementById("aika").value,
        hanke:      hankeArvo,
        aihe:       document.getElementById("aihe").value
    };

    // -- Send to Flask --
    fetch("/tallenna", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content },
        body:    JSON.stringify(data)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(json) {
        if (json.varaus_tayttyy) {
            viestiLaatikko.innerHTML = "\u2715 <strong>" + tr.err_slot_taken + "</strong>"
                + "<br><span style='font-size:0.82rem;'>" + tr.urgent_call + "</span>";
            viestiLaatikko.className = "vahvistus error";
            return;
        }
        if (json.virhe) {
            viestiLaatikko.textContent = "\u2715 " + json.virhe;
            viestiLaatikko.className   = "vahvistus error";
            return;
        }
        viestiLaatikko.textContent = tr.success;
        viestiLaatikko.className   = "vahvistus success";
        lomake.reset();
        // Clear hanke radio highlight after reset
        document.querySelectorAll(".hanke-btn input").forEach(function(r) {
            r.checked = false;
        });
        // Reload after 2 seconds to show the new booking in "My Bookings"
        setTimeout(function() { window.location.reload(); }, 2000);
    })
    .catch(function(virhe) {
        viestiLaatikko.textContent = tr.err_generic;
        viestiLaatikko.className   = "vahvistus error";
        console.log("Virhe:", virhe);
    });
});


// -------------------------------------------------------
// 6. RENDER CLIENT'S OWN BOOKINGS
// -------------------------------------------------------
function escHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderVaraukset(tr) {
    var lista = document.getElementById("varaus-lista");
    var osio  = document.getElementById("omat-varaukset");
    if (!lista || !osio) return;

    var data = (typeof ASIAKKAAN_VARAUKSET !== "undefined") ? ASIAKKAAN_VARAUKSET : [];
    osio.style.display = "block";

    if (data.length === 0) {
        lista.innerHTML = "<p style='color:#8fa3b0;font-size:0.88rem;padding:0.3rem 0;'>" + tr.no_bookings + "</p>";
        return;
    }

    var html = "";
    for (var i = 0; i < data.length; i++) {
        var v = data[i];

        // Translate the stored hanke value to a display name
        var hankeNimi;
        if (v.hanke === "talous") {
            hankeNimi = "\uD83D\uDCB0 Talous hanke";
        } else if (v.hanke === "psyykkinen") {
            hankeNimi = "\uD83E\uDDE0 Psyykkinen hanke";
        } else {
            hankeNimi = "\uD83E\uDD1D Apua muuhun";
        }

        var tilaHtml;
        if (v.tila === "hyvaksytty") {
            var msg = tr.confirmed_msg
                .replace("{w}", v.tyontekija_nimi || "")
                .replace("{d}", v.paiva || "")
                .replace("{t}", v.aika || "");
            tilaHtml = "<span class='tila hyvaksytty'>" + tr.status_confirmed + "</span>"
                     + "<span class='confirm-msg'>" + escHtml(msg) + "</span>";
        } else {
            tilaHtml = "<span class='tila odottaa'>" + tr.status_pending + "</span>";
        }

        html += "<div class='varaus-kortti'>"
              + "<div class='varaus-info'>"
              + "<strong>" + escHtml(v.paiva) + (v.aika ? "  \u00B7  " + escHtml(v.aika) : "") + "</strong>"
              + "  \u2013  " + hankeNimi
              + "<br><em style='color:#6b7c8a;font-size:0.84rem;'>" + escHtml(v.aihe) + "</em>"
              + "</div>"
              + "<div class='varaus-tila'>" + tilaHtml + "</div>"
              + "</div>";
    }
    lista.innerHTML = html;
}

// Render bookings on first load (Finnish by default)
renderVaraukset(t.fi);


// -------------------------------------------------------
// 7. CALENDAR VIEW
// -------------------------------------------------------
var kalenteriKuukausi = new Date();
kalenteriKuukausi.setDate(1);

function showView(view) {
    var lista     = document.getElementById("varaus-lista");
    var kalenteri = document.getElementById("kalenteri-nakyma");
    var btnL      = document.getElementById("btn-lista");
    var btnK      = document.getElementById("btn-kalenteri");
    if (!lista || !kalenteri) return;
    if (view === "kalenteri") {
        lista.style.display     = "none";
        kalenteri.style.display = "block";
        if (btnL) btnL.classList.remove("active");
        if (btnK) btnK.classList.add("active");
        renderCalendar(t[currentLang]);
    } else {
        lista.style.display     = "block";
        kalenteri.style.display = "none";
        if (btnL) btnL.classList.add("active");
        if (btnK) btnK.classList.remove("active");
    }
}

function renderCalendar(tr) {
    var sisalto = document.getElementById("kalenteri-sisalto");
    if (!sisalto) return;

    var year  = kalenteriKuukausi.getFullYear();
    var month = kalenteriKuukausi.getMonth();

    // Build a date-string → booking lookup
    var data = (typeof ASIAKKAAN_VARAUKSET !== "undefined") ? ASIAKKAAN_VARAUKSET : [];
    var bookedDates = {};
    for (var i = 0; i < data.length; i++) {
        bookedDates[data[i].paiva] = data[i];
    }

    var monthLabel  = tr.months[month] + " " + year;
    // Finnish weeks start Monday; JS getDay() 0=Sun → shift
    var firstDay    = new Date(year, month, 1).getDay();
    firstDay        = (firstDay + 6) % 7;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today       = new Date();

    var html = "<div class='kal-header'>"
        + "<button class='kal-nav' onclick='kalPrev()'>" + tr.cal_prev + "</button>"
        + "<span class='kal-month'>" + monthLabel + "</span>"
        + "<button class='kal-nav' onclick='kalNext()'>" + tr.cal_next + "</button>"
        + "</div>"
        + "<div class='kal-grid'>";

    for (var d = 0; d < 7; d++) {
        html += "<div class='kal-day-header'>" + tr.days_short[d] + "</div>";
    }
    for (var e = 0; e < firstDay; e++) {
        html += "<div class='kal-day'></div>";
    }
    for (var day = 1; day <= daysInMonth; day++) {
        var mm  = (month + 1 < 10 ? "0" : "") + (month + 1);
        var dd  = (day    < 10 ? "0" : "") + day;
        var ds  = year + "-" + mm + "-" + dd;
        var isToday = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day);
        var bk  = bookedDates[ds];
        var cls = "kal-day";
        if (isToday) cls += " today";
        if (bk) cls += (bk.tila === "hyvaksytty") ? " confirmed" : " pending";
        var clickAttr = bk ? " onclick=\"showDayDetail('" + ds + "')\"" : "";
        html += "<div class='" + cls + "'" + clickAttr + ">"
              + "<span class='kal-day-num'>" + day + "</span>"
              + (bk ? "<div class='kal-dot'></div>" : "")
              + "</div>";
    }
    html += "</div>";
    sisalto.innerHTML = html;
}

function kalPrev() {
    kalenteriKuukausi.setMonth(kalenteriKuukausi.getMonth() - 1);
    renderCalendar(t[currentLang]);
}

function kalNext() {
    kalenteriKuukausi.setMonth(kalenteriKuukausi.getMonth() + 1);
    renderCalendar(t[currentLang]);
}

function showDayDetail(dateStr) {
    var data   = (typeof ASIAKKAAN_VARAUKSET !== "undefined") ? ASIAKKAAN_VARAUKSET : [];
    var tr     = t[currentLang];
    var detail = document.getElementById("kal-detail");
    if (!detail) return;
    for (var i = 0; i < data.length; i++) {
        var v = data[i];
        if (v.paiva !== dateStr) continue;
        var hankeNimi;
        if (v.hanke === "talous")          hankeNimi = tr.hanke1;
        else if (v.hanke === "psyykkinen") hankeNimi = tr.hanke2;
        else                               hankeNimi = tr.hanke3;
        var tilaMsg = (v.tila === "hyvaksytty")
            ? tr.confirmed_msg
                .replace("{w}", v.tyontekija_nimi || "")
                .replace("{d}", v.paiva)
                .replace("{t}", v.aika || "")
            : tr.status_pending;
        detail.innerHTML = "<strong>" + escHtml(v.paiva) + (v.aika ? " &middot; klo " + escHtml(v.aika) : "") + "</strong>"
            + " &mdash; " + hankeNimi
            + "<br><em style='color:#6b7c8a;'>" + escHtml(v.aihe) + "</em>"
            + "<br>" + escHtml(tilaMsg);
        detail.style.display = "block";
        return;
    }
    detail.style.display = "none";
}


// -------------------------------------------------------
// 8. NOTIFICATIONS
// -------------------------------------------------------
function requestNotifPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

function showNotificationBanner(teksti, tyyppi) {
    var banneri = document.getElementById("ilmoitus-banneri");
    var el      = document.getElementById("ilmoitus-teksti");
    if (!banneri || !el) return;
    el.innerHTML  = teksti;
    banneri.className = "ilmoitus-banneri " + (tyyppi || "success");
    banneri.style.display = "flex";
}

function checkNewConfirmations() {
    var data = (typeof ASIAKKAAN_VARAUKSET !== "undefined") ? ASIAKKAAN_VARAUKSET : [];
    var tr   = t[currentLang];
    var stored = {};
    var isFirstLoad = false;
    try {
        var raw = localStorage.getItem("fulla_varaus_tilat");
        if (raw === null) { isFirstLoad = true; }
        stored = JSON.parse(raw || "{}");
    } catch (e) { isFirstLoad = true; }

    var newlyConfirmed = null;
    var current = {};
    for (var i = 0; i < data.length; i++) {
        current[data[i].id] = data[i].tila;
        if (!isFirstLoad && data[i].tila === "hyvaksytty" && stored[String(data[i].id)] !== "hyvaksytty") {
            if (!newlyConfirmed) newlyConfirmed = data[i];
        }
    }
    localStorage.setItem("fulla_varaus_tilat", JSON.stringify(current));

    if (newlyConfirmed) {
        var msg = tr.confirmed_msg
            .replace("{w}", newlyConfirmed.tyontekija_nimi || "")
            .replace("{d}", newlyConfirmed.paiva || "")
            .replace("{t}", newlyConfirmed.aika  || "");
        showNotificationBanner("\uD83C\uDF89 <strong>" + tr.notif_new_confirm + "</strong><br>" + escHtml(msg), "success");
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Fulla Meet \u2013 " + tr.notif_new_confirm, { body: msg });
        }
    }
}

function checkReminders() {
    var data = (typeof ASIAKKAAN_VARAUKSET !== "undefined") ? ASIAKKAAN_VARAUKSET : [];
    var tr   = t[currentLang];
    var now  = new Date();
    for (var i = 0; i < data.length; i++) {
        var v = data[i];
        if (v.tila !== "hyvaksytty" || !v.paiva || !v.aika) continue;
        var apptTime = new Date(v.paiva + "T" + v.aika + ":00");
        var diffH    = (apptTime - now) / (1000 * 60 * 60);
        var key      = "fulla_remind_" + v.id;
        if (diffH > 0 && diffH <= 24 && !sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            var body = tr.notif_reminder_body
                .replace("{d}", v.paiva)
                .replace("{t}", v.aika || "");
            showNotificationBanner("\u23F0 " + escHtml(body), "reminder");
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(tr.notif_reminder_title, { body: body });
            }
        }
    }
}

// Run on page load
requestNotifPermission();
checkNewConfirmations();
checkReminders();
// Re-check reminders every 5 minutes while the page is open
setInterval(checkReminders, 5 * 60 * 1000);

