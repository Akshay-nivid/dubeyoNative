import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, Platform, RefreshControl, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Defs, RadialGradient, Rect, Stop, Svg } from "react-native-svg";
import BottomNavigationBar from "@/src/components/BottomNavigationBar";
import LocationPicker from "@/src/components/LocationPicker";
import CategoryList from "./CategoryList";
import ClassifiedShowCard from "./ClassifiedShowCard";
import Header from "./Header";
import ProductSection from "./ProductSection";
import SearchBar from "./SearchBar";
import { useHomeData } from "./useHomeData";
const HomeScreen = () => {
  const router = useRouter();
  const {
    loading,
    place,
    profile,
    userName,
    signedImages,
    nearestProducts,
    trendingProducts,
    suggestedProducts,
    newAdsProducts,
    categoriesToRender,
    refresh,
    locationPickerProps,
  } = useHomeData();
  const [category, setCategory] = useState<any>(null);
  const [subcategoriesOpen, setSubcategoriesOpen] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  return (
    <>
      {/* Full Screen Gradient Background */}
      <Svg height="30%" width="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Defs>
          <RadialGradient
            id="grad1"
            cx="0%"
            cy="20%"
            rx="50%"
            ry="50%"
            fx="0%"
            fy="20%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            id="grad2"
            cx="100%"
            cy="20%"
            rx="50%"
            ry="50%"
            fx="100%"
            fy="20%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="#fff" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
      </Svg>
      <SafeAreaView className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        {/* Scrollable Content with Sticky Search */}
        <Animated.ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          stickyHeaderIndices={[1]} // Sticky Search Bar
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false } // layout properties might need false, but opacity works with true. Safe mode false for now.
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
        >
          {/* Header - Transparent Background to show Gradient */}
          <View style={{ paddingTop: Platform.OS === 'android' ? 2 : 0 }}>
            <Header
              place={place}
              profile={profile}
              userName={userName}
              onLocationPress={() => setLocationPickerVisible(true)}
            />
          </View>
          {/* Sticky Search Bar - Dynamic Glassmorphism */}
          <View style={{ paddingBottom: 2, marginTop: -13 }}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { opacity: headerOpacity, backgroundColor: 'rgba(255,255,255,0.95)' }
              ]}
            />
            <SearchBar />
          </View>
          {/* Content Sheet - Starts below search, scrolls under */}
          <View className="flex-1 rounded-t-[20px] overflow-hidden min-h-screen" style={{ backgroundColor: '#FAF1F8' }}>
            <View style={{ paddingTop: 20 }}>
              <CategoryList
                categories={categoriesToRender}
                onSelect={(cat) => {
                  setCategory(cat);
                  setSubcategoriesOpen(true);
                }}
                onSeeAll={() => router.push("/all-categories" as any)}
              />
              <ProductSection
                title="Popular near you"
                products={nearestProducts.length ? nearestProducts : trendingProducts}
                images={
                  nearestProducts.length
                    ? signedImages.nearest
                    : signedImages.trending
                }
              />
              <ProductSection
                title="Suggested Items"
                products={suggestedProducts}
                images={signedImages.suggested}
              />
              <ProductSection
                title="New Ads"
                products={newAdsProducts}
                images={signedImages.newads}
              />
              <View className="h-40" />
            </View>
          </View>
        </Animated.ScrollView>
        <BottomNavigationBar />
        <ClassifiedShowCard
          open={subcategoriesOpen}
          category={category}
          onClose={() => setSubcategoriesOpen(false)}
        />
        {locationPickerProps && (
          <LocationPicker
            visible={locationPickerVisible}
            onClose={() => setLocationPickerVisible(false)}
            currentLocation={locationPickerProps.currentLocation}
            onSelectLocation={locationPickerProps.onSelectLocation}
            onUseCurrentLocation={locationPickerProps.onUseCurrentLocation}
            getPlaceName={locationPickerProps.getPlaceName}
            getCoordinatesFromName={locationPickerProps.getCoordinatesFromName}
          />
        )}
      </SafeAreaView>
    </>
  );
};
export default HomeScreen;