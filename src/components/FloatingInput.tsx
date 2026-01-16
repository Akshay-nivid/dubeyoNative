import { View, Text, TextInput } from "react-native";

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  editable?: boolean;
}

export default function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  editable = true,
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
        className="text-base text-black"
      />
    </View>
  );
}
