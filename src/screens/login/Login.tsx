// import { colors } from "@/theme";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

import Logo from "@/assets/images/logo.svg";
import {
    googleAndroidClientId,
    googleIosClientId,
    googleWebClientId,
} from "@/src/constants/env";
import { post } from "@/src/services/api";
import { setToken } from "@/src/services/storage/tokenStorage";
import { Api } from "./api";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const [googleRequest, , promptGoogleLogin] = Google.useAuthRequest({
        androidClientId: googleAndroidClientId,
        iosClientId: googleIosClientId,
        webClientId: googleWebClientId,

    });

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
                await setToken(res.token);
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

    const handleGoogleLogin = async () => {
        if (!googleRequest) {
            Toast.show({
                type: "error",
                text1: "Google Sign-In not ready",
                text2: "Please try again in a moment",
            });
            return;
        }

        try {
            setGoogleLoading(true);
            const result = await promptGoogleLogin();

            if (result?.type === "success") {
                Toast.show({
                    type: "success",
                    text1: "Logged in with Google",
                });
                router.replace("/home");
            } else if (result?.type !== "dismiss") {
                Toast.show({
                    type: "error",
                    text1: "Google Sign-In cancelled",
                });
            }
        } catch {
            Toast.show({
                type: "error",
                text1: "Google Sign-In failed",
                text2: "Please try again",
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGuestLogin = () => {
        router.replace("/home");
    };

    return (
        <View className="flex-1" style={{ backgroundColor: colors.bg_primary }}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
                className="flex-1"
                style={{ backgroundColor: colors.bg_primary }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 items-center justify-center px-6 py-8">
                    <View className="items-center mb-8">
                        <Logo width={200} height={200} />
                    </View>
                    <Text className="mb-8 text-center text-xl font-semibold" style={{ color: colors.text_primary }}>
                        Login to your Account
                    </Text>
                    <View className="w-full max-w-md">
                        <View className="mb-4 w-full">
                            <TextInput
                                placeholder="Email"
                                placeholderTextColor={colors.text_secondary}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                                editable={!loading}
                                className="w-full rounded-xl px-4 py-3.5 text-base"
                                style={{
                                    backgroundColor: colors.bg_white,
                                    borderColor: colors.border_primary,
                                    borderWidth: 1,
                                    color: colors.text_primary
                                }}
                            />
                        </View>
                        <View className="mb-6 w-full">
                            <View className="w-full rounded-xl px-4 py-3.5 flex-row items-center" style={{ backgroundColor: colors.bg_white, borderColor: colors.border_primary, borderWidth: 1 }}>
                                <TextInput
                                    placeholder="Password"
                                    placeholderTextColor={colors.text_secondary}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    editable={!loading}
                                    className="flex-1 text-base"
                                    style={{ color: colors.text_primary }}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="ml-2"
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color={colors.icon_secondary}
                                    />
                                </Pressable>
                            </View>
                        </View>
                        <Pressable
                            onPress={handleEmailLogin}
                            disabled={loading}
                            className="mb-8 w-full rounded-xl py-4"
                            style={{
                                backgroundColor: loading ? colors.bg_gray_400 : colors.primary,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 4,
                                elevation: 4,
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.text_light} />
                            ) : (
                                <Text className="text-center text-base font-semibold" style={{ color: colors.text_light }}>
                                    Sign in
                                </Text>
                            )}
                        </Pressable>
                        <View className="mb-6">
                            <Text className="text-center text-sm" style={{ color: colors.text_secondary }}>
                                — Or sign in with —
                            </Text>
                        </View>
                        <View className="mb-8 flex-row justify-center gap-3">
                            <Pressable
                                onPress={handleGoogleLogin}
                                disabled={googleLoading || !googleRequest}
                                className="h-12 w-12 items-center justify-center rounded-xl border"
                                style={{
                                    backgroundColor: colors.bg_white,
                                    borderColor: colors.border_primary,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2,
                                    elevation: 2,
                                }}
                            >
                                {googleLoading ? (
                                    <ActivityIndicator size="small" color={colors.icon_primary} />
                                ) : (
                                    <Text className="text-xl font-bold" style={{ color: colors.text_primary }}>G</Text>
                                )}
                            </Pressable>
                            <Pressable
                                className="h-12 w-12 items-center justify-center rounded-xl"
                                style={{
                                    backgroundColor: colors.primary,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2,
                                    elevation: 2,
                                }}
                            >
                                <Text className="text-base font-bold" style={{ color: colors.text_light }}>f</Text>
                            </Pressable>
                            <Pressable
                                className="h-12 w-12 items-center justify-center rounded-xl border"
                                style={{
                                    backgroundColor: colors.bg_white,
                                    borderColor: colors.border_primary,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2,
                                    elevation: 2,
                                }}
                            >
                                <Text className="text-base font-bold" style={{ color: colors.primary }}>𝕏</Text>
                            </Pressable>
                        </View>
                        <View className="flex-row justify-center">
                            <Text className="text-sm" style={{ color: colors.text_secondary }}>
                                Don&apos;t have an account?{" "}
                                <Text
                                    className="font-semibold"
                                    style={{ color: colors.text_primary }}
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