import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { UserService } from "../../services/user/userService";

export default function ProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await UserService.getProfile();
            if (response?.data) {
                setUser(response.data);
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
                    {/* Cover Image / Top Background - Using a placeholder pattern or gray if no cover */}
                    <View className="h-40 bg-gray-200 w-full overflow-hidden">
                        {/* Using a static placeholder for cover as per design reference feeling */}
                        <Image
                            source={{ uri: "https://c0.wallpaperflare.com/preview/200/328/948/mockup-packaging-box-product.jpg" }}
                            className="w-full h-full opacity-50"
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            className="absolute top-12 left-4 bg-white/80 p-2 rounded-full z-10"
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Profile Card Overlay */}
                    <View className="px-4 -mt-12 flex-row items-end">
                        {/* Avatar */}
                        <View className="rounded-full p-1 bg-white shadow-sm">
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
                                <View>
                                    <Text className="text-xl font-bold text-gray-900">
                                        {user?.name || user?.firstName ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name : "User Name"}
                                    </Text>
                                    <Text className="text-orange-500 text-sm font-medium">
                                        {user?.email || "user@example.com"}
                                    </Text>
                                    <Text className="text-gray-400 text-xs mt-0.5">
                                        Joined on {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "September 2026"}
                                    </Text>
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
                            <View className="w-4 h-4 rounded-full bg-orange-100 items-center justify-center mr-2">
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
                        <MenuItem icon="person-outline" label="Profile Setting" />
                        <MenuItem icon="settings-outline" label="Account Setting" />
                        <MenuItem icon="notifications-outline" label="Notification Setting" />
                        <MenuItem icon="lock-closed-outline" label="Security" isLast />
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
                        className="w-full bg-orange-500 py-4 rounded-2xl items-center shadow-sm active:bg-orange-600"
                        onPress={handleLogout}
                    >
                        <Text className="text-white text-lg font-bold">Log out</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}
