import { useGlobalStyles } from "@/styles/global";
import { useTranslation } from "react-i18next";
import { Image, Text, View } from "react-native";

export default function HeaderTitle() {
  const { gs } = useGlobalStyles();
  const { t } = useTranslation();

  return (
    <View
      style={[
        gs.containerRow,
        { justifyContent: "space-between", width: "100%", zIndex: 1 },
      ]}
    >
      <View style={gs.containerRow}>
        <Image
          source={require("@/assets/logo.png")}
          style={{ width: 28, height: 28, resizeMode: "contain" }}
        />
        <Text
          style={[
            gs.h1,
            {
              fontSize: 22,
              lineHeight: 28,
              textShadowColor: "rgba(0,0,0,0.9)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            },
          ]}
          numberOfLines={1}
        >
          {t("application.name")}
        </Text>
      </View>
    </View>
  );
}
