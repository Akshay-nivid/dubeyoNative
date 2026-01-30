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
            resizeMode="cover"
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
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Edit Icon - Top Right */}
        {onEdit && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              padding: 4,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={colors.text_primary} />
          </TouchableOpacity>
        )}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.text_primary,
            marginBottom: 4,
            paddingRight: onEdit ? 32 : 0,
          }}
          numberOfLines={2}
        >
          {productTitle}
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: colors.primary,
            marginTop: 4,
          }}
        >
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

export default function MyAdsScreen() {
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
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.bg_primary }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.text_tertiary }}>
            Loading your ads...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.bg_primary }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: colors.bg_white,
          borderBottomWidth: 1,
          borderBottomColor: colors.border_primary,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 32 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text_primary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: colors.text_primary,
            flex: 1,
            textAlign: "center",
          }}
        >
          My Ads
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/postAd" as any)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
            marginLeft: 32,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={colors.text_white} />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.bg_primary,
          gap: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => handleFilterChange("active")}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: activeFilter === "active" ? colors.primary : colors.bg_white,
            alignItems: "center",
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: activeFilter === "active" ? colors.text_white : colors.text_primary,
            }}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFilterChange("draft")}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: activeFilter === "draft" ? colors.primary : colors.bg_white,
            alignItems: "center",
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: activeFilter === "draft" ? colors.text_white : colors.text_primary,
            }}
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
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text_primary,
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            No ads yet
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.text_tertiary,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            You haven't posted any ads yet. Start by creating your first ad!
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/postAd" as any)}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: colors.text_white,
                fontWeight: "600",
                fontSize: 16,
              }}
            >
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
              <Text style={{ color: colors.text_tertiary }}>No products found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
