import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface PostAdButtonProps {
  onPress: () => void;
}

const PostAdButton: React.FC<PostAdButtonProps> = ({ onPress }) => {
  return (
    <View className="px-4 mb-6">
      <TouchableOpacity
        className="w-full py-3.5 bg-cyan-600 rounded-lg items-center justify-center flex-row shadow-sm"
        onPress={onPress}
      >
        <Ionicons name="add-circle-outline" size={20} color="white" />
        <Text className="text-white font-bold text-lg ml-2">Post ad</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PostAdButton;
