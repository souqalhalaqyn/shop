import { useGlobalStyles } from "@/styles/global";
import { Stack } from "expo-router";

export default function AdsStackLayout() {
  const { plate } = useGlobalStyles();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: plate.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
