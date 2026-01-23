import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  place?: string;
  profile?: string | null;
}

const Header: React.FC<HeaderProps> = ({ place, profile }) => {
  return (
    <View className="px-4 py-2 flex-row items-center justify-between bg-white z-10">
      <View>
        <Text className="text-xs text-gray-500 font-medium">Home</Text>
        <View className="flex-row items-center mt-0.5">
          <Ionicons name="location-sharp" size={16} color="#000" />
          <Text className="ml-1 text-base font-bold text-gray-900">
            {place || "Dubai, UAE"}
          </Text>
        </View>
      </View>
      <TouchableOpacity className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
        {profile ? (
          <Image source={{ uri: profile }} className="w-full h-full" />
        ) : (
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
            className="w-full h-full"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Header;
