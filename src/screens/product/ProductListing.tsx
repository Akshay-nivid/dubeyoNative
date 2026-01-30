import { Api } from "@/src/screens/home/Api";
import { get } from "@/src/services/api";
import api from "@/src/services/api/client";
import { getImages } from "@/src/services/imageLink/image";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

interface ProductCardProps {
  item: {
    id: string | number;
    title: string;
    image: string;
    price: string;
    status?: string;
    originalPrice?: number;
    discountedPrice?: number;
    seller?: {
      name?: string;
      profilePic?: string;
    };
  };
  onPress: () => void;
}

// No Image Fallback Component
const NoImagePlaceholder = () => (
  <View
    style={{
      width: "100%",
      height: "100%",
      backgroundColor: colors.bg_secondary,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Ionicons name="image-outline" size={32} color={colors.text_tertiary} />
  </View>
);

const ProductCard: React.FC<ProductCardProps> = ({ item, onPress }) => {
  const noImageUrl = "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
  const imageUrl = item.image && !item.image.includes("undefined") ? item.image : null;
  const hasImage = imageUrl && imageUrl !== noImageUrl;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.bg_white,
        borderRadius: 12,
        marginBottom: 12,
        marginHorizontal: 16,
        flexDirection: "row",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Product Image - Left Side */}
      <View
        style={{
          width: 120,
          height: 120,
          backgroundColor: colors.bg_secondary,
        }}
      >
        {hasImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <NoImagePlaceholder />
        )}
      </View>

      {/* Product Details - Right Side */}
      <View
        style={{
          flex: 1,
          padding: 12,
          justifyContent: "space-between",
        }}
      >
        {/* Top Section: Title */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "500",
              color: colors.text_primary,
              lineHeight: 20,
              marginBottom: 8,
            }}
            numberOfLines={2}
          >
            {item.title || "Untitled Product"}
          </Text>

          {/* Seller Info Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            {item.seller?.profilePic ? (
              <Image
                source={{ uri: item.seller.profilePic }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  marginRight: 6,
                }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.bg_secondary,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 6,
                }}
              >
                <Ionicons name="person" size={12} color={colors.text_tertiary} />
              </View>
            )}
            <Text
              style={{
                fontSize: 12,
                color: colors.text_tertiary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {item.seller?.name || "Seller"}
            </Text>
          </View>
        </View>

        {/* Bottom Section: Price */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 6,
          }}
        >
          {item.discountedPrice &&
            item.originalPrice &&
            item.originalPrice > item.discountedPrice && (
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "400",
                  color: colors.text_tertiary,
                  textDecorationLine: "line-through",
                }}
              >
                {item.price}
              </Text>
            )}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.primary,
            }}
          >
            {item.price}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ProductListingScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    subcategoryId?: string;
    subcategoryName?: string;
    divisionTypes?: string;
    selectedDivision?: string;
  }>();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [divisionTypes, setDivisionTypes] = useState<any[]>([]);
  const [selectedDivisionType, setSelectedDivisionType] = useState<any>(null);
  const [signedImages, setSignedImages] = useState<Record<string | number, string>>({});
  const [sellerData, setSellerData] = useState<Record<string | number, { name: string; profilePic?: string }>>({});

  // Parse divisionTypes from params
  useEffect(() => {
    if (params.subcategoryId) {
      setSubcategoryId(params.subcategoryId);
    }
    if (params.subcategoryName) {
      setSubcategoryName(params.subcategoryName);
    }
    if (params.divisionTypes) {
      try {
        const parsed = JSON.parse(params.divisionTypes);
        setDivisionTypes(Array.isArray(parsed) ? parsed : []);
      } catch {
        setDivisionTypes([]);
      }
    }
    if (params.selectedDivision) {
      try {
        const parsed = JSON.parse(params.selectedDivision);
        setSelectedDivisionType(parsed);
      } catch {
        setSelectedDivisionType(null);
      }
    }
  }, [params]);

  // Fetch products when subcategoryId or selectedDivisionType changes
  useEffect(() => {
    if (subcategoryId) {
      fetchFilteredProducts();
    }
  }, [subcategoryId, selectedDivisionType]);

  const fetchFilteredProducts = async () => {
    if (!subcategoryId) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: any = {
        page: 1,
        limit: 50,
        subcategoryId,
      };

      // Add divisionType only if a specific one is selected (not "All")
      if (selectedDivisionType?.id) {
        queryParams.divisionType = selectedDivisionType.id;
      }

      const response = await api.request({
        method: "get",
        url: Api.FilterProducts,
        params: queryParams,
      });

      let productsList: any[] = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        productsList = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        productsList = response.data;
      }

      // Debug: Log first product to see structure
      if (productsList.length > 0) {
        console.log('Sample product data:', JSON.stringify(productsList[0], null, 2));
      }

      setProducts(productsList);

      // Fetch signed URLs for product images
      if (productsList.length > 0) {
        await fetchSignedUrls(productsList);
        // Fetch seller data for products that don't have it
        await fetchSellerData(productsList);
      }
    } catch (err: any) {
      console.error("Error fetching filtered products:", err);
      setError(err?.response?.data?.message || "Failed to load products");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load products",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSignedUrls = async (list: any[]) => {
    const result: Record<string | number, string> = {};
    await Promise.all(
      list.map(async (p) => {
        const key = p?.product_id || p?.id;
        if (!key) return;
        try {
          const res = await getImages(String(key));
          const id = p.product_id || p.id || key;
          if (res && res.length > 0) {
            result[id] = res[0];
          }
        } catch (error) {
          console.error(`Failed to fetch image for product ${key}:`, error);
        }
      })
    );
    setSignedImages(result);
  };

  const fetchSellerData = async (list: any[]) => {
    const result: Record<string | number, { name: string; profilePic?: string }> = {};
    
    // First, check if seller data is already in the product
    list.forEach((p) => {
      const id = p?.product_id || p?.id;
      if (!id) return;
      
      // Check if seller data exists in product
      if (p.seller && typeof p.seller === 'object') {
        let sellerName: string | undefined = undefined;
        if (typeof p.seller.name === 'string' && p.seller.name.trim()) {
          sellerName = p.seller.name.trim();
        } else if (typeof p.seller.firstName === 'string' && typeof p.seller.lastName === 'string') {
          sellerName = `${p.seller.firstName.trim()} ${p.seller.lastName.trim()}`;
        } else if (typeof p.seller.firstName === 'string' && p.seller.firstName.trim()) {
          sellerName = p.seller.firstName.trim();
        }
        
        if (sellerName) {
          result[id] = {
            name: sellerName,
            profilePic: typeof p.seller.profilePic === 'string' ? p.seller.profilePic : undefined,
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
            
            if (typeof seller.name === 'string' && seller.name.trim()) {
              sellerName = seller.name.trim();
            } else if (typeof seller.firstName === 'string' && typeof seller.lastName === 'string') {
              sellerName = `${seller.firstName.trim()} ${seller.lastName.trim()}`;
            } else if (typeof seller.firstName === 'string' && seller.firstName.trim()) {
              sellerName = seller.firstName.trim();
            }
            
            if (sellerName) {
              result[id] = {
                name: sellerName,
                profilePic: typeof seller.profilePic === 'string' ? seller.profilePic : undefined,
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch seller data for product ${id}:`, error);
        }
      })
    );
    
    setSellerData(result);
  };

  const formatPrice = (val: any) => {
    if (val === null || val === undefined) return "Price on request";
    if (typeof val === 'object') return "Price on request";
    if (val === 0 || val === "0" || val === "0.00") return "AED 0";
    const num = parseFloat(String(val));
    if (isNaN(num)) return "Price on request";
    return `AED ${num.toFixed(2)}`;
  };

  const filters = [
    { label: "All", value: null },
    ...divisionTypes.map((d) => ({
      label: typeof d.name === 'string' ? d.name : String(d.name || d.label || 'Unknown'),
      value: d,
    })),
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFilteredProducts();
  };

  const renderProduct = ({ item: p, index }: { item: any; index: number }) => {
    const id = p.product_id || p.id;
    const noImageUrl = "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
    const img = signedImages[id] && !signedImages[id].includes("undefined") 
      ? signedImages[id] 
      : noImageUrl;

    // Ensure all values are primitives, not objects
    const title = typeof p.title === 'string' ? p.title : 
                  typeof p.product_name === 'string' ? p.product_name : 
                  typeof p.title === 'object' ? JSON.stringify(p.title) : 
                  "Untitled";
    
    const price = formatPrice(p.price);
    const originalPrice = typeof p.originalPrice === 'number' ? p.originalPrice : 
                          typeof p.price === 'number' ? p.price : 
                          typeof p.price === 'string' ? parseFloat(p.price) || 0 : 0;
    const discountedPrice = typeof p.finalPrice === 'number' ? p.finalPrice : 
                            typeof p.price === 'number' ? p.price : 
                            typeof p.price === 'string' ? parseFloat(p.price) || 0 : 0;

    // Extract seller information - first check cached seller data, then product object
    let sellerName: string | undefined = undefined;
    let sellerProfilePic: string | undefined = undefined;

    // First, check if we have seller data from the fetched seller data cache
    if (sellerData[id]) {
      sellerName = sellerData[id].name;
      sellerProfilePic = sellerData[id].profilePic;
    }
    // Then check various possible seller data structures in the product object
    else if (p.seller && typeof p.seller === 'object') {
      // Direct seller object
      if (typeof p.seller.name === 'string' && p.seller.name.trim()) {
        sellerName = p.seller.name.trim();
      } else if (typeof p.seller.firstName === 'string' && typeof p.seller.lastName === 'string') {
        sellerName = `${p.seller.firstName.trim()} ${p.seller.lastName.trim()}`;
      } else if (typeof p.seller.firstName === 'string' && p.seller.firstName.trim()) {
        sellerName = p.seller.firstName.trim();
      } else if (typeof p.seller.username === 'string' && p.seller.username.trim()) {
        sellerName = p.seller.username.trim();
      }
      
      if (typeof p.seller.profilePic === 'string' && p.seller.profilePic.trim()) {
        sellerProfilePic = p.seller.profilePic.trim();
      } else if (typeof p.seller.profile_pic === 'string' && p.seller.profile_pic.trim()) {
        sellerProfilePic = p.seller.profile_pic.trim();
      } else if (typeof p.seller.avatar === 'string' && p.seller.avatar.trim()) {
        sellerProfilePic = p.seller.avatar.trim();
      }
    } else if (p.user && typeof p.user === 'object') {
      // Seller might be under 'user' key
      if (typeof p.user.name === 'string' && p.user.name.trim()) {
        sellerName = p.user.name.trim();
      } else if (typeof p.user.firstName === 'string' && typeof p.user.lastName === 'string') {
        sellerName = `${p.user.firstName.trim()} ${p.user.lastName.trim()}`;
      } else if (typeof p.user.firstName === 'string' && p.user.firstName.trim()) {
        sellerName = p.user.firstName.trim();
      }
      
      if (typeof p.user.profilePic === 'string' && p.user.profilePic.trim()) {
        sellerProfilePic = p.user.profilePic.trim();
      } else if (typeof p.user.profile_pic === 'string' && p.user.profile_pic.trim()) {
        sellerProfilePic = p.user.profile_pic.trim();
      }
    } else if (p.createdBy && typeof p.createdBy === 'object') {
      // Seller might be under 'createdBy' key
      if (typeof p.createdBy.name === 'string' && p.createdBy.name.trim()) {
        sellerName = p.createdBy.name.trim();
      } else if (typeof p.createdBy.firstName === 'string' && typeof p.createdBy.lastName === 'string') {
        sellerName = `${p.createdBy.firstName.trim()} ${p.createdBy.lastName.trim()}`;
      }
      
      if (typeof p.createdBy.profilePic === 'string' && p.createdBy.profilePic.trim()) {
        sellerProfilePic = p.createdBy.profilePic.trim();
      }
    }

    const seller = sellerName ? {
      name: sellerName,
      profilePic: sellerProfilePic,
    } : undefined;

    const productItem = {
      id: String(id),
      title: String(title),
      image: String(img),
      price: String(price),
      status: typeof p.status === 'string' ? p.status : "available",
      originalPrice,
      discountedPrice,
      seller,
    };

    return (
      <ProductCard
        item={productItem}
        onPress={() => router.push(`/product/${id}` as any)}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg_primary }} edges={['top']}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: colors.bg_white, borderColor: colors.border_primary }}
      >
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color={colors.text_primary} />
        </Pressable>
        <Text className="text-xl font-bold flex-1 text-center" style={{ color: colors.text_primary }}>
          {typeof subcategoryName === 'string' ? subcategoryName : "Products"}
        </Text>
        <View className="w-10" />
      </View>

      {/* Filters */}
      {divisionTypes.length > 0 && (
        <View
          className="px-4 py-3 border-b"
          style={{ backgroundColor: colors.bg_white, borderColor: colors.border_primary }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
          >
            {filters.map((f) => {
              const isSelected = f.value === null
                ? selectedDivisionType === null
                : selectedDivisionType?.id === f.value?.id;
              
              const labelText = typeof f.label === 'string' ? f.label : String(f.label || '');
              
              return (
                <Pressable
                  key={f.value?.id ?? "all"}
                  onPress={() => setSelectedDivisionType(f.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    backgroundColor: isSelected ? colors.primary : colors.bg_white,
                    borderColor: isSelected ? colors.primary : colors.border_primary,
                    minHeight: 36,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: isSelected ? colors.text_white : colors.text_primary,
                    }}
                  >
                    {labelText}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Product List */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-base" style={{ color: colors.text_secondary }}>
            Loading products...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text className="mt-4 text-lg font-semibold text-center" style={{ color: colors.text_primary }}>
            {error}
          </Text>
          <Pressable
            onPress={() => router.push("/home" as any)}
            className="mt-6 px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold" style={{ color: colors.text_white }}>
              Go to Home
            </Text>
          </Pressable>
        </View>
      ) : products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item.product_id || item.id || Math.random())}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        />
      ) : (
        <View 
          style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingHorizontal: 24,
            paddingVertical: 40,
          }}
        >
          <Ionicons name="cube-outline" size={64} color={colors.text_tertiary} />
          <Text 
            style={{ 
              marginTop: 16, 
              fontSize: 18, 
              fontWeight: '600', 
              textAlign: 'center',
              color: colors.text_primary 
            }}
          >
            No products found
          </Text>
          <Text 
            style={{ 
              marginTop: 8, 
              fontSize: 14, 
              textAlign: 'center',
              color: colors.text_tertiary 
            }}
          >
            No products found for this subcategory.
          </Text>
          <Pressable
            onPress={() => router.push("/home" as any)}
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: colors.primary,
            }}
          >
            <Text 
              style={{ 
                fontSize: 16, 
                fontWeight: '600',
                color: colors.text_white 
              }}
            >
              Go to Home
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ProductListingScreen;
