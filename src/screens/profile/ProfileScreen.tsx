import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    Image,
    ImageBackground,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Api } from "../home/Api";
import { get } from "../../services/api";
import { UserService } from "../../services/user/userService";

export default function ProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            // Use /user/me API endpoint
            const response = await get(Api.profile);
            const userData = response?.data?.data || response?.data || response;

            if (userData) {
                // Handle profile picture URL
                let profileImageUrl = "";
                if (userData?.profilePic && userData.profilePic !== "null" && userData.profilePic !== "undefined") {
                    if (userData.profilePic.includes("googleusercontent") || userData.profilePic.startsWith("http")) {
                        profileImageUrl = userData.profilePic;
                    } else {
                        try {
                            const imageResponse = await get(`${Api.Image}?key=${userData.profilePic}`);
                            profileImageUrl = imageResponse?.data?.url || imageResponse?.data || "";
                        } catch {
                            profileImageUrl = userData.profilePic;
                        }
                    }
                }

                // Format joined date if available
                let joinedDate = null;
                if (userData.createdAt || userData.created_at || userData.joinedDate) {
                    joinedDate = userData.createdAt || userData.created_at || userData.joinedDate;
                }

                // Set user data with all fields
                setUser({
                    ...userData,
                    profilePic: profileImageUrl || userData.profilePic,
                    joinedDate: joinedDate,
                    // Ensure name fields are available
                    firstName: userData.firstName || userData.first_name || "",
                    lastName: userData.lastName || userData.last_name || "",
                    email: userData.email || "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await UserService.logout();
        router.replace("/");
    };

    const MenuItem = ({
        icon,
        label,
        onPress,
        isLast = false,
    }: {
        icon: string;
        label: string;
        onPress?: () => void;
        isLast?: boolean;
    }) => (
        <TouchableOpacity
            className={`flex-row items-center justify-between py-4 ${!isLast ? "border-b border-gray-100" : ""
                }`}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center">
                <Ionicons name={icon as any} size={20} color="#374151" />
                <Text className="ml-3 text-gray-800 font-medium text-base">{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchProfile} />
                }
            >
                {/* Header Section */}
                <View className="bg-white pb-6 relative">
                    {/* Banner Background */}
                    <View className="w-full overflow-hidden" style={{ height: 160 }}>
                        <ImageBackground
                            source={require("../../../assets/images/banner.png")}
                            resizeMode="cover"
                            style={{ 
                                width: '100%', 
                                height: '100%',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start'
                            }}
                        >
                            <TouchableOpacity
                                className="absolute top-12 left-4 bg-white/80 p-2 rounded-full z-10"
                                onPress={() => router.back()}
                            >
                                <Ionicons name="arrow-back" size={24} color="#000" />
                            </TouchableOpacity>
                        </ImageBackground>
                    </View>

                    {/* Profile Card Overlay */}
                    <View className="px-4 -mt-12 flex-row items-end">
                        {/* Avatar */}
                        <View 
                            className="rounded-full p-1 bg-white shadow-sm"
                            style={{ borderWidth: 4, borderColor: 'white' }}
                        >
                            <Image
                                source={{
                                    uri: user?.profilePic || "https://randomuser.me/api/portraits/men/32.jpg",
                                }}
                                className="w-24 h-24 rounded-full"
                                resizeMode="cover"
                            />
                        </View>

                        {/* Info */}
                        <View className="flex-1 ml-4 mb-2">
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1">
                                    <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
                                        {user?.firstName || user?.lastName
                                            ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
                                            : user?.name || "User Name"}
                                    </Text>
                                    <Text className="text-blue-900 text-sm font-medium mt-1" numberOfLines={1}>
                                        {user?.email || "user@example.com"}
                                    </Text>
                                    {user?.joinedDate && (
                                        <Text className="text-gray-400 text-xs mt-0.5">
                                            Joined on {new Date(user.joinedDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                        </Text>
                                    )}
                                </View>

                                <TouchableOpacity
                                    className="bg-black px-4 py-1.5 rounded-full"
                                    onPress={() => router.push("/profile/edit" as any)}
                                >
                                    <Text className="text-white text-xs font-semibold">Edit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Action Pills */}
                    <View className="mt-6 px-4 flex-row space-x-3">
                        <TouchableOpacity className="flex-1 bg-white border border-gray-100 rounded-full py-2 px-1 flex-row items-center justify-center shadow-sm">
                            <View className="w-4 h-4 rounded-full bg-blue-00 items-center justify-center mr-2">
                                <Ionicons name="add" size={10} color="#F97316" />
                            </View>
                            <Text className="text-gray-700 text-xs font-medium">Add Mobile Number</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-1 bg-white border border-gray-100 rounded-full py-2 px-1 flex-row items-center justify-center shadow-sm">
                            <View className="w-4 h-4 rounded-full bg-red-100 items-center justify-center mr-2">
                                <Ionicons name="shield-checkmark" size={10} color="#EF4444" />
                            </View>
                            <Text className="text-gray-700 text-xs font-medium">Verify account</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* My Search - Standalone Item based on image */}
                <View className="mt-4 px-4">
                    <View className="bg-white rounded-2xl px-4 py-1 shadow-sm">
                        <MenuItem icon="search-outline" label="My search" />
                    </View>
                </View>

                {/* Personal Section */}
                <View className="mt-6 px-4">
                    <Text className="text-lg font-bold text-gray-900 mb-3 ml-1">Personal</Text>
                    <View className="bg-white rounded-3xl p-4 shadow-sm">
                        <MenuItem 
                            icon="person-outline" 
                            label="Profile Setting" 
                            onPress={() => router.push("/profile/edit" as any)}
                        />
                        <MenuItem icon="settings-outline" label="Account Setting" />
                        <MenuItem icon="notifications-outline" label="Notification Setting" />
                        <MenuItem 
                            icon="lock-closed-outline" 
                            label="Security" 
                            isLast 
                            onPress={() => router.push("/profile/security" as any)}
                        />
                    </View>
                </View>

                {/* General Section */}
                <View className="mt-6 px-4">
                    <Text className="text-lg font-bold text-gray-900 mb-3 ml-1">General</Text>
                    <View className="bg-white rounded-3xl p-4 shadow-sm">
                        <MenuItem icon="business-outline" label="City" />
                        <MenuItem icon="language-outline" label="Language" isLast />
                    </View>
                </View>

                {/* Others Section */}
                <View className="mt-6 px-4">
                    <Text className="text-lg font-bold text-gray-900 mb-3 ml-1">Others</Text>
                    <View className="bg-white rounded-3xl p-4 shadow-sm">
                        <MenuItem icon="headset-outline" label="Support" />
                        <MenuItem icon="call-outline" label="Call us" isLast />
                    </View>
                </View>

                {/* Logout Button */}
                <View className="px-4 mt-8 mb-10">
                    <TouchableOpacity
                        className="w-full bg-blue-900 py-4 rounded-2xl items-center shadow-sm active:bg-blue-900"
                        onPress={handleLogout}
                    >
                        <Text className="text-white text-lg font-bold">Log out</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}
