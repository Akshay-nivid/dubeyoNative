import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { get } from "@/src/services/api";
import { getImages } from "@/src/services/imageLink/image";
import { Api } from "@/src/screens/home/Api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ProductDetailProps {
  productId: string;
}

const ProductDetailScreen: React.FC<ProductDetailProps> = ({ productId }) => {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const imageScrollRef = useRef<ScrollView>(null);

  // Initialize carousel position when images load
  useEffect(() => {
    if (imageUrls.length > 0 && imageScrollRef.current) {
      imageScrollRef.current.scrollTo({ x: 0, animated: false });
      setCurrentImageIndex(0);
    }
  }, [imageUrls.length]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await get(`${Api.getProductDetails}?productId=${productId}`);

        if (res?.data?.data || res?.data) {
          const productData = res.data.data || res.data;
          setProduct(productData);
          
          // Fetch images
          const images = await getImages(productId, true);
          setImageUrls(images || []);
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Product not found",
          });
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load product details",
        });
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const handleShare = async () => {
    // For React Native, we can use expo-sharing or Linking
    try {
      const shareUrl = `dubeyoapp://product/${productId}`;
      await Linking.share({
        message: `${product?.title}\n${product?.description || ""}\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    Toast.show({
      type: "success",
      text1: isFavorited ? "Removed from favorites" : "Added to favorites",
    });
  };

  const handleCall = () => {
    if (product?.seller?.phone) {
      Linking.openURL(`tel:${product.seller.phone}`);
    } else {
      Toast.show({
        type: "info",
        text1: "Phone number not available",
      });
    }
  };

  const handleInterested = () => {
    Toast.show({
      type: "success",
      text1: "Interest sent",
      text2: "The seller will be notified",
    });
  };

  const goToNext = () => {
    if (imageUrls.length > 1 && imageScrollRef.current) {
      const nextIndex = (currentImageIndex + 1) % imageUrls.length;
      setCurrentImageIndex(nextIndex);
      imageScrollRef.current.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    }
  };

  const goToPrevious = () => {
    if (imageUrls.length > 1 && imageScrollRef.current) {
      const prevIndex = (currentImageIndex - 1 + imageUrls.length) % imageUrls.length;
      setCurrentImageIndex(prevIndex);
      imageScrollRef.current.scrollTo({ x: prevIndex * SCREEN_WIDTH, animated: true });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg_primary }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-base" style={{ color: colors.text_secondary }}>
            Loading product details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg_primary }}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold mb-4" style={{ color: colors.text_primary }}>
            Product not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold" style={{ color: colors.text_white }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentImage =
    imageUrls?.length > 0
      ? imageUrls[currentImageIndex]
      : product.images?.[0] && (product.images[0].startsWith("http://") || product.images[0].startsWith("https://"))
      ? product.images[0]
      : null;

  const description = product.enhancedDescription || product.description || "";
  const displayDescription = showFullDescription ? description : description.substring(0, 150);
  const hasMoreDescription = description.length > 150;

  const specs = product.specs || {};
  const specsEntries = Object.entries(specs);
  const initialLimit = 5;
  const hasMoreSpecs = specsEntries.length > initialLimit;
  const displayedSpecs = showAllDetails ? specsEntries : specsEntries.slice(0, initialLimit);

  const currency = product.currency || "AED";
  const originalPrice = parseFloat(product.price) || 0;
  const finalPrice =
    product.finalPrice != null && parseFloat(product.finalPrice) > 0
      ? parseFloat(product.finalPrice)
      : originalPrice > 0
      ? originalPrice
      : 0;
  const hasDiscount = originalPrice > 0 && finalPrice > 0 && originalPrice > finalPrice;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg_primary }} edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header with back and share buttons */}
        <View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-4 pt-2 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text_primary} />
          </Pressable>
          <Pressable
            onPress={handleShare}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="share-outline" size={24} color={colors.text_primary} />
          </Pressable>
        </View>

        {/* Image Carousel */}
        <View className="relative" style={{ height: SCREEN_WIDTH }}>
          {imageUrls?.length > 0 ? (
            <>
              <ScrollView
                ref={imageScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setCurrentImageIndex(index);
                }}
              >
                {imageUrls.map((url, index) => (
                  <View key={index} style={{ width: SCREEN_WIDTH }}>
                    <Image
                      source={{ uri: url }}
                      style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              {imageUrls.length > 1 && (
                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                  {imageUrls.map((_, index) => (
                    <View
                      key={index}
                      className="rounded-full"
                      style={{
                        width: index === currentImageIndex ? 24 : 8,
                        height: 8,
                        backgroundColor: index === currentImageIndex ? colors.text_white : "rgba(255,255,255,0.5)",
                        marginHorizontal: 2,
                      }}
                    />
                  ))}
                </View>
              )}

              {/* Image Counter */}
              {imageUrls.length > 1 && (
                <View
                  className="absolute top-16 right-4 px-3 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <Text className="text-sm font-semibold" style={{ color: colors.text_white }}>
                    {currentImageIndex + 1}/{imageUrls.length}
                  </Text>
                </View>
              )}

              {/* Navigation Arrows */}
              {imageUrls.length > 1 && (
                <>
                  <Pressable
                    onPress={goToPrevious}
                    className="absolute left-4 top-1/2 w-10 h-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      transform: [{ translateY: -20 }],
                    }}
                  >
                    <Ionicons name="chevron-back" size={24} color={colors.text_primary} />
                  </Pressable>
                  <Pressable
                    onPress={goToNext}
                    className="absolute right-4 top-1/2 w-10 h-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      transform: [{ translateY: -20 }],
                    }}
                  >
                    <Ionicons name="chevron-forward" size={24} color={colors.text_primary} />
                  </Pressable>
                </>
              )}
            </>
          ) : currentImage ? (
            <Image
              source={{ uri: currentImage }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
              contentFit="cover"
            />
          ) : (
            <View
              className="items-center justify-center"
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: colors.bg_secondary }}
            >
              <Ionicons name="image-outline" size={64} color={colors.text_tertiary} />
              <Text className="mt-4 text-base" style={{ color: colors.text_tertiary }}>
                No image available
              </Text>
            </View>
          )}
        </View>

        {/* Product Info Card */}
        <View className="bg-white rounded-t-3xl -mt-6 px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-2xl font-bold flex-1 pr-4" style={{ color: colors.text_primary }}>
              {product.title || "Untitled Product"}
            </Text>
            <Pressable onPress={handleToggleFavorite} className="ml-2">
              <Ionicons
                name={isFavorited ? "heart" : "heart-outline"}
                size={28}
                color={isFavorited ? "#dc2626" : colors.text_primary}
              />
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="text-base leading-6" style={{ color: colors.text_primary }}>
              {displayDescription}
              {hasMoreDescription && (
                <Text
                  onPress={() => setShowFullDescription(!showFullDescription)}
                  className="font-semibold"
                  style={{ color: colors.primary }}
                >
                  {showFullDescription ? " Less" : " More"}
                </Text>
              )}
            </Text>
          </View>

          <View className="flex-row items-baseline gap-3 mb-6">
            {hasDiscount && originalPrice > 0 && (
              <Text className="text-lg line-through" style={{ color: colors.text_tertiary }}>
                {currency} {originalPrice.toFixed(2)}
              </Text>
            )}
            <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
              {finalPrice > 0 ? `${currency} ${finalPrice.toFixed(2)}` : "Price on request"}
            </Text>
          </View>
        </View>

        {/* Seller Information Card */}
        {product?.seller && (
          <View className="bg-white mx-4 mt-4 rounded-2xl p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: colors.bg_secondary }}
                >
                  <Ionicons name="person" size={28} color={colors.text_primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold mb-1" style={{ color: colors.text_primary }}>
                    {product.seller.name || "Seller"}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.text_tertiary }}>
                    Active Seller
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center px-3 py-1 rounded-full" style={{ backgroundColor: colors.bg_secondary }}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text className="ml-1 text-sm font-semibold" style={{ color: colors.text_primary }}>
                  4.4
                </Text>
              </View>
            </View>
            <View className="mt-3 pt-3 border-t" style={{ borderColor: colors.border_primary }}>
              <View className="flex-row items-center">
                <View className="px-3 py-1 rounded-full mr-2" style={{ backgroundColor: colors.bg_secondary }}>
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    Fast Responder
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Product Details Card */}
        {specsEntries.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-2xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold" style={{ color: colors.text_primary }}>
                Product Details
              </Text>
              {hasMoreSpecs && (
                <Pressable onPress={() => setShowAllDetails(!showAllDetails)}>
                  <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                    {showAllDetails ? "View Less" : "View All"}
                  </Text>
                </Pressable>
              )}
            </View>
            <View className="gap-3">
              {displayedSpecs.map(([key, value]) => (
                <View key={key} className="flex-row items-center py-2">
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.bg_secondary }}>
                    <Text className="text-lg">
                      {key.toLowerCase().includes("fuel") && "⛽"}
                      {key.toLowerCase().includes("color") && "🎨"}
                      {key.toLowerCase().includes("mileage") && "📊"}
                      {key.toLowerCase().includes("power") && "⚡"}
                      {key.toLowerCase().includes("engine") && "🔧"}
                      {!key.toLowerCase().includes("fuel") &&
                        !key.toLowerCase().includes("color") &&
                        !key.toLowerCase().includes("mileage") &&
                        !key.toLowerCase().includes("power") &&
                        !key.toLowerCase().includes("engine") &&
                        "📋"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm mb-1" style={{ color: colors.text_tertiary }}>
                      {key}
                    </Text>
                    <Text className="text-base font-semibold" style={{ color: colors.text_primary }}>
                      {String(value)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Map Section Placeholder */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-6 items-center justify-center" style={{ minHeight: 200 }}>
          <Ionicons name="map-outline" size={48} color={colors.text_tertiary} />
          <Text className="mt-4 text-base font-semibold" style={{ color: colors.text_primary }}>
            Location Map
          </Text>
          <Text className="mt-2 text-sm" style={{ color: colors.text_tertiary }}>
            Map integration coming soon
          </Text>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row px-4 pb-6 pt-4 gap-3"
        style={{
          backgroundColor: colors.bg_primary,
          borderTopWidth: 1,
          borderTopColor: colors.border_primary,
        }}
      >
        <Pressable
          onPress={handleCall}
          className="w-14 h-14 items-center justify-center rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="call" size={24} color={colors.text_white} />
        </Pressable>
        <Pressable
          onPress={handleInterested}
          className="flex-1 h-14 items-center justify-center rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-base font-semibold" style={{ color: colors.text_white }}>
            I&apos;m interested
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetailScreen;
