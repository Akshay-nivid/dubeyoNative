import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Linking, Pressable,
    ScrollView,
    Text,
    View
} from "react-native";

export default function CallUsScreen() {
    const router = useRouter();
    const handlePhoneCall = () => {
        Linking.openURL("tel:800-38249953");
    };
    const handleEmailClick = () => {
        Linking.openURL("mailto:customersupport@dubeyo.com");
    };
    return (
        <View className="flex-1 bg-bg_primary">
            {/* Header */}
            <View className="bg-white px-4 pt-12 pb-4 flex-row items-center justify-between border-b border-border_primary">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={24} color={colors.palette_dark_blue} />
                </Pressable>
                <Text className="text-xl font-bold text-palette_dark_blue">
                    Call Us
                </Text>
                <View className="w-10" />
            </View>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 24,
                }}
            >
                <View className="w-full max-w-md items-center">
                    {/* Phone Icon */}
                    <View className="mb-8 w-24 h-24 rounded-full items-center justify-center bg-primary/10">
                        <Ionicons
                            name="call"
                            size={48}
                            color={colors.primary}
                        />
                    </View>
                    {/* Heading */}
                    <Text className="mb-3 text-center text-2xl font-bold text-palette_dark_blue">
                        Call us to get in touch
                    </Text>
                    {/* Operating Hours */}
                    <Text className="mb-8 text-center text-base text-text_tertiary">
                        Operating Hours: 9 AM to 6 PM
                    </Text>
                    {/* Phone Button */}
                    <Pressable
                        onPress={handlePhoneCall}
                        className="mb-8 w-full rounded-xl py-5 bg-primary items-center justify-center"
                        style={{
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 6,
                        }}
                    >
                        <Text className="text-2xl font-bold text-white mb-1">
                            800-38249953
                        </Text>
                        <Text className="text-sm text-white/90">
                            (dubeyo)
                        </Text>
                    </Pressable>
                    {/* Email Section */}
                    <View className="w-full items-center">
                        <Text className="mb-3 text-center text-base text-text_tertiary">
                            Or email us at
                        </Text>
                        <Pressable
                            onPress={handleEmailClick}
                            className="flex-row items-center"
                        >
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color={colors.primary}
                                style={{ marginRight: 8 }}
                            />
                            <Text className="text-base font-semibold text-primary">
                                customersupport@dubeyo.com
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
