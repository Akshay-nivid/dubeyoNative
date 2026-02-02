import { Api, fetchProductImages } from "@/src/screens/home/Api";
import { get } from "@/src/services/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const NoImagePlaceholder = () => (
  <View className="w-full h-full bg-bg_secondary justify-center items-center">
    <Ionicons name="image-outline" size={32} color={colors.text_tertiary} />
  </View>
);

interface ProductCardProps {
  item: any;
  imageUrl: string;
  onPress: () => void;
  onEdit?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  item,
  imageUrl,
  onPress,
  onEdit,
}) => {
  const noImageUrl =
    "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
  const hasImage = imageUrl && imageUrl !== noImageUrl;

  const productId = item.id || item.product_id || item._id;
  const productTitle =
    item.title || item.name || item.product_name || "Untitled";
  const productPrice = item.price || item.product_price || item.finalPrice;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-bg_white rounded-xl mb-3 mx-4 flex-row overflow-hidden shadow-sm"
      style={{ elevation: 2 }}
    >
      {/* Product Image - Left Side */}
      <View className="w-[120px] h-[120px] bg-bg_secondary">
        {hasImage ? (
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <NoImagePlaceholder />
        )}
      </View>

      {/* Product Details - Right Side */}
      <View className="flex-1 p-3 justify-center relative">
        {/* Edit Icon - Top Right */}
        {onEdit && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute top-2 right-2 p-1"
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={colors.text_primary} />
          </TouchableOpacity>
        )}
        <Text
          className={`text-base font-semibold text-text_primary mb-1 ${onEdit ? "pr-8" : ""}`}
          numberOfLines={2}
        >
          {productTitle}
        </Text>
        <Text className="text-lg font-bold text-primary mt-1">
          {productPrice
            ? `AED ${productPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : "Price on request"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function MyAds() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"active" | "draft">("active");
  const [signedImages, setSignedImages] = useState<
    Record<string | number, string>
  >({});

  const fetchUserProducts = async () => {
    try {
      setLoading(true);
      const response = await get(Api.getUserProducts);

      console.log("API Response:", JSON.stringify(response, null, 2));

      let productsList: any[] = [];

      // Backend returns: { success: true, page, limit, total, totalPages, data: [...] }
      // API wrapper extracts: response.data?.data || response.data
      // So after wrapper, response.data should be the array or the object with data property

      if (response?.data) {
        // Check if response.data is already an array (after API wrapper processing)
        if (Array.isArray(response.data)) {
          productsList = response.data;
        }
        // Check if response.data has a nested data property (original backend structure)
        else if (response.data.data && Array.isArray(response.data.data)) {
          productsList = response.data.data;
        }
        // Check for other possible structures
        else if (
          response.data.products &&
          Array.isArray(response.data.products)
        ) {
          productsList = response.data.products;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          productsList = response.data.items;
        }
      } else if (Array.isArray(response)) {
        productsList = response;
      }

      console.log(`Total products found: ${productsList.length}`);
      if (productsList.length > 0) {
        console.log("First product:", JSON.stringify(productsList[0], null, 2));
      }

      setAllProducts(productsList);

      // Filter products based on active filter
      filterProductsByStatus(productsList, activeFilter);

      // Fetch signed URLs for product images
      if (productsList.length > 0) {
        await fetchSignedUrls(productsList);
      }
    } catch (error: any) {
      console.error("Error fetching user products:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      // Check if it's a 404 or route not found error
      const errorMessage =
        error?.response?.status === 404
          ? "API endpoint not found. Please check backend routing."
          : error?.response?.data?.message ||
            error?.message ||
            "Failed to load your ads";

      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
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
        const id = p.id || p.product_id || p._id;
        if (!id) return;
        try {
          // Backend returns images as an array in product.images
          // Try to get image from product.images array first
          let imageUrl = "";

          if (Array.isArray(p.images) && p.images.length > 0) {
            // If images is an array of strings (URLs)
            imageUrl =
              typeof p.images[0] === "string"
                ? p.images[0]
                : p.images[0]?.url || p.images[0];
          }

          // If no image from product.images, try fetching from API
          if (!imageUrl) {
            const res = await fetchProductImages(id);
            imageUrl = res?.data?.[0] || "";
          }

          // Fallback to product.image if available
          if (!imageUrl && p.image) {
            imageUrl = p.image;
          }

          if (imageUrl) {
            result[id] = imageUrl;
          }
        } catch (error) {
          console.error(`Failed to fetch image for product ${id}:`, error);
        }
      }),
    );
    setSignedImages(result);
  };

  const filterProductsByStatus = (productsList: any[], filter: "active" | "draft") => {
    if (filter === "active") {
      // Active products: status === 0 or status === "active" or no draft flag
      const activeProducts = productsList.filter(
        (p) => p.status === 0 || p.status === "active" || (!p.isDraft && p.status !== 1)
      );
      setProducts(activeProducts);
    } else {
      // Draft products: status === 1 or isDraft === true or status === "draft"
      const draftProducts = productsList.filter(
        (p) => p.status === 1 || p.isDraft === true || p.status === "draft"
      );
      setProducts(draftProducts);
    }
  };

  useEffect(() => {
    fetchUserProducts();
  }, []);

  useEffect(() => {
    // Filter products when filter changes
    if (allProducts.length > 0) {
      filterProductsByStatus(allProducts, activeFilter);
    }
  }, [activeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProducts();
  };

  const handleFilterChange = (filter: "active" | "draft") => {
    setActiveFilter(filter);
  };

  const handleProductPress = (item: any) => {
    const productId = item.id || item.product_id || item._id;
    if (productId) {
      router.push(`/product/${productId}` as any);
    }
  };

  const handleEditPress = (item: any) => {
    const productId = item.id || item.product_id || item._id;
    if (productId) {
      // Navigate to edit product page
      router.push(`/postAd?edit=${productId}` as any);
    }
  };

  if (loading && products.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-bg_primary">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-text_tertiary">Loading your ads...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg_primary">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-bg_white border-b border-border_primary">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-8"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text_primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text_primary flex-1 text-center">
          My Ads
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/postAd" as any)}
          className="w-7 h-7 rounded-full bg-primary justify-center items-center ml-8"
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={colors.text_white} />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View className="flex-row px-4 py-3 bg-bg_primary gap-2">
        <TouchableOpacity
          onPress={() => handleFilterChange("active")}
          className={`flex-1 py-2.5 px-4 rounded-lg items-center ${
            activeFilter === "active" ? "bg-primary" : "bg-bg_white"
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm font-semibold ${
              activeFilter === "active" ? "text-text_white" : "text-text_primary"
            }`}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFilterChange("draft")}
          className={`flex-1 py-2.5 px-4 rounded-lg items-center ${
            activeFilter === "draft" ? "bg-primary" : "bg-bg_white"
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm font-semibold ${
              activeFilter === "draft" ? "text-text_white" : "text-text_primary"
            }`}
          >
            Draft
          </Text>
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name="list-outline"
            size={64}
            color={colors.text_tertiary}
          />
          <Text className="text-lg font-semibold text-text_primary mt-4 mb-2">
            No ads yet
          </Text>
          <Text className="text-sm text-text_tertiary text-center mb-6">
            You haven't posted any ads yet. Start by creating your first ad!
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/postAd" as any)}
            className="bg-primary px-6 py-3 rounded-lg"
            activeOpacity={0.8}
          >
            <Text className="text-text_white font-semibold text-base">
              Post an Ad
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) =>
            String(item.id || item.product_id || item._id || index)
          }
          renderItem={({ item }) => {
            const productId = item.id || item.product_id || item._id;
            const imageUrl =
              signedImages[productId] ||
              item.image ||
              (Array.isArray(item.images) && item.images[0]?.url) ||
              (Array.isArray(item.images) && item.images[0]) ||
              "";
            return (
              <ProductCard
                item={item}
                imageUrl={imageUrl}
                onPress={() => handleProductPress(item)}
                onEdit={() => handleEditPress(item)}
              />
            );
          }}
          contentContainerStyle={{ paddingVertical: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-text_tertiary">No products found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
