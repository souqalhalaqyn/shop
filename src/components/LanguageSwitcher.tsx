import { changeLanguage, type LanguageCode } from "@/i18n";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, TouchableOpacity } from "react-native";

export default function LanguageSwitcher() {
  const { gs, plate } = useGlobalStyles();
  const { i18n, t } = useTranslation();

  const handleLanguageChange = async () => {
    const newLang: LanguageCode = i18n.language === "en" ? "ar" : "en";

    Alert.alert(
      t("common.restartRequired") || "Restart Required",
      t("common.restartMessage") ||
        "Please restart the app to apply layout changes",
      [
        {
          text: t("common.ok"),
          onPress: () => changeLanguage(newLang),
        },

        {
          text: t("common.cancel"),
        },
      ],
    );
  };

  return (
    <TouchableOpacity style={gs.containerRow} onPress={handleLanguageChange}>
      <Ionicons name="globe" color={plate.text} size={16} />
      <Text style={gs.text}>
        {i18n.language === "en" ? t("language.arabic") : t("language.english")}
      </Text>
    </TouchableOpacity>
  );
}
