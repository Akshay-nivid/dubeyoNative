import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

const SearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View className="px-4 py-4">
      <View className="flex-row items-center rounded-lg px-4 h-12" style={{ backgroundColor: colors.bg_white }}>
        <Ionicons name="search" size={20} color={colors.bg_black} />
        <TextInput
          className="flex-1 ml-3 text-base h-full"
          style={{ color: colors.text_primary }}
          placeholder="Search or ask with muscot..."
          placeholderTextColor={colors.bg_gray_400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity>
          <Ionicons name="mic-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SearchBar;
