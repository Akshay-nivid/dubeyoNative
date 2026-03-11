import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProductCard from "@/src/components/ProductCard";
import { API_BASE_URL } from "@/src/constants/env";
import { searchProducts } from "@/src/services/api/search";
import { getImages } from "@/src/services/imageLink/image";
import { normalizeProduct } from "@/src/utils/productMapper";

const SearchDragScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [signedImages, setSignedImages] = useState<Record<string, string>>({});

  const suggestionChips = [
    "iPhone 13 below 2,000 AED",
    "Sofa set under 1,500 AED",
    "BMW under 50,000 AED",
    "Used laptop for work",
    "Used Toyota Camry",
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);
    setResults([]);

    try {
      const res = await searchProducts(searchQuery);
      const products = res?.data?.results || [];

      setResults(products);

      if (products.length > 0) {
        await fetchSignedUrls(products);
      }
    } catch (error) {
      console.error("Search error:", error);
      // Optionally show toast or error state
    } finally {
      setLoading(false);
    }
  };

  const fetchSignedUrls = async (list: any[]) => {
    const result: Record<string, string> = {};
    await Promise.all(
      list.map(async (p) => {
        const key = p?.id || p?.product_id || p?._id;
        if (!key) return;
        try {
          const res = await getImages(String(key));
          if (res && res.length > 0) {
            let url = res[0];
            if (typeof url === "string" && !/^https?:\/\//i.test(url)) {
              url = API_BASE_URL + (url.startsWith("/") ? url : `/${url}`);
            }
            if (typeof url === "string" && !url.includes("undefined")) {
              result[String(key)] = url;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch image for product ${key}:`, error);
        }
      }),
    );
    setSignedImages((prev) => ({ ...prev, ...result }));
  };

  const renderProduct = ({ item }: { item: any }) => {
    // Mock seller data for now as search API might not return it fully populated yet,
    // logic similar to ProductListing can be added if needed.
    const productItem = normalizeProduct(item, signedImages);
    return (
      <ProductCard
        item={productItem}
        onPress={() => router.push(`/product/${productItem.id}` as any)}
        variant="vertical"
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="mt-4 text-gray-500 font-medium">Searching...</Text>
        </View>
      );
    }

    if (hasSearched && results.length === 0) {
      return (
        <View className="flex-1 justify-center items-center px-10">
          <Ionicons name="search-outline" size={64} color="#C7B8FF" />
          <Text className="mt-4 text-lg font-semibold text-gray-800 text-center">
            No results found
          </Text>
          <Text className="mt-2 text-sm text-gray-500 text-center">
            We couldn't find anything matching "{searchQuery}". Try different
            keywords.
          </Text>
        </View>
      );
    }

    if (hasSearched && results.length > 0) {
      return (
        <FlatList
          data={results}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item.id || item._id || Math.random())}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    // Default State (Mascot & Suggestions)
    return (
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 20,
        }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot */}
        <Image
          source={require("@/assets/images/ai_modal_icon.png")}
          className="w-32 h-32 resize-contain mb-4"
        />

        {/* Search Badge */}
        <LinearGradient
          colors={["#C7B8FF", "#9F8CFF", "#7C6CF5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-6 py-1.5 mb-6"
          style={{ borderRadius: 6 }}
        >
          <Text className="text-white font-bold text-base">Search</Text>
        </LinearGradient>

        {/* Helper Text */}
        <Text className="text-center text-lg font-medium text-gray-800 px-10 mb-10 leading-6">
          “Looking to buy? Just describe what you want.”
        </Text>

        {/* Suggestion Chips */}
        <View className="mb-8 h-12">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {suggestionChips.map((chip, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSearchQuery(chip);
                  // Optional: trigger search immediately or just fill input
                }}
                className="border border-white/80 rounded-full px-6 py-2.5 bg-white/20 mr-3 justify-center"
              >
                <Text className="text-gray-800 text-sm font-medium">
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    );
  };

  return (
    <LinearGradient
      colors={["#f7e2fbff", "#d8ecf9ff", "#d7d1f3ff"]} // Very light Pink, Blue, Purple
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-2">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="close-circle-outline" size={28} color="#000" />
            </TouchableOpacity>
            <Text
              className="text-xl font-bold text-black"
              style={{ letterSpacing: 0.5 }}
            >
              Dubeyo.ai
            </Text>
            <TouchableOpacity className="p-2">
              <Ionicons name="bookmark-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Content Body */}
          <View className="flex-1">{renderContent()}</View>

          {/* Bottom Input Area */}
          <View className="px-5 pb-4 pt-2">
            <View className="bg-white rounded-full flex-row items-center p-2 shadow-sm border border-gray-100">
              {/* User Avatar Placeholder */}
              <View className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200">
                <Image
                  source={{
                    uri: "https://randomuser.me/api/portraits/men/32.jpg",
                  }}
                  className="w-full h-full"
                />
              </View>

              <TextInput
                placeholder="Ask me anything..."
                className="flex-1 text-base text-gray-800"
                placeholderTextColor="#9CA3AF"
                autoFocus={true}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (!text.trim()) {
                    setHasSearched(false);
                    setResults([]);
                  }
                }}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />

              {/* Mic/Wave Icon or Send Arrow */}
              <TouchableOpacity
                onPress={() =>
                  searchQuery.trim() ? handleSearch() : console.log("Voice")
                }
                className={`w-12 h-12 rounded-full items-center justify-center ml-2 ${searchQuery.trim() ? "bg-black" : "bg-purple-100"}`}
              >
                {searchQuery.trim() ? (
                  <Ionicons name="arrow-up" size={24} color="#FFF" />
                ) : (
                  /* Waveform Animation (Simulated) */
                  <View className="flex-row items-center gap-[2px]">
                    <View className="w-[2px] h-2 bg-[#8B5CF6] rounded-full" />
                    <View className="w-[2px] h-3 bg-[#8B5CF6] rounded-full" />
                    <View className="w-[2px] h-4 bg-[#8B5CF6] rounded-full" />
                    <View className="w-[2px] h-3 bg-[#8B5CF6] rounded-full" />
                    <View className="w-[2px] h-2 bg-[#8B5CF6] rounded-full" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SearchDragScreen;
