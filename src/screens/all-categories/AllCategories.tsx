import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { get } from "@/src/services/api";
import { colors } from "@/theme";
import { Api, categoryIcons } from "../home/Api";
import ClassifiedShowCard from "../home/ClassifiedShowCard";

const AllCategories = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subcategoriesCardOpen, setSubcategoriesCardOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await get(Api.CategoriesAll);
        let categoriesList: any[] = [];

        if (Array.isArray(res.data)) {
          categoriesList = res.data;
        } else if (Array.isArray(res.data?.data)) {
          categoriesList = res.data.data;
        }

        const list: any[] = [];
        categoriesList.forEach((cat: any) => {
          const name = cat.label || cat.name || cat.category_name || cat;
          const categoryId = cat.value || cat.category_id || cat.id;
          list.push({ key: categoryId || name, name, categoryId });
        });

        // Remove duplicates based on name
        const seen = new Set();
        const uniqueCategories = list.filter((x) =>
          seen.has(x.name) ? false : seen.add(x.name),
        );

        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Failed to fetch categories", error);
        // Fallback to category icons
        const fallbackCategories = Object.keys(categoryIcons);
        setCategories(
          fallbackCategories.map((name) => ({
            key: `fallback-${name}`,
            name,
            categoryId: null,
          })),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (category: any) => {
    if (!category.categoryId) {
      // Navigate to category page if no ID
      const slug = category.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/&/g, "and");
      router.push(`/categories/${slug}` as any);
      return;
    }

    setSelectedCategory({ name: category.name, id: category.categoryId });
    setSubcategoriesCardOpen(true);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-bg_primary"
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg_primary} />

      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-border_primary bg-bg_primary">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.icon_primary} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-text_primary">
          All Categories
        </Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-text_secondary">
            Loading categories...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-bg_primary"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
        >
          <View className="flex-row flex-wrap justify-between">
            {categories.map((c) => {
              const IconComponent = categoryIcons[c.name];
              return (
                <TouchableOpacity
                  key={c.categoryId || c.key}
                  className="w-[23%] items-center mb-6"
                  onPress={() => handleCategoryClick(c)}
                >
                  <View className="w-16 h-16 rounded-2xl items-center justify-center mb-2 shadow-sm border border-border_primary bg-bg_white">
                    {IconComponent ? (
                      <IconComponent size={28} color={colors.icon_primary} />
                    ) : (
                      <Text className="text-2xl">📦</Text>
                    )}
                  </View>
                  <Text
                    className="text-xs text-center font-medium leading-4 text-text_primary"
                    numberOfLines={2}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      <ClassifiedShowCard
        open={subcategoriesCardOpen}
        onClose={() => setSubcategoriesCardOpen(false)}
        category={selectedCategory}
      />
    </SafeAreaView>
  );
};

export default AllCategories;
