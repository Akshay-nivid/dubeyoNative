import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

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
        className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3.5 flex-row items-center justify-between"
      >
        <Text
          className={`flex-1 text-base ${
            selectedOption && selectedOption.value !== ""
              ? "text-gray-900"
              : "text-gray-400"
          }`}
        >
          {selectedOption && selectedOption.value !== ""
            ? selectedOption.label
            : labelText}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
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
          <Pressable className="bg-white rounded-t-3xl max-h-[80%]">
            <View className="py-4 px-6">
              <Text className="text-lg font-semibold text-gray-700">
                {typeof label === "string" ? label : "Select"}
              </Text>
            </View>
            <View className="h-px bg-gray-200 mx-6" />
            <ScrollView className="max-h-96">
              {options
                .filter((option) => option.value !== "")
                .map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    className={`px-6 py-4 ${
                      value === option.value ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        value === option.value
                          ? "text-blue-900 font-medium"
                          : "text-gray-900"
                      }`}
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
