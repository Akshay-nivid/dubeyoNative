import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Defs, RadialGradient, Rect, Stop, Svg } from "react-native-svg";
import Toast from "react-native-toast-message";

import DatePicker from "@/src/components/DatePicker";
import Dropdown from "@/src/components/Dropdown";
import { post } from "@/src/services/api";
import { setToken } from "@/src/services/storage/tokenStorage";
import { Api } from "./api";

export default function SignupScreen() {
  const router = useRouter();

  const [data, setData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phone?: string;
    gender?: string;
    dob?: string;
    address?: string;
    country?: string;
    email_otp?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [location, setLocation] = useState<{
    type: string;
    coordinates: number[];
  } | null>(null);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (name: string, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOTP = async () => {
    if (!data.email) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter your email address first",
      });
      return;
    }

    try {
      setSendingOTP(true);
      const res = await post(Api.sendEmailOTP, { email: data.email });

      if (res.status === 200) {
        setOtpSent(true);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: res.data?.message || "OTP sent successfully",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: res.data?.message || "Failed to send OTP. Please try again.",
        });
      }
      setSendingOTP(false);
    } catch (err: any) {
      setSendingOTP(false);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send OTP. Please try again.";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      });
    }
  };

  const handleVerifyOTP = async () => {
    if (!data.email_otp) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter the OTP",
      });
      return;
    }

    try {
      setVerifyingOTP(true);
      const res = await post(Api.verifyEmailOTP, {
        email: data.email,
        otp: data.email_otp,
      });

      if (res.status === 200) {
        setOtpVerified(true);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: res.data?.message || "OTP verified successfully!",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: res.data?.message || "Invalid OTP. Please try again.",
        });
      }
      setVerifyingOTP(false);
    } catch (err: any) {
      setVerifyingOTP(false);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid OTP. Please try again.";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const Location = await import("expo-location");

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission denied");
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation({
          type: "Point",
          coordinates: [position.coords.longitude, position.coords.latitude],
        });
      } catch (error) {
        console.warn("Location error:", error);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (loading) return;

    if (!otpVerified) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please verify your email OTP before signing up.",
      });
      return;
    }

    if (
      !data.firstName ||
      !data.email ||
      !data.password ||
      !data.phone ||
      !data.address ||
      !data.country
    ) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all required fields",
      });
      return;
    }

    // Basic Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address",
      });
      return;
    }

    if (data.password.length < 8) {
      Toast.show({
        type: "error",
        text1: "Weak Password",
        text2: "Password must be at least 8 characters long",
      });
      return;
    }

    if (data.phone.length < 10) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone",
        text2: "Please enter a valid phone number (min 10 digits)",
      });
      return;
    }

    if (!acceptedTerms) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please accept the Terms of Service and Privacy Policy",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...data,
        location: location ?? null,
      };

      const res = await post(Api.Register, payload);

      if (res.status !== 200) {
        const msg = res?.data?.message || "Signup failed. Please try again.";
        Toast.show({
          type: "error",
          text1: "Signup Failed",
          text2: msg,
        });
        setLoading(false);
        return;
      }

      const token = (res.data as any)?.token ?? (res as any)?.token ?? null;

      const hasCompletedPreferences =
        (res as any)?.hasCompletedPreferences ??
        (res.data as any)?.hasCompletedPreferences ??
        (res.data as any)?.user?.hasCompletedPreferences ??
        (res.data as any)?.has_completed_preferences ??
        false;

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Signup succeeded but no token returned. Please login.",
        });
        setLoading(false);
        return;
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: res.data?.message || "Account created successfully",
      });

      await setToken(token);
      setLoading(false);

      if (hasCompletedPreferences) {
        router.replace("/home");
      } else {
        router.replace("/preferences");
      }
    } catch (err: any) {
      console.log(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Signup failed. Please check your details and try again.";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: msg,
      });
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* 1. Background Gradient (Fixed) */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      >
        <Svg height="50%" width="100%" style={{ position: "absolute", top: 0 }}>
          <Defs>
            <RadialGradient
              id="grad1"
              cx="0%"
              cy="40%"
              rx="60%"
              ry="50%"
              fx="0%"
              fy="40%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#ddd7f9ff" stopOpacity="1" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id="grad2"
              cx="100%"
              cy="50%"
              rx="70%"
              ry="60%"
              fx="100%"
              fy="50%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#ddd7f9ff" stopOpacity="1" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="#fff" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
        </Svg>
      </View>

      {/* 2. Fixed Header (Absolute, Top) */}
      <View className="absolute top-0 left-0 right-0 px-6 pt-28 pb-6 z-10 pointer-events-none">
        <Text className="text-[#6944c7] text-3xl font-bold mb-2">
          Create your account
        </Text>
        <Text className="text-gray-500 text-sm">
          Fill in your details to get started
        </Text>
      </View>

      {/* 3. Scrolling Content (Main View) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, zIndex: 20 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Spacer for Header Height */}
          <View style={{ height: 180 }} />

          {/* White Card Container (Modal) */}
          <View
            className="flex-1 bg-white rounded-t-[32px] overflow-hidden pt-8 px-6 pb-12 shadow-sm"
            style={{ minHeight: 600 }}
          >
            {/* Tabs */}
            <View className="flex-row bg-gray-100 p-1 rounded-xl mb-6">
              <TouchableOpacity
                className="flex-1 py-3 items-center"
                onPress={() => router.replace("/login")}
                accessibilityRole="button"
                accessibilityLabel="Switch to Login"
              >
                <Text className="font-medium text-gray-500">Login</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-white py-3 rounded-lg shadow-sm items-center">
                <Text className="font-bold text-gray-900">Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View>
              {/* First Name & Last Name */}
              <View className="flex-row gap-3 mb-5">
                <View className="flex-1">
                  <Text className="text-gray-600 font-medium mb-2 ml-1">
                    First Name
                  </Text>
                  <TextInput
                    placeholder="First Name"
                    placeholderTextColor="#9CA3AF"
                    value={data.firstName || ""}
                    onChangeText={(text) => handleChange("firstName", text)}
                    editable={!loading}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-base text-gray-900"
                    accessibilityLabel="First Name"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 font-medium mb-2 ml-1">
                    Last Name
                  </Text>
                  <TextInput
                    placeholder="Last Name"
                    placeholderTextColor="#9CA3AF"
                    value={data.lastName || ""}
                    onChangeText={(text) => handleChange("lastName", text)}
                    editable={!loading}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-base text-gray-900"
                    accessibilityLabel="Last Name"
                  />
                </View>
              </View>

              {/* Email with OTP */}
              <View className="mb-5">
                <Text className="text-gray-600 font-medium mb-2 ml-1">
                  Email
                </Text>
                <View className="flex-row items-center w-full bg-gray-50 border border-gray-100 rounded-2xl pr-2">
                  <TextInput
                    placeholder="your@gmail.com"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={data.email || ""}
                    onChangeText={(text) => handleChange("email", text)}
                    editable={!loading && !otpSent}
                    className="flex-1 px-5 py-4 text-base text-gray-900"
                    accessibilityLabel="Email Address"
                  />
                  {!otpSent && data.email && (
                    <TouchableOpacity
                      onPress={handleSendOTP}
                      disabled={sendingOTP}
                      className={`px-4 py-2 rounded-xl ${sendingOTP ? "bg-gray-300" : "bg-[#6944c7]"}`}
                      accessibilityRole="button"
                      accessibilityLabel="Send OTP"
                    >
                      {sendingOTP ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white text-xs font-semibold">
                          Send OTP
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* OTP Verification */}
              {otpSent && !otpVerified && (
                <View className="mb-5">
                  <Text className="text-gray-600 font-medium mb-2 ml-1">
                    Enter OTP
                  </Text>
                  <View className="flex-row items-center w-full bg-gray-50 border border-gray-100 rounded-2xl pr-2">
                    <TextInput
                      placeholder="123456"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={data.email_otp || ""}
                      onChangeText={(text) => handleChange("email_otp", text)}
                      editable={!loading}
                      className="flex-1 px-5 py-4 text-base text-gray-900"
                      accessibilityLabel="OTP Code"
                    />
                    <TouchableOpacity
                      onPress={handleVerifyOTP}
                      disabled={verifyingOTP}
                      className={`px-4 py-2 rounded-xl ${verifyingOTP ? "bg-gray-300" : "bg-green-500"}`}
                      accessibilityRole="button"
                      accessibilityLabel="Verify OTP"
                    >
                      {verifyingOTP ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white text-xs font-semibold">
                          Verify
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Password */}
              <View className="mb-5">
                <Text className="text-gray-600 font-medium mb-2 ml-1">
                  Password
                </Text>
                <View className="flex-row items-center w-full bg-gray-50 border border-gray-100 rounded-2xl px-5">
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    value={data.password || ""}
                    onChangeText={(text) => handleChange("password", text)}
                    secureTextEntry={!showPassword}
                    className="flex-1 py-4 text-base text-gray-900"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    accessibilityLabel="Password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Phone */}
              <View className="mb-5">
                <Text className="text-gray-600 font-medium mb-2 ml-1">
                  Phone
                </Text>
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={data.phone || ""}
                  onChangeText={(text) => handleChange("phone", text)}
                  editable={!loading}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-base text-gray-900"
                  accessibilityLabel="Phone Number"
                />
              </View>

              {/* Gender */}
              <View className="mb-1">
                <Text className="text-gray-600 font-medium mb-2 ml-1">
                  Gender
                </Text>
                <Dropdown
                  label=""
                  name="gender"
                  value={data.gender || ""}
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
              </View>

              {/* Date of Birth */}
              <View className="mb-1">
                <Text className="text-gray-600 font-medium mb-2 ml-1">
                  Date of Birth
                </Text>
                <DatePicker
                  label=""
                  name="dob"
                  value={data.dob || ""}
                  onChange={handleChange}
                  required={false}
                />
              </View>

              {/* Address */}
              <View className="mb-5 mt-4">
                <Text className="text-gray-600 font-medium mb-2 ml-1">
                  Address
                </Text>
                <TextInput
                  placeholder="Full Address"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={data.address || ""}
                  onChangeText={(text) => handleChange("address", text)}
                  editable={!loading}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-base text-gray-900 min-h-[100px]"
                  accessibilityLabel="Full Address"
                />
              </View>

              {/* Country */}
              <View className="mb-5">
                <Text className="text-gray-600 font-medium mb-2 ml-1">
                  Country
                </Text>
                <Dropdown
                  label=""
                  name="country"
                  value={data.country || ""}
                  onChange={handleChange}
                  required={true}
                  options={[
                    { value: "", label: "Select Country" },
                    { value: "india", label: "India" },
                    { value: "usa", label: "United States" },
                    { value: "uk", label: "United Kingdom" },
                    { value: "canada", label: "Canada" },
                    { value: "australia", label: "Australia" },
                    { value: "uae", label: "UAE" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </View>

              {/* Terms Agreement */}
              <View className="mb-8 flex-row items-start px-1">
                <TouchableOpacity
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  className="mr-3 mt-1"
                  accessibilityRole="checkbox"
                  accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
                  accessibilityState={{ checked: acceptedTerms }}
                >
                  <View
                    className={`h-5 w-5 rounded border items-center justify-center ${
                      acceptedTerms
                        ? "bg-[#6944c7] border-[#6944c7]"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {acceptedTerms && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  className="flex-1"
                >
                  <Text className="text-xs leading-5 text-gray-500">
                    By signing up, you agree to Dubeyo's{" "}
                    <Text className="underline text-[#6944c7]">
                      Terms of Service
                    </Text>{" "}
                    and{" "}
                    <Text className="underline text-[#6944c7]">
                      Privacy Policy
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={
                  loading ||
                  !acceptedTerms ||
                  !data.firstName ||
                  !data.email ||
                  !otpVerified ||
                  !data.password ||
                  !data.phone ||
                  !data.address ||
                  !data.country
                }
                className={`w-full rounded-2xl py-4 items-center shadow-sm shadow-purple-200 mb-8 ${
                  loading ||
                  !acceptedTerms ||
                  !data.firstName ||
                  !data.email ||
                  !otpVerified ||
                  !data.password ||
                  !data.phone ||
                  !data.address ||
                  !data.country
                    ? "bg-purple-300"
                    : "bg-[#6944c7]"
                }`}
                accessibilityRole="button"
                accessibilityLabel="Register Account"
                accessibilityState={{ disabled: loading }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-lg font-semibold">
                    Register
                  </Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row justify-center pb-8">
                <Text className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <Text
                    className="font-semibold text-[#6944c7]"
                    onPress={() => router.replace("/login")}
                    accessibilityRole="link"
                    accessibilityLabel="Go to Login"
                  >
                    Sign In
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
