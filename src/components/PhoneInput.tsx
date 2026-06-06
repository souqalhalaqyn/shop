import { useGlobalStyles } from "@/styles/global";
import { useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const DIGIT_COUNT = 9;

interface PhoneInputProps {
  value: string;
  onChange: (digits: string) => void;
}

export default function PhoneInput({ value, onChange }: PhoneInputProps) {
  const { gs, plate } = useGlobalStyles();
  const ref = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, DIGIT_COUNT);
    onChange(digits);
  };

  const groups = [
    value.slice(0, 3),
    value.slice(3, 6),
    value.slice(6, 9),
  ];

  return (
    <Pressable
      style={{ alignSelf: "stretch" }}
      onPress={() => ref.current?.focus()}
    >
      <TextInput
        ref={ref}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
        keyboardType="number-pad"
        value={value}
        onChangeText={handleChange}
        autoFocus
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: plate.backgroundSecond,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: plate.gray,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Text style={[gs.label, { fontSize: 18, letterSpacing: 2, marginRight: 6 }]}>
          +963
        </Text>
        <Text style={{ color: plate.graySecond, fontSize: 20, marginRight: 4 }}>/</Text>
        {groups.map((group, gi) => (
          <View key={gi} style={{ flexDirection: "row" }}>
            {gi > 0 && (
              <Text style={{ color: plate.graySecond, fontSize: 18, marginHorizontal: 2 }}>
                {" "}
              </Text>
            )}
            {Array.from({ length: 3 }).map((_, di) => {
              const idx = gi * 3 + di;
              const char = group[di];
              return (
                <Text
                  key={di}
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    width: 14,
                    textAlign: "center",
                    color: char ? plate.text : plate.graySecond,
                  }}
                >
                  {char ?? (idx < value.length ? "" : "_")}
                </Text>
              );
            })}
          </View>
        ))}
      </View>
    </Pressable>
  );
}