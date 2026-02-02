import { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

interface Props {
  id?: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (name: string, value: string) => void;
  editable?: boolean;
}

export default function PasswordField({
  id,
  label,
  name,
  placeholder,
  required = false,
  value,
  onChange,
  editable = true,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="mb-5">
      <View className="w-full rounded-xl px-4 py-3.5 flex-row items-center bg-bg_white border border-border_primary">
        <TextInput
          id={id}
          placeholder={label}
          placeholderTextColor={colors.text_tertiary}
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={(text) => onChange(name, text)}
          editable={editable}
          className="flex-1 text-base text-text_primary"
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          className="ml-2"
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.icon_secondary}
          />
        </Pressable>
      </View>
    </View>
  );
}
