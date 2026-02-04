import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { TextInput, View } from "react-native";

const SearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View className="px-4 py-4">
      {/* Gradient Border Container */}
      <LinearGradient
        colors={['#14B8A6', '#3B82F6', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 2,
          borderRadius: 999,
          shadowColor: '#3B82F6', // Blue shadow/glow
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        {/* Inner Content - White Background */}
        <View className="flex-row items-center bg-white rounded-full px-4 h-[42px]">
          <MaskedView
            maskElement={<Ionicons name="sparkles" size={18} />}
            style={{ width: 18, height: 18 }}
          >
            <LinearGradient
              colors={['#14B8A6', '#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          </MaskedView>

          <TextInput
            className="flex-1 ml-3 text-base text-gray-700 h-full"
            placeholder="Search or ask with muscot..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />


        </View>
      </LinearGradient>
    </View>
  );
};

export default SearchBar;
