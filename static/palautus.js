const texts = {
    fi: {
        forgot_title: "Unohtuiko salasana?", forgot_description: "Anna tilisi sähköpostiosoite. Lähetämme palautuslinkin, jos tili on aktiivinen.",
        email: "Sähköposti", send: "Lähetä palautuslinkki", login: "Takaisin kirjautumiseen",
        reset_title: "Aseta uusi salasana", password: "Uusi salasana (8–128 merkkiä)",
        confirm: "Vahvista uusi salasana", save: "Vaihda salasana", new_link: "Pyydä uusi palautuslinkki",
        mismatch: "Salasanat eivät täsmää."
    },
    en: {
        forgot_title: "Forgot your password?", forgot_description: "Enter your account email. If your account is active, we will send a reset link.",
        email: "Email", send: "Send reset link", login: "Back to sign in",
        reset_title: "Set a new password", password: "New password (8–128 characters)",
        confirm: "Confirm new password", save: "Change password", new_link: "Request a new reset link",
        mismatch: "Passwords do not match."
    },
    ar: {
        forgot_title: "هل نسيت كلمة المرور؟", forgot_description: "أدخل بريد حسابك الإلكتروني. إذا كان الحساب نشطًا، سنرسل رابط إعادة التعيين.",
        email: "البريد الإلكتروني", send: "إرسال رابط الاستعادة", login: "العودة إلى تسجيل الدخول",
        reset_title: "تعيين كلمة مرور جديدة", password: "كلمة المرور الجديدة (٨–١٢٨ حرفًا)",
        confirm: "تأكيد كلمة المرور الجديدة", save: "تغيير كلمة المرور", new_link: "طلب رابط استعادة جديد",
        mismatch: "كلمتا المرور غير متطابقتين."
    }
};

const password = document.getElementById("salasana");
const confirmation = document.getElementById("vahvistus");
function checkPasswords() {
    if (password && confirmation) {
        confirmation.setCustomValidity(confirmation.value && confirmation.value !== password.value
            ? texts[document.documentElement.lang].mismatch : "");
    }
}
function setLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-text]").forEach(el => { el.textContent = texts[lang][el.dataset.text]; });
    document.querySelectorAll("[data-lang]").forEach(el => { el.classList.toggle("active", el.dataset.lang === lang); });
    checkPasswords();
    try { localStorage.setItem("fulla_lang", lang); } catch (e) {}
}
document.querySelectorAll("[data-lang]").forEach(el => el.addEventListener("click", () => setLanguage(el.dataset.lang)));
if (password && confirmation) {
    password.addEventListener("input", checkPasswords);
    confirmation.addEventListener("input", checkPasswords);
    const token = new URLSearchParams(location.hash.slice(1)).get("token");
    if (token) {
        document.getElementById("tunniste").value = token;
        history.replaceState(null, "", location.pathname + location.search);
    }
}
let lang = "fi";
try { lang = localStorage.getItem("fulla_lang") || "fi"; } catch (e) {}
setLanguage(Object.hasOwn(texts, lang) ? lang : "fi");
