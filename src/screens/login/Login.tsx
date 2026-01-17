import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import Toast from "react-native-toast-message";

import Logo from "@/assets/images/logo.svg";
import { post } from "@/src/services/api";
import { setToken } from "@/src/services/storage/tokenStorage";
import { Image } from "expo-image";
import { Api } from "./api";

export default function LoginScreen() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"email" | "mobile">("email");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mobile, setMobile] = useState("");
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Email and password are required",
            });
            return;
        }

        try {
            setLoading(true);

            const res = await post(Api.login, {
                value: email,
                password,
            });

            if (res.status === 200 && res.data) {
                await setToken(res.data.token);
                router.replace("/home");
            } else {
                Toast.show({
                    type: "error",
                    text1: "Login failed",
                    text2: res.message || "Invalid credentials",
                });
            }
        } catch {
            Toast.show({
                type: "error",
                text1: "Network error",
                text2: "Please try again",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = () => {
        router.replace("/home");
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 items-center justify-center px-6 py-8">
                    <View className="items-center mb-6">
                        <Image
                            source={Logo}
                            style={{ width: 256, height: 256 }}
                            contentFit="contain"
                            priority="high"
                            cachePolicy="memory-disk"
                            transition={200}
                        />
                    </View>

                    {/* Title */}
                    <Text className="mb-3 text-center text-lg font-medium text-gray-700">
                        Login to your Account
                    </Text>

                    {/* Email Login */}
                    {activeTab === "email" && (
                        <>
                            {/* Email */}
                            <View className="mb-4 w-full rounded-xl bg-gray-100 px-4 py-3">
                                <TextInput
                                    placeholder="Enter your email"
                                    placeholderTextColor="#9CA3AF"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                    editable={!loading}
                                    className="text-base text-gray-900"
                                />
                            </View>

                            {/* Password */}
                            <View className="mb-6 w-full rounded-xl bg-gray-100 px-4 py-3">
                                <TextInput
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                    editable={!loading}
                                    className="text-base text-gray-900"
                                />
                            </View>

                            {/* Submit Button */}
                            <Pressable
                                onPress={handleEmailLogin}
                                disabled={loading}
                                className={`mb-6 w-full rounded-xl py-4 shadow-md ${loading ? "bg-gray-400" : "bg-blue-900"
                                    }`}
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 3,
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-center text-base font-semibold text-white">
                                        Sign in
                                    </Text>
                                )}
                            </Pressable>

                            {/* Divider */}
                            <View className="mb-6">
                                <Text className="text-center text-sm text-gray-400">
                                    — Or sign in with —
                                </Text>
                            </View>

                            {/* Social Login Buttons */}
                            <View className="mb-6 flex-row justify-center">
                                {/* Google */}
                                <Pressable
                                    className="h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200 mr-3"
                                    style={{
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 2,
                                        elevation: 2,
                                    }}
                                >
                                    <Text className="text-xl font-bold text-gray-700">G</Text>
                                </Pressable>

                                {/* Facebook */}
                                <Pressable
                                    className="h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mr-3"
                                    style={{
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 2,
                                        elevation: 2,
                                    }}
                                >
                                    <Text className="text-base font-bold text-white">f</Text>
                                </Pressable>

                                {/* Twitter */}
                                <Pressable
                                    className="h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200"
                                    style={{
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 2,
                                        elevation: 2,
                                    }}
                                >
                                    <Text className="text-base font-bold text-blue-400">𝕏</Text>
                                </Pressable>
                            </View>

                            {/* Footer Sign Up */}
                            <View className="flex-row justify-center mb-4">
                                <Text className="text-sm text-gray-600">
                                    Don't have an account?{" "}
                                    <Text className="text-blue-600 font-medium">Sign up</Text>
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
