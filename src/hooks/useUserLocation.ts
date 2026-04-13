import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import Toast from "react-native-toast-message";

const LOCATION_STORAGE_KEY = "dubeyo_selected_location";

interface LocationData {
  coordinates: { lat: number; lon: number };
  place: string;
}

export const useUserLocation = () => {
  const [location, setLocation] = useState<LocationData>({
    coordinates: { lat: 0, lon: 0 },
    place: "Loading location...",
  });
  const [loading, setLoading] = useState(true);

  // Get place name from coordinates using reverse geocoding
  const getPlaceName = useCallback(
    async (lat: number, lon: number): Promise<string> => {
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lon,
        });
        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          // Format: specific, city, region (e.g., "melechovva, kannur, kerala")
          const specific = addr.name || addr.street || addr.district;
          const city = addr.city || addr.subregion;
          const region = addr.region;

          const parts = [specific, city, region].filter(
            (part): part is string => Boolean(part),
          );
          const uniqueParts = [...new Set(parts)];

          if (uniqueParts.length > 0) {
            return uniqueParts.join(", ").toLowerCase();
          }

          // Fallback: try other address components
          const fallbackParts = [
            addr.name,
            addr.street,
            addr.district,
            addr.subregion,
          ].filter((part): part is string => Boolean(part));

          if (fallbackParts.length > 0) {
            return fallbackParts[0];
          }
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
      }
      // Last resort: return coordinates as fallback
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    },
    [],
  );

  // Get coordinates from location name using forward geocoding
  const getCoordinatesFromName = useCallback(
    async (
      locationName: string,
    ): Promise<{ lat: number; lon: number; place: string } | null> => {
      try {
        const results = await Location.geocodeAsync(locationName);
        if (results && results.length > 0) {
          const result = results[0];
          const lat = result.latitude;
          const lon = result.longitude;
          // Get formatted place name from the coordinates
          const place = await getPlaceName(lat, lon);
          return {
            lat,
            lon,
            place,
          };
        }
      } catch (error) {
        console.error("Forward geocoding error:", error);
      }
      return null;
    },
    [getPlaceName],
  );

  // Get current live location
  const getCurrentLocation =
    useCallback(async (): Promise<LocationData | null> => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          Alert.alert(
            "Location Services Disabled",
            "Please turn on location services in your device settings to use this feature.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Settings",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("App-Prefs:root=Privacy&path=LOCATION");
                  } else {
                    Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
                  }
                },
              },
            ],
          );
          return null;
        }

        let { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
          const response = await Location.requestForegroundPermissionsAsync();
          status = response.status;
          canAskAgain = response.canAskAgain;
        }

        if (status !== "granted") {
          if (!canAskAgain) {
            Alert.alert(
              "Location Permission Denied",
              "You have permanently denied location permissions. Please enable them in app settings.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() },
              ],
            );
          } else {
            Toast.show({
              type: "error",
              text1: "Permission Denied",
              text2: "Location permission is required to find your current address.",
            });
          }
          return null;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const place = await getPlaceName(lat, lon);

        return {
          coordinates: { lat, lon },
          place,
        };
      } catch (error) {
        console.error("Location error:", error);
        Toast.show({
          type: "error",
          text1: "Location Error",
          text2: "Could not fetch your current location. Please check your signal.",
        });
        return null;
      }
    }, [getPlaceName]);

  // Load stored location or get current location
  const loadLocation = useCallback(async () => {
    setLoading(true);
    try {
      // Try to load stored location first
      let storedLocation: LocationData | null = null;
      try {
        const stored =
          Platform.OS === "web"
            ? localStorage.getItem(LOCATION_STORAGE_KEY)
            : await SecureStore.getItemAsync(LOCATION_STORAGE_KEY);

        if (stored) {
          storedLocation = JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error loading stored location:", error);
      }

      // If no stored location, get current location
      if (!storedLocation) {
        const currentLocation = await getCurrentLocation();
        if (currentLocation) {
          storedLocation = currentLocation;
        } else {
          // Fallback to default
          storedLocation = {
            coordinates: { lat: 25.2048, lon: 55.2708 }, // Dubai default
            place: "Dubai, UAE",
          };
        }
      } else {
        // If stored location exists but place name is missing or is coordinates, fetch it
        if (
          !storedLocation.place ||
          storedLocation.place.match(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/)
        ) {
          const placeName = await getPlaceName(
            storedLocation.coordinates.lat,
            storedLocation.coordinates.lon,
          );
          storedLocation.place = placeName;
          // Update stored location with place name
          const locationString = JSON.stringify(storedLocation);
          if (Platform.OS === "web") {
            localStorage.setItem(LOCATION_STORAGE_KEY, locationString);
          } else {
            await SecureStore.setItemAsync(
              LOCATION_STORAGE_KEY,
              locationString,
            );
          }
        }
      }

      setLocation(storedLocation);
    } catch (error) {
      console.error("Error loading location:", error);
      setLocation({
        coordinates: { lat: 25.2048, lon: 55.2708 },
        place: "Dubai, UAE",
      });
    } finally {
      setLoading(false);
    }
  }, [getCurrentLocation, getPlaceName]);

  // Update location (manual selection)
  const updateLocation = useCallback(
    async (newLocation: LocationData) => {
      try {
        // Ensure place name is set (if missing or is coordinates, fetch it)
        let locationToStore = { ...newLocation };
        if (
          !locationToStore.place ||
          locationToStore.place.match(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/)
        ) {
          const placeName = await getPlaceName(
            locationToStore.coordinates.lat,
            locationToStore.coordinates.lon,
          );
          locationToStore.place = placeName;
        }

        // Store the selected location
        const locationString = JSON.stringify(locationToStore);
        if (Platform.OS === "web") {
          localStorage.setItem(LOCATION_STORAGE_KEY, locationString);
        } else {
          await SecureStore.setItemAsync(LOCATION_STORAGE_KEY, locationString);
        }

        setLocation(locationToStore);
      } catch (error) {
        console.error("Error saving location:", error);
      }
    },
    [getPlaceName],
  );

  // Use current location
  const useCurrentLocation = useCallback(async () => {
    const currentLocation = await getCurrentLocation();
    if (currentLocation) {
      await updateLocation(currentLocation);
    }
  }, [getCurrentLocation, updateLocation]);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  return {
    ...location,
    loading,
    updateLocation,
    useCurrentLocation,
    getPlaceName,
    getCoordinatesFromName,
  };
};
