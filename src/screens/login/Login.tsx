import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { post } from "@/src/services/api";
import { Api } from "./api";

interface LoginResponse {
    success: boolean;
    message?: string;
    token?: string;
}

export default function LoginForm() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Username and password are required",
            });
            return;
        }

        try {
            setLoading(true);

            const res = await post(Api.login, {
                value:username,
                password,
            });
            console.log(res)

            if (res?.status==200) {

                router.replace("/home");
            } else {
                Toast.show({
                    type: "error",
                    text1: "Login failed",
                    text2: res?.message ?? "Invalid credentials",
                });
            }
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Network error",
                text2: "Please try again later",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="w-full max-w-md">
            <Text className="mb-8 text-center text-2xl font-semibold">
                Login
            </Text>

            <TextInput
                className="mb-4 w-full rounded-md border border-gray-300 px-4 py-3"
                placeholder="Username"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
            />

            <TextInput
                className="mb-6 w-full rounded-md border border-gray-300 px-4 py-3"
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
            />

            <Pressable
                onPress={handleLogin}
                disabled={loading}
                className={`w-full rounded-md py-3 ${loading ? "bg-blue-300" : "bg-blue-500"
                    }`}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text className="text-center font-medium text-white">
                        Login
                    </Text>
                )}
            </Pressable>
        </View>
    );
}
