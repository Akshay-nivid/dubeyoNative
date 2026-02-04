import { Api } from "@/src/screens/home/Api";
import { API_BASE_URL } from "@/src/constants/env";
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
    TextInput,
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

const NoImagePlaceholder = () => (
  <View className="w-full h-full bg-bg_secondary justify-center items-center">
    <Ionicons name="image-outline" size={32} color={colors.text_tertiary} />
  </View>
);

const ProductCard: React.FC<ProductCardProps> = ({ item, onPress }) => {
  const noImageUrl =
    "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
  const imageUrl =
    item.image && !item.image.includes("undefined") ? item.image : null;
  const hasImage = imageUrl && imageUrl !== noImageUrl;

  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const showImage = hasImage && !imageError;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-bg_white rounded-xl mb-3 mx-4 flex-row overflow-hidden"
      style={{ elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 }}
    >
      <View className="w-[120px] h-[120px] bg-bg_secondary overflow-hidden">
        {showImage ? (
          <Image
            source={{ uri: imageUrl ?? undefined }}
            className="w-full h-full min-w-[120px] min-h-[120px]"
            contentFit="cover"
            transition={200}
            recyclingKey={item.id != null ? String(item.id) : undefined}
            onError={() => setImageError(true)}
            style={{ width: 120, height: 120 }}
          />
        ) : (
          <NoImagePlaceholder />
        )}
      </View>

      <View className="flex-1 p-3 justify-between">
        <View className="flex-1">
          <Text
            className="text-[15px] font-medium text-text_primary leading-5 mb-2"
            numberOfLines={2}
          >
            {item.title || "Untitled Product"}
          </Text>

          <View className="flex-row items-center mb-2">
            {item.seller?.profilePic ? (
              <Image
                source={{ uri: item.seller.profilePic }}
                className="w-5 h-5 rounded-full mr-1.5"
                contentFit="cover"
              />
            ) : (
              <View className="w-5 h-5 rounded-full bg-bg_secondary justify-center items-center mr-1.5">
                <Ionicons
                  name="person"
                  size={12}
                  color={colors.text_tertiary}
                />
              </View>
            )}
            <Text
              className="text-xs text-text_tertiary flex-1"
              numberOfLines={1}
            >
              {item.seller?.name || "Seller"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-baseline gap-1.5">
          {item.discountedPrice != null &&
            item.originalPrice != null &&
            item.originalPrice > item.discountedPrice && (
              <Text className="text-[13px] text-text_tertiary line-through">
                {item.price}
              </Text>
            )}
          <Text className="text-lg font-bold text-primary">
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
  const [searchQuery, setSearchQuery] = useState("");
  const [signedImages, setSignedImages] = useState<Record<string, string>>({});
  const [sellerData, setSellerData] = useState<
    Record<string | number, { name: string; profilePic?: string }>
  >({});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.subcategoryId,
    params.subcategoryName,
    params.divisionTypes,
    params.selectedDivision,
  ]);

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
        console.log(
          "Sample product data:",
          JSON.stringify(productsList[0], null, 2),
        );
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
    const result: Record<string, string> = {};
    await Promise.all(
      list.map(async (p) => {
        const key = p?.product_id ?? p?.id ?? p?._id;
        if (!key) return;
        try {
          const res = await getImages(String(key));
          const id = String(p.product_id ?? p.id ?? p._id ?? key);
          if (res && res.length > 0) {
            let url = res[0];
            if (typeof url === "string" && !/^https?:\/\//i.test(url)) {
              url = API_BASE_URL + (url.startsWith("/") ? url : `/${url}`);
            }
            if (typeof url === "string" && !url.includes("undefined")) {
              result[id] = url;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch image for product ${key}:`, error);
        }
      }),
    );
    setSignedImages(result);
  };

  const fetchSellerData = async (list: any[]) => {
    const result: Record<
      string | number,
      { name: string; profilePic?: string }
    > = {};

    // First, check if seller data is already in the product
    list.forEach((p) => {
      const id = p?.product_id || p?.id;
      if (!id) return;

      // Check if seller data exists in product
      if (p.seller && typeof p.seller === "object") {
        let sellerName: string | undefined = undefined;
        if (typeof p.seller.name === "string" && p.seller.name.trim()) {
          sellerName = p.seller.name.trim();
        } else if (
          typeof p.seller.firstName === "string" &&
          typeof p.seller.lastName === "string"
        ) {
          sellerName = `${p.seller.firstName.trim()} ${p.seller.lastName.trim()}`;
        } else if (
          typeof p.seller.firstName === "string" &&
          p.seller.firstName.trim()
        ) {
          sellerName = p.seller.firstName.trim();
        }

        if (sellerName) {
          result[id] = {
            name: sellerName,
            profilePic:
              typeof p.seller.profilePic === "string"
                ? p.seller.profilePic
                : undefined,
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
            } else if (
              typeof seller.firstName === "string" &&
              typeof seller.lastName === "string"
            ) {
              sellerName = `${seller.firstName.trim()} ${seller.lastName.trim()}`;
            } else if (
              typeof seller.firstName === "string" &&
              seller.firstName.trim()
            ) {
              sellerName = seller.firstName.trim();
            }

            if (sellerName) {
              result[id] = {
                name: sellerName,
                profilePic:
                  typeof seller.profilePic === "string"
                    ? seller.profilePic
                    : undefined,
              };
            }
          }
        } catch (error) {
          console.error(
            `Failed to fetch seller data for product ${id}:`,
            error,
          );
        }
      }),
    );

    setSellerData(result);
  };

  const formatPrice = (val: any) => {
    if (val === null || val === undefined) return "Price on request";
    if (typeof val === "object") return "Price on request";
    if (val === 0 || val === "0" || val === "0.00") return "AED 0";
    const num = parseFloat(String(val));
    if (isNaN(num)) return "Price on request";
    return `AED ${num.toFixed(2)}`;
  };

  const filters = [
    { label: "All", value: null },
    ...divisionTypes.map((d) => ({
      label:
        typeof d.name === "string"
          ? d.name
          : String(d.name || d.label || "Unknown"),
      value: d,
    })),
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFilteredProducts();
  };

  const filteredProducts = searchQuery.trim()
    ? products.filter((p) => {
        const title = p.title ?? p.product_name ?? "";
        return String(title).toLowerCase().includes(searchQuery.trim().toLowerCase());
      })
    : products;

  /** Get first image URL from product (API or embedded). */
  const getProductImageUrl = (p: any): string | null => {
    const id = p?.product_id ?? p?.id ?? p?._id;
    const idStr = id != null ? String(id) : "";
    const fromSigned = idStr && signedImages[idStr];
    if (typeof fromSigned === "string" && !fromSigned.includes("undefined"))
      return fromSigned;
    if (typeof p?.image === "string" && !p.image.includes("undefined"))
      return p.image;
    if (typeof p?.thumbnail === "string" && !p.thumbnail.includes("undefined"))
      return p.thumbnail;
    const first = Array.isArray(p?.images) && p.images[0];
    if (first) {
      const url = typeof first === "string" ? first : first?.url ?? first?.link ?? first?.src;
      if (typeof url === "string" && url.trim() && !url.includes("undefined"))
        return url.trim();
    }
    return null;
  };

  const renderProduct = ({ item: p, index }: { item: any; index: number }) => {
    const id = p.product_id ?? p.id;
    const idStr = id != null ? String(id) : "";
    const noImageUrl =
      "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
    const img = getProductImageUrl(p) ?? noImageUrl;

    // Ensure all values are primitives, not objects
    const title =
      typeof p.title === "string"
        ? p.title
        : typeof p.product_name === "string"
          ? p.product_name
          : typeof p.title === "object"
            ? JSON.stringify(p.title)
            : "Untitled";

    const price = formatPrice(p.price);
    const originalPrice =
      typeof p.originalPrice === "number"
        ? p.originalPrice
        : typeof p.price === "number"
          ? p.price
          : typeof p.price === "string"
            ? parseFloat(p.price) || 0
            : 0;
    const discountedPrice =
      typeof p.finalPrice === "number"
        ? p.finalPrice
        : typeof p.price === "number"
          ? p.price
          : typeof p.price === "string"
            ? parseFloat(p.price) || 0
            : 0;

    // Extract seller information - first check cached seller data, then product object
    let sellerName: string | undefined = undefined;
    let sellerProfilePic: string | undefined = undefined;

    // First, check if we have seller data from the fetched seller data cache
    if (sellerData[id]) {
      sellerName = sellerData[id].name;
      sellerProfilePic = sellerData[id].profilePic;
    }
    // Then check various possible seller data structures in the product object
    else if (p.seller && typeof p.seller === "object") {
      // Direct seller object
      if (typeof p.seller.name === "string" && p.seller.name.trim()) {
        sellerName = p.seller.name.trim();
      } else if (
        typeof p.seller.firstName === "string" &&
        typeof p.seller.lastName === "string"
      ) {
        sellerName = `${p.seller.firstName.trim()} ${p.seller.lastName.trim()}`;
      } else if (
        typeof p.seller.firstName === "string" &&
        p.seller.firstName.trim()
      ) {
        sellerName = p.seller.firstName.trim();
      } else if (
        typeof p.seller.username === "string" &&
        p.seller.username.trim()
      ) {
        sellerName = p.seller.username.trim();
      }

      if (
        typeof p.seller.profilePic === "string" &&
        p.seller.profilePic.trim()
      ) {
        sellerProfilePic = p.seller.profilePic.trim();
      } else if (
        typeof p.seller.profile_pic === "string" &&
        p.seller.profile_pic.trim()
      ) {
        sellerProfilePic = p.seller.profile_pic.trim();
      } else if (
        typeof p.seller.avatar === "string" &&
        p.seller.avatar.trim()
      ) {
        sellerProfilePic = p.seller.avatar.trim();
      }
    } else if (p.user && typeof p.user === "object") {
      // Seller might be under 'user' key
      if (typeof p.user.name === "string" && p.user.name.trim()) {
        sellerName = p.user.name.trim();
      } else if (
        typeof p.user.firstName === "string" &&
        typeof p.user.lastName === "string"
      ) {
        sellerName = `${p.user.firstName.trim()} ${p.user.lastName.trim()}`;
      } else if (
        typeof p.user.firstName === "string" &&
        p.user.firstName.trim()
      ) {
        sellerName = p.user.firstName.trim();
      }

      if (typeof p.user.profilePic === "string" && p.user.profilePic.trim()) {
        sellerProfilePic = p.user.profilePic.trim();
      } else if (
        typeof p.user.profile_pic === "string" &&
        p.user.profile_pic.trim()
      ) {
        sellerProfilePic = p.user.profile_pic.trim();
      }
    } else if (p.createdBy && typeof p.createdBy === "object") {
      // Seller might be under 'createdBy' key
      if (typeof p.createdBy.name === "string" && p.createdBy.name.trim()) {
        sellerName = p.createdBy.name.trim();
      } else if (
        typeof p.createdBy.firstName === "string" &&
        typeof p.createdBy.lastName === "string"
      ) {
        sellerName = `${p.createdBy.firstName.trim()} ${p.createdBy.lastName.trim()}`;
      }

      if (
        typeof p.createdBy.profilePic === "string" &&
        p.createdBy.profilePic.trim()
      ) {
        sellerProfilePic = p.createdBy.profilePic.trim();
      }
    }

    const seller = sellerName
      ? {
          name: sellerName,
          profilePic: sellerProfilePic,
        }
      : undefined;

    const productItem = {
      id: String(id),
      title: String(title),
      image: String(img),
      price: String(price),
      status: typeof p.status === "string" ? p.status : "available",
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
    <SafeAreaView
      className="flex-1 bg-bg_primary"
      edges={["top"]}
    >
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border_primary bg-bg_white">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color={colors.text_primary} />
        </Pressable>
        <Text className="text-xl font-bold flex-1 text-center text-text_primary">
          {typeof subcategoryName === "string" ? subcategoryName : "Products"}
        </Text>
        <View className="w-10" />
      </View>

      <View className="px-4 py-3 bg-bg_white">
        <View className="flex-row items-center rounded-xl px-4 h-12 bg-bg_secondary border border-border_secondary">
          <Ionicons name="search" size={20} color={colors.text_tertiary} />
          <TextInput
            className="flex-1 ml-3 text-base text-text_primary"
            placeholder={`Search in ${(subcategoryName || "products").toLowerCase()}`}
            placeholderTextColor={colors.text_tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {divisionTypes.length > 0 && (
        <View className="px-4 py-3 border-b border-border_primary bg-bg_white">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            {filters.map((f) => {
              const isSelected =
                f.value === null
                  ? selectedDivisionType === null
                  : selectedDivisionType?.id === f.value?.id;
              const labelText =
                typeof f.label === "string" ? f.label : String(f.label || "");
              return (
                <Pressable
                  key={f.value?.id ?? "all"}
                  onPress={() => setSelectedDivisionType(f.value)}
                  className={`px-4 py-2 rounded-full border min-h-[36px] justify-center items-center ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "bg-bg_white border-border_primary"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? "text-text_white" : "text-text_primary"
                    }`}
                  >
                    {labelText}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-base text-text_secondary">
            Loading products...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.error}
          />
          <Text className="mt-4 text-lg font-semibold text-center text-text_primary">
            {error}
          </Text>
          <Pressable
            onPress={() => router.push("/home" as any)}
            className="mt-6 px-6 py-3 rounded-xl bg-primary"
          >
            <Text className="text-base font-semibold text-text_white">
              Go to Home
            </Text>
          </Pressable>
        </View>
      ) : products.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) =>
            String(item.product_id || item.id || Math.random())
          }
          contentContainerStyle={{
            paddingVertical: 16,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            searchQuery.trim() ? (
              <View className="py-10 items-center justify-center px-6">
                <Ionicons name="search-outline" size={48} color={colors.text_tertiary} />
                <Text className="mt-3 text-base text-center text-text_secondary">
                  No results for "{searchQuery.trim()}"
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View className="flex-1 justify-center items-center px-6 py-10">
          <Ionicons
            name="cube-outline"
            size={64}
            color={colors.text_tertiary}
          />
          <Text className="mt-4 text-lg font-semibold text-center text-text_primary">
            No products found
          </Text>
          <Text className="mt-2 text-sm text-center text-text_tertiary">
            No products found for this subcategory.
          </Text>
          <Pressable
            onPress={() => router.push("/home" as any)}
            className="mt-6 px-6 py-3 rounded-xl bg-primary"
          >
            <Text className="text-base font-semibold text-text_white">
              Go to Home
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ProductListingScreen;
