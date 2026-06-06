import { useGlobalStyles } from "@/styles/global";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function Ads() {
  const { gs } = useGlobalStyles();
  const { t } = useTranslation();

  return (
    <View style={gs.container}>
      <Text style={gs.h1}>{t("pages.comingSoon")}</Text>
    </View>
  );
}
