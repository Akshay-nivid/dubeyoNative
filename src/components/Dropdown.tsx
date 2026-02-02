import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { colors } from "@/theme";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string | React.ReactNode;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  options: Option[];
  required?: boolean;
}

export default function Dropdown({
  label,
  name,
  value,
  onChange,
  placeholder = "Select an option",
  options,
  required = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value && opt.value !== "");

  const handleSelect = (optionValue: string) => {
    onChange(name, optionValue);
    setIsOpen(false);
  };

  const labelText = typeof label === "string" ? label : "Select";

  return (
    <View className="mb-5">
      <Pressable
        onPress={() => setIsOpen(true)}
        className="w-full rounded-xl px-4 py-3.5 flex-row items-center justify-between bg-bg_white border border-border_primary"
      >
        <Text
          className={`flex-1 text-base ${selectedOption && selectedOption.value !== "" ? "text-text_primary" : "text-text_tertiary"}`}
        >
          {selectedOption && selectedOption.value !== ""
            ? selectedOption.label
            : labelText}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.icon_secondary} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <Pressable className="rounded-t-3xl max-h-[80%] bg-bg_white">
            <View className="py-4 px-6">
              <Text className="text-lg font-semibold text-text_primary">
                {typeof label === "string" ? label : "Select"}
              </Text>
            </View>
            <View className="h-px mx-6 bg-border_primary" />
            <ScrollView className="max-h-96">
              {options
                .filter((option) => option.value !== "")
                .map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    className={`px-6 py-4 ${value === option.value ? "bg-bg_secondary" : "bg-bg_white"}`}
                  >
                    <Text
                      className={`text-base ${value === option.value ? "font-medium text-primary" : "text-text_primary"}`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
