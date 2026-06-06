import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { useTranslation } from "react-i18next";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function Settings() {
  const { gs } = useGlobalStyles();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("", t("settings.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("settings.logout"), style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={gs.container}>
      <Text style={gs.h1}>{t("settings.title")}</Text>

      {user && (
        <View style={[gs.cardFlat, { padding: 16, marginTop: 20 }]}>
          <Text style={gs.label}>{t("settings.account")}</Text>
          <Text style={[gs.textSmall, { marginTop: 4 }]}>{user.phone}</Text>
        </View>
      )}

      <View style={[gs.cardFlat, { padding: 16, marginTop: 20 }]}>
        <View style={gs.rowBetween}>
          <Text style={gs.label}>{t("settings.theme")}</Text>
          <ThemeSwitcher />
        </View>
        <View style={[gs.divider, { marginVertical: 12 }]} />
        <View style={gs.rowBetween}>
          <Text style={gs.label}>{t("settings.language")}</Text>
          <LanguageSwitcher />
        </View>
      </View>

      <TouchableOpacity
        style={[gs.buttonDanger, { marginTop: 32 }]}
        onPress={handleLogout}
      >
        <Text style={gs.buttonText}>{t("settings.logout")}</Text>
      </TouchableOpacity>
    </View>
  );
}
