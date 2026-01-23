import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { categoryIcons } from "./Api";

interface Category {
  key: string;
  name: string;
  categoryId: string | null;
}

interface CategoryListProps {
  categories: Category[];
  onSelect: (category: Category) => void;
  onSeeAll: () => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onSelect,
  onSeeAll,
}) => {
  const displayCategories = categories.slice(0, 4);

  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 8 }}
      >
        {displayCategories.map((c) => {
          const IconComponent = categoryIcons[c.name];
          return (
            <TouchableOpacity
              key={c.categoryId || c.key}
              className="items-center mr-3"
              style={{ width: 80 }}
              onPress={() => onSelect(c)}
            >
              <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-2 shadow-sm border border-gray-100">
                {IconComponent ? (
                  <IconComponent size={28} color="#1f2937" />
                ) : (
                  <Text className="text-2xl">📦</Text>
                )}
              </View>
              <Text
                className="text-xs text-center text-gray-700 font-medium leading-4"
                numberOfLines={2}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        {/* See All Button */}
        <TouchableOpacity
          className="items-center mr-3"
          style={{ width: 80 }}
          onPress={onSeeAll}
        >
          <View className="w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center mb-2 border-2 border-dashed border-gray-300">
            <Ionicons name="grid-outline" size={28} color="#6b7280" />
          </View>
          <Text
            className="text-xs text-center text-gray-700 font-medium leading-4"
            numberOfLines={2}
          >
            See All
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CategoryList;
