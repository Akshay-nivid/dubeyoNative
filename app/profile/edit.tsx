import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import DatePicker from "../../src/components/DatePicker";
import Dropdown from "../../src/components/Dropdown";
import { Api } from "../../src/screens/home/Api";
import { get } from "../../src/services/api";
import { UserService } from "../../src/services/user/userService";
import { colors } from "../../theme";

export default function ProfileSettingsScreen() {
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
            const response = await UserService.getProfile();
            const user = response?.data;

            if (!user) return;

            // Handle profile picture URL
            let profileImageUrl = "";
            if (user?.profilePic && user.profilePic !== "null" && user.profilePic !== "undefined") {
                if (user.profilePic.includes("googleusercontent")) {
                    profileImageUrl = user.profilePic;
                } else {
                    try {
                        const imageResponse = await get(`${Api.Image}?key=${user.profilePic}`);
                        profileImageUrl = imageResponse?.data?.url || "";
                    } catch {
                        profileImageUrl = user.profilePic;
                    }
                }
            }

            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                phone: user.phone || "",
                gender: user.gender || "",
                dob: user.dob ? (user.dob.includes("T") ? user.dob.split("T")[0] : user.dob) : "",
                address: user.address || "",
                cityState: user.cityState || "",
                pin: user.pin || "",
                country: user.country || "",
                profilePic: profileImageUrl,
                verified: !!user.verified,
            });

            // Set verification status
            if (user.verified) {
                setVerificationStatus("verified");
            } else if (user.verificationStatus) {
                setVerificationStatus(user.verificationStatus as any);
            } else {
                setVerificationStatus("not_verified");
            }
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to load profile data",
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
            if (response?.status === 200) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: response?.data?.message || "Profile updated successfully",
                });
                await fetchProfile();
            } else {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: (response as any)?.message || "Failed to update profile",
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
        // TODO: Implement image picker with expo-image-picker
        Toast.show({
            type: "info",
            text1: "Info",
            text2: "Profile picture upload functionality to be implemented",
        });
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
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4 text-gray-600">Loading profile...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* Header */}
                <View className="flex-row items-center px-4 pt-4 pb-6 bg-white border-b border-gray-200">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-center font-bold text-lg text-gray-900">
                        Profile setting
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <View className="px-4 pt-6">
                    {/* Profile Picture Section */}
                    <View className="items-center mb-6">
                        <View className="relative">
                            {profilePicLoading ? (
                                <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
                                    <ActivityIndicator size="small" color={colors.primary} />
                                </View>
                            ) : formData.profilePic ? (
                                <Image
                                    source={{ uri: formData.profilePic }}
                                    className="w-24 h-24 rounded-full"
                                    style={{ borderWidth: 2, borderColor: colors.border_primary }}
                                />
                            ) : (
                                <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
                                    <Ionicons name="person" size={40} color={colors.icon_secondary} />
                                </View>
                            )}
                            <TouchableOpacity
                                onPress={handleProfilePicChange}
                                className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1.5 border-2 border-white"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create-outline" size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text className="mt-3 text-gray-500 text-sm text-center">
                            {getVerificationText()}
                        </Text>

                        <TouchableOpacity
                            className={`mt-2 px-6 py-2 rounded-full ${
                                verificationStatus === "verified"
                                    ? "bg-green-500"
                                    : verificationStatus === "pending"
                                    ? "bg-yellow-500"
                                    : verificationStatus === "rejected"
                                    ? "bg-red-500"
                                    : "bg-black"
                            }`}
                            onPress={handleVerifyButtonClick}
                            disabled={verificationStatus === "verified" || verificationStatus === "pending"}
                            activeOpacity={0.7}
                            style={{
                                opacity:
                                    verificationStatus === "verified" || verificationStatus === "pending" ? 0.6 : 1,
                            }}
                        >
                            <Text className="text-white text-sm font-semibold">
                                {getVerifyButtonText()}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <View className="bg-white rounded-2xl p-4 shadow-sm">
                        {/* First Name & Last Name Row */}
                        <View className="flex-row gap-3 mb-5">
                            <View className="flex-1">
                                <TextInput
                                    placeholder="First Name *"
                                    placeholderTextColor={colors.text_secondary}
                                    value={formData.firstName}
                                    onChangeText={(text) => handleChange("firstName", text)}
                                    editable={!saving}
                                    className="rounded-xl px-4 py-3.5 text-base"
                                    style={{
                                        outline: "none",
                                        backgroundColor: colors.bg_white,
                                        borderColor: colors.border_primary,
                                        borderWidth: 1,
                                        color: colors.text_primary,
                                    }}
                                />
                            </View>
                            <View className="flex-1">
                                <TextInput
                                    placeholder="Last Name"
                                    placeholderTextColor={colors.text_secondary}
                                    value={formData.lastName}
                                    onChangeText={(text) => handleChange("lastName", text)}
                                    editable={!saving}
                                    className="rounded-xl px-4 py-3.5 text-base"
                                    style={{
                                        outline: "none",
                                        backgroundColor: colors.bg_white,
                                        borderColor: colors.border_primary,
                                        borderWidth: 1,
                                        color: colors.text_primary,
                                    }}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View className="mb-5">
                            <TextInput
                                placeholder="Email *"
                                placeholderTextColor={colors.text_secondary}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={formData.email}
                                onChangeText={(text) => handleChange("email", text)}
                                editable={false}
                                className="rounded-xl px-4 py-3.5 text-base"
                                style={{
                                    outline: "none",
                                    backgroundColor: colors.bg_white,
                                    borderColor: colors.border_primary,
                                    borderWidth: 1,
                                    color: colors.text_tertiary,
                                }}
                            />
                        </View>

                        {/* Phone */}
                        <View className="mb-5">
                            <TextInput
                                placeholder="Phone *"
                                placeholderTextColor={colors.text_secondary}
                                keyboardType="phone-pad"
                                value={formData.phone}
                                onChangeText={(text) => handleChange("phone", text)}
                                editable={!saving}
                                className="rounded-xl px-4 py-3.5 text-base"
                                style={{
                                    outline: "none",
                                    backgroundColor: colors.bg_white,
                                    borderColor: colors.border_primary,
                                    borderWidth: 1,
                                    color: colors.text_primary,
                                }}
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

                        {/* Address */}
                        <View className="mb-5">
                            <TextInput
                                placeholder="Address *"
                                placeholderTextColor={colors.text_secondary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={formData.address}
                                onChangeText={(text) => handleChange("address", text)}
                                editable={!saving}
                                className="rounded-xl px-4 py-3.5 text-base min-h-[100px]"
                                style={{
                                    outline: "none",
                                    backgroundColor: colors.bg_white,
                                    borderColor: colors.border_primary,
                                    borderWidth: 1,
                                    color: colors.text_primary,
                                }}
                            />
                        </View>

                        {/* City */}
                        <View className="mb-5">
                            <TextInput
                                placeholder="City"
                                placeholderTextColor={colors.text_secondary}
                                value={formData.cityState}
                                onChangeText={(text) => handleChange("cityState", text)}
                                editable={!saving}
                                className="rounded-xl px-4 py-3.5 text-base"
                                style={{
                                    outline: "none",
                                    backgroundColor: colors.bg_white,
                                    borderColor: colors.border_primary,
                                    borderWidth: 1,
                                    color: colors.text_primary,
                                }}
                            />
                        </View>

                        {/* PIN Code */}
                        <View className="mb-5">
                            <TextInput
                                placeholder="PIN Code"
                                placeholderTextColor={colors.text_secondary}
                                keyboardType="numeric"
                                value={formData.pin}
                                onChangeText={(text) => handleChange("pin", text)}
                                editable={!saving}
                                className="rounded-xl px-4 py-3.5 text-base"
                                style={{
                                    outline: "none",
                                    backgroundColor: colors.bg_white,
                                    borderColor: colors.border_primary,
                                    borderWidth: 1,
                                    color: colors.text_primary,
                                }}
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

                        {/* Save Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={saving}
                            className="mt-6 bg-lime-400 py-4 rounded-xl items-center"
                            style={{ opacity: saving ? 0.6 : 1 }}
                            activeOpacity={0.7}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Text className="font-bold text-black text-base">Save</Text>
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
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {/* Modal Header */}
                            <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
                                <Text className="text-lg font-bold text-gray-900">
                                    Identity Verification
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowVerificationModal(false)}
                                    className="p-2"
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close" size={24} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <View className="px-6 pt-6">
                                {/* Emirates ID Number */}
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-2">
                                        Emirates ID Number <Text className="text-red-500">*</Text>
                                    </Text>
                                    <TextInput
                                        placeholder="Enter Emirates ID Number"
                                        placeholderTextColor={colors.text_secondary}
                                        value={verificationForm.emiratesId}
                                        onChangeText={(text) => handleVerificationChange("emiratesId", text)}
                                        className="bg-gray-50 rounded-xl px-4 py-3 text-sm"
                                        style={{
                                            color: colors.text_primary,
                                            borderColor: verificationErrors.emiratesId ? colors.error : colors.border_primary,
                                            borderWidth: 1,
                                        }}
                                    />
                                    {verificationErrors.emiratesId && (
                                        <Text className="text-xs text-red-500 mt-1">
                                            {verificationErrors.emiratesId}
                                        </Text>
                                    )}
                                </View>

                                {/* Full Name */}
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-2">
                                        Full Name <Text className="text-red-500">*</Text>
                                    </Text>
                                    <TextInput
                                        placeholder="Enter Full Name"
                                        placeholderTextColor={colors.text_secondary}
                                        value={verificationForm.fullName}
                                        onChangeText={(text) => handleVerificationChange("fullName", text)}
                                        className="bg-gray-50 rounded-xl px-4 py-3 text-sm"
                                        style={{
                                            color: colors.text_primary,
                                            borderColor: verificationErrors.fullName ? colors.error : colors.border_primary,
                                            borderWidth: 1,
                                        }}
                                    />
                                    {verificationErrors.fullName && (
                                        <Text className="text-xs text-red-500 mt-1">
                                            {verificationErrors.fullName}
                                        </Text>
                                    )}
                                </View>

                                {/* Date of Birth */}
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-2">
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
                                        <Text className="text-xs text-red-500 mt-1">
                                            {verificationErrors.dob}
                                        </Text>
                                    )}
                                </View>

                                {/* Expiry Date */}
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-2">
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
                                        <Text className="text-xs text-red-500 mt-1">
                                            {verificationErrors.expiryDate}
                                        </Text>
                                    )}
                                </View>

                                {/* Image Upload Section */}
                                <View className="mb-6">
                                    <View className="flex-row gap-3">
                                        {/* Front Image */}
                                        <View className="flex-1">
                                            <Text className="text-sm font-medium text-gray-700 mb-2">
                                                (Emirates ID - Front image) <Text className="text-red-500">*</Text>
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => handleImageUpload("front")}
                                                className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center justify-center"
                                                style={{
                                                    minHeight: 120,
                                                    backgroundColor: verificationForm.frontImage ? "#F9FAFB" : "#FAFAFA",
                                                    borderColor: verificationErrors.frontImage ? colors.error : colors.border_primary,
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                {verificationForm.frontImage ? (
                                                    <Image
                                                        source={{ uri: verificationForm.frontImage }}
                                                        className="w-full h-24 rounded-lg"
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <>
                                                        <Ionicons name="arrow-up-circle-outline" size={32} color={colors.icon_secondary} />
                                                        <Text className="text-sm text-gray-600 mt-2">Upload</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            {verificationErrors.frontImage && (
                                                <Text className="text-xs text-red-500 mt-1">
                                                    {verificationErrors.frontImage}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Back Image */}
                                        <View className="flex-1">
                                            <Text className="text-sm font-medium text-gray-700 mb-2">
                                                (Emirates ID - Back image) <Text className="text-red-500">*</Text>
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => handleImageUpload("back")}
                                                className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center justify-center"
                                                style={{
                                                    minHeight: 120,
                                                    backgroundColor: verificationForm.backImage ? "#F9FAFB" : "#FAFAFA",
                                                    borderColor: verificationErrors.backImage ? colors.error : colors.border_primary,
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                {verificationForm.backImage ? (
                                                    <Image
                                                        source={{ uri: verificationForm.backImage }}
                                                        className="w-full h-24 rounded-lg"
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <>
                                                        <Ionicons name="arrow-up-circle-outline" size={32} color={colors.icon_secondary} />
                                                        <Text className="text-sm text-gray-600 mt-2">Upload</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            {verificationErrors.backImage && (
                                                <Text className="text-xs text-red-500 mt-1">
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
                                    className="bg-black py-4 rounded-xl items-center"
                                    style={{ opacity: submittingVerification ? 0.6 : 1 }}
                                    activeOpacity={0.7}
                                >
                                    {submittingVerification ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text className="text-white font-bold text-base">Submit</Text>
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
