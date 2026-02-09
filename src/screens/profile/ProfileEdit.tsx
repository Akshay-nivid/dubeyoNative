import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import DatePicker from "../../components/DatePicker";
import Dropdown from "../../components/Dropdown";
import { Api } from "../home/Api";
import { get } from "../../services/api";
import { UserService } from "../../services/user/userService";
import { colors } from "../../../theme";

export default function ProfileEditScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profilePicLoading, setProfilePicLoading] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [submittingVerification, setSubmittingVerification] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<"not_verified" | "pending" | "rejected" | "verified">("not_verified");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "",
        dob: "",
        address: "",
        cityState: "",
        pin: "",
        country: "",
        profilePic: "",
        verified: false,
    });

    const [verificationForm, setVerificationForm] = useState({
        emiratesId: "",
        fullName: "",
        dob: "",
        expiryDate: "",
        frontImage: null as string | null,
        backImage: null as string | null,
    });

    const [verificationErrors, setVerificationErrors] = useState<{
        emiratesId?: string;
        fullName?: string;
        dob?: string;
        expiryDate?: string;
        frontImage?: string;
        backImage?: string;
    }>({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // Use /user/me API endpoint
            const response = await get(Api.profile);
            const user = response?.data?.data || response?.data || response;

            if (!user) {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: "No user data found",
                });
                return;
            }

            console.log("User data from /user/me:", user);

            // Handle profile picture URL
            let profileImageUrl = "";
            if (user?.profilePic && user.profilePic !== "null" && user.profilePic !== "undefined") {
                if (user.profilePic.includes("googleusercontent") || user.profilePic.startsWith("http")) {
                    profileImageUrl = user.profilePic;
                } else {
                    try {
                        const imageResponse = await get(`${Api.Image}?key=${user.profilePic}`);
                        profileImageUrl = imageResponse?.data?.url || imageResponse?.data || "";
                    } catch {
                        profileImageUrl = user.profilePic;
                    }
                }
            }

            // Format date of birth - handle various date formats
            let formattedDob = "";
            if (user.dob) {
                if (user.dob.includes("T")) {
                    formattedDob = user.dob.split("T")[0];
                } else if (user.dob.includes(" ")) {
                    formattedDob = user.dob.split(" ")[0];
                } else {
                    formattedDob = user.dob;
                }
            }

            // Populate all form fields from API response
            setFormData({
                firstName: user.firstName || user.first_name || "",
                lastName: user.lastName || user.last_name || "",
                email: user.email || "",
                phone: user.phone || user.phoneNumber || "",
                gender: user.gender || "",
                dob: formattedDob,
                address: user.address || "",
                cityState: user.cityState || user.city_state || user.city || "",
                pin: user.pin || user.pinCode || user.pincode || "",
                country: user.country || "",
                profilePic: profileImageUrl,
                verified: !!user.verified || !!user.isVerified,
            });

            // Set verification status
            if (user.verified || user.isVerified) {
                setVerificationStatus("verified");
            } else if (user.verificationStatus || user.verification_status) {
                setVerificationStatus((user.verificationStatus || user.verification_status) as any);
            } else {
                setVerificationStatus("not_verified");
            }
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error?.message || "Failed to load profile data",
            });
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (saving) return;

        try {
            setSaving(true);
            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                gender: formData.gender || null,
                dob: formData.dob || null,
                address: formData.address || null,
                cityState: formData.cityState || null,
                pin: formData.pin || null,
                country: formData.country || null,
            };

            const response = await UserService.updateProfile(updateData);
            if (response?.status === 200 || response?.status === 201) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: response?.data?.message || response?.message || "Profile updated successfully",
                });
                await fetchProfile();
            } else {
                const errorMessage = response?.message || 
                    (response?.status === 404 ? "Update endpoint not found. Please contact support." : 
                     response?.status === 400 ? "Invalid data. Please check your inputs." :
                     "Failed to update profile");
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: errorMessage,
                });
            }
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error?.message || "Failed to update profile",
            });
            console.error("Error updating profile:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleProfilePicChange = async () => {
        try {
            // Request permission to access media library
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        "Permission Required",
                        "We need access to your photos to update your profile picture.",
                        [{ text: "OK" }]
                    );
                    return;
                }
            }

            // Show action sheet for image source selection
            Alert.alert(
                "Select Photo",
                "Choose an option",
                [
                    {
                        text: "Camera",
                        onPress: () => pickImageFromCamera(),
                    },
                    {
                        text: "Photo Library",
                        onPress: () => pickImageFromLibrary(),
                    },
                    {
                        text: "Cancel",
                        style: "cancel",
                    },
                ],
                { cancelable: true }
            );
        } catch (error: any) {
            console.error("Error requesting permissions:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to access photos",
            });
        }
    };

    const pickImageFromCamera = async () => {
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        "Permission Required",
                        "We need access to your camera to take a photo.",
                        [{ text: "OK" }]
                    );
                    return;
                }
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                await uploadProfilePicture(result.assets[0].uri);
            }
        } catch (error: any) {
            console.error("Error picking image from camera:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to take photo",
            });
        }
    };

    const pickImageFromLibrary = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                await uploadProfilePicture(result.assets[0].uri);
            }
        } catch (error: any) {
            console.error("Error picking image from library:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to select photo",
            });
        }
    };

    const uploadProfilePicture = async (imageUri: string) => {
        try {
            setProfilePicLoading(true);

            // Create FormData
            const formData = new FormData();
            
            // Extract filename and type from URI
            // Handle both file:// and content:// URIs (Android)
            let filename = imageUri.split('/').pop() || 'profile.jpg';
            
            // Remove query parameters if any
            filename = filename.split('?')[0];
            
            // Determine MIME type
            const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
            let mimeType = 'image/jpeg';
            
            switch (extension) {
                case 'png':
                    mimeType = 'image/png';
                    break;
                case 'jpg':
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case 'gif':
                    mimeType = 'image/gif';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    break;
                default:
                    mimeType = 'image/jpeg';
            }

            // Ensure filename has proper extension
            if (!filename.includes('.')) {
                filename = `profile.${extension}`;
            }

            // Append file to FormData (React Native format)
            // FormData handles file:// and content:// URIs correctly
            formData.append('files', {
                uri: imageUri,
                name: filename,
                type: mimeType,
            } as any);

            // Upload to backend
            const response = await UserService.updateProfilePic(formData);

            if (response?.status === 200 || response?.status === 201) {
                // Backend returns: { message: "Profile picture updated successfully", data: userObject }
                // API service extracts: res.data = response.data?.data || response.data
                // So response.data = userObject (the updated user), response.message = success message
                const userData = response?.data;
                const imageKey = userData?.profilePic;
                
                if (imageKey) {
                    // Fetch the signed URL for the image
                    try {
                        const imageResponse = await get(`${Api.Image}?key=${imageKey}`);
                        const imageUrl = imageResponse?.data?.url || imageResponse?.data || imageUri;
                        
                        // Update form data with new profile picture URL
                        setFormData((prev) => ({
                            ...prev,
                            profilePic: imageUrl,
                        }));

                        Toast.show({
                            type: "success",
                            text1: "Success",
                            text2: response?.message || "Profile picture updated successfully",
                        });
                    } catch (error) {
                        // If fetching signed URL fails, use the local URI temporarily
                        setFormData((prev) => ({
                            ...prev,
                            profilePic: imageUri,
                        }));

                        Toast.show({
                            type: "success",
                            text1: "Success",
                            text2: response?.message || "Profile picture updated successfully",
                        });
                    }
                } else {
                    // If no key in response, refresh profile to get updated data
                    await fetchProfile();
                    Toast.show({
                        type: "success",
                        text1: "Success",
                        text2: response?.message || "Profile picture updated successfully",
                    });
                }
            } else {
                const errorMessage = response?.message || 
                    (response?.status === 400 ? "Invalid image file" :
                     response?.status === 413 ? "Image file too large" :
                     "Failed to update profile picture");
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: errorMessage,
                });
            }
        } catch (error: any) {
            console.error("Error uploading profile picture:", error);
            
            // Provide more specific error messages
            let errorMessage = "Failed to upload profile picture";
            if (error?.message?.includes("Network Error") || error?.message?.includes("network")) {
                errorMessage = "Network error. Please check your internet connection and try again.";
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (error?.response?.status === 413) {
                errorMessage = "Image file is too large. Please choose a smaller image.";
            } else if (error?.response?.status === 400) {
                errorMessage = "Invalid image file. Please try again.";
            }
            
            Toast.show({
                type: "error",
                text1: "Error",
                text2: errorMessage,
            });
        } finally {
            setProfilePicLoading(false);
        }
    };

    const handleVerificationChange = (name: string, value: string) => {
        setVerificationForm((prev) => ({ ...prev, [name]: value }));
        if (verificationErrors[name as keyof typeof verificationErrors]) {
            setVerificationErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleImageUpload = async (side: "front" | "back") => {
        // TODO: Implement image picker
        Toast.show({
            type: "info",
            text1: "Info",
            text2: "Image upload functionality to be implemented",
        });
    };

    const handleVerificationSubmit = async () => {
        const errors: typeof verificationErrors = {};

        if (!verificationForm.emiratesId.trim()) {
            errors.emiratesId = "Emirates ID Number is required";
        }
        if (!verificationForm.fullName.trim()) {
            errors.fullName = "Full Name is required";
        }
        if (!verificationForm.dob) {
            errors.dob = "Date of Birth is required";
        }
        if (!verificationForm.expiryDate) {
            errors.expiryDate = "Expiry Date is required";
        }
        if (!verificationForm.frontImage) {
            errors.frontImage = "Front image is required";
        }
        if (!verificationForm.backImage) {
            errors.backImage = "Back image is required";
        }

        if (Object.keys(errors).length > 0) {
            setVerificationErrors(errors);
            return;
        }

        try {
            setSubmittingVerification(true);
            // TODO: Implement API call for verification submission
            setVerificationStatus("pending");
            setShowVerificationModal(false);
            Toast.show({
                type: "success",
                text1: "Success",
                text2: "Verification submitted successfully. Your request is pending review.",
            });
            setVerificationForm({
                emiratesId: "",
                fullName: "",
                dob: "",
                expiryDate: "",
                frontImage: null,
                backImage: null,
            });
            setVerificationErrors({});
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error?.message || "Failed to submit verification",
            });
        } finally {
            setSubmittingVerification(false);
        }
    };

    const getVerifyButtonText = () => {
        switch (verificationStatus) {
            case "verified":
                return "Verified User";
            case "pending":
                return "Pending Verification";
            case "rejected":
                return "Rejected";
            default:
                return "Verify";
        }
    };

    const handleVerifyButtonClick = () => {
        if (verificationStatus === "rejected" || verificationStatus === "not_verified") {
            setShowVerificationModal(true);
        }
    };

    const getVerificationText = () => {
        switch (verificationStatus) {
            case "verified":
                return "You are a verified user";
            case "pending":
                return "Your verification is pending review";
            case "rejected":
                return "Your verification was rejected. Please resubmit.";
            default:
                return "Currently you are not verified user";
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-bg_primary">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4 text-text_tertiary">Loading profile...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-bg_primary">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                <View className="flex-row items-center px-4 pt-14 pb-6 bg-bg_white border-b border-border_primary">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.icon_primary} />
                    </TouchableOpacity>
                    <Text className="flex-1 text-center font-bold text-lg text-text_primary">
                        Profile setting
                    </Text>
                    <View className="w-10" />
                </View>

                <View className="px-4 pt-6">
                    <View className="items-center mb-6">
                        <View className="relative">
                            {profilePicLoading ? (
                                <View className="w-24 h-24 rounded-full bg-border_secondary items-center justify-center">
                                    <ActivityIndicator size="small" color={colors.primary} />
                                </View>
                            ) : formData.profilePic ? (
                                <Image
                                    source={{ uri: formData.profilePic }}
                                    className="w-24 h-24 rounded-full border-2 border-border_primary"
                                />
                            ) : (
                                <View className="w-24 h-24 rounded-full bg-border_secondary items-center justify-center">
                                    <Ionicons name="person" size={40} color={colors.icon_secondary} />
                                </View>
                            )}
                            <TouchableOpacity
                                onPress={handleProfilePicChange}
                                className="absolute bottom-0 right-0 bg-success rounded-full p-1.5 border-2 border-bg_white"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create-outline" size={14} color={colors.text_white} />
                            </TouchableOpacity>
                        </View>

                        <Text className="mt-3 text-text_tertiary text-sm text-center">
                            {getVerificationText()}
                        </Text>

                        <TouchableOpacity
                            className={`mt-2 px-6 py-2 rounded-full ${
                                verificationStatus === "verified"
                                    ? "bg-success"
                                    : verificationStatus === "pending"
                                    ? "bg-warning"
                                    : verificationStatus === "rejected"
                                    ? "bg-error"
                                    : "bg-bg_black"
                            } ${verificationStatus === "verified" || verificationStatus === "pending" ? "opacity-60" : ""}`}
                            onPress={handleVerifyButtonClick}
                            disabled={verificationStatus === "verified" || verificationStatus === "pending"}
                            activeOpacity={0.7}
                        >
                            <Text className="text-text_white text-sm font-semibold">
                                {getVerifyButtonText()}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-bg_white rounded-2xl p-4 shadow-sm" style={{ elevation: 2 }}>
                        <View className="flex-row gap-3 mb-5">
                            <View className="flex-1">
                                <TextInput
                                    placeholder="First Name *"
                                    placeholderTextColor={colors.text_tertiary}
                                    value={formData.firstName}
                                    onChangeText={(text) => handleChange("firstName", text)}
                                    editable={!saving}
                                    className="rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_primary"
                                />
                            </View>
                            <View className="flex-1">
                                <TextInput
                                    placeholder="Last Name"
                                    placeholderTextColor={colors.text_tertiary}
                                    value={formData.lastName}
                                    onChangeText={(text) => handleChange("lastName", text)}
                                    editable={!saving}
                                    className="rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_primary"
                                />
                            </View>
                        </View>

                        <View className="mb-5">
                            <TextInput
                                placeholder="Email *"
                                placeholderTextColor={colors.text_tertiary}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={formData.email}
                                onChangeText={(text) => handleChange("email", text)}
                                editable={false}
                                className="rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_tertiary"
                            />
                        </View>

                        <View className="mb-5">
                            <TextInput
                                placeholder="Phone *"
                                placeholderTextColor={colors.text_tertiary}
                                keyboardType="phone-pad"
                                value={formData.phone}
                                onChangeText={(text) => handleChange("phone", text)}
                                editable={!saving}
                                className="rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_primary"
                            />
                        </View>

                        {/* Gender */}
                        <Dropdown
                            label="Gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            placeholder="Select gender"
                            options={[
                                { value: "", label: "Select gender" },
                                { value: "male", label: "Male" },
                                { value: "female", label: "Female" },
                                { value: "other", label: "Other" },
                                { value: "prefer_not_say", label: "Prefer not to say" },
                            ]}
                        />

                        {/* Date of Birth */}
                        <DatePicker
                            label="Date of Birth"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            required={false}
                        />

                        <View className="mb-5">
                            <TextInput
                                placeholder="Address *"
                                placeholderTextColor={colors.text_tertiary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={formData.address}
                                onChangeText={(text) => handleChange("address", text)}
                                editable={!saving}
                                className="rounded-xl px-4 py-3.5 text-base min-h-[100px] bg-bg_white border border-border_primary text-text_primary"
                            />
                        </View>

                        <View className="mb-5">
                            <TextInput
                                placeholder="City"
                                placeholderTextColor={colors.text_tertiary}
                                value={formData.cityState}
                                onChangeText={(text) => handleChange("cityState", text)}
                                editable={!saving}
                                className="rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_primary"
                            />
                        </View>

                        <View className="mb-5">
                            <TextInput
                                placeholder="PIN Code"
                                placeholderTextColor={colors.text_tertiary}
                                keyboardType="numeric"
                                value={formData.pin}
                                onChangeText={(text) => handleChange("pin", text)}
                                editable={!saving}
                                className="rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_primary"
                            />
                        </View>

                        {/* Country */}
                        <Dropdown
                            label="Country *"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="Select country"
                            options={[
                                { value: "", label: "Select country" },
                                { value: "United Arab Emirates", label: "United Arab Emirates" },
                                { value: "India", label: "India" },
                                { value: "Pakistan", label: "Pakistan" },
                                { value: "Bangladesh", label: "Bangladesh" },
                                { value: "Philippines", label: "Philippines" },
                                { value: "Egypt", label: "Egypt" },
                                { value: "Other", label: "Other" },
                            ]}
                        />

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={saving}
                            className={`mt-6 bg-primary py-4 rounded-xl items-center ${saving ? "opacity-60" : ""}`}
                            activeOpacity={0.7}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={colors.text_white} />
                            ) : (
                                <Text className="font-bold text-text_white text-base">Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Identity Verification Modal */}
            <Modal
                visible={showVerificationModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowVerificationModal(false)}
            >
                <Pressable
                    className="flex-1 bg-black/50 justify-end"
                    onPress={() => setShowVerificationModal(false)}
                >
                    <Pressable
                        className="bg-white rounded-t-3xl"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            className="max-h-[90%]"
                            contentContainerStyle={{ paddingBottom: 12 }}
                        >
                            {/* Modal Header */}
                            <View className="flex-row items-center justify-between px-5 pt-3 pb-2.5 border-b border-gray-200">
                                <Text className="text-lg font-bold text-gray-900">
                                    Identity Verification
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowVerificationModal(false)}
                                    className="p-1.5 -mr-1.5"
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close" size={22} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <View className="px-5 pt-3">
                                {/* Emirates ID Number */}
                                <View className="mb-2.5">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">
                                        Emirates ID Number <Text className="text-red-500">*</Text>
                                    </Text>
                                    <TextInput
                                        placeholder="Enter Emirates ID Number"
                                        placeholderTextColor={colors.text_secondary}
                                        value={verificationForm.emiratesId}
                                        onChangeText={(text) => handleVerificationChange("emiratesId", text)}
                                        className={`rounded-xl px-4 py-3 text-base bg-bg_white border text-text_primary ${verificationErrors.emiratesId ? "border-error" : "border-border_primary"}`}
                                    />
                                    {verificationErrors.emiratesId && (
                                        <Text className="text-xs text-red-500 mt-0.5">
                                            {verificationErrors.emiratesId}
                                        </Text>
                                    )}
                                </View>

                                {/* Full Name */}
                                <View className="mb-2.5">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">
                                        Full Name <Text className="text-red-500">*</Text>
                                    </Text>
                                    <TextInput
                                        placeholder="Enter Full Name"
                                        placeholderTextColor={colors.text_secondary}
                                        value={verificationForm.fullName}
                                        onChangeText={(text) => handleVerificationChange("fullName", text)}
                                        className={`rounded-xl px-4 py-3 text-base bg-bg_white border text-text_primary ${verificationErrors.fullName ? "border-error" : "border-border_primary"}`}
                                    />
                                    {verificationErrors.fullName && (
                                        <Text className="text-xs text-red-500 mt-0.5">
                                            {verificationErrors.fullName}
                                        </Text>
                                    )}
                                </View>

                                {/* Date of Birth */}
                                <View className="mb-2.5">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">
                                        Date of Birth (DOB) <Text className="text-red-500">*</Text>
                                    </Text>
                                    <DatePicker
                                        label="Select date"
                                        name="dob"
                                        value={verificationForm.dob}
                                        onChange={handleVerificationChange}
                                        placeholder="Select date"
                                        required={true}
                                    />
                                    {verificationErrors.dob && (
                                        <Text className="text-xs text-red-500 mt-0.5">
                                            {verificationErrors.dob}
                                        </Text>
                                    )}
                                </View>

                                {/* Expiry Date */}
                                <View className="mb-2.5">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">
                                        Expiry Date <Text className="text-red-500">*</Text>
                                    </Text>
                                    <DatePicker
                                        label="Select date"
                                        name="expiryDate"
                                        value={verificationForm.expiryDate}
                                        onChange={handleVerificationChange}
                                        placeholder="Select date"
                                        required={true}
                                    />
                                    {verificationErrors.expiryDate && (
                                        <Text className="text-xs text-red-500 mt-0.5">
                                            {verificationErrors.expiryDate}
                                        </Text>
                                    )}
                                </View>

                                {/* Image Upload Section */}
                                <View className="mb-3">
                                    <View className="flex-row gap-2.5">
                                        {/* Front Image */}
                                        <View className="flex-1">
                                            <Text className="text-sm font-medium text-gray-700 mb-1">
                                                (Emirates ID - Front image) <Text className="text-red-500">*</Text>
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => handleImageUpload("front")}
                                                className={`border-2 border-dashed rounded-xl p-3 items-center justify-center min-h-[90px] ${verificationForm.frontImage ? "bg-bg_primary" : "bg-bg_secondary"} ${verificationErrors.frontImage ? "border-error" : "border-border_primary"}`}
                                                activeOpacity={0.7}
                                            >
                                                {verificationForm.frontImage ? (
                                                    <Image
                                                        source={{ uri: verificationForm.frontImage }}
                                                        className="w-full h-18 rounded-lg"
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <>
                                                        <Ionicons name="arrow-up-circle-outline" size={24} color={colors.icon_secondary} />
                                                        <Text className="text-xs text-gray-600 mt-1">Upload</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            {verificationErrors.frontImage && (
                                                <Text className="text-xs text-red-500 mt-0.5">
                                                    {verificationErrors.frontImage}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Back Image */}
                                        <View className="flex-1">
                                            <Text className="text-sm font-medium text-gray-700 mb-1">
                                                (Emirates ID - Back image) <Text className="text-red-500">*</Text>
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => handleImageUpload("back")}
                                                className={`border-2 border-dashed rounded-xl p-3 items-center justify-center min-h-[90px] ${verificationForm.backImage ? "bg-bg_primary" : "bg-bg_secondary"} ${verificationErrors.backImage ? "border-error" : "border-border_primary"}`}
                                                activeOpacity={0.7}
                                            >
                                                {verificationForm.backImage ? (
                                                    <Image
                                                        source={{ uri: verificationForm.backImage }}
                                                        className="w-full h-18 rounded-lg"
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <>
                                                        <Ionicons name="arrow-up-circle-outline" size={24} color={colors.icon_secondary} />
                                                        <Text className="text-xs text-gray-600 mt-1">Upload</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            {verificationErrors.backImage && (
                                                <Text className="text-xs text-red-500 mt-0.5">
                                                    {verificationErrors.backImage}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                {/* Submit Button */}
                                <TouchableOpacity
                                    onPress={handleVerificationSubmit}
                                    disabled={submittingVerification}
                                    className={`bg-bg_black py-3 rounded-xl items-center ${submittingVerification ? "opacity-60" : ""}`}
                                    activeOpacity={0.7}
                                >
                                    {submittingVerification ? (
                                        <ActivityIndicator size="small" color={colors.text_white} />
                                    ) : (
                                        <Text className="text-text_white font-bold text-base">Submit</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
