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
}

const SelectRow = ({
  label,
  value,
  options,
  onSelect,
  isLoading = false,
}: SelectRowProps) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 ml-1">
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => {
          if (isLoading) return;
          setOpen(!open);
        }}
        disabled={isLoading}
        className={`bg-white border border-gray-100 rounded-2xl px-4 h-12 shadow-sm shadow-gray-100 flex-row justify-between items-center ${isLoading ? "opacity-50" : ""}`}
      >
        <Text
          className={`text-sm font-medium ${value ? "text-gray-900" : "text-gray-400"}`}
        >
          {isLoading ? "Loading..." : value || `Select ${label}`}
        </Text>
        <View className="flex-row items-center">
          {isLoading && (
            <ActivityIndicator size="small" color="#A855F7" className="mr-2" />
          )}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color="#9CA3AF"
          />
        </View>
      </TouchableOpacity>
      {open && options?.length > 0 && (
        <View className="mt-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl shadow-black/5 max-h-64">
          <ScrollView nestedScrollEnabled>
            {options.map((opt: any) => (
              <TouchableOpacity
                key={opt.id || opt._id || opt.value}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className="px-4 py-3 border-b border-gray-50 active:bg-gray-50"
              >
                <Text className="text-sm text-gray-700">
                  {opt.name || opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {open && (!options || options.length === 0) && (
        <View className="mt-2 bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <Text className="text-gray-400 text-sm text-center italic">
            No options available
          </Text>
        </View>
      )}
    </View>
  );
};

export default SelectRow;
