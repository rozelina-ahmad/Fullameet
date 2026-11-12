 // Haetaan lomake ja vahvistus-elementti
const lomake = document.getElementById("asiakasLomake");
const vahvistus = document.getElementById("vahvistus");

// Lisätään tapahtumakuuntelija lomakkeelle
lomake.addEventListener("submit", function(event) {
    event.preventDefault(); // Estetään lomakkeen normaali lähetys

    // Haetaan tiedot lomakkeesta
    const data = {
        nimi: document.getElementById("nimi").value,
        sahkoposti: document.getElementById("sahkoposti").value,
        puhelin: document.getElementById("puhelin").value,
        paiva: document.getElementById("paiva").value,
        hanke: document.getElementById("hanke").value,
        aihe: document.getElementById("aihe").value
    };

    // Lähetetään tiedot Flask-palvelimelle POST-pyynnöllä
    fetch("/tallenna", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(json => {
        // Näytetään vahvistusviesti käyttäjälle
        vahvistus.innerText = json.viesti;

        // Tyhjennetään lomake
        lomake.reset();
    })
    .catch(error => {
        console.error("Virhe lähetyksessä:", error);
        vahvistus.innerText = "Varauksen tallentaminen epäonnistui!";
    });
});

