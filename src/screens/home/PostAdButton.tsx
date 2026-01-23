import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/theme";

interface PostAdButtonProps {
  onPress: () => void;
}

const PostAdButton: React.FC<PostAdButtonProps> = ({ onPress }) => {
  return (
    <View className="px-4 mb-6">
      <TouchableOpacity
        className="w-full py-3.5 rounded-lg items-center justify-center flex-row shadow-sm"
        style={{ backgroundColor: colors.primary }}
        onPress={onPress}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.text_light} />
        <Text className="font-bold text-lg ml-2" style={{ color: colors.text_light }}>Post ad</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PostAdButton;
