import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface InlinePickerOption {
  label: string;
  value: string;
}

interface InlinePickerProps {
  label: string;
  value: string;
  options: InlinePickerOption[];
  containerStyle?: any;
  isLoading?: boolean;
  onSelect: (opt: InlinePickerOption) => void;
}

export const InlinePicker: React.FC<InlinePickerProps> = ({
  label, value, options, containerStyle, isLoading, onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const hasValue = !!(value && value !== "Select" && value !== "Select Option");

  return (
    <View className="mb-2" style={containerStyle}>
      <Text 
        className="text-gray-900 font-semibold text-[12px] mb-1.5 ml-1"
        style={{ flexWrap: 'wrap' }}
      >
        {label}
      </Text>

      <TouchableOpacity
        onPress={() => !isLoading && setOpen(true)}
        activeOpacity={0.7}
        className="bg-gray-50/50 border border-gray-100 rounded-[8px] h-12 px-4 flex-row items-center justify-between shadow-sm shadow-black/[0.02]"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#6366F1" />
        ) : (
          <>
            <Text
              className={`text-sm font-semibold flex-1 ${hasValue ? "text-gray-900" : "text-gray-400"}`}
              numberOfLines={1}
            >
              {value || "Select"}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#6366F1" />
          </>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/35"
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] pt-4 pb-8 max-h-[60%]">
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-4" />
            <Text className="font-bold text-[15px] text-gray-900 mb-3 px-5">{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.label === value;
                return (
                  <TouchableOpacity
                    onPress={() => { onSelect(item); setOpen(false); }}
                    className={`py-[14px] px-5 border-b border-b-gray-100 flex-row items-center justify-between`}
                  >
                    <Text className={`text-[14px] font-semibold flex-1 ${isSelected ? "text-indigo-600" : "text-gray-700"}`}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#4F46E5" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

