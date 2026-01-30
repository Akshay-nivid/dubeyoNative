import { colors } from "@/theme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNavigationBar from "@/src/components/BottomNavigationBar";
import LocationPicker from "@/src/components/LocationPicker";
import CategoryList from "./CategoryList";
import ClassifiedShowCard from "./ClassifiedShowCard";
import Header from "./Header";
import PostAdButton from "./PostAdButton";
import ProductSection from "./ProductSection";
import SearchBar from "./SearchBar";
import { LinearGradient } from "expo-linear-gradient";

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

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.bg_primary }}
    >
      {/* <StatusBar barStyle="dark-content" backgroundColor={colors.bg_primary} /> */}
      <StatusBar barStyle="dark-content" backgroundColor="#108EAA" />
      {/* Linear Gradient at the top */}
      <LinearGradient
        colors={["#108EAA", "#f6f6f6"]}
        locations={[0, 1]}
        style={{ paddingTop: 0 }}
      >

      {/*Header handles profile navigation internally */}
      <Header
        place={place}
        profile={profile}
        userName={userName}
        onLocationPress={() => setLocationPickerVisible(true)}
      />
      <SearchBar />
      </LinearGradient>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.bg_primary }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* <SearchBar /> */}

        <CategoryList
          categories={categoriesToRender}
          onSelect={(cat) => {
            setCategory(cat);
            setSubcategoriesOpen(true);
          }}
          onSeeAll={() => router.push("/all-categories" as any)}
        />

        <PostAdButton onPress={() => router.push("/postAd" as any)} />

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

        <View className="h-32" />
      </ScrollView>

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
  );
};

export default HomeScreen;
