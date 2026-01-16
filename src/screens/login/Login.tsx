import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import { post } from "@/src/services/api";
import { Api } from "./api";
import { setToken } from "@/src/services/storage/tokenStorage";
import FloatingInput from "@/src/components/FloatingInput";
import { Image } from "react-native";
import Logo from "@/assets/images/logo.png";

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
    <View className="mb-6 text-center px-6 bg-white ">
        <Image
        source={Logo}
      />
      {/* <Text className="mb-6 text-center text-2xl font-semibold">
        Dubeyo
      </Text> */}

      {/* Tabs */}
      <View className="mb-6 flex-row rounded-lg border border-gray-200 bg-gray-100 p-1">
        <Pressable
          onPress={() => setActiveTab("email")}
          className={`flex-1 rounded-md py-2 ${
            activeTab === "email" ? "bg-white" : ""
          }`}
        >
          <Text className="text-center font-medium">Email</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("mobile")}
          className={`flex-1 rounded-md py-2 ${
            activeTab === "mobile" ? "bg-white" : ""
          }`}
        >
          <Text className="text-center font-medium">Mobile OTP</Text>
        </Pressable>
      </View>

      {/* Email Login */}
      {activeTab === "email" && (
        <>
          {/* Email */}
          <View className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
            <Text className="text-xs text-gray-400">Email</Text>
            <TextInput
              placeholder="Enter your email"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              className="text-base text-gray-900"
            />
          </View>

          {/* Password */}
          <View className="mb-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
            <Text className="text-xs text-gray-400">Password</Text>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              className="text-base text-gray-900"
            />
          </View>

          <Text className="mb-4 text-right text-sm text-gray-500">
            Forgot password?
          </Text>

          {/* Submit */}
          <Pressable
            onPress={handleEmailLogin}
            disabled={loading}
            className={`mb-4 rounded-lg py-3 ${
              loading ? "bg-gray-400" : "bg-black"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center font-semibold text-white">
                Sign In
              </Text>
            )}
          </Pressable>

          {/* Divider */}
          <View className="my-4 flex-row items-center">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-2 text-gray-400 text-sm">or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Guest */}
          <Pressable
            onPress={handleGuestLogin}
            className="rounded-lg border border-gray-200 py-3"
          >
            <Text className="text-center font-medium">
              Continue as Guest
            </Text>
          </Pressable>
        </>
      )}

      {/* Mobile OTP */}
      {activeTab === "mobile" && (
        <View className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
          <Text className="text-xs text-gray-400">Mobile Number</Text>
          <TextInput
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
            className="text-base text-gray-900"
          />
          <Text className="mt-2 text-xs text-gray-500">
            Mobile OTP coming soon
          </Text>
        </View>
      )}
    </View>
  );
}
