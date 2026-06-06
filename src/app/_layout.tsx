import { ApiProvider } from "@/api";
import { useAuth, AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { AppThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { initI18n } from "@/i18n";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

function InnerLayout() {
  const { theme } = useAppTheme();
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(drawer)" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ApiProvider>
      <AuthProvider>
        <AppThemeProvider>
          <CartProvider>
            <InnerLayout />
          </CartProvider>
        </AppThemeProvider>
      </AuthProvider>
    </ApiProvider>
  );
}
