import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";


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
  getCoordinatesFromName: (locationName: string) => Promise<{ lat: number; lon: number; place: string } | null>;
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

  const panY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        return isVerticalSwipe && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
          const newOpacity = Math.max(0, 1 - (gestureState.dy / (Dimensions.get('window').height * 0.5)));
          fadeAnim.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          Animated.parallel([
            Animated.timing(panY, {
              toValue: Dimensions.get('window').height,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            })
          ]).start(onClose);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      // Opening Animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(Dimensions.get('window').height);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };


  const handleUseCurrentLocation = async () => {
    setUsingCurrent(true);
    try {
      await onUseCurrentLocation();
      handleClose();
    } catch (error) {
      console.error("Error using current location:", error);
    } finally {
      setUsingCurrent(false);
    }
  };

  const handleManualInput = async () => {
    if (!locationName.trim()) {
      setError("Please enter a location name");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getCoordinatesFromName(locationName.trim());
      if (result) {
        onSelectLocation({
          coordinates: { lat: result.lat, lon: result.lon },
          place: result.place,
        });
        setLocationName("");
        handleClose();
      } else {
        setError("Location not found. Please try a different location name.");
      }
    } catch (error) {
      console.error("Error getting coordinates from location name:", error);
      setError("Unable to find location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View
        className="flex-1 justify-end"
        style={{ zIndex: 10000 }}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: fadeAnim }
          ]}
        >
          <Pressable
            className="flex-1"
            onPress={handleClose}
          >
            <BlurView
              intensity={70}
              tint="dark"
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
            />
          </Pressable>
        </Animated.View>
        <Animated.View
          className="rounded-t-3xl max-h-[80%] bg-bg_white overflow-hidden"
          style={{
            transform: [
              { translateY: Animated.add(slideAnim, panY) },
              { scale: scaleAnim }
            ]
          }}
          {...panResponder.panHandlers}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="py-4 px-6 border-b border-border_primary flex-row justify-between items-center">
              <Pressable onPress={handleClose}>
                <Text className="text-base text-primary">Cancel</Text>
              </Pressable>

              <Text className="text-lg font-semibold text-text_primary">
                Select Location
              </Text>
              <View className="w-16" />
            </View>

            <ScrollView className="px-6 py-4">
              {/* Current Location */}
              <View className="mb-6">
                <Text className="text-sm font-medium mb-2 text-text_secondary">
                  Current Location
                </Text>
                <View className="p-4 rounded-lg flex-row items-center justify-between bg-bg_secondary">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Ionicons
                        name="location-sharp"
                        size={18}
                        color={colors.icon_primary}
                      />
                      <Text className="ml-2 text-base font-medium text-text_primary">
                        {currentLocation.place}
                      </Text>
                    </View>
                    <Text className="text-xs ml-6 text-text_secondary">
                      {currentLocation.coordinates.lat.toFixed(4)},{" "}
                      {currentLocation.coordinates.lon.toFixed(4)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleUseCurrentLocation}
                    disabled={usingCurrent}
                    className={`px-4 py-2 rounded-lg ${usingCurrent ? "bg-bg_gray_400" : "bg-primary"}`}
                  >
                    {usingCurrent ? (
                      <ActivityIndicator size="small" color={colors.text_white} />
                    ) : (
                      <Text className="text-sm font-medium text-text_white">
                        Use Current
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Manual Input */}
              <View>
                <Text className="text-sm font-medium mb-2 text-text_secondary">
                  Enter Location Name
                </Text>

                <View className="mb-3">
                  <TextInput
                    value={locationName}
                    onChangeText={(text) => {
                      setLocationName(text);
                      setError(null);
                    }}
                    placeholder="e.g., kannur, kerala"
                    className={`px-4 py-3 rounded-lg border bg-bg_white text-text_primary ${error ? "border-error" : "border-border_primary"}`}
                    placeholderTextColor={colors.text_tertiary}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  {error && (
                    <Text className="text-xs mt-1 text-error">
                      {error}
                    </Text>
                  )}
                  <Text className="text-xs mt-1 text-text_tertiary">
                    Enter city name, city and state, or full address
                  </Text>
                </View>

                <Pressable
                  onPress={handleManualInput}
                  disabled={loading || !locationName.trim()}
                  className={`py-3 rounded-lg items-center ${loading || !locationName.trim() ? "bg-bg_gray_400" : "bg-primary"
                    }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.text_white} />
                  ) : (
                    <Text className="text-base font-medium text-text_white">
                      Set Location
                    </Text>
                  )}
                </Pressable>
              </View>

              <View className="h-6" />
            </ScrollView>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
