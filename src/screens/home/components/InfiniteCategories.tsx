import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface InfiniteCategoriesProps {
    categoriesToRender: any[];
    categoryIcons: any;
    setCategory: (category: any) => void;
    setSubcategoriesCarOopen: (open: boolean) => void;
}

const InfiniteCategories: React.FC<InfiniteCategoriesProps> = ({
    categoriesToRender,
    categoryIcons,
    setCategory,
    setSubcategoriesCarOopen,
}) => {
    const router = useRouter();

    return (
        <View className="mb-6 px-4">
            <View className="flex-row flex-wrap justify-between">
                {categoriesToRender.map((c) => {
                    const IconComponent = categoryIcons[c.name] || categoryIcons.default;
                    return (
                        <TouchableOpacity
                            key={c.categoryId || c.key}
                            className="items-center mb-6"
                            style={{ width: '23%' }}
                            onPress={() => {
                                setCategory({ name: c.name, id: c.categoryId });
                                setSubcategoriesCarOopen(true);
                            }}
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
        </View>
    );
};

export default InfiniteCategories;
