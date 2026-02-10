import ProductCard from "@/src/components/ProductCard";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { Api, fetchNearestProducts, fetchNewProducts, fetchProductImages, fetchSuggestedProducts } from "@/src/screens/home/Api"; // Import fetchers
import { get } from "@/src/services/api";
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
    // const { blockValue } = params;/

    // Params might be passed as object or individual fields depending on how it's called
    // Safe check for sectionType
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
    }, [sectionType, coordinates]); // Re-fetch if section type or location changes

    const fetchData = async () => {
        setLoading(true);
        try {
            let data: any[] = [];
            if (sectionType === "popular") {
                // Needs location. If we have coordinates from hook, use them.
                // Otherwise default or wait? For now, if no coords, maybe fetch trending or empty?
                if (coordinates && coordinates.lat && coordinates.lon) {
                    const res = await fetchNearestProducts(coordinates.lat, coordinates.lon);
                    data = res?.data || [];
                } else {
                    // Fallback to trending if no location? Or maybe try to get location?
                    // For now let's try fetching without location if that endpoint allows or skip
                    // Actually ProductListing handles location.
                    // We can use the generic 'get' if we need to pass page parameters differently
                    // But let's stick to the basic fetchers first as per Home logic.
                    // Note: Home logic uses `fetchNearestProducts` with coords.
                    // If coords are missing, `useHomeData` skips it.
                    // We should probably try to get location if missing, but `useUserLocation` should handle it.
                    // If we really don't have it, maybe empty or toast?
                }
            } else if (sectionType === "suggested") {
                const res = await fetchSuggestedProducts();
                data = res?.data || [];
            } else if (sectionType === "new") {
                const res = await fetchNewProducts();
                data = res?.data || [];
            }

            // Process data to ensure consistent structure if needed
            // And fetch images if they are not included (Home logic does this)
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

    // Image loading logic reused from useHomeData to ensure images show up
    // Ideally this should be a hook or utility but duplicating for speed/independence as per request to keep it clean separation
    const loadImages = async (list: any[]) => {
        // In a real app we might want to update the products with images
        // But ProductCard handles 'image' prop.
        // The Home logic maintains a separate 'signedImages' map.
        // ProductListing fetches signed urls and updates a map.
        // ProductListing's ProductCard uses 'item.image' if available or looks up.

        // Let's try to map the fetched images back to the product objects for simplicity here
        // so we don't need a separate state for images if possible, or we can use a state.
        // ProductCard expects `image` property.

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
        // Note: we aren't setting state here, we return data. 
        // Actually `loadImages` in `useHomeData` updates a state map.
        // Here let's just update the objects in place for the list.
        // BUT `fetchData` calls `loadImages(data)` then `setProducts(data)`.
        // `loadImages` needs to mutate or return new list.
        // The current `loadImages` implementation above returns a Promise of list.
        // So in fetchData: `data = await loadImages(data);`
        return updatedList;
    };

    // Correction to fetchData to use the result of loadImages
    /* 
      const fetchData = async () => {
      ...
        // data = plain products
        const productsWithImages = await loadImages(data);
        setProducts(productsWithImages);
      ...
      }
    */

    const fetchSellerData = async (list: any[]) => {
        const result: Record<string | number, { name: string; profilePic?: string }> = {};

        // First, check if seller data is already in the product
        list.forEach((p) => {
            const id = p?.product_id || p?.id;
            if (!id) return;

            // Check if seller data exists in product
            if (p.seller && typeof p.seller === "object") {
                let sellerName: string | undefined = undefined;
                if (typeof p.seller.name === "string" && p.seller.name.trim()) {
                    sellerName = p.seller.name.trim();
                } else if (typeof p.seller.firstName === "string" && typeof p.seller.lastName === "string") {
                    sellerName = `${p.seller.firstName.trim()} ${p.seller.lastName.trim()}`;
                } else if (typeof p.seller.firstName === "string" && p.seller.firstName.trim()) {
                    sellerName = p.seller.firstName.trim();
                }

                if (sellerName) {
                    result[id] = {
                        name: sellerName,
                        profilePic: typeof p.seller.profilePic === "string" ? p.seller.profilePic : undefined,
                    };
                }
            }
        });

        // For products without seller data, fetch from product details endpoint
        const productsWithoutSeller = list.filter((p) => {
            const id = p?.product_id || p?.id;
            return id && !result[id];
        });

        // Fetch seller data for products that don't have it (limit to avoid too many requests)
        const limitedProducts = productsWithoutSeller.slice(0, 20);

        await Promise.all(
            limitedProducts.map(async (p) => {
                const id = p?.product_id || p?.id;
                if (!id || result[id]) return;

                try {
                    const res = await get(`${Api.getProductDetails}?productId=${id}`);
                    const productData = res?.data?.data || res?.data;

                    if (productData?.seller) {
                        const seller = productData.seller;
                        let sellerName: string | undefined = undefined;

                        if (typeof seller.name === "string" && seller.name.trim()) {
                            sellerName = seller.name.trim();
                        } else if (typeof seller.firstName === "string" && typeof seller.lastName === "string") {
                            sellerName = `${seller.firstName.trim()} ${seller.lastName.trim()}`;
                        } else if (typeof seller.firstName === "string" && seller.firstName.trim()) {
                            sellerName = seller.firstName.trim();
                        }

                        if (sellerName) {
                            result[id] = {
                                name: sellerName,
                                profilePic: typeof seller.profilePic === "string" ? seller.profilePic : undefined,
                            };
                        }
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
        fetchData(); // This will re-fetch
    };

    const filteredProducts = searchQuery.trim()
        ? products.filter((p) => {
            const title = p.title ?? p.product_name ?? "";
            return String(title).toLowerCase().includes(searchQuery.trim().toLowerCase());
        })
        : products;

    const renderItem = ({ item }: { item: any }) => {
        // Adapter to match ProductCardProps
        // ProductListing logic for mapping 'p' to 'productItem' is complex.
        // valid fields: id, title, image, price, seller, location

        const id = item.id || item.product_id || item._id;
        const title = item.title || item.product_name || "Untitled";
        const price = item.price || item.product_price || "Price on request";
        const image = item.image || (item.images && item.images[0]) || null;
        
        // Extract images array
        const imagesArray = item.images && Array.isArray(item.images) && item.images.length > 0
            ? item.images
            : (image ? [image] : []);

        // Extract specifications
        const specs = item.specs || item.specifications || {};

        // Extract features/tags
        const features = item.features || item.tags || item.verificationBadges || [];

        // Extract seller information
        let sellerName: string | undefined = sellerData[id]?.name;
        let sellerProfilePic: string | undefined = sellerData[id]?.profilePic;
        let sellerVerified: boolean | undefined = item.seller?.verified || item.seller?.isVerified || false;

        if (!sellerName) {

            // Helper to check a potential seller object
            const extractFromObject = (obj: any) => {
                if (!obj) return;
                if (typeof obj.name === "string" && obj.name.trim()) {
                    sellerName = obj.name.trim();
                } else if (typeof obj.firstName === "string" && typeof obj.lastName === "string") {
                    sellerName = `${obj.firstName.trim()} ${obj.lastName.trim()}`;
                } else if (typeof obj.firstName === "string" && obj.firstName.trim()) {
                    sellerName = obj.firstName.trim();
                } else if (typeof obj.username === "string" && obj.username.trim()) {
                    sellerName = obj.username.trim();
                }

                if (typeof obj.profilePic === "string" && obj.profilePic.trim()) {
                    sellerProfilePic = obj.profilePic.trim();
                } else if (typeof obj.profile_pic === "string" && obj.profile_pic.trim()) {
                    sellerProfilePic = obj.profile_pic.trim();
                } else if (typeof obj.avatar === "string" && obj.avatar.trim()) {
                    sellerProfilePic = obj.avatar.trim();
                }

                if (typeof obj.verified === "boolean") {
                    sellerVerified = obj.verified;
                } else if (typeof obj.isVerified === "boolean") {
                    sellerVerified = obj.isVerified;
                }
            };

            if (item.seller && typeof item.seller === 'object') {
                extractFromObject(item.seller);
            }

            if (!sellerName && item.user && typeof item.user === 'object') {
                extractFromObject(item.user);
            }

            if (!sellerName && item.createdBy && typeof item.createdBy === 'object') {
                extractFromObject(item.createdBy);
            }
        }

        const sellerObj = sellerName ? {
            name: sellerName,
            profilePic: sellerProfilePic,
            verified: sellerVerified
        } : undefined;

        const productItem = {
            id,
            title,
            image,
            images: imagesArray,
            price: typeof price === 'number' ? `AED ${price}` : price, // Simple formatting
            specs,
            features,
            seller: sellerObj,
            location: item.location
        };

        return (
            <ProductCard
                item={productItem}
                onPress={() => router.push(`/product/${id}` as any)}
                variant="vertical"
            />
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-bg_primary">
            {/* Header */}
            <View className="px-4 pt-14 pb-4 flex-row items-center border-b border-white/50 bg-white/50 backdrop-blur-md">
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
                <View className="flex-1 flex-row items-center rounded-full px-4 h-12 bg-white">
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
                    className="w-12 h-12 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => {
                        // Filter button action - can be implemented later
                        console.log("Filter pressed");
                    }}
                >
                    <Ionicons name="options" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading && !refreshing ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id || item.product_id || Math.random())}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-10">
                            <Text className="text-text_secondary">No items found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default SectionListingScreen;
