import { colors } from "@/theme";
import { Ionicons, Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
} from "react-native";
import MapView, { Marker, Region, Circle } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { get } from "../services/api";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  currentLocation: {
    coordinates: { lat: number; lon: number };
    place: string;
  };
  onSelectLocation: (location: {
    coordinates: { lat: number; lon: number };
    place: string;
  }) => void;
  onUseCurrentLocation: () => Promise<void>;
  getPlaceName: (lat: number, lon: number) => Promise<string>;
  getCoordinatesFromName: (
    locationName: string,
  ) => Promise<{ lat: number; lon: number; place: string } | null>;
}

export default function LocationPicker({
  visible,
  onClose,
  currentLocation,
  onSelectLocation,
  onUseCurrentLocation,
  getPlaceName,
  getCoordinatesFromName,
}: LocationPickerProps) {
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [usingCurrent, setUsingCurrent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [region, setRegion] = useState<Region>({
    latitude: currentLocation.coordinates.lat || 12.9716,
    longitude: currentLocation.coordinates.lon || 77.5946,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [selectedAddress, setSelectedAddress] = useState(currentLocation.place);
  const mapRef = useRef<MapView>(null);
  const isInitialMount = useRef(true);
  const [nearbyProducts, setNearbyProducts] = useState<any[]>([]);
  const [isMoving, setIsMoving] = useState(false);


  // Animation values
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const triggerClose = () => {
    opacity.value = withTiming(0, { duration: 250 }, () => {
      runOnJS(onClose)();
    });
  };

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = 0;
    }
  }, [visible]);

  const fetchNearbyProducts = async (lat: number, lon: number) => {
    try {
      const response = await get("/product/nearest", {
        params: { latitude: lat, longitude: lon, limit: 15 },
      });
      if (response.data && Array.isArray(response.data)) {
        setNearbyProducts(response.data);
      }
    } catch (err) {
      console.log("Error fetching nearby products:", err);
    }
  };

  // Sync region when currentLocation changes (e.g. from parent)
  useEffect(() => {
    if (visible) {
      const newRegion = {
        latitude: currentLocation.coordinates.lat,
        longitude: currentLocation.coordinates.lon,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
      setSelectedAddress(currentLocation.place);
      mapRef.current?.animateToRegion(newRegion, 1000);
      fetchNearbyProducts(newRegion.latitude, newRegion.longitude);
    }
  }, [visible, currentLocation.coordinates.lat, currentLocation.coordinates.lon]);

  const handleRegionChangeComplete = async (newRegion: Region) => {
    setRegion(newRegion);
    try {
      const name = await getPlaceName(newRegion.latitude, newRegion.longitude);
      setSelectedAddress(name);
    } catch (err) {
      console.error("Error fetching place name:", err);
    }
  };

  const handleUseCurrentLocation = async () => {
    setUsingCurrent(true);
    try {
      await onUseCurrentLocation();
      // The parent will update currentLocation, which triggers the useEffect above
    } catch (error) {
      console.error("Error using current location:", error);
    } finally {
      setUsingCurrent(false);
    }
  };

  const handleManualSearch = async () => {
    if (!locationName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getCoordinatesFromName(locationName.trim());
      if (result) {
        const newRegion = {
          latitude: result.lat,
          longitude: result.lon,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        mapRef.current?.animateToRegion(newRegion, 1000);
        setSelectedAddress(result.place);
        fetchNearbyProducts(result.lat, result.lon);
        setLocationName("");
      } else {
        setError("Location not found.");
      }
    } catch (err) {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSelection = () => {
    onSelectLocation({
      coordinates: { lat: region.latitude, lon: region.longitude },
      place: selectedAddress,
    });
    triggerClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      onRequestClose={triggerClose}
      statusBarTranslucent={true}
      transparent={true}
    >
      <Animated.View style={[{ flex: 1, backgroundColor: "white" }, animatedStyle]}>
        {/* Full Screen Map Container */}
        <View style={StyleSheet.absoluteFillObject}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={region}
            onRegionChange={() => setIsMoving(true)}
            onRegionChangeComplete={(newRegion) => {
              setIsMoving(false);
              handleRegionChangeComplete(newRegion);
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
          >
            {nearbyProducts.map((product) => (
              <Marker
                key={product.id}
                coordinate={{
                  latitude: product.latitude || product.location?.coordinates[1],
                  longitude: product.longitude || product.location?.coordinates[0],
                }}
                tracksViewChanges={false}
              >
                <View className="items-center justify-center">
                  <View className="w-6 h-6 bg-blue-500/20 rounded-full items-center justify-center shadow-sm">
                    <View className="w-2.5 h-2.5 bg-blue-500 rounded-full border-1.5 border-white shadow-md" />
                  </View>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Minimal Focal Point with Hint Label */}
          <View
            pointerEvents="box-none"
            style={styles.markerFixed}
            className="items-center justify-center"
          >
            {/* "Select the location" Hint Label - Premium Pill Design */}
            {!isMoving && (
              <Pressable 
                onPress={handleConfirmSelection}
                className="absolute bottom-12 items-center z-20 w-[160px] left-[-56px] active:opacity-70"
              >
                <View className="bg-black/95 px-4 py-2 rounded-full shadow-2xl flex-row items-center border border-white/10 justify-center">
                  <Text className="text-white text-[11px] font-bold tracking-wide" numberOfLines={1}>
                    Select the location
                  </Text>
                </View>
                {/* Refined Pointer Arrow */}
                <View className="w-2 h-2 bg-black/95 rotate-45 -mt-1 border-r border-b border-white/5" />
              </Pressable>
            )}

            <View className="w-8 h-8 rounded-full items-center justify-center">
              <View className="w-3 h-3 bg-[#1A1A1A] rounded-full border-2 border-white shadow-xl" />
              <View className="absolute w-6 h-6 border-[1.5px] border-[#1A1A1A]/30 rounded-full" />
            </View>
          </View>
        </View>

        {/* Floating Command-Bar Style Header */}
        <SafeAreaView edges={["top"]} className="absolute top-0 left-0 right-0 z-20">
          <View className="px-4 py-3 flex-row items-center">
            {/* Signature Floating Back Button - Corrected Size */}
            <Pressable
              onPress={triggerClose}
              className="w-14 h-14 bg-white rounded-full items-center justify-center mr-3 border border-gray-200 shadow-lg"
            >
              <Feather name="corner-up-left" size={24} color="black" />
            </Pressable>

            {/* Floating Search Input - Corrected Size & Perfect Symmetry */}
            <View className="flex-1 relative bg-white rounded-[28px] shadow-xl border border-gray-100 flex-row items-center px-4 h-14">
              <View className="mr-2.5">
                <Ionicons name="search" size={20} color="#9CA3AF" />
              </View>
              <TextInput
                value={locationName}
                onChangeText={(text) => {
                  setLocationName(text);
                  setError(null);
                }}
                placeholder="Search location..."
                className="flex-1 text-gray-900 font-medium text-[15px]"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleManualSearch}
              />
              {loading ? (
                <View className="ml-2">
                  <ActivityIndicator size="small" color="#1A1A1A" />
                </View>
              ) : locationName.trim() ? (
                <Pressable
                  onPress={() => setLocationName("")}
                  className="ml-2 w-6 h-6 rounded-full items-center justify-center bg-gray-100"
                >
                  <Ionicons name="close" size={14} color="#6B7280" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {error && (
            <View className="mx-4 mt-1 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100 self-start shadow-sm">
              <Text className="text-[10px] text-red-600 font-bold uppercase">{error}</Text>
            </View>
          )}
        </SafeAreaView>

        {/* Bottom Confirmation Sheet-Style Panel */}
        <View className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-[32px] shadow-2xl border-t border-gray-100 pt-3 pb-12 px-6">
          {/* Floating Current Location Button - Outside Top Right */}
          <Pressable
            onPress={handleUseCurrentLocation}
            disabled={usingCurrent}
            className="absolute -top-20 right-6 w-14 h-14 bg-[#3B82F6] rounded-full items-center justify-center shadow-xl border border-white/10 active:opacity-80"
          >
            {usingCurrent ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="locate" size={28} color="white" />
            )}
          </Pressable>

          {/* Drag Handle for Sheet Feel */}
          <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6" />

          {/* Highlighted Selection Summary Card */}
          <View className="flex-row items-center mb-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/30">
            <View className="w-11 h-11 bg-[#3B82F6] rounded-full items-center justify-center mr-3.5 shadow-sm">
              <Ionicons name="location" size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-gray-900 leading-tight" numberOfLines={2}>
                {selectedAddress || "Pinpointing location..."}
              </Text>
            </View>
            {/* Removed Current Location Icon for repositioning */}
          </View>

          {/* Primary Action Button - Modern & Non-Complex */}
          <Pressable
            onPress={handleConfirmSelection}
            className="h-14 bg-[#1A1A1A] rounded-[20px] items-center justify-center shadow-md active:opacity-90"
          >
            <Text className="text-white font-bold text-[17px]">Confirm Selection</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  markerFixed: {
    left: '50%',
    marginLeft: -24,
    marginTop: -48,
    position: 'absolute',
    top: '50%',
    zIndex: 15,
    width: 48,
    height: 48,
  },
});
