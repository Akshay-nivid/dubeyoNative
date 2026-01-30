import { Api } from "@/src/screens/home/Api";
import { get } from "@/src/services/api";
import { getImages } from "@/src/services/imageLink/image";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

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
    try {
      const shareUrl = `dubeyoapp://product/${productId}`;
      await Share.share({
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

  const handleWhatsApp = () => {
    if (product?.seller?.phone) {
      Linking.openURL(`https://wa.me/${product.seller.phone.replace(/[^0-9]/g, '')}`);
    } else {
      Toast.show({
        type: "info",
        text1: "Phone number not available",
      });
    }
  };

  const handleChat = () => {
    Toast.show({
      type: "success",
      text1: "Chat",
      text2: "Chat feature coming soon",
    });
  };


  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg_primary }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-2 text-base" style={{ color: colors.text_secondary }}>
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

  // Extract features/verification badges from product data
  const features = product.features || product.verificationBadges || product.badges || [];
  const featuresArray = Array.isArray(features) ? features : [];

  // Extract basic specs from product or specs object
  const getSpecValue = (key: string, fallback?: string) => {
    if (specs[key] && typeof specs[key] === 'object' && 'value' in specs[key]) {
      return specs[key].value;
    }
    if (specs[key]) {
      return specs[key];
    }
    if (product[key]) {
      return product[key];
    }
    return fallback;
  };

  const year = getSpecValue('year') || getSpecValue('modelYear') || getSpecValue('model_year');
  const mileage = getSpecValue('mileage') || getSpecValue('odometer') || getSpecValue('km');
  const fuelType = getSpecValue('fuelType') || getSpecValue('fuel') || getSpecValue('fuel_type');

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
        contentContainerStyle={{ paddingBottom: 80 }}
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

              {/* Image Counter - Bottom Left */}
              {imageUrls.length > 1 && (
                <View
                  className="absolute bottom-4 left-4 px-3 py-1 rounded"
                  style={{ backgroundColor: "rgba(255,255,255,0.8)" }}
                >
                  <Text className="text-sm font-semibold" style={{ color: colors.text_primary }}>
                    {currentImageIndex + 1}/{imageUrls.length}
                  </Text>
                </View>
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
        <View className="bg-white rounded-t-3xl -mt-6 px-6 pt-4 pb-3">
          {/* Price and Seller Info Row */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-2xl font-bold" style={{ color: colors.text_primary }}>
              {finalPrice > 0 ? `${currency} ${finalPrice.toLocaleString()}` : "Price on request"}
            </Text>
            {product?.seller && (
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: colors.bg_secondary }}
                >
                  {product.seller.profilePic ? (
                    <Image
                      source={{ uri: product.seller.profilePic }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={20} color={colors.text_primary} />
                  )}
                </View>
                <View>
                  <Text className="text-sm font-semibold" style={{ color: colors.text_primary }}>
                    {product.seller.name || "Seller"}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-xs" style={{ color: colors.text_tertiary }}>
                      Seller
                    </Text>
                    <Ionicons name="star" size={12} color="#fbbf24" style={{ marginLeft: 4 }} />
                    <Text className="text-xs ml-1 font-semibold" style={{ color: colors.text_primary }}>
                      4.4
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Car Model */}
          <Text className="text-md font-bold mb-4" style={{ color: colors.text_primary }}>
            {product.title || "Untitled Product"}
          </Text>

          {/* Basic Specs Row */}
          {(year || mileage || fuelType) && (
            <View className="flex-row items-center gap-3 mb-3">
              {year && (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color={colors.text_tertiary} />
                  <Text className="text-sm ml-1" style={{ color: colors.text_tertiary }}>
                    {year} model
                  </Text>
                </View>
              )}
              {mileage && (
                <View className="flex-row items-center">
                  <Ionicons name="speedometer-outline" size={16} color={colors.text_tertiary} />
                  <Text className="text-sm ml-1" style={{ color: colors.text_tertiary }}>
                    {mileage} {mileage.toString().includes('km') ? '' : 'km'}
                  </Text>
                </View>
              )}
              {fuelType && (
                <View className="flex-row items-center">
                  <Ionicons name="car-outline" size={16} color={colors.text_tertiary} />
                  <Text className="text-sm ml-1" style={{ color: colors.text_tertiary }}>
                    {fuelType}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Verification Badges / Features */}
          {featuresArray.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-2">
              {featuresArray.map((feature: any, index: number) => {
                const featureName = typeof feature === 'string' ? feature : feature.name || feature.label || feature.title;
                if (!featureName) return null;
                return (
                  <View key={index} className="px-3 py-1 rounded-full flex-row items-center" style={{ backgroundColor: "#10b981" }}>
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                    <Text className="text-xs font-semibold ml-1" style={{ color: "#ffffff" }}>
                      {featureName}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Disclaimer */}
          <View className="flex-row items-start mb-2">
            <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginTop: 2 }} />
            <Text className="text-xs ml-2 flex-1" style={{ color: colors.text_tertiary }}>
              This info is provided by the seller and is not verified by Dubeyoo.
            </Text>
          </View>
        </View>


        {/* Car Details Card */}
        {specsEntries.length > 0 && (
          <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text_primary }}>
                Car Details
              </Text>
              {hasMoreSpecs && (
                <Pressable onPress={() => setShowAllDetails(!showAllDetails)}>
                  <Text className="text-md font-bold" style={{ color: colors.bg_black }}>
                    {showAllDetails ? "Less" : "More"}
                  </Text>
                </Pressable>
              )}
            </View>
            <View className="gap-1">
              {displayedSpecs.map(([key, value]) => {
                // Handle specs that have a 'value' property
                const specValue = value && typeof value === 'object' && 'value' in value 
                  ? (value as any).value 
                  : value;
                const displayKey = value && typeof value === 'object' && 'label' in value
                  ? (value as any).label
                  : key;
                const displayValue = specValue !== null && specValue !== undefined ? String(specValue) : '';
                return (
                  <View key={key} className="flex-row justify-between items-center py-1.5 border-b" style={{ borderBottomColor: colors.border_primary }}>
                    <Text className="text-sm flex-1" style={{ color: colors.text_tertiary }}>
                      {displayKey}:
                    </Text>
                    <Text className="text-sm font-semibold flex-1 text-right" style={{ color: colors.text_primary }}>
                      {displayValue}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Description Section */}
        {description && (
          <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
            <Text className="text-lg font-bold mb-2" style={{ color: colors.text_primary }}>
              Description
            </Text>
            <Text className="text-base leading-6" style={{ color: colors.text_primary }}>
              {displayDescription}
              {hasMoreDescription && (
                <Text
                  onPress={() => setShowFullDescription(!showFullDescription)}
                  className="font-bold"
                  style={{ color: colors.bg_black }}
                >
                  {showFullDescription ? " Less" : " More"}
                </Text>
              )}
            </Text>
          </View>
        )}

        {/* Posted On */}
        {product.createdAt && (
          <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
            <Text className="text-sm" style={{ color: colors.text_tertiary }}>
              Posted On: {new Date(product.createdAt).toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
          </View>
        )}

        {/* Location Section */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <Text className="text-lg font-bold mb-2" style={{ color: colors.text_primary }}>
            Location
          </Text>
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-base flex-1" style={{ color: colors.text_primary }}>
              {product.location || product.address || "P.O. Box 39613, Dubai, UAE Emirates"}
            </Text>
            <Pressable>
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                Edit
              </Text>
            </Pressable>
          </View>
          <View className="bg-gray-200 rounded-lg overflow-hidden" style={{ minHeight: 200 }}>
            <View className="items-center justify-center" style={{ minHeight: 200 }}>
              <Ionicons name="map-outline" size={48} color={colors.text_tertiary} />
              <Text className="mt-4 text-base font-semibold" style={{ color: colors.text_primary }}>
                Map View
              </Text>
            </View>
          </View>
        </View>

        {/* Report Ad Button */}
        <View className="mx-4 mt-3 mb-6">
          <Pressable
            className="w-full py-3 rounded-xl items-center"
            style={{ backgroundColor: "#000000" }}
          >
            <Text className="text-base font-semibold" style={{ color: "#ffffff" }}>
              Report ad
            </Text>
          </Pressable>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row px-4 pb-4 pt-3"
        style={{
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: colors.border_primary,
        }}
      >
        <Pressable
          onPress={handleCall}
          className="flex-1 items-center py-2"
        >
          <Ionicons name="call" size={24} color={colors.text_primary} />
          <Text className="text-xs mt-1" style={{ color: colors.text_primary }}>
            Call
          </Text>
        </Pressable>
        <Pressable
          onPress={handleWhatsApp}
          className="flex-1 items-center py-2"
        >
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          <Text className="text-xs mt-1" style={{ color: colors.text_primary }}>
            Whatsapp
          </Text>
        </Pressable>
        <Pressable
          onPress={handleChat}
          className="flex-1 items-center py-2"
        >
          <Ionicons name="chatbubble-outline" size={24} color={colors.text_primary} />
          <Text className="text-xs mt-1" style={{ color: colors.text_primary }}>
            Chat
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetailScreen;
