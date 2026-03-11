import { Text, View } from "react-native";

const AISuggestedTag = () => (
  <View className="flex-row items-center self-start px-2.5 py-1 rounded-full border border-purple-200 mb-3 bg-purple-50/50">
    <Text className="text-yellow-500 mr-1.5 text-xs">✨</Text>
    <Text className="text-purple-600 font-bold text-[10px] tracking-wider uppercase">
      AI Suggested
    </Text>
  </View>
);

export default AISuggestedTag;
