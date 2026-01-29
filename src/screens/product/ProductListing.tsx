import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
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
import api from "@/src/services/api/client";
import { getImages } from "@/src/services/imageLink/image";
import { Api } from "@/src/screens/home/Api";

interface ProductCardProps {
  item: {
    id: string | number;
    title: string;
    image: string;
    price: string;
    status?: string;
    originalPrice?: number;
    discountedPrice?: number;
  };
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, onPress }) => {
  const noImageUrl = "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
  const imageUrl = item.image && !item.image.includes("undefined") ? item.image : noImageUrl;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl overflow-hidden mb-4"
      activeOpacity={0.8}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="relative">
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: 200 }}
          contentFit="cover"
          transition={200}
        />
        {/* Heart Icon Overlay */}
        <Pressable
          className="absolute top-3 right-3"
          onPress={(e) => {
            e.stopPropagation();
            // TODO: Handle favorite toggle
          }}
          activeOpacity={0.7}
        >
          <View
            className="w-8 h-8 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <Ionicons name="heart-outline" size={20} color={colors.text_primary} />
          </View>
        </Pressable>
      </View>
      <View className="p-4">
        <Text
          className="text-lg font-bold mb-2"
          style={{ color: colors.text_primary }}
          numberOfLines={2}
        >
          {item.title || "Untitled Product"}
        </Text>
        <View className="flex-row items-baseline gap-2">
          {item.discountedPrice && item.originalPrice && item.originalPrice > item.discountedPrice && (
            <Text className="text-sm line-through" style={{ color: colors.text_tertiary }}>
              {item.price}
            </Text>
          )}
          <Text className="text-xl font-bold" style={{ color: colors.primary }}>
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

      setProducts(productsList);

      // Fetch signed URLs for product images
      if (productsList.length > 0) {
        await fetchSignedUrls(productsList);
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

  const formatPrice = (val: any) => {
    if (val === 0 || val === "0" || val === "0.00") return "AED 0";
    if (!val) return "Price on request";
    return `AED ${parseFloat(val).toFixed(2)}`;
  };

  const filters = [
    { label: "All", value: null },
    ...divisionTypes.map((d) => ({
      label: d.name,
      value: d,
    })),
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFilteredProducts();
  };

  const renderProduct = ({ item: p }: { item: any }) => {
    const id = p.product_id || p.id;
    const noImageUrl = "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
    const img = signedImages[id] && !signedImages[id].includes("undefined") 
      ? signedImages[id] 
      : noImageUrl;

    const productItem = {
      id,
      title: p.title || p.product_name || "Untitled",
      image: img,
      price: formatPrice(p.price),
      status: p.status || "available",
      originalPrice: p.originalPrice || p.price,
      discountedPrice: p.finalPrice || p.price,
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
          {subcategoryName || "Products"}
        </Text>
        <View className="w-10" />
      </View>

      {/* Filters */}
      {divisionTypes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-3 border-b"
          style={{ backgroundColor: colors.bg_white, borderColor: colors.border_primary }}
          contentContainerStyle={{ gap: 12 }}
        >
          {filters.map((f) => {
            const isSelected = f.value === null
              ? selectedDivisionType === null
              : selectedDivisionType?.id === f.value?.id;
            
            return (
              <Pressable
                key={f.value?.id ?? "all"}
                onPress={() => setSelectedDivisionType(f.value)}
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.bg_white,
                  borderColor: isSelected ? colors.primary : colors.border_primary,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: isSelected ? colors.text_white : colors.text_primary,
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cube-outline" size={64} color={colors.text_tertiary} />
          <Text className="mt-4 text-lg font-semibold text-center" style={{ color: colors.text_primary }}>
            No products found
          </Text>
          <Text className="mt-2 text-sm text-center" style={{ color: colors.text_tertiary }}>
            No products found for this subcategory.
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
      )}
    </SafeAreaView>
  );
};

export default ProductListingScreen;
