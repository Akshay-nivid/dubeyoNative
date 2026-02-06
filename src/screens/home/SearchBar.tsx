import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useRouter } from "expo-router";

const SearchBar: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1 // Infinite repeat
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View className="px-4 py-4">
      {/* Shadow Container */}
      <View
        style={{
          borderRadius: 999,
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        {/* Clipping Container for Border */}
        <View style={{ borderRadius: 999, overflow: 'hidden', padding: 2 }}>
          {/* Rotating Gradient Background */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 700,
                height: 700,
                marginLeft: -350,
                marginTop: -350,
                zIndex: -1,
                opacity: 0.6,
              },
              animatedStyle,
            ]}
          >
            <LinearGradient
              colors={['#14B8A6', '#3B82F6', '#8B5CF6', '#14B8A6']} // Teal -> Blue -> Violet -> Teal (Loop)
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 700, height: 700 }}
            />
          </Animated.View>

          {/* Inner Content - White Background */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/search-drag')}
            className="flex-row items-center bg-white/90 rounded-full px-4 h-[42px]"
          >
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
              editable={false} // Disable direct editing here, redirect to search screen
              onPressIn={() => router.push('/search-drag')} // Catch press for Android compatibility
              pointerEvents="none" // Ensure the parent TouchableOpacity handles the press
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SearchBar;
