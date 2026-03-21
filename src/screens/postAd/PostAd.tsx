import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import GradientText from "../../components/GradientText";
import { useUserLocation } from "../../hooks/useUserLocation";
import { Api, fetchProfile } from "../../screens/home/Api";
import { get } from "../../services/api";
import { getToken } from "../../services/storage/tokenStorage";
import LocationPicker from "@/src/components/LocationPicker";

const PostAd = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const editProductId = params.edit;

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [imageError, setImageError] = useState("");
  const [editLoaded, setEditLoaded] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const {
    coordinates,
    place,
    updateLocation,
    useCurrentLocation,
    getPlaceName,
    getCoordinatesFromName,
  } = useUserLocation();
  const [userName, setUserName] = useState("User");

  // Keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        // Scroll to bottom to ensure description input is visible
        // The delay ensures the keyboard is fully up and layout is adjusted
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const checkGuest = async () => {
      const token = await getToken();
      // In RN, we usually define guest as not having a token
      // or having a specific flag in storage. Following the token check:
      if (!token) {
        router.replace("/login");
      } else {
        try {
          const res = await fetchProfile();
          const profileData = res?.data || {};
          // Extract user name just like in useHomeData
          const firstName =
            profileData?.firstName || profileData?.first_name || "";
          const lastName =
            profileData?.lastName || profileData?.last_name || "";

          const fullName =
            profileData?.name ||
            profileData?.fullName ||
            [firstName, lastName].filter(Boolean).join(" ") ||
            "User";

          if (fullName) {
            setUserName(fullName.split(" ")[0]); // Use first name
          }
        } catch (e) {
          console.log("Error fetching profile", e);
        }
      }
    };
    checkGuest();
  }, [router]);

  // Edit mode: load existing product and pre-fill
  useEffect(() => {
    if (!editProductId || editLoaded) return;
    const loadProductForEdit = async () => {
      try {
        const res = await get(
          `${Api.getProductDetails}?productId=${editProductId}`,
        );
        const product = res?.data?.data ?? res?.data ?? res;
        if (product) {
          const desc =
            product.description ??
            product.enhancedDescription ??
            product.descriptions ??
            "";
          setDescription(typeof desc === "string" ? desc : "");
          const imgs = product.images ?? product.image ?? [];
          const uris = Array.isArray(imgs)
            ? imgs
                .map((u: any) =>
                  typeof u === "string" ? u : (u?.url ?? u?.link ?? ""),
                )
                .filter(Boolean)
            : typeof imgs === "string"
              ? [imgs]
              : [];
          if (uris.length > 0) {
            setPhotos(
              uris.map(
                (uri: string) => ({ uri }) as ImagePicker.ImagePickerAsset,
              ),
            );
          }
        }
      } catch (e) {
        console.warn("Could not load product for edit", e);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Could not load ad for editing.",
        });
      } finally {
        setEditLoaded(true);
      }
    };
    loadProductForEdit();
  }, [editProductId, editLoaded]);

  const [isPickerActive, setIsPickerActive] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);

  // Animations
  const panY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height),
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        // Professional Feel: Capture immediately if touching the header/handle area
        return evt.nativeEvent.locationY < 100;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Otherwise, require a small drag threshold to distinguish from clicks
        const isVerticalSwipe =
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        return isVerticalSwipe && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
          const newOpacity = Math.max(
            0,
            1 - gestureState.dy / (Dimensions.get("window").height * 0.5),
          );
          fadeAnim.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          handleCloseModal();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (showPickerModal) {
      panY.setValue(0);
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
      // Reset values for next time (optional but good practice)
      fadeAnim.setValue(0);
      slideAnim.setValue(Dimensions.get("window").height);
      scaleAnim.setValue(0.9);
    }
  }, [showPickerModal]);

  const handleCloseModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPickerModal(false);
    });
  };

  const processPickedImages = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled) {
      const incoming = result.assets;
      const validFiles: ImagePicker.ImagePickerAsset[] = [];
      let rejectedCount = 0;

      const allowedExtensions = ["jpg", "jpeg", "png", "heic", "heif"];

      for (const file of incoming) {
        // Check extension
        const uri = file.uri;
        const extension = uri.split(".").pop()?.toLowerCase();

        if (!extension || !allowedExtensions.includes(extension)) {
          rejectedCount++;
          continue;
        }

        // Backend handles size validation, so we skip it here as requested.
        validFiles.push(file);
      }

      if (rejectedCount > 0) {
        Toast.show({
          type: "error",
          text1: "Invalid Format",
          text2: `${rejectedCount} image(s) were skipped (Only JPG, PNG, HEIC allowed)`,
        });
        setImageError(
          `${rejectedCount} image(s) skipped due to invalid format.`,
        );
      } else {
        setImageError("");
      }

      if (validFiles.length > 0) {
        setPhotos((prev) => {
          const newPhotos = [...prev, ...validFiles];
          if (newPhotos.length > 4) {
            Toast.show({
              type: "error",
              text1: "Limit Reached",
              text2: "Only first 4 images were added.",
            });
            return newPhotos.slice(0, 4);
          }
          return newPhotos;
        });
      }
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission",
        "Permission to access camera roll is required!",
      );
      return;
    }

    try {
      setIsPickerActive(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 4 - photos.length,
        quality: 1,
      });
      await processPickedImages(result);
    } catch (err) {
      console.error("Image picker error", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to pick images",
      });
    } finally {
      setIsPickerActive(false);
    }
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Permission to access camera is required!");
      return;
    }

    try {
      setIsPickerActive(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false, // Usually camera allows 1 at a time, but we can just add it
        quality: 1,
      });
      await processPickedImages(result);
    } catch (err) {
      console.error("Camera error", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to take photo",
      });
    } finally {
      setIsPickerActive(false);
    }
  };

  const pickImage = async () => {
    if (isPickerActive) return;

    if (photos.length >= 4) {
      Toast.show({
        type: "error",
        text1: "Limit Reached",
        text2: "You can upload up to 4 images only",
      });
      return;
    }

    setShowPickerModal(true);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (photos.length < 1 || !description.trim()) return;

    try {
      setLoading(true);

      // Pass local URIs directly to PostAdDetails
      const imageUris = photos.map((p) => p.uri);

      const nextParams: Record<string, string> = {
        description,
        images: JSON.stringify(imageUris),
      };
      if (editProductId) nextParams.edit = editProductId;
      router.push({
        pathname: "/postAdDetails",
        params: nextParams,
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderImagesSection = () => {
    return (
      <View className="mb-8">
        {photos.length === 0 ? (
          /* Empty State - Click to Upload */
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.7}
            className="bg-[#F0F4FF] border-2 border-dashed border-[#1e3a8a] rounded-2xl h-52 items-center justify-center"
          >
            <Ionicons
              name="add-circle-outline"
              size={32}
              color="#1e3a8a"
            />
            <Text className="text-[#1e3a8a] font-semibold text-lg mt-2">
              Upload Image
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Max 4 images. JPG, PNG, JPEG. Max 5MB.
            </Text>
          </TouchableOpacity>
        ) : (
          /* Filled State - Images Inside Box */
          <View className="bg-[#F0F4FF] border-2 border-dashed border-[#1e3a8a] rounded-2xl p-4 min-h-[160px]">
            <View className="flex-row flex-wrap gap-2">
              {photos.map((photo, index) => (
                <View
                  key={index}
                  className="w-[22%] aspect-square rounded-xl overflow-hidden relative border border-gray-100 bg-white"
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-100 rounded-md p-1 z-10 shadow-sm"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={14}
                      color="#EF4444"
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Button (if less than 4) */}
              {photos.length < 4 && (
                <TouchableOpacity
                  onPress={pickImage}
                  className="w-[22%] aspect-square rounded-xl border-2 border-dashed border-[#1e3a8a] items-center justify-center bg-white/50"
                >
                  <Ionicons
                    name="add"
                    size={24}
                    color="#1e3a8a"
                  />
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-gray-400 text-xs mt-4 text-center">
              Max 4 images. JPG, PNG, JPEG. Max 5MB.
            </Text>
          </View>
        )}

        {imageError ? (
          <Text className="text-red-500 text-xs mt-2">{imageError}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#f7e2fbff", "#d8ecf9ff", "#d7d1f3ff"]} // Very light Pink, Blue, Purple
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView
        className="flex-1 bg-transparent"
        edges={["top"]}
      >
        <View className="px-4 py-2 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100 mr-4"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#000"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowLocationPicker(true)}
              className="flex-1 justify-center"
            >
              <Text className="text-xl font-bold text-gray-900">Post ad</Text>
              <View className="flex-row items-center">
                <Ionicons
                  name="location-outline"
                  size={12}
                  color="#6B7280"
                />
                <Text
                  className="text-xs text-gray-500 font-medium ml-1"
                  numberOfLines={1}
                >
                  {place || "Select location"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={12}
                  color="#6366F1"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* New Gradient Header */}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0} // Small offset
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 pt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: keyboardVisible ? 24 : 0 }} // Only pad when keyboard is open
            keyboardShouldPersistTaps="handled" // Allow taps
            bounces={false} // Prevent bouncing when content fits
          >
            {/* New Gradient Header Moved Here */}
            <View className="px-5 mb-2 mt-10">
              <View className="items-center mb-4">
                <Image
                  source={require("@/assets/images/ai_modal_icon.png")}
                  style={{ width: 60, height: 60 }}
                  contentFit="contain"
                />
              </View>
              <View className="mb-2">
                {/* Full Gradient Line 1 */}
                <View style={{ height: 44, width: "100%" }}>
                  <GradientText
                    text={`Hi there, ${userName}`}
                    colors={["#14B8A6", "#3B82F6", "#8B5CF6"]} // Teal -> Blue -> Violet
                    style={{ fontSize: 36, fontWeight: "800" }}
                    textAnchor="middle"
                    x="50%"
                  />
                </View>
              </View>

              <View className="mb-1">
                {/* Full Gradient Line 2 */}
                <View style={{ height: 44, width: "100%" }}>
                  <GradientText
                    text="Sell with AI"
                    colors={["#14B8A6", "#3B82F6", "#8B5CF6"]} // Teal -> Blue -> Violet
                    style={{ fontSize: 36, fontWeight: "800" }}
                    textAnchor="middle"
                    x="50%"
                  />
                </View>
              </View>

              <Text className="text-gray-500 text-sm mt-3 font-medium leading-5 w-full text-center">
                Post ads effortlessly with our exclusive AI-powered AI
                experience
              </Text>
            </View>

            <View className="pb-8 mt-6">
              {renderImagesSection()}

              <View className="bg-white rounded-[22px] overflow-hidden border border-gray-200 shadow-sm">
                {/* Inner Shadow Effect */}
                <LinearGradient
                  colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0.3 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 20,
                    zIndex: 1,
                  }}
                  pointerEvents="none"
                />
                <View className="p-5">
                  <View className="flex-row">
                    {!description && (
                      <View className="mr-2 mt-1 z-10">
                        <Ionicons
                          name="sparkles"
                          size={18}
                          color="#9CA3AF"
                        />
                      </View>
                    )}
                    <TextInput
                      placeholder="Type the Description...."
                      className="flex-1 text-base text-gray-900 min-h-[80px] pt-0.5"
                      value={description}
                      onChangeText={setDescription}
                      placeholderTextColor="#9CA3AF"
                      multiline
                      textAlignVertical="top"
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  <View className="flex-row items-center justify-end mt-2 px-1">
                    {/* Waveform Icon */}

                    <TouchableOpacity
                      onPress={description.trim() ? handleContinue : () => {}}
                      disabled={loading}
                      className={`w-12 h-12 rounded-xl items-center justify-center ${description.trim() && photos.length === 0 ? "bg-gray-200" : "bg-black"}`}
                    >
                      {description.trim() ? (
                        <Ionicons
                          name="arrow-forward"
                          size={24}
                          color={
                            description.trim() && photos.length === 0
                              ? "#9CA3AF"
                              : "#FFF"
                          }
                        />
                      ) : (
                        /* Waveform Animation (Simulated) inside button */
                        <View className="flex-row items-center gap-[2px]">
                          <View className="w-[2px] h-2 bg-white rounded-full" />
                          <View className="w-[2px] h-3 bg-white rounded-full" />
                          <View className="w-[2px] h-4 bg-white rounded-full" />
                          <View className="w-[2px] h-3 bg-white rounded-full" />
                          <View className="w-[2px] h-2 bg-white rounded-full" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Custom Image Picker Modal */}
      <Modal
        transparent={true}
        visible={showPickerModal}
        animationType="none"
        onRequestClose={handleCloseModal}
        statusBarTranslucent={true}
      >
        <View
          className="flex-1 justify-end"
          style={{ zIndex: 10000 }}
        >
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
          >
            <TouchableOpacity
              className="flex-1"
              style={{ flex: 1 }}
              onPress={handleCloseModal}
              activeOpacity={1}
            >
              <BlurView
                intensity={70}
                tint="dark"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(0,0,0,0.3)" },
                ]}
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            className="rounded-t-[25px] w-full overflow-hidden bg-white pb-10"
            style={{
              maxHeight: "75%",
              zIndex: 10001,
              transform: [
                { translateY: Animated.add(slideAnim, panY) },
                { scale: scaleAnim },
              ],
            }}
            {...panResponder.panHandlers}
          >
            {/* Drag Handle */}
            <View className="pt-3 pb-2 items-center">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            <Text className="text-xl font-bold text-gray-900 text-center mb-8 mt-2">
              Upload Photo
            </Text>

            <View className="flex-row justify-around mb-8 px-4">
              {/* Camera Option */}
              <TouchableOpacity
                onPress={() => {
                  handleCloseModal();
                  setTimeout(pickImageFromCamera, 100);
                }}
                className="items-center"
                activeOpacity={0.7}
              >
                <View className="w-20 h-20 bg-blue-50 rounded-2xl items-center justify-center mb-3 border border-blue-100 shadow-sm">
                  <Ionicons
                    name="camera"
                    size={32}
                    color="#3B82F6"
                  />
                </View>
                <Text className="font-semibold text-gray-700 text-base">
                  Camera
                </Text>
              </TouchableOpacity>

              {/* Gallery Option */}
              <TouchableOpacity
                onPress={() => {
                  handleCloseModal();
                  setTimeout(pickImageFromLibrary, 100);
                }}
                className="items-center"
                activeOpacity={0.7}
              >
                <View className="w-20 h-20 bg-purple-50 rounded-2xl items-center justify-center mb-3 border border-purple-100 shadow-sm">
                  <Ionicons
                    name="images"
                    size={32}
                    color="#8B5CF6"
                  />
                </View>
                <Text className="font-semibold text-gray-700 text-base">
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        currentLocation={{ coordinates, place }}
        onSelectLocation={updateLocation}
        onUseCurrentLocation={useCurrentLocation}
        getPlaceName={getPlaceName}
        getCoordinatesFromName={getCoordinatesFromName}
      />
    </LinearGradient>
  );
};

export default PostAd;
