import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, RefreshControl, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUserLocation } from "../../hooks/useUserLocation";
import { Api, categoryCallBackData, categoryIcons } from "./Api";
import ClassifiedShowCard from "./components/ClassifiedShowCard";
import InfiniteCategories from "./components/InfiniteCategories";
import { get } from "@/src/services/api";

const Home = () => {
    const router = useRouter();
    const [profile, setProfile] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
    const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
    const [nearestProducts, setNearestProducts] = useState<any[]>([]);
    const [newAdsProducts, setNewAdsProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [subcategoriesCardOpen, setSubcategoriesCarOopen] = useState(false);
    const [category, setCategory] = useState(null);
    const [signedImagesByCategory, setSignedImagesByCategory] = useState({
        suggested: {},
        trending: {},
        nearest: {},
        newads: {},
    });

    const { place, coordinates } = useUserLocation();
    // Default user or from storage - implementing simplistic version
    const [user, setUser] = useState<any>({ firstName: "User", profilePic: null });



    const fetchSignedUrlsForCategory = async (list: any[], categoryType: string) => {
        const result: any = {};
        await Promise.all(list.map(async (p) => {
            try {
                const id = p.product_id || p.id;
                // Assuming we need to fetch image URL for each product
                // If API returns direct URLs, this might be redundant, but following web code logic
                // The web code allows for image key fetching. 
                // We'll optimistically use p.image if available, or fetch if needed.
                // For now, if p.images is array and has url, use it.
                if (Array.isArray(p.images) && p.images.length > 0) {
                    result[id] = p.images[0].url || p.images[0];
                } else if (p.image) {
                    result[id] = p.image;
                }
            } catch { }
        }));
        setSignedImagesByCategory((prev) => ({ ...prev, [categoryType]: result }));
    };

    const fetchData = async () => {
        try {
            // In a real scenario, use Promise.allSettled or handle individual errors
            const [catRes, suggestedRes, trendingRes, newAdsRes, profileRes] = await Promise.all([
                get(Api.CategoriesAll).catch(e => ({ data: { data: categoryCallBackData } })), // Fallback
                get(Api.SuggestedProducts).catch(e => ({ data: { data: [] } })),
                get(Api.TrendingProducts).catch(e => ({ data: { data: [] } })),
                get(Api.NewlyProducts).catch(e => ({ data: { data: [] } })),
                get(Api.profile).catch(e => ({ data: { data: { firstName: "User" } } })),
            ]);

            setCategories(catRes?.data?.data || categoryCallBackData);

            const suggested = suggestedRes?.data?.data || [];
            const trending = trendingRes?.data?.data || [];
            const newAds = newAdsRes?.data?.data || [];

            setSuggestedProducts(suggested);
            setTrendingProducts(trending);
            setNewAdsProducts(newAds);
            setUser(profileRes?.data?.data || { firstName: "User" });

            fetchSignedUrlsForCategory(suggested, "suggested");
            fetchSignedUrlsForCategory(trending, "trending");
            fetchSignedUrlsForCategory(newAds, "newads");

        } catch (error) {
            console.error("Error fetching home data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();
    }, []);

    // Nearest Products - dependent on location
    useEffect(() => {
        if (!coordinates?.lat || !coordinates?.lon) return;
        get(`${Api.NearestProducts}&latitude=${coordinates.lat}&longitude=${coordinates.lon}`)
            .then((res) => {
                const list = res?.data?.data || [];
                setNearestProducts(list);
                fetchSignedUrlsForCategory(list, "nearest");
            })
            .catch(() => { });
    }, [coordinates]);

    const categoriesToRender = categories.length
        ? categories.map((c: any) => ({
            key: c.value || c.id,
            name: c.label || c.name,
            categoryId: c.value || c.id,
        }))
        : Object.keys(categoryIcons).map((name) => ({
            key: name,
            name,
            categoryId: null,
        }));

    const renderProductSection = (title: string, products: any[], images: any) => {
        if (!products || products.length === 0) return null;
        return (
            <View className="mb-6" key={title}>
                <View className="flex-row justify-between items-center px-4 mb-3">
                    <Text className="text-lg font-bold text-gray-900">{title}</Text>
                    <TouchableOpacity>
                        <Text className="text-gray-500 font-medium text-sm flex-row items-center">See all <Ionicons name="arrow-forward" size={14} /></Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                    {products.slice(0, 5).map((p, index) => {
                        const id = p.product_id || p.id;
                        const img = images[id] || "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg"; // Placeholder
                        return (
                            <TouchableOpacity
                                key={p.id || index}
                                className="mr-3 w-40 bg-white rounded-xl overflow-hidden mb-1" // Removed border/shadow to cleaner look or match image
                                activeOpacity={0.8}
                                onPress={() => router.push(`/product/${p.id || p.product_id}` as any)}
                            >
                                <Image
                                    source={{ uri: img }}
                                    className="w-full h-32 bg-gray-200 rounded-xl"
                                    resizeMode="cover"
                                />
                                <View className="pt-2">
                                    <Text className="text-sm font-bold text-gray-900 mb-0.5" numberOfLines={1}>{p.price ? `AED ${p.price}` : "Price on request"}</Text>
                                    <Text className="text-xs text-gray-500 font-medium mb-1" numberOfLines={1}>{p.title}</Text>
                                    {/* Heart icon handled via absolute positioning or other means if needed, specifically asked for image layout match */}
                                </View>
                                {/* Heart Icon Overlay */}
                                <TouchableOpacity className="absolute top-2 right-2 bg-white/70 p-1.5 rounded-full">
                                    <Ionicons name="heart-outline" size={16} color="#000" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>
        )
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header: Location & Profile */}
            <View className="px-4 py-2 flex-row items-center justify-between bg-white z-10">
                <View>
                    <Text className="text-xs text-gray-500 font-medium">Home</Text>
                    <View className="flex-row items-center mt-0.5">
                        <Ionicons name="location-sharp" size={16} color="#000" />
                        <Text className="ml-1 text-base font-bold text-gray-900">{place || "Dubai, UAE"}</Text>
                    </View>
                </View>
                <TouchableOpacity className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                    {profile ? (
                        <Image source={{ uri: profile }} className="w-full h-full" />
                    ) : (
                        <Image source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }} className="w-full h-full" /> // Placeholder avatar
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 bg-white"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} colors={["#0891b2"]} />}
            >
                {/* Search Bar */}
                <View className="px-4 py-4">
                    <View className="flex-row items-center bg-gray-50 rounded-lg px-4 h-12">
                        <Ionicons name="search" size={20} color="#9ca3af" />
                        <TextInput
                            className="flex-1 ml-3 text-base text-gray-800 h-full"
                            placeholder="Search or ask with muscot..."
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <TouchableOpacity>
                            <Ionicons name="mic-outline" size={20} color="#0891b2" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories Grid */}
                <InfiniteCategories
                    categoriesToRender={categoriesToRender}
                    categoryIcons={categoryIcons}
                    setCategory={setCategory}
                    setSubcategoriesCarOopen={setSubcategoriesCarOopen}
                />

                {/* Post Ad Button - Blue as requested */}
                <View className="px-4 mb-6">
                    <TouchableOpacity
                        className="w-full py-3.5 bg-cyan-600 rounded-lg items-center justify-center flex-row shadow-sm"
                        onPress={() => router.push("/post-ad" as any)} // Assuming route
                    >
                        <Ionicons name="add-circle-outline" size={20} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">Post ad</Text>
                    </TouchableOpacity>
                </View>

                {/* Product Sections */}
                {/* Popular near you corresponds to trending or nearest, usually */}
                {renderProductSection("Popular near you", nearestProducts.length ? nearestProducts : trendingProducts, signedImagesByCategory.trending)}

                {/* Other sections as available */}
                {/* Only show if data exists to match 'Suggested' etc from web code */}
                {suggestedProducts.length > 0 && renderProductSection("Suggested Items", suggestedProducts, signedImagesByCategory.suggested)}
                {newAdsProducts.length > 0 && renderProductSection("New Ads", newAdsProducts, signedImagesByCategory.newads)}

                <View className="h-24" />
            </ScrollView>

            <ClassifiedShowCard
                open={subcategoriesCardOpen}
                onClose={() => setSubcategoriesCarOopen(false)}
                category={category}
            />
        </SafeAreaView>
    );
};

export default Home;
