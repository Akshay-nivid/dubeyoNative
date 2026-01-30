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
    <View
      className="px-4 py-4 flex-row items-center"
      style={{ backgroundColor: "transparent" }}
    >
      {/* Profile Picture + User Info */}
      <View className="flex-row items-center flex-1">
        {/* Profile Picture */}
        <TouchableOpacity
          className="w-12 h-12 rounded-full overflow-hidden border mr-3"
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
            style={{ resizeMode: "cover" }}
          />
        </TouchableOpacity>

        {/* User Name and Location */}
        <View className="flex-1">
          {/* User Name */}
          {userName && (
            <Text
              className="text-base font-semibold"
              style={{ 
                color: colors.bg_black,
                fontFamily: "OpenSans"
              }}
              numberOfLines={1}
            >
              Hi{userName ? ` ${userName}` : ""}
            </Text>
          )}
          
          {/* Location */}
          <TouchableOpacity
            onPress={onLocationPress}
            activeOpacity={0.7}
            className="flex-row items-center mt-0.5"
          >
            <Ionicons
              name="location-sharp"
              size={14}
              color={colors.icon_primary}
            />
            <Text
              className="ml-1 text-sm font-medium"
              style={{ color: colors.text_primary }}
              numberOfLines={1}
            >
              {place && place.trim() ? place : "Your location"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Header;
