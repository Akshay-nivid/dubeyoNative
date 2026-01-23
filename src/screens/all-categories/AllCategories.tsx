import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { get } from "@/src/services/api";
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
                    seen.has(x.name) ? false : seen.add(x.name)
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
                    }))
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
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View className="px-4 py-3 flex-row items-center justify-between bg-white border-b border-gray-100">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">All Categories</Text>
                <View className="w-10" />
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0891b2" />
                    <Text className="text-gray-500 mt-4">Loading categories...</Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1 bg-white"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16 }}
                >
                    <View className="flex-row flex-wrap justify-between">
                        {categories.map((c) => {
                            const IconComponent = categoryIcons[c.name];
                            return (
                                <TouchableOpacity
                                    key={c.categoryId || c.key}
                                    className="items-center mb-6"
                                    style={{ width: '23%' }}
                                    onPress={() => handleCategoryClick(c)}
                                >
                                    <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-2 shadow-sm border border-gray-100">
                                        {IconComponent ? (
                                            <IconComponent size={28} color="#1f2937" />
                                        ) : (
                                            <Text className="text-2xl">📦</Text>
                                        )}
                                    </View>
                                    <Text className="text-xs text-center text-gray-700 font-medium leading-4" numberOfLines={2}>
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
