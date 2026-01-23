import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "@/theme";

interface HeaderProps {
  place?: string;
  profile?: string | null;
}

const Header: React.FC<HeaderProps> = ({ place, profile }) => {
  const router = useRouter();

  return (
    <View className="px-4 py-2 flex-row items-center justify-between" style={{ backgroundColor: colors.bg_primary }}>
      {/* 📍 Location */}
      <View>
        <Text className="text-xs font-medium" style={{ color: colors.text_secondary }}>Home</Text>
        <View className="flex-row items-center mt-0.5">
          <Ionicons name="location-sharp" size={16} color={colors.icon_primary} />
          <Text className="ml-1 text-base font-bold" style={{ color: colors.text_primary }}>
            {place || "Your location"}
          </Text>
        </View>
      </View>

      {/* 👤 Profile Avatar */}
      <TouchableOpacity
        className="w-10 h-10 rounded-full overflow-hidden border"
        style={{ borderColor: colors.border_primary, backgroundColor: colors.bg_secondary }}
        onPress={() => router.push("/profile")}
        activeOpacity={0.8}
      >
        <Image
          source={{
            uri:
              profile ||
              "https://randomuser.me/api/portraits/men/32.jpg",
          }}
          className="w-full h-full"
        />
      </TouchableOpacity>
    </View>
  );
};

export default Header;
