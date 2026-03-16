import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

const AISuggestedTag = () => (
  <View 
    className="flex-row items-center px-2.5 py-1 rounded-full border border-indigo-100"
    style={{ backgroundColor: '#EEF2FF' }}
  >
    <Ionicons name="sparkles" size={10} color="#6366F1" className="mr-1.5" />
    <Text 
      className="text-indigo-600 font-bold tracking-tight"
      style={{ fontSize: 9, textTransform: 'uppercase' }}
    >
      AI Suggested
    </Text>
  </View>
);

export default AISuggestedTag;
