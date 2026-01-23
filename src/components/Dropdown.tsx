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
        className="w-full rounded-xl px-4 py-3.5 flex-row items-center justify-between"
        style={{ backgroundColor: colors.bg_white, borderColor: colors.border_primary, borderWidth: 1 }}
      >
        <Text
          className="flex-1 text-base"
          style={{ color: selectedOption && selectedOption.value !== "" ? colors.text_primary : colors.text_secondary }}
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
          <Pressable className="rounded-t-3xl max-h-[80%]" style={{ backgroundColor: colors.bg_white }}>
            <View className="py-4 px-6">
              <Text className="text-lg font-semibold" style={{ color: colors.text_primary }}>
                {typeof label === "string" ? label : "Select"}
              </Text>
            </View>
            <View className="h-px mx-6" style={{ backgroundColor: colors.border_primary }} />
            <ScrollView className="max-h-96">
              {options
                .filter((option) => option.value !== "")
                .map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    className="px-6 py-4"
                    style={{ backgroundColor: value === option.value ? colors.bg_secondary : colors.bg_white }}
                  >
                    <Text
                      className={`text-base ${value === option.value ? "font-medium" : ""}`}
                      style={{ color: value === option.value ? colors.primary : colors.text_primary }}
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
