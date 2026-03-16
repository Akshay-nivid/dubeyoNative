import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

/* -------------------------------------------------------------------------- */
/*                              PURE HELPERS                                  */
/* -------------------------------------------------------------------------- */

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "heic", "heif"];
const MAX_IMAGES = 4;

const filterValidImages = (
  assets: ImagePicker.ImagePickerAsset[],
): { validFiles: ImagePicker.ImagePickerAsset[]; rejectedCount: number } => {
  let rejectedCount = 0;
  const validFiles: ImagePicker.ImagePickerAsset[] = [];
  for (const file of assets) {
    const ext = file.uri.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      rejectedCount++;
    } else {
      validFiles.push(file);
    }
  }
  return { validFiles, rejectedCount };
};

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

interface ImageGridProps {
  /** Current image URIs to display */
  images: string[];
  /** The initial images passed from the previous screen (no delete button shown for these) */
  initialImages: string[];
  /** Called whenever the image list changes (add or remove) */
  onChange: (newImages: string[]) => void;
}

/* -------------------------------------------------------------------------- */
/*                           IMAGE PREVIEW CARD                               */
/* -------------------------------------------------------------------------- */

const ImagePreviewCard = ({ images, initialImages, onChange }: ImageGridProps) => {
  /* --- PICKER STATE --- */
  const [isPickerActive, setIsPickerActive] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);

  /* --- BOTTOM SHEET ANIMATIONS --- */
  const panY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height),
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => evt.nativeEvent.locationY < 100,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dy) > Math.abs(gs.dx) && Math.abs(gs.dy) > 10,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          panY.setValue(gs.dy);
          fadeAnim.setValue(
            Math.max(0, 1 - gs.dy / (Dimensions.get("window").height * 0.5)),
          );
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 150 || gs.vy > 0.5) {
          closeModal();
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
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(Dimensions.get("window").height);
      scaleAnim.setValue(0.9);
    }
  }, [showPickerModal]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setShowPickerModal(false));
  };

  /* --- IMAGE HANDLERS --- */

  const processPickedImages = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const { validFiles, rejectedCount } = filterValidImages(result.assets);

    if (rejectedCount > 0) {
      Toast.show({
        type: "error",
        text1: "Invalid Format",
        text2: `${rejectedCount} image(s) skipped (Only JPG, PNG, HEIC allowed)`,
      });
    }

    if (validFiles.length > 0) {
      const newPhotos = [...images, ...validFiles.map((f) => f.uri)];
      if (newPhotos.length > MAX_IMAGES) {
        Toast.show({
          type: "error",
          text1: "Limit Reached",
          text2: "Only first 4 images were added.",
        });
        onChange(newPhotos.slice(0, MAX_IMAGES));
      } else {
        onChange(newPhotos);
      }
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Permission", text2: "Camera roll access is required!" });
      return;
    }
    try {
      setIsPickerActive(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - images.length,
        quality: 1,
      });
      await processPickedImages(result);
    } catch (err) {
      console.error("Image picker error", err);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to pick images" });
    } finally {
      setIsPickerActive(false);
    }
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Permission", text2: "Camera access is required!" });
      return;
    }
    try {
      setIsPickerActive(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });
      await processPickedImages(result);
    } catch (err) {
      console.error("Camera error", err);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to take photo" });
    } finally {
      setIsPickerActive(false);
    }
  };

  const openPicker = () => {
    if (isPickerActive) return;
    if (images.length >= MAX_IMAGES) {
      Toast.show({ type: "error", text1: "Limit Reached", text2: "You can upload up to 4 images only" });
      return;
    }
    setShowPickerModal(true);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  /* --- RENDER --- */

  return (
    <>
      {/* Image Grid */}
      <View
        className="flex-row justify-start flex-wrap mb-6"
        style={{ rowGap: 16, columnGap: "2.66%" }}
      >
        {/* Filled slots */}
        {images.map((uri: string, index: number) => (
          <View
            key={index}
            style={{ width: "23%", aspectRatio: 1 }}
            className="relative"
          >
            <TouchableOpacity
              onPress={openPicker}
              className="rounded-[20px] overflow-hidden bg-[#E5E5E5] w-full h-full border border-gray-200"
            >
              <Image
                source={{ uri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </TouchableOpacity>
            {/* Delete only on newly added images */}
            {!initialImages.includes(uri) && (
              <TouchableOpacity
                onPress={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-100/90 rounded-md p-1.5 z-10 shadow-sm"
              >
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Empty placeholder slots */}
        {Array.from({ length: Math.max(0, MAX_IMAGES - images.length) }).map((_, idx) => (
          <TouchableOpacity
            key={`empty-${idx}`}
            onPress={openPicker}
            className="rounded-[20px] justify-center items-center bg-[#EDEDED]"
            style={{ width: "23%", aspectRatio: 1 }}
          >
            <Ionicons name="camera" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Camera / Gallery Bottom Sheet Modal */}
      <Modal
        transparent={true}
        visible={showPickerModal}
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <View className="flex-1 justify-end" style={{ zIndex: 10000 }}>
          {/* Blurred backdrop */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
            <TouchableOpacity
              className="flex-1"
              style={{ flex: 1 }}
              onPress={closeModal}
              activeOpacity={1}
            >
              <BlurView
                intensity={70}
                tint="dark"
                style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.3)" }]}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Draggable sheet */}
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
              {/* Camera */}
              <TouchableOpacity
                onPress={() => { closeModal(); setTimeout(pickImageFromCamera, 100); }}
                className="items-center"
                activeOpacity={0.7}
              >
                <View className="w-20 h-20 bg-blue-50 rounded-2xl items-center justify-center mb-3 border border-blue-100 shadow-sm">
                  <Ionicons name="camera" size={32} color="#3B82F6" />
                </View>
                <Text className="font-semibold text-gray-700 text-base">Camera</Text>
              </TouchableOpacity>

              {/* Gallery */}
              <TouchableOpacity
                onPress={() => { closeModal(); setTimeout(pickImageFromLibrary, 100); }}
                className="items-center"
                activeOpacity={0.7}
              >
                <View className="w-20 h-20 bg-purple-50 rounded-2xl items-center justify-center mb-3 border border-purple-100 shadow-sm">
                  <Ionicons name="images" size={32} color="#8B5CF6" />
                </View>
                <Text className="font-semibold text-gray-700 text-base">Gallery</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

export default ImagePreviewCard;
