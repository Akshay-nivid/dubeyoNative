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
    <View className={`border rounded-xl px-4 py-3 bg-gray-50 ${
      editable ? "border-gray-300" : "border-gray-200"
    }`}>
      <Text className="text-xs text-gray-400 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.text_secondary}
        keyboardType={keyboardType}
        className="text-base text-black"
        style={{ color: editable ? colors.text_primary : colors.text_tertiary }}
      />
    </View>
  );
}
