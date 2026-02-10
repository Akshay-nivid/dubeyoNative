import ProductCard from "@/src/components/ProductCard";
import ThemedBackground from "@/src/components/ThemedBackground";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { Api, fetchNearestProducts, fetchNewProducts, fetchProductImages, fetchSuggestedProducts } from "@/src/screens/home/Api";
import { get } from "@/src/services/api";
import { normalizeProduct } from "@/src/utils/productMapper";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Define the section types
type SectionType = "popular" | "suggested" | "new";

const SectionListingScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{ sectionType: SectionType; title?: string }>();

    // Params might be passed as object or individual fields depending on how it's called
    const sectionType = (params.sectionType || "popular") as SectionType;
    const screenTitle = params.title || (
        sectionType === "popular" ? "Popular Near You" :
            sectionType === "suggested" ? "Suggested Items" :
                sectionType === "new" ? "New Ads" : "Listings"
    );

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sellerData, setSellerData] = useState<Record<string | number, { name: string; profilePic?: string }>>({});
    const { coordinates } = useUserLocation();

    useEffect(() => {
        fetchData();
    }, [sectionType, coordinates]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let data: any[] = [];
            if (sectionType === "popular") {
                if (coordinates && coordinates.lat && coordinates.lon) {
                    const res = await fetchNearestProducts(coordinates.lat, coordinates.lon);
                    data = res?.data || [];
                }
            } else if (sectionType === "suggested") {
                const res = await fetchSuggestedProducts();
                data = res?.data || [];
            } else if (sectionType === "new") {
                const res = await fetchNewProducts();
                data = res?.data || [];
            }

            const productsWithImages = await loadImages(data);
            setProducts(productsWithImages);
            fetchSellerData(productsWithImages);

        } catch (error) {
            console.error("Error fetching section data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Image loading logic
    const loadImages = async (list: any[]) => {
        const updatedList = await Promise.all(list.map(async (p) => {
            const id = p.id || p.product_id || p._id;
            if (!id) return p;

            // Check if image is already good
            if (p.image && !p.image.includes("undefined")) return p;

            try {
                const res = await fetchProductImages(id);
                const imageUrl = res?.data?.[0] || (Array.isArray(p.images) && p.images[0]?.url);
                if (imageUrl) {
                    return { ...p, image: imageUrl };
                }
            } catch (e) { }
            return p;
        }));
        return updatedList;
    };

    const fetchSellerData = async (list: any[]) => {
        const result: Record<string | number, { name: string; profilePic?: string }> = {};

        // 1. Populate from existing data in list using mapper
        list.forEach((p) => {
            const normalized = normalizeProduct(p);
            if (normalized.seller && normalized.id) {
                result[normalized.id] = {
                    name: normalized.seller.name || "",
                    profilePic: normalized.seller.profilePic
                };
            }
        });

        // 2. Fetch missing seller data
        const productsWithoutSeller = list.filter((p) => {
            const id = p?.product_id || p?.id;
            return id && !result[id];
        });

        const limitedProducts = productsWithoutSeller.slice(0, 20);

        await Promise.all(
            limitedProducts.map(async (p) => {
                const id = p?.product_id || p?.id;
                if (!id || result[id]) return;

                try {
                    const res = await get(`${Api.getProductDetails}?productId=${id}`);
                    const productData = res?.data?.data || res?.data;

                    const normalized = normalizeProduct(productData || {});
                    if (normalized.seller) {
                        result[id] = {
                            name: normalized.seller.name || "",
                            profilePic: normalized.seller.profilePic
                        };
                    }
                } catch (error) {
                    console.error(`Failed to fetch seller data for product ${id}:`, error);
                }
            })
        );

        setSellerData(prev => ({ ...prev, ...result }));
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filteredProducts = searchQuery.trim()
        ? products.filter((p) => {
            const title = p.title ?? p.product_name ?? "";
            return String(title).toLowerCase().includes(searchQuery.trim().toLowerCase());
        })
        : products;

    const renderItem = ({ item }: { item: any }) => {
        const productItem = normalizeProduct(item, {}, sellerData);

        return (
            <ProductCard
                item={productItem}
                onPress={() => router.push(`/product/${productItem.id}` as any)}
                variant="vertical"
            />
        );
    };

    return (
        <ThemedBackground>
            <SafeAreaView className="flex-1" edges={["top"]}>
                {/* Header */}
                <View className="px-4 py-4 flex-row items-center border-b border-white/50 bg-white/50 backdrop-blur-md">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center bg-white rounded-full shadow-sm"
                    >
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black flex-1 text-center text-gray-900 mr-10">
                        {screenTitle}
                    </Text>
                </View>

                {/* Search & Filter Bar */}
                <View className="px-4 py-3 flex-row items-center gap-3">
                    <View className="flex-1 flex-row items-center rounded-xl px-4 h-12 bg-bg_secondary border border-border_secondary">
                        <Ionicons name="search" size={20} color={colors.text_tertiary} />
                        <TextInput
                            className="flex-1 ml-3 text-base text-text_primary"
                            placeholder={`Search in ${screenTitle.toLowerCase()}`}
                            placeholderTextColor={colors.text_tertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-xl items-center justify-center bg-primary border border-primary"
                        onPress={() => {
                            // Filter button action
                        }}
                    >
                        <Ionicons name="options-outline" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {loading && !refreshing ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : products.length > 0 ? (
                    <FlatList
                        data={filteredProducts}
                        renderItem={renderItem}
                        keyExtractor={(item) => String(item.id || item.product_id || Math.random())}
                        numColumns={2} // Ensure 2 columns
                        columnWrapperStyle={{ justifyContent: 'space-between' }} // Space them out
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingVertical: 16,
                            paddingBottom: 40 // Extra padding at bottom
                        }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                        }
                    />
                ) : (
                    <View className="flex-1 items-center justify-center py-10">
                        <Ionicons
                            name="cube-outline"
                            size={64}
                            color={colors.text_tertiary}
                        />
                        <Text className="mt-4 text-base text-text_secondary">No items found</Text>
                    </View>
                )}
            </SafeAreaView>
        </ThemedBackground>
    );
};

export default SectionListingScreen;
