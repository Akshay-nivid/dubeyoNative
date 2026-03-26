import { Ionicons, Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Dimensions, Keyboard, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView, KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useUserLocation } from "../../hooks/useUserLocation";
import { Api, fetchProfile } from "../../screens/home/Api";
import { get } from "../../services/api";
import { getToken } from "../../services/storage/tokenStorage";
import LocationPicker from "@/src/components/LocationPicker";
import { API_BASE_URL } from "@/src/constants/env";

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
  type UploadStatus = "uploading" | "success" | "error";
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, { status: UploadStatus; key?: string; progress?: number }>>({});

  const uploadImage = async (uri: string) => {
    if (!uri.startsWith("file://") && !uri.startsWith("content://")) {
      setUploadStatuses(prev => ({ ...prev, [uri]: { status: "success", key: uri, progress: 100 } }));
      return;
    }

    setUploadStatuses(prev => ({ ...prev, [uri]: { status: "uploading", progress: 0 } }));
    try {
      const token = await getToken();
      const formData = new FormData();
      const fileName = uri.split("/").pop() || "image.jpg";
      let ext = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() || "jpg" : "jpg";
      if (!["jpg", "jpeg", "png", "webp", "heic"].includes(ext)) ext = "jpg";

      formData.append("image", {
        uri,
        name: fileName.includes(".") ? fileName : `${fileName}.jpg`,
        type: `image/${ext === "jpg" ? "jpeg" : ext}`,
      } as any);

      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            let progress = Math.round((event.loaded * 100) / event.total);
            if (progress > 100) progress = 100;
            setUploadStatuses(prev => ({ ...prev, [uri]: { status: "uploading", progress } }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              if (result?.data) {
                setUploadStatuses(prev => ({ ...prev, [uri]: { status: "success", key: result.data, progress: 100 } }));
                resolve();
              } else {
                reject(new Error("Upload response missing data"));
              }
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network Error")));
        xhr.open("POST", `${API_BASE_URL}/product/v1/image/upload`);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      }).catch((e) => {
        console.log("Image upload failed", e);
        setUploadStatuses(prev => ({ ...prev, [uri]: { status: "error", progress: 0 } }));
        Toast.show({ type: "error", text1: "Upload Failed", text2: "Could not upload image." });
      });
    } catch (e) {
      console.log("Image upload setup failed", e);
      setUploadStatuses(prev => ({ ...prev, [uri]: { status: "error", progress: 0 } }));
      Toast.show({ type: "error", text1: "Upload Failed", text2: "Could not upload image." });
    }
  };

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
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(
      showEvent,
      () => {
        setKeyboardVisible(true);
      },
    );

    const keyboardHideListener = Keyboard.addListener(
      hideEvent,
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
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
            const initialStatuses: Record<string, { status: UploadStatus; key?: string; progress?: number }> = {};
            uris.forEach((uri: string) => {
              initialStatuses[uri] = { status: "success", key: uri, progress: 100 };
            });
            setUploadStatuses(initialStatuses);
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

  // Animation values
  const scrollX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (photos.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [photos.length]);

  // Animations
  const panY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height),
  ).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(keyboardAnim, {
      toValue: keyboardVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [keyboardVisible]);

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
        const availableSlots = 4 - photos.length;
        if (availableSlots <= 0) {
          Toast.show({ type: "error", text1: "Limit Reached", text2: "Max 4 images." });
          return;
        }

        const keptFiles = validFiles.slice(0, availableSlots);
        if (validFiles.length > availableSlots) {
          Toast.show({
            type: "error",
            text1: "Limit Reached",
            text2: `Only ${availableSlots} out of ${validFiles.length} extra images were added.`,
          });
        }

        setPhotos((prev) => [...prev, ...keptFiles]);

        setTimeout(() => {
          keptFiles.forEach(file => uploadImage(file.uri));
        }, 0);
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

  const isAnyUploading = photos.some(p => uploadStatuses[p.uri]?.status === "uploading");
  const hasUploadError = photos.some(p => uploadStatuses[p.uri]?.status === "error");
  const isContinueDisabled = loading || isAnyUploading || hasUploadError || !description.trim() || photos.length < 1;

  const handleContinue = async () => {
    if (isContinueDisabled) return;

    try {
      setLoading(true);

      const imageUris = photos.map((p) => {
        const s = uploadStatuses[p.uri];
        if (s?.status === "success" && s.key) return s.key;
        return p.uri;
      });

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
    const totalSlots = 4;

    return (
      <View className="mb-6">
        <Animated.View
          className="mb-6 px-1"
          style={{
            opacity: keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ translateY: keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }]
          }}
        >
          <Text className="text-[34px] font-bold text-gray-900 leading-[40px]" style={{ fontFamily: "DM Serif Display" }}>
            Hi, {userName}
          </Text>
          <Text className="text-[42px] font-bold text-indigo-600 leading-[42px]" style={{ fontFamily: "DM Serif Display" }}>
            Sell with AI
          </Text>
          <View className="flex-row items-center justify-between mt-3 px-0.5">
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={14} color="#A1A1AA" />
              <Text className="text-[12px] text-gray-400 font-medium ml-1">At least 1 photo required. Max 4. (Max 5MB each)</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          className="flex-row flex-wrap justify-between mt-4"
          style={{
            opacity: keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ translateY: keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }]
          }}
        >
          {Array.from({ length: totalSlots }).map((_, index) => {
            const photo = photos[index];
            const isFilled = !!photo;

            if (isFilled) {
              const statusInfo = uploadStatuses[photo.uri];
              const isUploading = statusInfo?.status === "uploading";
              const isError = statusInfo?.status === "error";

              return (
                <View key={index} className="w-[48.5%] aspect-square mb-3">
                  <View className="w-full h-full rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                    <Image
                      source={{ uri: photo.uri }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={200}
                    />



                    {isUploading && (
                      <View className="absolute inset-0 bg-black/40 items-center justify-center">
                        <ActivityIndicator color="#FFF" size="small" />
                      </View>
                    )}

                    {isError && (
                      <View className="absolute inset-0 bg-red-500/20 items-center justify-center">
                        <Ionicons name="alert-circle" size={24} color="#EF4444" />
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            // Labels for placeholders
            const placeholders = [
              "Photo 1",
              "Photo 2",
              "Photo 3",
              "Photo 4",
            ];

            return (
              <TouchableOpacity
                key={index}
                onPress={pickImage}
                activeOpacity={0.7}
                className="w-[48.5%] aspect-square mb-3"
              >
                <View
                  className="w-full h-full rounded-[24px] bg-indigo-50/50 border-2 border-dashed border-indigo-100 items-center justify-center"
                >
                  <View className="w-10 h-10 rounded-full items-center justify-center mb-1 bg-indigo-50">
                    <Ionicons
                      name="camera-outline"
                      size={20}
                      color="#6366F1"
                    />
                  </View>
                  <Text className="text-[11px] font-bold text-indigo-400">
                    {placeholders[index]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {imageError ? (
          <Text className="text-red-500 text-[11px] mt-1 ml-1 font-medium">{imageError}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6F3' }}>
      {/* STATIC BACKGROUND LAYER */}
      <View style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 bg-[#F7F6F3]" edges={["top"]}>
          <Animated.View
            className="px-4 py-3 flex-row items-center justify-between z-10 bg-[#F7F6F3] border-b border-gray-200 shadow-lg"
            style={{
              opacity: keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [{ translateY: keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }]
            }}
          >
            <View className="flex-row items-center flex-1 pr-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 bg-white rounded-full items-center justify-center mr-4 border border-gray-200 shadow-sm"
              >
                <Feather name="corner-up-left" size={22} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowLocationPicker(true)}
                className="flex-1 justify-center"
              >
                <Text className="text-xl font-bold text-gray-900">Post ad</Text>
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={12} color="#6B7280" />
                  <Text className="text-xs text-gray-500 font-medium ml-1" numberOfLines={1}>
                    {place || "Select location"}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color="#6366F1" style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 pt-4 bg-[#F7F6F3]"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View>
              {renderImagesSection()}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* FULL SCREEN BLUR OVERLAY */}
      <Animated.View
        pointerEvents={keyboardVisible ? "auto" : "none"}
        style={[StyleSheet.absoluteFill, { opacity: keyboardAnim, zIndex: 50 }]}
      >
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => Keyboard.dismiss()}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
      </Animated.View>

      {/* AI COMMAND BAR */}
      <KeyboardStickyView
        offset={{ opened: 0, closed: 0 }}
        style={{ zIndex: 100 }}
      >
        <SafeAreaView edges={["bottom"]}>
          <View className="px-4 pb-4">
            <View 
              className="rounded-[28px] overflow-hidden border border-gray-200 shadow-lg bg-[#F7F6F3]"
            >
              <View className="flex-row items-center px-4 py-3 min-h-[80px]">
                {!description.trim() && (
                  <View className="items-center justify-center pl-1">
                    <Ionicons name="sparkles" size={18} color="#6366F1" />
                  </View>
                )}

                <TextInput
                  placeholder="Sell with AI"
                  className="flex-1 text-[16px] text-gray-900 mx-3 max-h-[120px]"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor="#A1A1AA"
                  multiline
                  textAlignVertical="center"
                  returnKeyType="done"
                  blurOnSubmit={false}
                />

                <TouchableOpacity
                  onPress={!isContinueDisabled ? handleContinue : undefined}
                  disabled={isContinueDisabled && !!description.trim()}
                  activeOpacity={0.8}
                  className={`w-11 h-11 rounded-full items-center justify-center mb-0.5 shadow-sm ${!description.trim() ? "bg-white" : (!isContinueDisabled ? "bg-indigo-600" : "bg-gray-100")
                    }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : description.trim() ? (
                    <Ionicons name="arrow-up" size={22} color={!isContinueDisabled ? "#FFF" : "#9CA3AF"} />
                  ) : (
                    <Ionicons name="mic-outline" size={20} color="#4B5563" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardStickyView>

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
    </View>
  );
};

export default PostAd;
