import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Animated } from "react-native";

interface PostAdSkeletonProps {
  className?: string;
  style?: any;
}

const PostAdSkeleton = ({
  className = "",
  style = {},
}: PostAdSkeletonProps) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <Animated.View
      style={[{ opacity }, style]}
      className={`overflow-hidden ${className}`}
    >
      <LinearGradient
        colors={["#f7e2fbff", "#d8ecf9ff", "#d7d1f3ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
};

export default PostAdSkeleton;
