import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  place?: string;
  profile?: string | null;
  userName?: string | null;
  onLocationPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ place, profile, userName, onLocationPress }) => {
  const router = useRouter();

  return (
    <View className="px-4 py-4 flex-row items-center bg-transparent">
      {/* Profile Picture + User Info */}
      <View className="flex-row items-center flex-1">
        {/* Profile Picture */}
        <TouchableOpacity
          className="w-12 h-12 rounded-full overflow-hidden border border-border_primary bg-bg_secondary mr-3"
          onPress={() => router.push("/profile")}
          activeOpacity={0.8}
        >
          <Image
            source={{
              uri: profile || "https://randomuser.me/api/portraits/men/32.jpg",
            }}
            className="w-full h-full"
            style={{ resizeMode: "cover" }}
          />
        </TouchableOpacity>

        {/* User Name and Location */}
        <View className="flex-1">
          {/* User Name */}
          {userName && (
            <Text
              className="text-xl font-bold font-sans text-bg_black"
              numberOfLines={1}
            >
              Hi{userName ? ` ${userName}` : ""}
            </Text>
          )}

          {/* Location */}
          <TouchableOpacity
            onPress={onLocationPress}
            activeOpacity={0.7}
            className="flex-row items-center mt-1"
          >
            <Ionicons
              name="location-sharp"
              size={14}
              color={colors.icon_primary}
            />
            <Text
              className="ml-1 text-sm font-medium text-text_primary"
              numberOfLines={1}
            >
              {place && place.trim() ? place : "Your location"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* Notification Bell */}
      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm ml-2"
        style={{ elevation: 2 }}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.text_primary} />
        {/* Red Dot */}
        <View className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-red-500 border-[1px] border-white" />
      </TouchableOpacity>
    </View>
  );
};

export default Header;
