import { post } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useUserLocation } from "../../hooks/useUserLocation";
import { getToken } from "../../services/storage/tokenStorage";
import { PostAdApi } from "./Api";

const PostAd = () => {
    const router = useRouter();
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [imageError, setImageError] = useState("");
    const { place } = useUserLocation();

    useEffect(() => {
        const checkGuest = async () => {
            const token = await getToken();
            // In RN, we usually define guest as not having a token
            // or having a specific flag in storage. Following the token check:
            if (!token) {
                router.replace("/login");
            }
        };
        checkGuest();
    }, [router]);

    const MAX_SIZE = 20 * 1024 * 1024; // Updated to 20MB as per new UI design

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission", "Permission to access camera roll is required!");
            return;
        }

        if (photos.length >= 4) {
            setImageError("You can upload up to 4 images only");
            Toast.show({
                type: 'error',
                text1: 'Limit Reached',
                text2: 'You can upload up to 4 images only'
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 4 - photos.length,
            quality: 1,
        });

        if (!result.canceled) {
            const incoming = result.assets;
            const validFiles: ImagePicker.ImagePickerAsset[] = [];

            for (const file of incoming) {
                if (file.fileSize && file.fileSize > MAX_SIZE) {
                    Toast.show({
                        type: 'error',
                        text1: 'File too large',
                        text2: `Image size is larger than 20MB`
                    });
                    continue;
                }
                validFiles.push(file);
            }

            if (photos.length + validFiles.length > 4) {
                setImageError("You can upload up to 4 images only");
                const allowed = validFiles.slice(0, 4 - photos.length);
                setPhotos((prev) => [...prev, ...allowed]);
            } else {
                setImageError("");
                setPhotos((prev) => [...prev, ...validFiles]);
            }
        }
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = [];
        for (const photo of photos) {
            const formData = new FormData();
            const uri = photo.uri;
            const fileName = uri.split('/').pop() || "image.jpg";
            const fileType = fileName.split('.').pop() || "jpg";

            // @ts-ignore
            formData.append('image', {
                uri,
                name: fileName,
                type: `image/${fileType}`
            });

            try {
                const response = await post(PostAdApi.Image, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                if (response.data?.url) {
                    uploadedUrls.push(response.data.url);
                } else if (typeof response.data === 'string') {
                    uploadedUrls.push(response.data);
                }
            } catch (error) {
                console.error("Failed to upload image:", uri, error);
                throw new Error(`Failed to upload one or more images`);
            }
        }
        return uploadedUrls;
    };

    const handleContinue = () => {
        if (photos.length >= 1 && description.trim().length > 0) {
            router.push({
                pathname: "/postAdDetails",
                params: {
                    description: description,
                    images: JSON.stringify(photos.map(p => p.uri)),
                }
            });
        }
    };

    const renderImagesSection = () => {
        return (
            <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-6">
                <Text className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Images</Text>

                {/* Upload Area */}
                <TouchableOpacity
                    onPress={pickImage}
                    activeOpacity={0.7}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-8 items-center justify-center mb-6"
                >
                    <View className="bg-white px-6 py-2 rounded-xl mb-4 border border-gray-200 shadow-sm flex-row items-center">
                        <Ionicons name="arrow-up-outline" size={20} color="#374151" />
                        <Text className="ml-2 text-gray-700 font-bold text-lg">Upload</Text>
                    </View>
                    <Text className="text-gray-600 text-center text-sm font-medium mb-1">
                        Choose images or drag & drop it here.
                    </Text>
                    <Text className="text-gray-400 text-center text-xs">
                        JPG, JPEG, PNG and WEBP. Max 20 MB.
                    </Text>
                </TouchableOpacity>

                {/* Preview Row - Only show if photos exist */}
                {photos.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-2">
                        {photos.map((photo, index) => (
                            <View key={index} className="w-[22%] aspect-square rounded-xl overflow-hidden relative border border-gray-100">
                                <Image
                                    source={{ uri: photo.uri }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                />
                                <TouchableOpacity
                                    onPress={() => removePhoto(index)}
                                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1 z-10 shadow-sm"
                                >
                                    <Ionicons name="close" size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {imageError ? (
                    <Text className="text-red-500 text-xs mt-2">{imageError}</Text>
                ) : null}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
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
                    <TouchableOpacity className="flex-row items-center">
                        <Text className="text-gray-600 text-sm mr-1">{place || "Detecting location..."}</Text>
                        <Ionicons name="caret-down-sharp" size={12} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                {/* Images Section */}
                {renderImagesSection()}

                {/* Description Section */}
                <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-8">
                    <Text className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Description</Text>
                    <View className="bg-gray-50 rounded-3xl p-5 h-44 border border-gray-100/50">
                        <TextInput
                            placeholder="Describe what you're selling..."
                            className="flex-1 text-base text-gray-900"
                            multiline
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>
                    <Text className="text-gray-400 text-sm mt-3 leading-5">
                        AI will expand, refine, and organize this into professional product details.
                    </Text>
                </View>

                {/* Analyze Button */}
                <TouchableOpacity
                    className={`py-4 rounded-xl items-center justify-center flex-row mb-10 w-full ${(!description.trim() || photos.length === 0) ? 'bg-gray-200' : ''}`}
                    style={(!description.trim() || photos.length === 0) ? {} : { backgroundColor: 'rgb(8, 145, 178)' }}
                    onPress={handleContinue}
                    disabled={loading || !description.trim() || photos.length === 0}
                >
                    <Ionicons name="sparkles" size={18} color={(!description.trim() || photos.length === 0) ? "#9CA3AF" : "#FFF"} style={{ marginRight: 8 }} />
                    <Text className={`font-bold text-lg ${(!description.trim() || photos.length === 0) ? 'text-gray-400' : 'text-white'}`}>Continue with AI</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

export default PostAd;
