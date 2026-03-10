import PasswordField from "@/src/components/PasswordField";
import { Api } from "@/src/screens/login/api";
import { post } from "@/src/services/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState<"email" | "update">("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [sendingOTP, setSendingOTP] = useState(false);
    const handleSendOTP = async () => {
        if (!email) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Please enter your email address",
            });
            return;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Please provide a valid email address",
            });
            return;
        }
        try {
            setSendingOTP(true);
            const res = await post(Api.forgotPassword, { email });
            if (res.status === 200) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: res.data?.message || "OTP sent successfully to your email",
                });
                setStep("update");
            } else {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: res.data?.message || "Failed to send OTP. Please try again.",
                });
            }
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: err?.response?.data?.message || err?.message || "Failed to send OTP. Please try again.",
            });
        } finally {
            setSendingOTP(false);
        }
    };
    const handleUpdatePassword = async () => {
        if (!otp || !password || !confirmPassword) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Please fill in all fields",
            });
            return;
        }
        if (password !== confirmPassword) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Passwords do not match",
            });
            return;
        }
        if (password.length < 6) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Password must be at least 6 characters long",
            });
            return;
        }
        try {
            setLoading(true);
            const res = await post(Api.updatePassword, {
                email,
                otp,
                password: password.trim(),
                confirmPassword: confirmPassword.trim(),
            });
            if (res.status === 200) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: res.data?.message || "Password updated successfully",
                });
                router.replace("/");
            } else {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: res.data?.message || res.data?.Message || "Failed to update password. Please try again.",
                });
            }
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: err?.response?.data?.message || err?.message || "Failed to update password. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };
    return (
        <View className="flex-1 bg-palette_light_cream">
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
                className="flex-1 bg-palette_light_cream"
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 items-center justify-center px-6 py-8">
                    {/* Back Button */}
                    <Pressable
                        onPress={() => router.back()}
                        className="absolute top-12 left-6 z-10"
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text_primary} />
                    </Pressable>
                    <Text className="mb-8 text-center text-xl font-semibold text-text_primary">
                        {step === "email" ? "Forgot Password" : "Update Password"}
                    </Text>
                    <View className="w-full max-w-md">
                        {step === "email" ? (
                            <>
                                <View className="mb-4 w-full">
                                    <TextInput
                                        placeholder="Email"
                                        placeholderTextColor={colors.bg_gray_400}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        value={email}
                                        onChangeText={setEmail}
                                        editable={!sendingOTP}
                                        className="w-full rounded-xl px-4 py-3.5 text-base bg-white border border-border_primary text-text_primary"
                                    />
                                </View>
                                <Pressable
                                    onPress={handleSendOTP}
                                    disabled={sendingOTP}
                                    className={`mb-8 w-full rounded-xl py-4 ${sendingOTP ? 'bg-bg_gray_400' : 'bg-primary'}`}
                                    style={sendingOTP ? {} : {
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 4,
                                        elevation: 4,
                                    }}
                                >
                                    {sendingOTP ? (
                                        <ActivityIndicator color={colors.text_light} />
                                    ) : (
                                        <Text className="text-center text-base font-semibold text-palette_light_cream">
                                            Send OTP
                                        </Text>
                                    )}
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <View className="mb-4 w-full">
                                    <Text className="mb-2 text-sm text-text_tertiary">
                                        OTP sent to {email}
                                    </Text>
                                    <TextInput
                                        placeholder="Enter 6-digit OTP"
                                        placeholderTextColor={colors.bg_gray_400}
                                        keyboardType="number-pad"
                                        value={otp}
                                        onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, "").slice(0, 6))}
                                        maxLength={6}
                                        editable={!loading}
                                        className="w-full rounded-xl px-4 py-3.5 text-base bg-white border border-border_primary text-text_primary"
                                    />
                                </View>
                                <PasswordField
                                    id="new_password"
                                    label="New Password"
                                    name="password"
                                    value={password}
                                    onChange={(_, value) => setPassword(value)}
                                    editable={!loading}
                                />
                                <PasswordField
                                    id="confirm_password"
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(_, value) => setConfirmPassword(value)}
                                    editable={!loading}
                                />
                                <Pressable
                                    onPress={() => setStep("email")}
                                    className="mb-4 self-end"
                                >
                                    <Text className="text-sm font-semibold text-primary">
                                        Change email
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleUpdatePassword}
                                    disabled={loading}
                                    className={`mb-8 w-full rounded-xl py-4 ${loading ? 'bg-bg_gray_400' : 'bg-primary'}`}
                                    style={loading ? {} : {
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
                                        <Text className="text-center text-base font-semibold text-palette_light_cream">
                                            Update Password
                                        </Text>
                                    )}
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}