import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

const AISuggestedTag = () => (
  <View 
    className="flex-row items-center px-3 py-1.5 rounded-full"
    style={{ backgroundColor: '#9EAFFE' }}
  >
    <Ionicons name="sparkles" size={12} color="white" className="mr-1.5" />
    <Text className="text-white font-medium text-[10px]">
      Ai generated Details
    </Text>
  </View>
);

export default AISuggestedTag;
