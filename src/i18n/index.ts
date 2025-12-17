import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./translations/en.json";
import ua from "./translations/ua.json";

export const LANGUAGE_STORAGE_KEY = "skillup.language";
export const SUPPORTED_LANGUAGES = ["en", "ua"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

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
  lng: phoneLang,
  fallbackLng: "ua",    
  interpolation: {
    escapeValue: false,
  },
});

// Load persisted language (if any) after init.
// This avoids losing user's selection on app restart.
(async () => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
      await i18n.changeLanguage(saved);
      return;
    }
    // ensure we're using detected device language if nothing saved
    if (phoneLang && SUPPORTED_LANGUAGES.includes(phoneLang as SupportedLanguage)) {
      await i18n.changeLanguage(phoneLang);
    }
  } catch (e) {
    console.log("Language storage error:", e);
  }
})();

export default i18n;
