import { Link } from "expo-router";
import { Text, View, Pressable } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-base font-medium">
        welcome Anagha
      </Text>

      <Link href="/about" asChild>
        <Pressable className="mt-5 rounded-md bg-blue-500 px-4 py-2">
          <Text className="text-white font-medium">
            Go to About
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
