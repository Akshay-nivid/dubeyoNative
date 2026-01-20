import { Ionicons } from "@expo/vector-icons";
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
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
                    text2: res.data?.message || "Invalid credentials",
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
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 items-center justify-center px-6 py-8">
                    {/* Logo */}
                    <View className="items-center mb-8">
                        <Image
                            source={Logo}
                            style={{ width: 200, height: 200 }}
                            contentFit="contain"
                            priority="high"
                            cachePolicy="memory-disk"
                            transition={200}
                        />
                    </View>

                    {/* Title */}
                    <Text className="mb-8 text-center text-xl font-semibold text-gray-800">
                        Login to your Account
                    </Text>

                    {/* Email Login */}
                    
                        <View className="w-full max-w-md">
                            {/* Email */}
                            <View className="mb-4 w-full">
                                <TextInput
                                    placeholder="Email"
                                    placeholderTextColor="#9CA3AF"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                    editable={!loading}
                                    className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3.5 text-base text-gray-900"
                                    style={{ outline: "none" }}
                                />
                            </View>

                            {/* Password */}
                            <View className="mb-6 w-full">
                                <View className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3.5 flex-row items-center">
                                    <TextInput
                                        placeholder="Password"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                        editable={!loading}
                                        className="flex-1 text-base text-gray-900"
                                        style={{ outline: "none" }}
                                    />
                                    <Pressable
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="ml-2"
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#6B7280"
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Submit Button */}
                            <Pressable
                                onPress={handleEmailLogin}
                                disabled={loading}
                                className={`mb-8 w-full rounded-xl py-4 ${loading ? "bg-gray-400" : "bg-blue-900"
                                    }`}
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 4,
                                    elevation: 4,
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
                            <View className="mb-8 flex-row justify-center gap-3">
                                {/* Google */}
                                <Pressable
                                    className="h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-300"
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
                                    className="h-12 w-12 items-center justify-center rounded-xl bg-blue-600"
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
                                    className="h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-300"
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
                            <View className="flex-row justify-center">
                                <Text className="text-sm text-gray-500">
                                    Don't have an account?{" "}
                                    <Text
                                        className="text-gray-700 font-semibold"
                                        onPress={() => router.push("/signup")}
                                    >
                                        Sign up
                                    </Text>
                                </Text>
                            </View>
                        </View>
                    
                </View>
            </ScrollView>
        </View>
    );
}
