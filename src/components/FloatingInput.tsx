import { View, Text, TextInput } from "react-native";
import { colors } from "@/theme";

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  editable?: boolean;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "numeric" | "email-address";
}

export default function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  editable = true,
  placeholder = "",
  keyboardType = "default",
}: Props) {
  return (
    <View
      className={`rounded-xl px-4 py-3 border bg-bg_secondary ${
        editable ? "border-border_secondary" : "border-border_primary"
      }`}
    >
      <Text className="text-xs text-text_tertiary mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.text_tertiary}
        keyboardType={keyboardType}
        className={`text-base ${editable ? "text-text_primary" : "text-text_tertiary"}`}
      />
    </View>
  );
}
