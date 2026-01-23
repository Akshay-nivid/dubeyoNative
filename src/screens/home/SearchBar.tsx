import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

const SearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View className="px-4 py-4">
      <View className="flex-row items-center bg-gray-50 rounded-lg px-4 h-12">
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800 h-full"
          placeholder="Search or ask with muscot..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity>
          <Ionicons name="mic-outline" size={20} color="#0891b2" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SearchBar;
