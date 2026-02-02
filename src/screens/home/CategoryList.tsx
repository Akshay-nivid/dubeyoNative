import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/theme";
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
  const realCategories = categories.slice(0, 7);
  const othersCategory = { key: "others", name: "Others", categoryId: null };
  const displayCategories = [...realCategories, othersCategory];

  return (
    <View className="px-4 mb-1">
      <View className="flex-row flex-wrap justify-between">
        {displayCategories.map((c) => {
          const IconComponent = categoryIcons[c.name];
          const isOthers = c.name === "Others";
          return (
            <TouchableOpacity
              key={c.key}
              className="w-[23%] mb-4"
              onPress={() => onSelect(c)}
              activeOpacity={0.7}
            >
              <View className="w-full aspect-square rounded-lg items-center justify-center bg-bg_secondary pt-3 pb-2 px-2">
                {isOthers ? (
                  <Ionicons name="grid-outline" size={24} color={colors.text_primary} />
                ) : (
                  IconComponent && (
                    <IconComponent size={24} color={colors.text_primary} />
                  )
                )}
                <Text
                  className="text-[10px] text-center font-bold leading-3 text-text_primary mt-2"
                  numberOfLines={2}
                >
                  {c.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default CategoryList;
