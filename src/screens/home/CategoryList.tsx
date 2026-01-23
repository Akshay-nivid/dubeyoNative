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
    <View className="mb-4 px-4">
      <View className="flex-row flex-wrap justify-between">
        {displayCategories.map((c) => {
          const IconComponent = categoryIcons[c.name];
          const isOthers = c.name === "Others";
          return (
            <TouchableOpacity
              key={c.key}
              className="w-[23%] mb-4"
              onPress={() => onSelect(c)}
            >
              <View className="w-full aspect-square rounded-3xl items-center justify-center p-1" style={{ backgroundColor: colors.bg_secondary }}>
                {isOthers ? (
                  <Ionicons name="grid-outline" size={24} color={colors.icon_primary} />
                ) : (
                  IconComponent && (
                    <IconComponent size={24} color={colors.icon_primary} />
                  )
                )}
                <Text className="text-[10px] text-center font-bold mt-1.5 leading-3" style={{ color: colors.text_primary }} numberOfLines={2}>
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
