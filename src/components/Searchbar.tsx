import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: (text: string) => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder,
  onClear,
  onSubmit,
}: SearchBarProps) {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();

  return (
    <View
      style={[
        gs.containerRow,
        styles.container,
        { backgroundColor: plate.backgroundSecond },
      ]}
    >
      <TouchableOpacity onPress={() => onSubmit?.(value)} style={{ padding: 8 }}>
        <Ionicons name="search" size={22} color={plate.textSecond} />
      </TouchableOpacity>

      <TextInput
        style={[gs.input]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t("common.search")}
        placeholderTextColor={plate.textSecond}
        selectionColor={plate.primary}
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => onSubmit?.(value)}
      />

      {value.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <Ionicons
            name="close-circle"
            size={20}
            color={plate.textSecond}
            style={{}}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },

});
