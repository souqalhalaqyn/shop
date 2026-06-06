import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";
import ar from "./ar.json";
import en from "./en.json";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const LANGUAGE_STORAGE_KEY = "@barbers-shop:language";

export type LanguageCode = "en" | "ar";

/**
 * Pre-initialization: Apply RTL before app renders
 * Returns true if a reload was triggered (app will restart)
 */
export async function preInit(): Promise<boolean> {
  const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const deviceLocale = getLocales()[0].languageCode ?? "en";
  const initialLang =
    storedLang === "en" || storedLang === "ar"
      ? storedLang
      : deviceLocale.startsWith("ar")
        ? "ar"
        : "en";

  const shouldBeRTL = initialLang === "ar";

  // If RTL state doesn't match, apply it and reload
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);

    // Reload after a small delay
    setTimeout(() => {
      if (__DEV__) {
        const { DevSettings } = require("react-native");
        DevSettings.reload();
      } else {
        const { Updates } = require("expo-updates");
        Updates.reloadAsync();
      }
    }, 50);

    return true; // App is reloading
  }

  return false; // Continue with init
}

/**
 * Initialize i18next (call after preInit returns false)
 */
export async function initI18n() {
  const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const deviceLocale = getLocales()[0].languageCode ?? "en";
  const initialLang =
    storedLang === "en" || storedLang === "ar"
      ? storedLang
      : deviceLocale.startsWith("ar")
        ? "ar"
        : "en";

  i18n.use(initReactI18next).init({
    resources,
    lng: initialLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

  return initialLang;
}

export async function changeLanguage(lang: LanguageCode) {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);

  const shouldBeRTL = lang === "ar";
  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);

  // Reload to apply RTL
  setTimeout(() => {
    if (__DEV__) {
      const { DevSettings } = require("react-native");
      DevSettings.reload();
    } else {
      const { Updates } = require("expo-updates");
      Updates.reloadAsync();
    }
  }, 100);
}

export default i18n;
