import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChangePasswordScreen() {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = async () => {
    if (newPassword.length < 6) {
      Alert.alert("", t("auth.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("", t("auth.passwordsNotMatch"));
      return;
    }
    setLoading(true);
    try {
      await changePassword(newPassword);
      router.replace("/(drawer)");
    } catch (error: any) {
      Alert.alert("", error?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[gs.container, { justifyContent: "center" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Ionicons name="lock-closed" size={48} color={plate.primary} />
        <Text style={[gs.h1, { marginTop: 16 }]}>{t("auth.changePasswordTitle")}</Text>
        <Text style={[gs.textSmall, { marginTop: 8, textAlign: "center" }]}>
          {t("auth.changePasswordSubtitle")}
        </Text>
      </View>

      <View style={[gs.inputContainer, { marginTop: 16 }]}>
        <TextInput
          style={gs.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t("auth.newPasswordPlaceholder")}
          placeholderTextColor={plate.graySecond}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color={plate.graySecond}
          />
        </TouchableOpacity>
      </View>

      <View style={[gs.inputContainer, { marginTop: 12 }]}>
        <TextInput
          style={gs.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t("auth.confirmPassword")}
          placeholderTextColor={plate.graySecond}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[gs.button, { marginTop: 24, opacity: loading ? 0.6 : 1 }]}
        onPress={handleChange}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={plate.background} />
        ) : (
          <Text style={gs.buttonText}>{t("auth.changePasswordButton")}</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
