import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SelectRowProps {
  label: string;
  value?: string;
  options: any[];
  onSelect: (option: any) => void;
  isLoading?: boolean;
  containerStyle?: object | any[];
}

const SelectRow = ({
  label,
  value,
  options,
  onSelect,
  isLoading = false,
  containerStyle,
}: SelectRowProps) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-4" style={containerStyle}>
      <Text 
        className="text-gray-900 font-bold text-[13px] mb-1.5 ml-1"
        style={{ flexWrap: 'wrap' }}
      >
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => {
          if (isLoading) return;
          setOpen(!open);
        }}
        disabled={isLoading}
        activeOpacity={0.7}
        className={`bg-gray-50/50 border border-gray-100 rounded-[18px] px-4 h-12 shadow-sm shadow-black/[0.02] flex-row justify-between items-center ${isLoading ? "opacity-50" : ""}`}
      >
        <Text
          numberOfLines={1}
          className={`text-sm font-semibold flex-1 mr-2 ${value ? "text-gray-900" : "text-gray-400"}`}
        >
          {isLoading ? "Loading..." : value || `Select ${label}`}
        </Text>
        <View className="flex-row items-center">
          {isLoading && (
            <ActivityIndicator size="small" color="#6366F1" className="mr-2" />
          )}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={14}
            color="#9CA3AF"
          />
        </View>
      </TouchableOpacity>
      {open && options?.length > 0 && (
        <View className="mt-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xl shadow-black/10 max-h-64 z-50">
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {options.map((opt: any, index: number) => (
              <TouchableOpacity
                key={opt.id || opt._id || opt.value || index}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className="px-4 py-3.5 border-b border-gray-50 active:bg-indigo-50/30"
              >
                <Text className="text-sm text-gray-700 font-medium">
                  {typeof opt === "string" ? opt : opt.name || opt.label || String(opt)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {open && (!options || options.length === 0) && (
        <View className="mt-2 bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <Text className="text-gray-400 text-xs text-center italic font-medium">
            No options available
          </Text>
        </View>
      )}
    </View>
  );
};

export default SelectRow;
