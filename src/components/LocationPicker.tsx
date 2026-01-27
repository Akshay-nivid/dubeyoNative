import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "@/theme";

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

  const handleUseCurrentLocation = async () => {
    setUsingCurrent(true);
    try {
      await onUseCurrentLocation();
      onClose();
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
        onClose();
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
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-3xl max-h-[80%]"
          style={{ backgroundColor: colors.bg_white }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="py-4 px-6 border-b flex-row justify-between items-center" style={{ borderColor: colors.border_primary }}>
            <Pressable onPress={onClose}>
              <Text className="text-base" style={{ color: colors.primary }}>
                Cancel
              </Text>
            </Pressable>
            <Text
              className="text-lg font-semibold"
              style={{ color: colors.text_primary }}
            >
              Select Location
            </Text>
            <View className="w-16" />
          </View>

          <ScrollView className="px-6 py-4">
            {/* Current Location */}
            <View className="mb-6">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.text_secondary }}
              >
                Current Location
              </Text>
              <View
                className="p-4 rounded-lg flex-row items-center justify-between"
                style={{ backgroundColor: colors.bg_secondary }}
              >
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Ionicons
                      name="location-sharp"
                      size={18}
                      color={colors.icon_primary}
                    />
                    <Text
                      className="ml-2 text-base font-medium"
                      style={{ color: colors.text_primary }}
                    >
                      {currentLocation.place}
                    </Text>
                  </View>
                  <Text
                    className="text-xs ml-6"
                    style={{ color: colors.text_secondary }}
                  >
                    {currentLocation.coordinates.lat.toFixed(4)},{" "}
                    {currentLocation.coordinates.lon.toFixed(4)}
                  </Text>
                </View>
                <Pressable
                  onPress={handleUseCurrentLocation}
                  disabled={usingCurrent}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: usingCurrent
                      ? colors.bg_gray_400
                      : colors.primary,
                  }}
                >
                  {usingCurrent ? (
                    <ActivityIndicator size="small" color={colors.text_white} />
                  ) : (
                    <Text
                      className="text-sm font-medium"
                      style={{ color: colors.text_white }}
                    >
                      Use Current
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Manual Input */}
            <View>
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.text_secondary }}
              >
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
                  className="px-4 py-3 rounded-lg border"
                  style={{
                    backgroundColor: colors.bg_white,
                    borderColor: error ? colors.error : colors.border_primary,
                    color: colors.text_primary,
                  }}
                  placeholderTextColor={colors.text_tertiary}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {error && (
                  <Text
                    className="text-xs mt-1"
                    style={{ color: colors.error }}
                  >
                    {error}
                  </Text>
                )}
                <Text
                  className="text-xs mt-1"
                  style={{ color: colors.text_tertiary }}
                >
                  Enter city name, city and state, or full address
                </Text>
              </View>

              <Pressable
                onPress={handleManualInput}
                disabled={loading || !locationName.trim()}
                className="py-3 rounded-lg items-center"
                style={{
                  backgroundColor:
                    loading || !locationName.trim()
                      ? colors.bg_gray_400
                      : colors.primary,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.text_white} />
                ) : (
                  <Text
                    className="text-base font-medium"
                    style={{ color: colors.text_white }}
                  >
                    Set Location
                  </Text>
                )}
              </Pressable>
            </View>

            <View className="h-6" />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
