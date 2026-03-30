import { Ionicons, Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Dimensions, DimensionValue, Keyboard, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView, KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import AnimatedRE, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  interpolate,
  withTiming
} from "react-native-reanimated";
import { useUserLocation } from "../../hooks/useUserLocation";
import { Api, fetchProfile } from "../../screens/home/Api";
import { get } from "../../services/api";
import { getToken } from "../../services/storage/tokenStorage";
import * as ImageManipulator from "expo-image-manipulator";
import LocationPicker from "@/src/components/LocationPicker";
import { API_BASE_URL } from "@/src/constants/env";
import { GENERATION_STEPS, usePostAdAI, normalizeFieldKey } from "../../hooks/usePostAdAI";
import { usePostAdData } from "../../hooks/usePostAdData";
import EditableRow from "./components/EditableRow";
import { InlinePicker } from "./components/InlinePicker";
import PostAdSkeleton from "./components/PostAdSkeleton";

/** Shown when AI already filled category/subcategory — matches InlinePicker layout */
const ReadOnlyCategoryRow = ({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: DimensionValue;
}) => (
  <View className="mb-2" style={{ width }}>
    <Text
      className="text-gray-900 font-bold text-[12px] mb-1.5 ml-1"
      style={{ flexWrap: "wrap" }}
    >
      {label}
    </Text>
    <View className="bg-gray-50/50 border border-gray-100 rounded-[8px] px-4 h-12 justify-center shadow-sm shadow-black/[0.02]">
      <Text
        className="text-gray-900 text-sm font-semibold"
        numberOfLines={1}
      >
        {value?.trim() ? value : "—"}
      </Text>
    </View>
  </View>
);
import AISuggestedTag from "./components/AISuggestedTag";

