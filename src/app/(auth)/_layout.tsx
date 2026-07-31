import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { isAuthenticated, mustChangePassword } = useAuth();

  if (isAuthenticated && !mustChangePassword) {
    return <Redirect href={"/(drawer)" as any} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
    </Stack>
  );
}