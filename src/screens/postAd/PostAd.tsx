import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import GradientText from "../../components/GradientText";
import { useUserLocation } from "../../hooks/useUserLocation";
import { fetchProfile } from "../../screens/home/Api"; // Import from Home API
import { get } from "../../services/api";
import { getToken } from "../../services/storage/tokenStorage";
import { Api } from "../../screens/home/Api";

const PostAd = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{ edit?: string }>();
    const editProductId = params.edit;

    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [imageError, setImageError] = useState("");
    const [editLoaded, setEditLoaded] = useState(false);


    const { place } = useUserLocation();
    const [userName, setUserName] = useState("User");

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
                    const firstName = profileData?.firstName || profileData?.first_name || "";
                    const lastName = profileData?.lastName || profileData?.last_name || "";
                    const fullName = profileData?.name || profileData?.fullName ||
                        (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || "User");

                    if (fullName) {
                        setUserName(fullName.split(' ')[0]); // Use first name
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
                const res = await get(`${Api.getProductDetails}?productId=${editProductId}`);
                const product = res?.data?.data ?? res?.data ?? res;
                if (product) {
                    const desc = product.description ?? product.enhancedDescription ?? product.descriptions ?? "";
                    setDescription(typeof desc === "string" ? desc : "");
                    const imgs = product.images ?? product.image ?? [];
                const uris = Array.isArray(imgs)
                    ? imgs.map((u: any) => (typeof u === "string" ? u : u?.url ?? u?.link ?? "")).filter(Boolean)
                    : typeof imgs === "string" ? [imgs] : [];
                    if (uris.length > 0) {
                        setPhotos(uris.map((uri: string) => ({ uri } as ImagePicker.ImagePickerAsset)));
                    }
                }
            } catch (e) {
                console.warn("Could not load product for edit", e);
                Toast.show({ type: "error", text1: "Error", text2: "Could not load ad for editing." });
            } finally {
                setEditLoaded(true);
            }
        };
        loadProductForEdit();
    }, [editProductId, editLoaded]);

    const MAX_SIZE = 5 * 1024 * 1024; // Updated to 10MB as per user request
    const [isPickerActive, setIsPickerActive] = useState(false);

    const pickImage = async () => {
        if (isPickerActive) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission", "Permission to access camera roll is required!");
            return;
        }

        if (photos.length >= 4) {
            Toast.show({
                type: 'error',
                text1: 'Limit Reached',
                text2: 'You can upload up to 4 images only'
            });
            return;
        }

        try {
            setIsPickerActive(true);
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                selectionLimit: 4 - photos.length,
                quality: 1,
            });

            if (!result.canceled) {
                const incoming = result.assets;
                const validFiles: ImagePicker.ImagePickerAsset[] = [];
                let rejectedCount = 0;
                let rejectionReason = "";

                for (const file of incoming) {
                    let fileSize = file.fileSize;

                    // Fallback to FileSystem if size is missing
                    if (!fileSize) {
                        try {
                            const info = await FileSystem.getInfoAsync(file.uri);
                            if (info.exists) {
                                fileSize = info.size;
                            }
                        } catch (e) {
                            console.warn("Failed to get file info", e);
                        }
                    }

                    if (fileSize && fileSize > MAX_SIZE) {
                        rejectedCount++;
                        rejectionReason = "Size > 10MB";
                        continue;
                    }
                    validFiles.push(file);
                }

                if (rejectedCount > 0) {
                    Toast.show({
                        type: 'error',
                        text1: 'Some images skipped',
                        text2: `${rejectedCount} image(s) exceeded 10MB limit.`
                    });
                    setImageError(`${rejectedCount} image(s) were skipped because they exceed 10MB.`);
                } else {
                    setImageError("");
                }

                if (validFiles.length > 0) {
                    setPhotos((prev) => {
                        const newPhotos = [...prev, ...validFiles];
                        if (newPhotos.length > 4) {
                            Toast.show({
                                type: 'error',
                                text1: 'Limit Reached',
                                text2: 'Only first 4 images were added.'
                            });
                            return newPhotos.slice(0, 4);
                        }
                        return newPhotos;
                    });
                }
            }
        } catch (err) {
            console.error("Image picker error", err);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to pick images'
            });
        } finally {
            setIsPickerActive(false);
        }
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
                        <Ionicons name="add-circle-outline" size={32} color="#1e3a8a" />
                        <Text className="text-[#1e3a8a] font-semibold text-lg mt-2">Upload Image</Text>
                        <Text className="text-gray-400 text-xs mt-1">
                            Max 4 images. JPG, PNG, JPEG. Max 5MB.
                        </Text>
                    </TouchableOpacity>
                ) : (
                    /* Filled State - Images Inside Box */
                    <View className="bg-[#F0F4FF] border-2 border-dashed border-[#1e3a8a] rounded-2xl p-4 min-h-[160px]">
                        <View className="flex-row flex-wrap gap-2">
                            {photos.map((photo, index) => (
                                <View key={index} className="w-[22%] aspect-square rounded-xl overflow-hidden relative border border-gray-100 bg-white">
                                    <Image
                                        source={{ uri: photo.uri }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                    />
                                    <TouchableOpacity
                                        onPress={() => removePhoto(index)}
                                        className="absolute top-1 right-1 bg-red-100 rounded-md p-1 z-10 shadow-sm"
                                    >
                                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {/* Add Button (if less than 4) */}
                            {photos.length < 4 && (
                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="w-[22%] aspect-square rounded-xl border-2 border-dashed border-[#1e3a8a] items-center justify-center bg-white/50"
                                >
                                    <Ionicons name="add" size={24} color="#1e3a8a" />
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
            colors={['#f7e2fbff', '#d8ecf9ff', '#d7d1f3ff']} // Very light Pink, Blue, Purple
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-2 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
                    >
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>

                    <View className="ml-4">
                        <Text className="text-xl font-bold text-gray-900">Post ad</Text>

                    </View>
                </View>

                {/* New Gradient Header */}


                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
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
                                <View style={{ height: 44, width: '100%' }}>
                                    <GradientText
                                        text={`Hi there, ${userName}`}
                                        colors={['#14B8A6', '#3B82F6', '#8B5CF6']} // Teal -> Blue -> Violet
                                        style={{ fontSize: 36, fontWeight: '800' }}
                                        textAnchor="middle"
                                        x="50%"
                                    />
                                </View>
                            </View>

                            <View className="mb-1">
                                {/* Full Gradient Line 2 */}
                                <View style={{ height: 44, width: '100%' }}>
                                    <GradientText
                                        text="Sell with AI"
                                        colors={['#14B8A6', '#3B82F6', '#8B5CF6']} // Teal -> Blue -> Violet
                                        style={{ fontSize: 36, fontWeight: '800' }}
                                        textAnchor="middle"
                                        x="50%"
                                    />
                                </View>
                            </View>

                            <Text className="text-gray-500 text-sm mt-3 font-medium leading-5 w-full text-center">
                                Post ads effortlessly with our exclusive AI-powered AI experience
                            </Text>
                        </View>

                        <View className="pb-8 mt-6">
                            {renderImagesSection()}

                            <View className="bg-white rounded-[22px] overflow-hidden border border-gray-200 shadow-sm">
                                {/* Inner Shadow Effect */}
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.06)', 'rgba(0,0,0,0)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 0.3 }}
                                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, zIndex: 1 }}
                                    pointerEvents="none"
                                />
                                <View className="p-5">
                                    <View className="flex-row">
                                        {!description && (
                                            <View className="mr-2 mt-1 z-10">
                                                <Ionicons name="sparkles" size={18} color="#9CA3AF" />
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
                                        />
                                    </View>
                                    <View className="flex-row items-center justify-end mt-2 px-1">
                                        {/* Waveform Icon */}


                                        <TouchableOpacity
                                            onPress={description.trim() ? handleContinue : () => { }}
                                            disabled={loading}
                                            className={`w-12 h-12 rounded-xl items-center justify-center ${(description.trim() && photos.length === 0) ? 'bg-gray-200' : 'bg-black'}`}
                                        >
                                            {description.trim() ? (
                                                <Ionicons name="arrow-up" size={24} color={(description.trim() && photos.length === 0) ? "#9CA3AF" : "#FFF"} />
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
        </LinearGradient >
    );
};

export default PostAd;
