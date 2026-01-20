import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;

  return (
    <View className="mb-5">
      <View className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3.5 flex-row items-center">
        <TextInput
          id={id}
          placeholder={label}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={(text) => onChange(name, text)}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 text-base text-gray-900"
          style={{ outline: "none" }}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          className="ml-2"
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#6B7280"
          />
        </Pressable>
      </View>
    </View>
  );
}
