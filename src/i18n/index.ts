import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./translations/en.json";
import ua from "./translations/ua.json";

const resources = {
  en: { translation: en },
  ua: { translation: ua },
};

 
let phoneLang = "ua";

try {
  const locales = Localization.getLocales();

  if (locales && Array.isArray(locales) && locales.length > 0) {
    const langCode = locales[0].languageCode;

    if (langCode === "uk" || langCode === "ua") {
      phoneLang = "ua";      
    } else if (langCode === "en") {
      phoneLang = "en";      
    }
   
  }
} catch (e) {
  console.log("Localization error:", e);
}

i18n.use(initReactI18next).init({

 
  resources,
  lng: 'en',
  fallbackLng: "ua",    
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
