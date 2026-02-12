// import { t } from "@/src/localization/i18n";
import FreeMapView from "@/src/components/FreeMapView";
import { Api } from "@/src/screens/home/Api";
import { get } from "@/src/services/api";
import { getImages } from "@/src/services/imageLink/image";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ExpoLocation from 'expo-location';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,


  ScrollView,
  Share,
  Text,
  View
} from "react-native";



import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";


const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Standard icon sizes for the detail screen
const ICON = {
  sm: 14,   // badges, tiny inline
  md: 16,   // inline with text (specs, disclaimer)
  lg: 20,   // header buttons, list icons, bottom bar
  xl: 32,   // empty states, placeholders
} as const;

interface ProductDetailProps {
  productId: string;
}

const ProductDetailScreen: React.FC<ProductDetailProps> = ({ productId }) => {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'location'>('description');
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLocationVisible, setIsLocationVisible] = useState(false);
  const [address, setAddress] = useState<string>("");
  const imageScrollRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<ScrollView>(null);
  const descriptionRef = useRef<View>(null);
  const detailsRef = useRef<View>(null);
  const locationRef = useRef<View>(null);
  const [sectionPositions, setSectionPositions] = useState<{
    description: number;
    details: number;
    location: number;
  }>({ description: 0, details: 0, location: 0 });

  // Initialize carousel position when images load
  useEffect(() => {
    if (imageUrls.length > 0 && imageScrollRef.current) {
      imageScrollRef.current.scrollTo({ x: 0, animated: false });
      setCurrentImageIndex(0);
    }
  }, [imageUrls.length]);

  useEffect(() => {
    let isMounted = true;
    const fetchAddress = async () => {
      if (product?.location?.coordinates && product.location.coordinates.length === 2) {
        try {
          const [lon, lat] = product.location.coordinates;
          const [result] = await ExpoLocation.reverseGeocodeAsync({ latitude: lat, longitude: lon });

          if (isMounted && result) {
            const place = result.city || result.district || result.region || result.subregion || result.name;
            if (place) {
              setAddress(place);
            } else {
              setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            }
          }
        } catch (e) {
          if (isMounted) setAddress(`${product.location.coordinates[1].toFixed(4)}, ${product.location.coordinates[0].toFixed(4)}`);
        }
      } else if (product?.address) {
        setAddress(product.address);
      }
    };

    if (product) {
      fetchAddress();
    }
    return () => { isMounted = false; };
  }, [product]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await get(
          `${Api.getProductDetails}?productId=${productId}`,
        );

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

  const handleChat = () => {
    Toast.show({
      type: "success",
      text1: "Chat",
      text2: "Chat feature coming soon",
    });
  };

  // Measure section positions using onLayout
  const handleDescriptionLayout = (event: any) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions(prev => ({ ...prev, description: y }));
  };

  const handleDetailsLayout = (event: any) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions(prev => ({ ...prev, details: y }));
  };

  const handleLocationLayout = (event: any) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions(prev => ({ ...prev, location: y }));
  };

  // Handle scroll to detect active section
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrolling) return;

    const scrollY = event.nativeEvent.contentOffset.y;
    // Offset accounts for the image carousel + main info block + sticky tab bar
    // sectionPositions.location etc. from onLayout are relative to content start
    const threshold = 100; // Point where tab switches

    if (sectionPositions.location > 0 && scrollY >= sectionPositions.location - threshold) {
      if (activeTab !== 'location') setActiveTab('location');
    } else if (sectionPositions.details > 0 && scrollY >= sectionPositions.details - threshold) {
      if (activeTab !== 'details') setActiveTab('details');
    } else if (sectionPositions.description > 0) {
      if (activeTab !== 'description') setActiveTab('description');
    }
  };


  // Scroll to section when tab is pressed
  const scrollToSection = (section: 'description' | 'details' | 'location') => {
    const position = sectionPositions[section];
    if (position > 0) {
      setIsScrolling(true);
      setActiveTab(section);

      // Scroll to position minus sticky tab bar offset
      mainScrollRef.current?.scrollTo({
        y: position - 75,
        animated: true,
      });

      // Reset scrolling flag after animation
      setTimeout(() => setIsScrolling(false), 600);
    }
  };


  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg_primary">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-2 text-base text-text_secondary">
            Loading product details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-bg_primary">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold mb-4 text-text_primary">
            Product not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="px-6 py-3 rounded-xl bg-primary"
          >
            <Text className="text-base font-semibold text-text_white">
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentImage =
    imageUrls?.length > 0
      ? imageUrls[currentImageIndex]
      : product.images?.[0] &&
        (product.images[0].startsWith("http://") ||
          product.images[0].startsWith("https://"))
        ? product.images[0]
        : null;

  const description = product.enhancedDescription || product.description || "";
  const displayDescription = showFullDescription
    ? description
    : description.substring(0, 150);
  const hasMoreDescription = description.length > 150;

  const specs = product.specs || {};
  const specsEntries = Object.entries(specs);
  const initialLimit = 3; // Show only 3 specs initially
  const hasMoreSpecs = specsEntries.length > initialLimit;
  const displayedSpecs = showAllDetails
    ? specsEntries
    : specsEntries.slice(0, initialLimit);

  // Extract features/verification badges from product data
  const features =
    product.features || product.verificationBadges || product.badges || [];
  const featuresArray = Array.isArray(features) ? features : [];

  // Extract basic specs from product or specs object
  const getSpecValue = (key: string, fallback?: string) => {
    if (specs[key] && typeof specs[key] === "object" && "value" in specs[key]) {
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

  // Get icon name for spec type
  const getSpecIcon = (specKey: string): { name: keyof typeof Ionicons.glyphMap; type: 'ionicons' } => {
    const key = specKey.toLowerCase();
    if (key.includes('shape') || key.includes('form')) {
      return { name: 'shapes-outline', type: 'ionicons' };
    }
    if (key.includes('material') || key.includes('fabric') || key.includes('texture')) {
      return { name: 'cube-outline', type: 'ionicons' };
    }
    if (key.includes('type') || key.includes('decor') || key.includes('category') || key.includes('style')) {
      return { name: 'grid-outline', type: 'ionicons' };
    }
    if (key.includes('placement') || key.includes('location') || key.includes('position') || key.includes('mount')) {
      return { name: 'location-outline', type: 'ionicons' };
    }
    if (key.includes('handcrafted') || key.includes('handmade') || key.includes('craft')) {
      return { name: 'hand-left-outline', type: 'ionicons' };
    }
    if (key.includes('capacity') || key.includes('seats') || key.includes('people')) {
      return { name: 'people-outline', type: 'ionicons' };
    }
    if (key.includes('engine') || key.includes('power') || key.includes('engineout') || key.includes('hp')) {
      return { name: 'construct-outline', type: 'ionicons' };
    }
    if (key.includes('speed') || key.includes('max') || key.includes('km/h')) {
      return { name: 'speedometer-outline', type: 'ionicons' };
    }
    if (key.includes('color') || key.includes('colour')) {
      return { name: 'color-palette-outline', type: 'ionicons' };
    }
    if (key.includes('size') || key.includes('dimension')) {
      return { name: 'resize-outline', type: 'ionicons' };
    }
    if (key.includes('weight')) {
      return { name: 'scale-outline', type: 'ionicons' };
    }
    if (key.includes('brand') || key.includes('manufacturer')) {
      return { name: 'business-outline', type: 'ionicons' };
    }
    if (key.includes('year') || key.includes('model')) {
      return { name: 'calendar-outline', type: 'ionicons' };
    }
    if (key.includes('mileage') || key.includes('km')) {
      return { name: 'speedometer-outline', type: 'ionicons' };
    }
    if (key.includes('fuel') || key.includes('gas')) {
      return { name: 'car-outline', type: 'ionicons' };
    }
    // Default icon
    return { name: 'information-circle-outline', type: 'ionicons' };
  };

  const year =
    getSpecValue("year") ||
    getSpecValue("modelYear") ||
    getSpecValue("model_year");
  const mileage =
    getSpecValue("mileage") || getSpecValue("odometer") || getSpecValue("km");
  const fuelType =
    getSpecValue("fuelType") ||
    getSpecValue("fuel") ||
    getSpecValue("fuel_type");

  const currency = product.currency || "AED";
  const originalPrice = parseFloat(product.price) || 0;
  const finalPrice =
    product.finalPrice != null && parseFloat(product.finalPrice) > 0
      ? parseFloat(product.finalPrice)
      : originalPrice > 0
        ? originalPrice
        : 0;
  const hasDiscount =
    originalPrice > 0 && finalPrice > 0 && originalPrice > finalPrice;

  return (
    <SafeAreaView
      className="flex-1 bg-bg_primary"
      edges={["top"]}
    >
      <ScrollView
        ref={mainScrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 85 }}

        onScroll={handleScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={[3]}
      >
        <View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-4 pt-2 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/90 shadow-md"
            style={{ elevation: 4 }}
          >
            <Ionicons name="arrow-back" size={ICON.lg} color={colors.text_primary} />
          </Pressable>
          <Pressable
            onPress={handleShare}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/95 shadow-lg"
            style={{
              elevation: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            }}
          >
            <Ionicons
              name="share-social"
              size={ICON.lg}
              color={colors.primary}
            />
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
                showsHorizontalScrollIndicator={true}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                  );
                  setCurrentImageIndex(index);
                }}
                onScroll={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                  );
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
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

              {/* Scroll Progress Bar */}
              {imageUrls.length > 1 && (
                <View className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                  <View
                    className="h-full bg-white"
                    style={{
                      width: `${(scrollProgress * 100) || ((currentImageIndex + 1) / imageUrls.length * 100)}%`,
                    }}
                  />
                </View>
              )}

              {/* Pagination Dots */}
              {imageUrls.length > 1 && (
                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                  {imageUrls.map((_, index) => (
                    <View
                      key={index}
                      className={`rounded-full h-2 mx-0.5 ${index === currentImageIndex ? "w-6 bg-text_white" : "w-2 bg-white/50"}`}
                    />
                  ))}
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
              className="items-center justify-center bg-bg_secondary"
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
            >
              <Ionicons
                name="image-outline"
                size={ICON.xl}
                color={colors.text_tertiary}
              />
              <Text className="mt-4 text-base text-text_tertiary">
                No image available
              </Text>
            </View>
          )}
        </View>

        <View className="bg-bg_white rounded-t-3xl -mt-8 px-6 pt-4 pb-3">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-2xl font-bold text-text_primary">
              {finalPrice > 0
                ? `${currency} ${finalPrice.toLocaleString()}`
                : "Price on request"}
            </Text>
          </View>

          <Text className="text-md font-bold mb-4 text-text_primary">
            {product.title || "Untitled Product"}
          </Text>

          {/* Basic Specs Row */}
          {(year || mileage || fuelType) && (
            <View className="flex-row items-center gap-3 mb-3">
              {year && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="time-outline"
                    size={ICON.md}
                    color={colors.text_tertiary}
                  />
                  <Text className="text-sm ml-1 text-text_tertiary">
                    {year} model
                  </Text>
                </View>
              )}
              {mileage && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="speedometer-outline"
                    size={ICON.md}
                    color={colors.text_tertiary}
                  />
                  <Text className="text-sm ml-1 text-text_tertiary">
                    {mileage} {mileage.toString().includes("km") ? "" : "km"}
                  </Text>
                </View>
              )}
              {fuelType && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="car-outline"
                    size={ICON.md}
                    color={colors.text_tertiary}
                  />
                  <Text className="text-sm ml-1 text-text_tertiary">
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
                const featureName =
                  typeof feature === "string"
                    ? feature
                    : feature.name || feature.label || feature.title;
                if (!featureName) return null;
                return (
                  <View
                    key={index}
                    className="px-3 py-1 rounded-full flex-row items-center bg-success"
                  >
                    <Ionicons name="checkmark" size={ICON.sm} color={colors.text_white} />
                    <Text className="text-xs font-semibold ml-1 text-text_white">
                      {featureName}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Disclaimer */}
          <View className="flex-row items-start mb-2">
            <Ionicons
              name="alert-circle"
              size={ICON.md}
              color={colors.error}
              style={{ marginTop: 2 }}
            />
            <Text className="text-xs ml-2 flex-1 text-text_tertiary">
              This info is provided by the seller and is not verified by
              Dubeyoo.
            </Text>
          </View>
        </View>

        {/* Tab Bar - Sticky */}
        <View
          className="bg-bg_white border-b border-border_primary shadow-sm"
          style={{
            elevation: 4,
          }}
        >
          <View className="px-4 pt-4">
            <View className="flex-row justify-around items-center">
              <Pressable
                onPress={() => scrollToSection('description')}
                className="flex-1 items-center pb-3"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text
                  className={`text-base font-bold ${activeTab === 'description' ? 'text-primary' : 'text-text_tertiary'
                    }`}
                >
                  Description
                </Text>
                {activeTab === 'description' && (
                  <View className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full" style={{ width: '50%' }} />
                )}
              </Pressable>
              <Pressable
                onPress={() => scrollToSection('details')}
                className="flex-1 items-center pb-3"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text
                  className={`text-base font-bold ${activeTab === 'details' ? 'text-primary' : 'text-text_tertiary'
                    }`}
                >
                  Details
                </Text>
                {activeTab === 'details' && (
                  <View className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full" style={{ width: '50%' }} />
                )}
              </Pressable>
              <Pressable
                onPress={() => scrollToSection('location')}
                className="flex-1 items-center pb-3"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text
                  className={`text-base font-bold ${activeTab === 'location' ? 'text-primary' : 'text-text_tertiary'
                    }`}
                >
                  Location
                </Text>
                {activeTab === 'location' && (
                  <View className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full" style={{ width: '50%' }} />
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View
          ref={descriptionRef}
          onLayout={handleDescriptionLayout}
          className="px-4 py-4 bg-bg_white"
        >
          {description ? (
            <>
              <Text className="text-lg font-bold mb-2 text-text_primary">
                Description
              </Text>
              <Text className="text-base leading-6 text-text_primary">
                {displayDescription}
                {hasMoreDescription && (
                  <Text
                    onPress={() => setShowFullDescription(!showFullDescription)}
                    className="font-bold text-bg_black"
                  >
                    {showFullDescription ? " Read less" : " Read more"}
                  </Text>
                )}
              </Text>
            </>
          ) : (
            <View className="py-4">
              <Text className="text-base text-text_tertiary text-center">
                No description
              </Text>
            </View>
          )}
        </View>

        {/* Details Section */}
        {specsEntries.length > 0 && (
          <View
            ref={detailsRef}
            onLayout={handleDetailsLayout}
            className="px-4 py-4 bg-bg_white"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-text_primary">
                Details
              </Text>
              {hasMoreSpecs && (
                <Pressable onPress={() => setShowAllDetails(!showAllDetails)}>
                  <Text className="text-md font-bold text-bg_black">
                    {showAllDetails ? "Less" : "More"}
                  </Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              {displayedSpecs.map(([key, value]) => {
                const specValue =
                  value && typeof value === "object" && "value" in value
                    ? (value as any).value
                    : value;
                const displayKey =
                  value && typeof value === "object" && "label" in value
                    ? (value as any).label
                    : key;
                const displayValue =
                  specValue !== null && specValue !== undefined
                    ? String(specValue)
                    : "";

                // Get icon for this spec (use both key and displayKey for better matching)
                const iconInfo = getSpecIcon(displayKey || key);

                return (
                  <View
                    key={key}
                    className="bg-bg_white rounded-xl p-3 items-center"
                    style={{
                      width: '30%',
                      minHeight: 100,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    {/* Icon Circle */}
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: '#E6F7FA' }}
                    >
                      <Ionicons
                        name={iconInfo.name}
                        size={ICON.md}
                        color={colors.text_primary}
                      />
                    </View>

                    {/* Spec Content */}
                    <View className="items-center">
                      <Text className="text-xs text-bg_black mb-1 text-center" numberOfLines={2} style={{ lineHeight: 14 }}>
                        {displayKey}
                      </Text>
                      <Text className="text-sm font-bold text-bg_black text-center" numberOfLines={2} style={{ lineHeight: 18 }}>
                        {displayValue}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}


        {/* Posted On Section */}
        {product.createdAt && (
          <View className="bg-bg_white mx-4 mt-3 rounded-2xl p-4">
            <Text className="text-sm text-text_tertiary">
              Posted on{" "}
              {new Date(product.createdAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        )}

        {/* Location Section */}
        <View
          ref={locationRef}
          onLayout={handleLocationLayout}
          className="bg-bg_white mx-4 mt-3 rounded-2xl p-4"
        >
          <Text className="text-lg font-bold mb-2 text-text_primary">
            Location
          </Text>
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-base flex-1 text-text_primary">
              {address || "P.O. Box 39613, Dubai, UAE Emirates"}
            </Text>
            <Pressable>
              {/* <Text className="text-sm font-semibold text-primary">
                Edit
              </Text> */}
            </Pressable>
          </View>
          {(Platform.OS === 'ios' || Platform.OS === 'android') && product?.location?.coordinates && product.location.coordinates.length === 2 && (


            <View className="bg-border_secondary rounded-2xl overflow-hidden min-h-[220px] mt-2 border border-border_primary">
              <FreeMapView
                latitude={product.location.coordinates[1]}
                longitude={product.location.coordinates[0]}
                title={product.title}
                address={address}
              />
            </View>

          )}

          {(!product?.location?.coordinates || product.location.coordinates.length !== 2) && (
            <View className="bg-border_secondary rounded-lg overflow-hidden min-h-[200px] mt-2">
              <View className="items-center justify-center min-h-[200px]">
                <Ionicons
                  name="map-outline"
                  size={ICON.xl}
                  color={colors.text_tertiary}
                />
                <Text className="mt-4 text-base font-semibold text-text_primary">
                  Location not available
                </Text>
              </View>
            </View>
          )}

        </View>

        <View className="mx-4 mt-3 mb-2">

          <Pressable className="w-full py-3 rounded-xl items-center bg-bg_black">
            <Text className="text-base font-semibold text-text_white">
              Report ad
            </Text>
          </Pressable>
        </View>


      </ScrollView>

      {product?.seller && (
        <View className="absolute bottom-0 left-0 right-0 flex-row items-center px-4 py-3 bg-bg_white border-t border-border_primary">
          <View className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-border_secondary">
            {product.seller.profilePic ? (
              <Image
                source={{ uri: product.seller.profilePic }}
                style={{ width: 48, height: 48 }}
                contentFit="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons
                  name="person"
                  size={ICON.lg}
                  color={colors.text_tertiary}
                />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-text_primary">
              {product.seller.name || "Seller"}
            </Text>
            <Text className="text-sm text-text_tertiary">
              Seller ⭐ 4.4
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={handleCall}
              className="w-12 h-12 rounded-full items-center justify-center bg-primary"
            >
              <Ionicons name="call" size={ICON.lg} color={colors.text_white} />
            </Pressable>
            <Pressable
              onPress={handleChat}
              className="w-12 h-12 rounded-full items-center justify-center bg-border_secondary"
            >
              <Ionicons
                name="chatbubble-outline"
                size={ICON.lg}
                color={colors.text_primary}
              />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ProductDetailScreen;