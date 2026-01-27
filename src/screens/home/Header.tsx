import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  place?: string;
  profile?: string | null;
  onLocationPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ place, profile, onLocationPress }) => {
  const router = useRouter();

  return (
    <View
      className="px-4 py-2 flex-row items-center justify-between"
      style={{ backgroundColor: colors.bg_primary }}
    >
      {/* 📍 Location */}
      <TouchableOpacity
        onPress={onLocationPress}
        activeOpacity={0.7}
        className="flex-1"
      >
        <Text
          className="text-xs font-medium"
          style={{ color: colors.text_secondary }}
        >
          Home
        </Text>
        <View className="flex-row items-center mt-0.5">
          <Ionicons
            name="location-sharp"
            size={16}
            color={colors.icon_primary}
          />
          <Text
            className="ml-1 text-base font-bold flex-1"
            style={{ color: colors.text_primary }}
            numberOfLines={1}
          >
            {place || "Your location"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.icon_secondary}
            style={{ marginLeft: 4 }}
          />
        </View>
      </TouchableOpacity>

      {/* 👤 Profile Avatar */}
      <TouchableOpacity
        className="w-10 h-10 rounded-full overflow-hidden border ml-3"
        style={{
          borderColor: colors.border_primary,
          backgroundColor: colors.bg_secondary,
        }}
        onPress={() => router.push("/profile")}
        activeOpacity={0.8}
      >
        <Image
          source={{
            uri: profile || "https://randomuser.me/api/portraits/men/32.jpg",
          }}
          className="w-full h-full"
        />
      </TouchableOpacity>
    </View>
  );
};

export default Header;