const PostAd = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const editProductId = params.edit;

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [cycleOffset, setCycleOffset] = useState(0);
  const [imageError, setImageError] = useState("");
  const [editLoaded, setEditLoaded] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  type UploadStatus = "uploading" | "success" | "error";
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, { status: UploadStatus; key?: string; progress?: number }>>({});
  const [showBasicDetails, setShowBasicDetails] = useState(false);

  const {
    generationStep,
    isFormLoading,
    data,
    setData,
    fetchPreview,
    specMetadata,
  } = usePostAdAI();

  const {
    categories,
    subcategories,
    brands,
    models,
    isLoadingSubcategories,
    isLoadingBrands,
    isLoadingModels,
  } = usePostAdData(data.categoryId, data.subcategoryId, data.brandId);

  const categoryName = useMemo(() => {
    if (!data?.categoryId || categories.length === 0)
      return data?.category?.name || data?.category?.label || "";
    const cat = categories.find(
      (c) => (c.id || c._id || c.value) === data.categoryId,
    );
    return cat?.name || cat?.label || data?.category?.name || "";
  }, [categories, data.categoryId, data?.category]);

  const subcategoryName = useMemo(() => {
    if (!data?.subcategoryId || subcategories.length === 0)
      return data?.subcategory?.name || data?.subcategory?.label || "";
    const sub = subcategories.find(
      (s) => (s.id || s._id || s.value) === data.subcategoryId,
    );
    return sub?.name || sub?.label || data?.subcategory?.name || "";
  }, [subcategories, data.subcategoryId, data?.subcategory]);

  /** Pickers only when preview AI did not extract that field (otherwise read-only). */
  const showCategoryFilter = data.aiExtractedCategory !== true;
  const showSubcategoryFilter = data.aiExtractedSubcategory !== true;
  const categoryColWidth = "48%";

  const uploadImage = async (uri: string) => {
    if (!uri.startsWith("file://") && !uri.startsWith("content://")) {
      setUploadStatuses(prev => ({ ...prev, [uri]: { status: "success", key: uri, progress: 100 } }));
      return;
    }

    setUploadStatuses(prev => ({ ...prev, [uri]: { status: "uploading", progress: 0 } }));
    try {
      // Professional Image Optimization
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // Professional resize for ads
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // High quality but optimized size
      );

      const optimizedUri = manipulatedImage.uri;
      const token = await getToken();
      const formData = new FormData();
      const fileName = optimizedUri.split("/").pop() || "image.jpg";
      let ext = "jpg"; // We forced JPEG above

      formData.append("image", {
        uri: optimizedUri,
        name: fileName.includes(".") ? fileName : `${fileName}.jpg`,
        type: `image/jpeg`,
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
      if (!result.canceled) {
        setCycleOffset(0); // Reset cycling when adding
        await processPickedImages(result);
      }
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
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled) {
        setCycleOffset(0); // Reset cycling when adding
        await processPickedImages(result);
      }
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
      Toast.show({ type: "error", text1: "Limit Reached", text2: "Max 4 images." });
      return;
    }
    setShowPickerModal(true);
  };

  const isAnyUploading = photos.some(p => uploadStatuses[p.uri]?.status === "uploading");
  const hasUploadError = photos.some(p => uploadStatuses[p.uri]?.status === "error");
  const isContinueDisabled = loading || isAnyUploading || hasUploadError || !description.trim() || photos.length < 1;

  const handleContinue = async () => {
    if (isContinueDisabled) return;
    
    if (!showBasicDetails) {
      setShowBasicDetails(true);
      const hasValidCoords =
        !!coordinates &&
        Number.isFinite(coordinates.lat) &&
        Number.isFinite(coordinates.lon) &&
        coordinates.lat !== 0 &&
        coordinates.lon !== 0;
      
      const imageUris = photos.map((p) => {
        const s = uploadStatuses[p.uri];
        if (s?.status === "success" && s.key) return s.key;
        return p.uri;
      });

      fetchPreview(
        description,
        imageUris,
        hasValidCoords ? { lat: coordinates.lat, lon: coordinates.lon } : null,
      );
      return;
    }

    try {
      setLoading(true);
      const imageUris = photos.map((p) => {
        const s = uploadStatuses[p.uri];
        if (s?.status === "success" && s.key) return s.key;
        return p.uri;
      });
      
      const nextParams: Record<string, string> = {
        description: data.enhancedDescription || description,
        images: JSON.stringify(imageUris),
        title: data.title || "",
        categoryId: data.categoryId || "",
        subcategoryId: data.subcategoryId || "",
        brandId: data.brandId || "",
        modelId: data.modelId || "",
        aiData: JSON.stringify(data), // Pass the full AI data to avoid re-fetching
      };
      
      if (editProductId) nextParams.edit = editProductId;
      router.push({
        pathname: "/postAdDetails",
        params: nextParams,
      });
    } catch (err) {
      Toast.show({ type: "error", text1: "Error", text2: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (indexInStack: number) => {
    // We need to find the actual photo in the stack because they cycle
    const totalSlots = 4;
    const baseStack = [...Array(totalSlots - photos.length).fill(null), ...photos];
    const itemIndex = (indexInStack + cycleOffset) % totalSlots;
    const photoToRemove = baseStack[itemIndex];

    if (photoToRemove) {
      setPhotos((prev) => prev.filter((p) => p.uri !== photoToRemove.uri));
      setCycleOffset(0); // Reset cycling when removing for predictability
    }
  };

  const renderImagesSection = () => {
    const totalSlots = 4;
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const cyclePhotos = () => {
      // Increment offset to cycle ALL slots (0-3)
      setCycleOffset((prev) => (prev + 1) % totalSlots);
      translateX.value = 0;
      translateY.value = 0;
    };

    const gesture = Gesture.Pan()
      .onUpdate((e) => {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      })
      .onEnd((e) => {
        if (Math.abs(e.translationX) > 100 || Math.abs(e.translationY) > 100) {
          runOnJS(cyclePhotos)();
        } else {
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }
      });

    const animatedTopCard = useAnimatedStyle(() => ({
      transform: [
        { rotate: '-8deg' },
        { translateX: translateX.value - 15 },
        { translateY: translateY.value + 5 },
      ],
      zIndex: 100,
    }));

    return (
      <View className="mb-6">
        <Animated.View
          className="mb-8 px-4 items-center"
          style={{
            opacity: keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ translateY: keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }]
          }}
        >
          <Text className="text-[34px] font-bold text-gray-900 leading-[40px] text-center" style={{ fontFamily: "DM Serif Display" }}>
            Hi, {userName}
          </Text>
          <Text className="text-[42px] font-bold text-indigo-600 leading-[42px] text-center mt-1" style={{ fontFamily: "DM Serif Display" }}>
            Sell with AI
          </Text>
          <View className="flex-row items-center justify-center mt-4 px-2">
            <Ionicons name="information-circle-outline" size={14} color="#A1A1AA" />
            <Text className="text-[12px] text-gray-400 font-medium ml-1.5 text-center">At least 1 photo required. Max 4. (Max 5MB each)</Text>
          </View>
        </Animated.View>

        <Animated.View
          className="mt-6 mb-12 items-center justify-center relative"
          style={{
            height: 320,
            opacity: keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ translateY: keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }]
          }}
        >
          {Array.from({ length: totalSlots }).map((_, index) => {
            // Priority list: placeholders first [null, null], then images [A, B]
            const baseStack = [...Array(totalSlots - photos.length).fill(null), ...photos];
            
            // Apply cycleOffset: shift whole stack right (last becomes first)
            // If offset 1: [B, null, null, A]
            const itemIndex = (index + cycleOffset) % totalSlots;
            const photo = baseStack[itemIndex];
            const isFilled = !!photo;

            // Alternating pattern: index 0 (R), 1 (L), 2 (R), 3 (L-front)
            const slotStyles: any = [
              { transform: [{ rotate: '15deg' }, { translateX: 35 }, { translateY: 15 }], zIndex: 10 },
              { transform: [{ rotate: '-15deg' }, { translateX: -35 }, { translateY: 15 }], zIndex: 20 },
              { transform: [{ rotate: '8deg' }, { translateX: 15 }, { translateY: 5 }], zIndex: 30 },
              { transform: [{ rotate: '-8deg' }, { translateX: -15 }, { translateY: 5 }], zIndex: 40 }
            ][index];

            const renderCardContent = () => {
              if (photo) {
                const statusInfo = uploadStatuses[photo.uri];
                const isUploading = statusInfo?.status === "uploading";
                const isError = statusInfo?.status === "error";

                return (
                  <View className="w-full h-full rounded-[32px] overflow-hidden bg-white border border-gray-100 shadow-xl">
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
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
                    >
                      <Ionicons name="close" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  onPress={pickImage}
                  activeOpacity={0.8}
                  className="w-full h-full"
                >
                  <View
                    className="w-full h-full rounded-[32px] bg-white border border-gray-100 shadow-lg items-center justify-center"
                  >
                    <View className="w-12 h-12 rounded-full items-center justify-center bg-indigo-50 border border-indigo-100">
                      <Ionicons
                        name="add-outline"
                        size={32}
                        color="#6366F1"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            };

            if (index === 3) {
              return (
                <GestureDetector key={index} gesture={gesture}>
                  <AnimatedRE.View 
                    className="absolute w-[60%] aspect-[3/4]"
                    style={animatedTopCard}
                  >
                    {renderCardContent()}
                  </AnimatedRE.View>
                </GestureDetector>
              );
            }

            return (
              <View key={index} className="absolute w-[60%] aspect-[3/4]" style={slotStyles}>
                {renderCardContent()}
              </View>
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                <View className="flex-row items-center mt-0.5">
                  <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                  <Text
                    className="text-[11px] text-gray-400 font-medium ml-1 shrink"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {place ? place.split(',')[0] : "Select location"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={10}
                    color="#6366F1"
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 pt-4 bg-[#F7F6F3]"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View>
              {renderImagesSection()}
            </View>

            {showBasicDetails && (
              <View className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-200 mb-6">
                <View className="flex-row justify-between items-center mb-5">
                  <Text
                    className="text-xl text-gray-900"
                    style={{ fontFamily: Dimensions.get('window').fontScale > 1 ? undefined : "DM Serif Display" }}
                  >
                    Basic Details
                  </Text>
                  <AISuggestedTag />
                </View>

                {generationStep < GENERATION_STEPS.BASIC_FORM ? (
                  <>
                    <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
                    <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
                    <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
                  </>
                ) : (
                  <>
                    <EditableRow
                      label="Title"
                      value={data.title}
                      onChange={(v: string) =>
                        setData((prev: any) => ({ ...prev, title: v }))
                      }
                    />
                    
                    <View className="flex-row justify-between w-full">
                      {showCategoryFilter ? (
                        <InlinePicker
                          label="Category"
                          value={data.category?.name || data.category?.label || "Select Category"}
                          options={categories.map((c: any) => ({
                            label: c.name || c.label || "",
                            value: c.id || c._id || c.value || "",
                          }))}
                          containerStyle={{ width: categoryColWidth }}
                          onSelect={(opt: any) => {
                            const full = categories.find((c: any) => (c.id || c._id || c.value) === opt.value);
                            setData((prev: any) => ({
                              ...prev,
                              categoryId: full?.id || full?._id || opt.value,
                              category: full || opt,
                              subcategoryId: undefined,
                              subcategory: undefined,
                            }));
                          }}
                        />
                      ) : (
                        <ReadOnlyCategoryRow
                          label="Category"
                          value={categoryName}
                          width={categoryColWidth}
                        />
                      )}

                      {showSubcategoryFilter ? (
                        <InlinePicker
                          label="Sub Category"
                          value={data.subcategory?.name || data.subcategory?.label || "Select Sub Category"}
                          options={subcategories.map((s: any) => ({
                            label: s.name || s.label || "",
                            value: s.id || s._id || s.value || "",
                          }))}
                          isLoading={isLoadingSubcategories}
                          containerStyle={{ width: categoryColWidth }}
                          onSelect={(opt: any) => {
                            const full = subcategories.find((s: any) => (s.id || s._id || s.value) === opt.value);
                            setData((prev: any) => ({
                              ...prev,
                              subcategoryId: full?.id || full?._id || opt.value,
                              subcategory: full || opt,
                              brandId: undefined,
                              brand: undefined,
                              modelId: undefined,
                              model: undefined,
                            }));
                          }}
                        />
                      ) : (
                        <ReadOnlyCategoryRow
                          label="Sub Category"
                          value={subcategoryName}
                          width={categoryColWidth}
                        />
                      )}
                    </View>

                    {(brands.length > 0 || data.brandId || data.isbrandrequired || data.is_brand_required) && (
                      <View className="mt-4 flex-row justify-between w-full">
                        <InlinePicker
                          label="Brand"
                          value={data.brand?.name || data.brand?.label || data.brand || "Select Brand"}
                          options={brands.map((b: any) => ({
                            label: b.name || b.label || "",
                            value: b.id || b._id || b.value || "",
                          }))}
                          isLoading={isLoadingBrands}
                          containerStyle={{ 
                            width: (data.brandId || models.length > 0 || data.modelId || data.isModelrequired || data.is_model_required) ? "48%" : "100%" 
                          }}
                          onSelect={(opt: any) => {
                            const full = brands.find((b: any) => (b.id || b._id || b.value) === opt.value);
                            setData((prev: any) => ({
                              ...prev,
                              brandId: full?.id || full?._id || opt.value,
                              brand: full || opt,
                              modelId: undefined,
                              model: undefined,
                            }));
                          }}
                        />

                        {(data.brandId || models.length > 0 || data.modelId || data.isModelrequired || data.is_model_required) && (
                          <InlinePicker
                            label="Model"
                            value={data.model?.name || data.model?.label || data.model || "Select Model"}
                            options={models.map((m: any) => ({
                              label: m.name || m.label || "",
                              value: m.id || m._id || m.value || "",
                            }))}
                            isLoading={isLoadingModels}
                            containerStyle={{ width: "48%" }}
                            onSelect={(opt: any) => {
                              const full = models.find((m: any) => (m.id || m._id || m.value) === opt.value);
                              setData((prev: any) => ({
                                ...prev,
                                modelId: full?.id || full?._id || opt.value,
                                model: full || opt,
                              }));
                            }}
                          />
                        )}
                      </View>
                    )}

                    <View className="mt-4">
                      <Text 
                        className="text-gray-900 font-bold text-[12px] mb-1.5 ml-1"
                      >
                        Location
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowLocationPicker(true)}
                        activeOpacity={0.7}
                        className="bg-gray-50/50 border border-gray-100 rounded-[8px] h-12 px-4 flex-row items-center justify-between shadow-sm shadow-black/[0.02]"
                      >
                        <View className="flex-row items-center flex-1 mr-2">
                          <Ionicons name="location-sharp" size={14} color="#6366F1" className="mr-2" />
                          <Text 
                            className={`text-sm font-semibold flex-1 ${place ? "text-gray-900" : "text-gray-400"}`}
                            numberOfLines={1}
                          >
                            {place || "Select location"}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}

            {showBasicDetails && (
              <TouchableOpacity
                onPress={handleContinue}
                disabled={loading || isFormLoading || !data.title}
                className={`h-14 rounded-[20px] items-center justify-center shadow-lg active:opacity-90 mb-10 ${loading || isFormLoading || !data.title ? "bg-gray-100" : "bg-[#1A1A1A]"}`}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className={`font-bold text-[17px] ${loading || isFormLoading || !data.title ? "text-gray-400" : "text-white"}`}>
                    Next
                  </Text>
                )}
              </TouchableOpacity>
            )}
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
      {!showBasicDetails && (
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
      )}

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
    </GestureHandlerRootView>
  );
};

export default PostAd;
