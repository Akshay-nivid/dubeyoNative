import { colors } from "@/theme";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.bg_primary }}
    >
      <View className="flex-1 items-center justify-center px-6">
        <Text
          className="text-xl font-bold mb-4"
          style={{ color: colors.text_primary }}
        >
          Chat
        </Text>
        <Text
          className="text-base text-center"
          style={{ color: colors.text_tertiary }}
        >
          Chat feature coming soon
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 px-6 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text
            className="text-base font-semibold"
            style={{ color: colors.text_white }}
          >
            Go Back
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
