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
import { cssInterop } from "nativewind";
cssInterop(MaskedView, {
  className: {
    target: "style",
  },
});
cssInterop(LinearGradient, {
  className: {
    target: "style",
  },
});
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
        className="rounded-full bg-white shadow-cyan-400"
        style={{
          shadowColor: '#22d3ee', // Cyan-400
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8, // High opacity for glow
          shadowRadius: 20, // Large radius for spread
          elevation: 20, // Android elevation
        }}
      >
        {/* Clipping Container for Border */}
        <View className="rounded-full overflow-hidden p-[1px]">
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
                opacity: 0.4,
                // zIndex removed to ensure it renders in flow (before TouchableOpacity) but not behind parent background
              },
              animatedStyle,
            ]}
          >
            <LinearGradient
              colors={['#14B8A6', '#3B82F6', '#8B5CF6', '#14B8A6']} // Teal -> Blue -> Violet -> Teal (Loop)
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-[700px] h-[700px]"
            />
          </Animated.View>
          {/* Inner Content - White Background */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/search-drag' as any)}
            className="flex-row items-center bg-white/90 rounded-full px-4 h-[42px]"
          >
            <MaskedView
              maskElement={<Ionicons name="sparkles" size={18} />}
              className="w-[18px] h-[18px]"
            >
              <LinearGradient
                colors={['#14B8A6', '#3B82F6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1"
              />
            </MaskedView>
            <TextInput
              className="flex-1 ml-3 text-base text-gray-700 h-full"
              placeholder="Search or ask with muscot..."
              placeholderTextColor="#9ca3af85"
              value={searchQuery}
              onChangeText={setSearchQuery}
              editable={false} // Disable direct editing here, redirect to search screen
              onPressIn={() => router.push('/search-drag' as any)} // Catch press for Android compatibility
              pointerEvents="none" // Ensure the parent TouchableOpacity handles the press
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
export default SearchBar;