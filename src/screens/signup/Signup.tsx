import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { colors } from "@/theme";

import DatePicker from "@/src/components/DatePicker";
import Dropdown from "@/src/components/Dropdown";
import PasswordField from "@/src/components/PasswordField";
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
        // Dynamically import expo-location to avoid module resolution errors
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
        // Location is optional, so we continue without it
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

    // Validate required fields: First Name, Email, OTP verification, Password, Phone, Address, Country
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
        text2: "Please fill in all required fields (First Name, Email, Password, Phone, Address, Country)",
      });
      return;
    }

    // Validate terms acceptance
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
      const user = (res.data as any)?.data ?? (res.data as any)?.user ?? (res as any)?.user ?? null;

      const isFirstLogin =
        (res as any)?.isFirstLogin ??
        (res.data as any)?.isFirstLogin ??
        (res.data as any)?.user?.isFirstLogin ??
        (res.data as any)?.is_first_login ??
        false;

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
        router.replace("/home" as any);
      } else {
        // New users should go to preferences page
        router.replace("/preferences" as any);
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
    <View className="flex-1 bg-bg_primary">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        className="flex-1 bg-bg_primary"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-16 pb-4">
          <View className="mb-8">
            <Text className="mb-2 text-3xl font-bold text-text_primary">
              Create Account
            </Text>
            <Text className="text-base text-text_tertiary">
              Fill in your details to get started
            </Text>
          </View>

          <View className="w-full flex-row mb-5 gap-3">
            <View className="flex-1">
              <TextInput
                placeholder="First Name *"
                placeholderTextColor={colors.text_tertiary}
                value={data.firstName || ""}
                onChangeText={(text) => handleChange("firstName", text)}
                editable={!loading}
                className="rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_primary"
              />
            </View>

            <View className="flex-1">
              <TextInput
                placeholder="Last Name"
                placeholderTextColor={colors.text_tertiary}
                value={data.lastName || ""}
                onChangeText={(text) => handleChange("lastName", text)}
                editable={!loading}
                className="rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_primary"
              />
            </View>
          </View>

          {/* Email with OTP */}
          <View className="w-full mb-5">
            <View className="flex-row gap-2 items-center">
              <TextInput
                placeholder="Email *"
                placeholderTextColor={colors.text_tertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={data.email || ""}
                onChangeText={(text) => handleChange("email", text)}
                editable={!loading && !otpSent}
                className="flex-1 rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_primary"
              />
              {!otpSent && data.email && (
                <Pressable
                  onPress={handleSendOTP}
                  disabled={sendingOTP}
                  className={`rounded-xl justify-center items-center px-4 py-3.5 min-h-[50px] ${sendingOTP ? "bg-bg_gray_400" : "bg-primary"}`}
                  style={{ elevation: 2 }}
                >
                  {sendingOTP ? (
                    <ActivityIndicator color={colors.text_light} size="small" />
                  ) : (
                    <Text className="text-sm font-semibold text-text_light">
                      Send OTP
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>

          {/* Email OTP Verification */}
          {otpSent && !otpVerified && (
            <View className="w-full mb-5">
              <View className="flex-row gap-2">
                <TextInput
                  placeholder="Email OTP *"
                  placeholderTextColor={colors.text_tertiary}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={data.email_otp || ""}
                  onChangeText={(text) => handleChange("email_otp", text)}
                  editable={!loading}
                  className="flex-1 rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_primary"
                />
                <Pressable
                  onPress={handleVerifyOTP}
                  disabled={verifyingOTP}
                  className={`px-5 py-3.5 rounded-xl justify-center items-center min-w-[100px] ${verifyingOTP ? "bg-bg_gray_400" : "bg-success_btn"}`}
                  style={{ elevation: 2 }}
                >
                  {verifyingOTP ? (
                    <ActivityIndicator color={colors.text_light} size="small" />
                  ) : (
                    <Text className="text-sm font-semibold text-text_light">
                      Verify
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Password */}
          <PasswordField
            id="password"
            label="Password *"
            name="password"
            required={true}
            value={data.password || ""}
            onChange={handleChange}
            editable={!loading}
          />

          {/* Phone */}
          <View className="w-full mb-5">
            <TextInput
              placeholder="Phone *"
              placeholderTextColor={colors.text_tertiary}
              keyboardType="phone-pad"
              value={data.phone || ""}
              onChangeText={(text) => handleChange("phone", text)}
              editable={!loading}
              className="rounded-xl px-4 py-3.5 text-base bg-bg_white border border-border_primary text-text_primary"
            />
          </View>

          {/* Gender */}
          <Dropdown
            label="Gender"
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

          {/* Date of Birth */}
          <DatePicker
            label="Date of Birth"
            name="dob"
            value={data.dob || ""}
            onChange={handleChange}
            required={false}
          />

          {/* Address */}
          <View className="w-full mb-5">
            <TextInput
              placeholder="Address *"
              placeholderTextColor={colors.text_tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={data.address || ""}
              onChangeText={(text) => handleChange("address", text)}
              editable={!loading}
              className="rounded-xl px-4 py-3.5 text-base min-h-[100px] bg-bg_white border border-border_primary text-text_primary"
            />
          </View>

          {/* Country */}
          <Dropdown
            label="Country *"
            name="country"
            value={data.country || ""}
            onChange={handleChange}
            required={true}
            options={[
              { value: "", label: "" },
              { value: "india", label: "India" },
              { value: "usa", label: "United States" },
              { value: "uk", label: "United Kingdom" },
              { value: "canada", label: "Canada" },
              { value: "australia", label: "Australia" },
              { value: "uae", label: "UAE" },
              { value: "other", label: "Other" },
            ]}
          />

          {/* Terms Agreement */}
          <View className="mb-6 flex-row items-start">
            <Pressable
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              className="mr-3 mt-1"
            >
              <View
                className={`h-5 w-5 rounded border-2 items-center justify-center ${
                  acceptedTerms ? "bg-primary border-primary" : "bg-bg_white border-border_primary"
                }`}
              >
                {acceptedTerms && (
                  <Text className="text-xs font-bold text-text_light">✓</Text>
                )}
              </View>
            </Pressable>
            <Pressable
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              className="flex-1"
            >
              <Text className="text-xs leading-5 text-text_tertiary">
                By signing up, you agree to Dubeyo&apos;s{" "}
                <Text className="underline text-primary">Terms of Service</Text>{" "}
                and{" "}
                <Text className="underline text-primary">Privacy Policy</Text>
              </Text>
            </Pressable>
          </View>

          <Pressable
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
            className={`mb-6 w-full rounded-xl py-4 ${
              (loading ||
                !acceptedTerms ||
                !data.firstName ||
                !data.email ||
                !otpVerified ||
                !data.password ||
                !data.phone ||
                !data.address ||
                !data.country) ? "bg-bg_gray_400" : "bg-primary"
            }`}
            style={{ elevation: 4 }}
          >
            {loading ? (
              <ActivityIndicator color={colors.text_light} />
            ) : (
              <Text className="text-center text-base font-semibold text-text_light">
                Register
              </Text>
            )}
          </Pressable>

          <View className="flex-row justify-center pb-4">
            <Text className="text-sm text-text_tertiary">
              Already have an account?{" "}
              <Text
                className="font-semibold text-primary"
                onPress={() => router.push("/")}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
