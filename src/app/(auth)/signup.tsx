import { useAuth } from "@/context/AuthContext";
import PhoneInput from "@/components/PhoneInput";
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

export default function SignupScreen() {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const { signup } = useAuth();
  const [digits, setDigits] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (digits.length !== 9) {
      Alert.alert("", t("auth.phoneInvalid"));
      return;
    }
    if (!password) {
      Alert.alert("", t("auth.passwordRequired"));
      return;
    }
    if (password.length < 6) {
      Alert.alert("", t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("", t("auth.passwordsNotMatch"));
      return;
    }

    const phone = `+963${digits}`;
    setLoading(true);
    try {
      await signup(phone, password);
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
        <Ionicons name="cut" size={64} color={plate.primary} />
        <Text style={[gs.h1, { marginTop: 16 }]}>{t("application.name")}</Text>
      </View>

      <Text style={[gs.h2, { marginBottom: 8 }]}>
        {t("auth.createAccount")}
      </Text>
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
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={plate.background} />
        ) : (
          <Text style={gs.buttonText}>{t("auth.createAccount")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 16, alignItems: "center" }}
        onPress={() => router.back()}
      >
        <Text style={{ color: plate.primary }}>{t("auth.hasAccount")}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}