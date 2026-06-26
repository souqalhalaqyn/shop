import PhoneInput from "@/components/PhoneInput";
import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [digits, setDigits] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (digits.length !== 9) {
      Alert.alert("", t("auth.phoneInvalid"));
      return;
    }
    if (!password) {
      Alert.alert("", t("auth.passwordRequired"));
      return;
    }

    const phone = `+963${digits}`;
    setLoading(true);
    try {
      await login(phone, password);
    } catch (error: any) {
      Alert.alert("", error.message);
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
        <Image
          source={require("@/assets/logo.png")}
          style={{ width: 120, height: 120, resizeMode: "contain" }}
        />
        <Text style={[gs.h1, { marginTop: 16 }]}>{t("application.name")}</Text>
      </View>

      <Text style={[gs.h2, { marginBottom: 8 }]}>{t("auth.loginTitle")}</Text>
      <Text style={[gs.textSmall, { marginBottom: 24 }]}>
        {t("auth.enterPhone")}
      </Text>

      <PhoneInput value={digits} onChange={setDigits} />

      <View style={[gs.inputContainer, { marginTop: 16 }]}>
        <TextInput
          style={gs.input}
          value={password}
          onChangeText={setPassword}
          placeholder={t("auth.passwordPlaceholder")}
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

      <TouchableOpacity
        style={[gs.button, { marginTop: 24, opacity: loading ? 0.6 : 1 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={plate.background} />
        ) : (
          <Text style={gs.buttonText}>{t("auth.login")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 16, alignItems: "center" }}
        onPress={() => router.push("/(auth)/signup")}
      >
        <Text style={{ color: plate.primary }}>{t("auth.noAccount")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 12, alignItems: "center" }}
        onPress={() => router.push("/(drawer)" as any)}
      >
        <Text style={{ color: plate.graySecond }}>
          {t("common.continueAsGuest")}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
