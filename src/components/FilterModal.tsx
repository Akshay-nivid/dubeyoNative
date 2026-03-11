import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (selectedDivision: any) => void;
  onReset: () => void;
  divisionTypes: any[];
  selectedDivision: any;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  onReset,
  divisionTypes,
  selectedDivision,
}) => {
  const [tempSelectedDivision, setTempSelectedDivision] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      setTempSelectedDivision(selectedDivision);
    }
  }, [visible, selectedDivision]);

  const handleApply = () => {
    onApply(tempSelectedDivision);
    onClose();
  };

  const handleReset = () => {
    setTempSelectedDivision(null);
    onReset();
    // Don't close immediately on reset, let user choose to apply empty or selecting something else
    // But usually reset functionality might want to clear and close, or just clear.
    // Reference image has "Reset" in top right.
  };

  const isSelected = (division: any) => {
    if (!tempSelectedDivision && !division) return true; // Handling "All" if we had an explicit "All" option
    return tempSelectedDivision?.id === division?.id;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet" // iOS standard for this kind of modal
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-center">Filter</Text>
          <TouchableOpacity onPress={handleReset} className="p-2 -mr-2">
            <Text className="text-base text-gray-500">Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
          {/* Type / Category Division Section */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-gray-800">Type</Text>
              {/* <Text className="text-sm text-gray-500">View all &gt;</Text> */}
            </View>

            <View className="flex-row flex-wrap gap-3">
              {divisionTypes.length > 0 ? (
                divisionTypes.map((dt) => {
                  const active = isSelected(dt);
                  return (
                    <TouchableOpacity
                      key={dt.id}
                      onPress={() =>
                        setTempSelectedDivision(active ? null : dt)
                      }
                      className={`px-4 py-2 rounded-full border ${
                        active
                          ? "bg-black border-black"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          active ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {dt.name} {active && "✓"}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text className="text-gray-400 italic">No types available</Text>
              )}
            </View>
          </View>

          {/* Placeholder for Price Range (visual only for now as requested by user goal which prioritized layout) */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-gray-800">
                Price Range
              </Text>
            </View>
            {/* Visual Placeholder for slider */}
            <View className="h-1 bg-gray-200 rounded-full w-full mb-2 relative">
              <View className="absolute left-[20%] right-[30%] h-full bg-black rounded-full" />
              <View className="absolute left-[20%] -top-1.5 w-4 h-4 bg-black rounded-full" />
              <View className="absolute right-[30%] -top-1.5 w-4 h-4 bg-black rounded-full" />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-sm text-gray-600">0 AED</Text>
              <Text className="text-sm text-gray-600">Max AED</Text>
            </View>
          </View>

          {/* Placeholder for Rating or other filters */}
          {/* <View className="mb-6">
                     <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-base font-bold text-gray-800">Customer Review</Text>
                    </View>
                     {[5, 4, 3].map(stars => (
                         <View key={stars} className="flex-row items-center justify-between mb-3">
                             <View className="flex-row">
                                 {[...Array(5)].map((_, i) => (
                                     <Ionicons 
                                        key={i} 
                                        name={i < stars ? "star" : "star-outline"} 
                                        size={18} 
                                        color={i < stars ? "#000" : "#ccc"} 
                                     />
                                 ))}
                                 <Text className="ml-2 text-gray-600">& up</Text>
                             </View>
                             <View className={`w-5 h-5 rounded-full border border-gray-300 ${stars === 4 ? 'border-4 border-black' : ''}`} />
                         </View>
                     ))}
                 </View> */}
        </ScrollView>

        {/* Footer */}
        <View className="p-4 border-t border-gray-100 pb-8">
          <TouchableOpacity
            onPress={handleApply}
            className="bg-black py-4 rounded-xl items-center justify-center shadow-sm"
          >
            <Text className="text-white text-base font-bold">Show results</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default FilterModal;
