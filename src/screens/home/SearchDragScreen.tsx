import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SearchDragScreen = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = React.useState("");

    const suggestionChips = [
        "iPhone 13 below 2,000 AED",
        "Sofa set under 1,500 AED",
        "BMW under 50,000 AED",
        "Used laptop for work",
        "Used Toyota Camry"
    ];

    return (
        <LinearGradient
            colors={['#f7e2fbff', '#d8ecf9ff', '#d7d1f3ff']} // Very light Pink, Blue, Purple
            className="flex-1"
        >
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-5 py-2">
                        <TouchableOpacity onPress={() => router.back()} className="p-2">
                            <Ionicons name="close-circle-outline" size={28} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-black" style={{ letterSpacing: 0.5 }}>
                            Dubeyo.ai
                        </Text>
                        <TouchableOpacity className="p-2">
                            <Ionicons name="bookmark-outline" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Content Body - now inside ScrollView */}
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Mascot */}
                        <Image
                            source={require("@/assets/images/ai_modal_icon.png")}
                            className="w-32 h-32 resize-contain mb-4"
                        />

                        {/* Search Badge */}
                        <LinearGradient
                            colors={['#C7B8FF', '#9F8CFF', '#7C6CF5']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="px-6 py-1.5 mb-6"
                            style={{ borderRadius: 6 }}
                        >
                            <Text className="text-white font-bold text-base">Search</Text>
                        </LinearGradient>

                        {/* Helper Text */}
                        <Text className="text-center text-lg font-medium text-gray-800 px-10 mb-10 leading-6">
                            “Looking to buy? Just describe what you want.”
                        </Text>

                        {/* Suggestion Chips */}
                        <View className="mb-8 h-12">
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 20 }}
                            >
                                {suggestionChips.map((chip, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        className="border border-white/80 rounded-full px-6 py-2.5 bg-white/20 mr-3 justify-center"
                                    >
                                        <Text className="text-gray-800 text-sm font-medium">{chip}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </ScrollView>

                    {/* Bottom Input Area */}
                    <View className="px-5 pb-4 pt-2">
                        <View className="bg-white rounded-full flex-row items-center p-2 shadow-sm border border-gray-100">
                            {/* User Avatar Placeholder */}
                            <View className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200">
                                <Image
                                    source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
                                    className="w-full h-full"
                                />
                            </View>

                            <TextInput
                                placeholder="Ask me anything..."
                                className="flex-1 text-base text-gray-800"
                                placeholderTextColor="#9CA3AF"
                                autoFocus={true}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />

                            {/* Mic/Wave Icon or Send Arrow */}
                            <TouchableOpacity
                                onPress={() => searchQuery.trim() ? console.log("Send") : console.log("Voice")}
                                className={`w-12 h-12 rounded-full items-center justify-center ml-2 ${searchQuery.trim() ? 'bg-black' : 'bg-purple-100'}`}
                            >
                                {searchQuery.trim() ? (
                                    <Ionicons name="arrow-up" size={24} color="#FFF" />
                                ) : (
                                    /* Waveform Animation (Simulated) */
                                    <View className="flex-row items-center gap-[2px]">
                                        <View className="w-[2px] h-2 bg-[#8B5CF6] rounded-full" />
                                        <View className="w-[2px] h-3 bg-[#8B5CF6] rounded-full" />
                                        <View className="w-[2px] h-4 bg-[#8B5CF6] rounded-full" />
                                        <View className="w-[2px] h-3 bg-[#8B5CF6] rounded-full" />
                                        <View className="w-[2px] h-2 bg-[#8B5CF6] rounded-full" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default SearchDragScreen;
