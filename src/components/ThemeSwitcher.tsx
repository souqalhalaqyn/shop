import { useAppTheme } from "@/context/ThemeContext";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";

export default function ThemeSwitcher() {
  const { plate, gs, isDark } = useGlobalStyles();
  const { themeType, setThemeType } = useAppTheme();

  const cycleTheme = () => {
    const next: Record<string, "light" | "dark" | "system"> = {
      system: "light",
      light: "dark",
      dark: "system",
    };
    setThemeType(next[themeType]);
  };

  const getIcon = () => {
    if (themeType === "system") return "phone-portrait";
    return isDark ? "moon" : "sunny";
  };

  return (
    <TouchableOpacity onPress={cycleTheme} style={[gs.containerRow, { padding: 10 }]}>
      <Ionicons name={getIcon()} size={20} color={plate.primary} />
    </TouchableOpacity>
  );
}
