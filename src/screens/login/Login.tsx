// import {
//     googleWebClientId,
// } from "@/src/constants/env";
import { post } from "@/src/services/api";
import {
  getCredentials,
  removeCredentials,
  setCredentials,
  setToken,
} from "@/src/services/storage/tokenStorage";
import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
// import {
//     GoogleSignin,
//     isErrorWithCode,
//     statusCodes,
// } from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Defs, RadialGradient, Rect, Stop, Svg } from "react-native-svg";
import Toast from "react-native-toast-message";
import { Api } from "./api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      const credentials = await getCredentials();
      if (credentials) {
        setEmail(credentials.email);
        if (credentials.password) setPassword(credentials.password);
        setRememberMe(true);
      }
    };
    loadCredentials();

    // Configure Google Sign-In
    //     GoogleSignin.configure({
    //         webClientId: googleWebClientId, // From app.json/env
    //         offlineAccess: true,
    //         // scopes: ['profile', 'email'],
    // });
  }, []);

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

        if (rememberMe) {
          await setCredentials({ email, password });
        } else {
          await removeCredentials();
        }

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

  // const handleGoogleLogin = async () => {
  //     try {
  //         setGoogleLoading(true);
  //         await GoogleSignin.hasPlayServices();

  //         // Sign out first so the account picker always appears
  //         try { await GoogleSignin.signOut(); } catch { }

  //         const userInfo = await GoogleSignin.signIn();

  //         console.log("Google User Info:", userInfo);

  //         if (userInfo.data?.idToken) {
  //             // Send Google ID token to backend for authentication & JWT
  //             const res = await post(Api.googleLogin, {
  //                 credential: userInfo.data.idToken,
  //             });

  //             if (res.status === 200 && res.data) {
  //                 // Store the backend JWT (not Firebase token)
  //                 const jwt = res.data.token || res.token;
  //                 if (jwt) await setToken(jwt);

  //                 // Optionally sign into Firebase for Firebase services
  //                 try {
  //                     const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
  //                     await auth().signInWithCredential(googleCredential);
  //                 } catch (fbErr) {
  //                     console.warn("Firebase sign-in skipped:", fbErr);
  //                 }

  //                 // Toast.show({
  //                 //     type: "success",
  //                 //     text1: "Logged in with Google",
  //                 // });

  //                 // New users go to preferences, returning users go to home
  //                 const isNewUser = res.data.isNewUser ?? res.data.user?.isNewUser;
  //                 if (isNewUser) {
  //                     router.replace("/preferences");
  //                 } else {
  //                     router.replace("/home");
  //                 }
  //             } else {
  //                 Toast.show({
  //                     type: "error",
  //                     text1: "Google Sign-In failed",
  //                     text2: res.data?.message || "Backend authentication failed",
  //                 });
  //             }
  //         }
  //         // else {
  //         //     Toast.show({
  //         //         type: "error",
  //         //         // text1: "Google Sign-In failed",
  //         //         // text2: "No ID token received",
  //         //     });
  //         // }

  //     } catch (error) {
  //         if (isErrorWithCode(error)) {
  //             switch (error.code) {
  //                 case statusCodes.SIGN_IN_CANCELLED:
  //                     // user cancelled the login flow
  //                     break;
  //                 case statusCodes.IN_PROGRESS:
  //                     // operation (e.g. sign in) is in progress already
  //                     break;
  //                 case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
  //                     Toast.show({
  //                         type: "error",
  //                         text1: "Play Services not available",
  //                     });
  //                     break;
  //                 default:
  //                     Toast.show({
  //                         type: "error",
  //                         text1: "Google Sign-In error",
  //                         text2: "Something went wrong",
  //                     });
  //                     console.error(error);
  //             }
  //         } else {
  //             Toast.show({
  //                 type: "error",
  //                 text1: "Google Sign-In error",
  //                 text2: "An unexpected error occurred",
  //             });
  //             console.error(error);
  //         }
  //     } finally {
  //         setGoogleLoading(false);
  //     }
  // };

  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Full Screen Gradient Background (from Home.tsx) */}
      <Svg height="45%" width="100%" style={{ position: "absolute", top: 0 }}>
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

      {/* Header Area */}
      <View className="px-6 pt-28 pb-4">
        {/* Header Text */}
        <Text className="text-[#6944c7] text-3xl font-bold mb-2">
          Go ahead and setup your account
        </Text>
        <Text className="text-gray-500 text-sm">
          Create your account and simplify your workflow instantly.
        </Text>
      </View>

      {/* White Card Container */}
      <View className="flex-1 bg-white rounded-t-[32px] overflow-hidden">
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 30,
            paddingBottom: 20,
          }}
        >
          {/* Tabs */}
          <View className="flex-row bg-gray-100 p-1 rounded-xl mb-5">
            <TouchableOpacity className="flex-1 bg-white py-3 rounded-lg shadow-sm items-center">
              <Text className="font-bold text-gray-900">Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 items-center"
              onPress={() => router.replace("/signup")}
            >
              <Text className="font-medium text-gray-500">Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View>
            {/* Email */}
            <View className="mb-5">
              <Text className="text-gray-600 font-medium mb-2 ml-1">Email</Text>
              <TextInput
                placeholder="your@gmail.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-base text-gray-900"
              />
            </View>

            {/* Password */}
            <View className="mb-5">
              <Text className="text-gray-600 font-medium mb-2 ml-1">
                Password
              </Text>
              <View className="flex-row items-center w-full bg-gray-50 border border-gray-100 rounded-2xl px-5">
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  className="flex-1 py-4 text-base text-gray-900"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-off-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password */}
            <View className="flex-row justify-between items-center mb-8">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  className={`w-5 h-5 rounded border ${rememberMe ? "bg-[#6944c7] border-[#6944c7]" : "border-gray-300 bg-gray-50"} items-center justify-center mr-2`}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <Text className="text-gray-600 font-medium">Remember Me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                <Text className="text-gray-900 font-medium">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleEmailLogin}
              disabled={loading}
              className={`w-full rounded-2xl py-4 items-center shadow-sm shadow-purple-200 ${loading ? "bg-purple-300" : "bg-[#6944c7]"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-semibold">Login</Text>
              )}
            </TouchableOpacity>

            {/* Or login with */}
            <View className="flex-row items-center justify-center mt-5 mb-6">
              <View className="h-[1px] bg-gray-200 flex-1" />
              <Text className="mx-4 text-gray-400 text-sm">Or login with</Text>
              <View className="h-[1px] bg-gray-200 flex-1" />
            </View>

            {/* Social Login Icons Row */}
            <View className="flex-row items-center justify-center gap-6 mb-8">
              {/* Apple */}
              <TouchableOpacity className="w-14 h-14 rounded-full border border-gray-200 bg-white items-center justify-center shadow-sm">
                <Ionicons name="logo-apple" size={24} color="black" />
              </TouchableOpacity>

              {/* Google */}
              {/* <TouchableOpacity
                                onPress={handleGoogleLogin}
                                disabled={googleLoading}
                                className="w-14 h-14 rounded-full border border-gray-200 bg-white items-center justify-center shadow-sm"
                            >
                                {googleLoading ? (
                                    <ActivityIndicator size="small" color="black" />
                                ) : (
                                    <Image
                                        source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                                        style={{ width: 22, height: 22 }}
                                        resizeMode="contain"
                                    />
                                )}
                            </TouchableOpacity> */}

              {/* Guest */}
              <TouchableOpacity
                onPress={() => router.replace("/home")}
                className="w-14 h-14 rounded-full border border-gray-200 bg-white items-center justify-center shadow-sm"
              >
                <Ionicons name="person" size={22} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
