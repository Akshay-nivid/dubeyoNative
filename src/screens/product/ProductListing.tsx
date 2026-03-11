import { API_BASE_URL } from "@/src/constants/env";
import { Api } from "@/src/screens/home/Api";
import { get } from "@/src/services/api";
import api from "@/src/services/api/client";
import { getImages } from "@/src/services/imageLink/image";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import FilterModal from "@/src/components/FilterModal";
import ProductCard from "@/src/components/ProductCard";
import ThemedBackground from "@/src/components/ThemedBackground";
import { normalizeProduct } from "@/src/utils/productMapper";

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
  const [showFilter, setShowFilter] = useState(false);
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

    // 1. Populate from existing data in list using mapper logic
    list.forEach((p) => {
      const normalized = normalizeProduct(p);
      if (normalized.seller && normalized.id) {
        result[normalized.id] = {
          name: normalized.seller.name || "",
          profilePic: normalized.seller.profilePic,
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
              profilePic: normalized.seller.profilePic,
            };
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFilteredProducts();
  };

  const filteredProducts = searchQuery.trim()
    ? products.filter((p) => {
        const title = p.title ?? p.product_name ?? "";
        return String(title)
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());
      })
    : products;

  const renderProduct = ({ item }: { item: any }) => {
    const productItem = normalizeProduct(item, signedImages, sellerData);

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
        {/* Header - seamless with page background, centered title (same as Section Listing) */}
        <View className="px-4 pt-4 pb-3 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/80"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View
            className="items-center justify-center"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              paddingHorizontal: 48,
            }}
            pointerEvents="none"
          >
            <Text
              className="text-xl font-black text-gray-900"
              numberOfLines={1}
            >
              {typeof subcategoryName === "string"
                ? subcategoryName
                : "Products"}
            </Text>
          </View>
          <View className="w-10" />
        </View>

        <View className="px-4 py-3 flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center rounded-xl px-4 h-12 bg-bg_secondary border border-border_secondary">
            <Ionicons name="search" size={20} color={colors.text_tertiary} />
            <TextInput
              className="flex-1 ml-3 text-base text-text_primary"
              placeholder={`Search in ${(subcategoryName || "products").toLowerCase()}`}
              placeholderTextColor={colors.text_tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilter(!showFilter)}
            className="h-12 w-12 items-center justify-center rounded-xl bg-primary border border-primary"
          >
            <Ionicons name="options-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <FilterModal
          visible={showFilter}
          onClose={() => setShowFilter(false)}
          onApply={(division) => setSelectedDivisionType(division)}
          onReset={() => setSelectedDivisionType(null)}
          divisionTypes={divisionTypes}
          selectedDivision={selectedDivisionType}
        />

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
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{
              paddingHorizontal: 16,
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
                  <Ionicons
                    name="search-outline"
                    size={48}
                    color={colors.text_tertiary}
                  />
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
    </ThemedBackground>
  );
};

export default ProductListingScreen;
