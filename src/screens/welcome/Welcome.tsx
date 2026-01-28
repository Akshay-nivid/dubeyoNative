import LogoWhite from "@/assets/images/logo_white.svg";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Welcome = () => {
    const router = useRouter();

    return (
        <LinearGradient
            colors={["#0B5ED7", "#5FA8FF", "#FFFFFF"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            className="flex-1"
        >
            <SafeAreaView className="flex-1 justify-between items-center py-10 px-6">
                <View className="flex-1 justify-center items-center">
                    <View className="mb-4">
                        <LogoWhite width={200} height={71} /> 
                    </View>
                </View>
                <View className="w-full">
                    <Text className="text-gray-800 text-center mb-8 font-medium">
                        Your AI Assistant for Case Law and Legal Insight.
                    </Text>

                    <TouchableOpacity
                        className="w-full py-4 rounded-full mb-4 items-center"
                        style={{ backgroundColor: '#2b5bfd' }} // Using style for precise color matching if tailwind color isn't exact
                        onPress={() => router.push("/login" as any)}
                    >
                        <Text className="text-white text-lg font-bold">Sign In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="w-full py-4 rounded-full border border-[#2b5bfd] items-center bg-white"
                        onPress={() => router.push("/signup" as any)}
                    >
                        <Text className="text-[#2b5bfd] text-lg font-bold">
                            Create Account
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default Welcome;
