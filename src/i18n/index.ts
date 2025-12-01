import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./translations/en.json";
import ua from "./translations/ua.json";

const resources = {
  en: { translation: en },
  ua: { translation: ua },
};

// Дефолт — українська
let phoneLang = "ua";

try {
  const locales = Localization.getLocales();

  if (locales && Array.isArray(locales) && locales.length > 0) {
    const langCode = locales[0].languageCode;

    if (langCode === "uk" || langCode === "ua") {
      phoneLang = "ua";       // українська система → українська апка
    } else if (langCode === "en") {
      phoneLang = "en";       // англійська система → англійська апка
    }
    // інші мови → автоматично "ua"
  }
} catch (e) {
  console.log("Localization error:", e);
}

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  resources,
  lng: 'en',
  fallbackLng: "ua",   // fallback теж українська
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
