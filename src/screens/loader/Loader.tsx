import Logo from "@/assets/images/logo_dark.svg";
import { getToken } from "@/src/services/storage/tokenStorage";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, StatusBar, View } from "react-native";
import { Defs, RadialGradient, Rect, Stop, Svg } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LoaderScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Start fade-in and scale animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous pulse animation for AI feel
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseAnimation.start();



        // Navigate to login after 3 seconds
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start(async () => {
                const token = await getToken();
                if (token) {
                    router.replace("/home");
                } else {
                    router.replace("/login");
                }
            });
        }, 3000);

        return () => {
            clearTimeout(timer);
            pulseAnimation.stop();
            pulseAnimation.stop();
        };
    }, []);

    const logoSize = Math.min(SCREEN_WIDTH * 0.55, 220);
    const logoHeight = Math.min(SCREEN_HEIGHT * 0.12, 70);

    return (
        <View className="flex-1 justify-center items-center bg-bg_white">
            <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

            {/* Radial Gradient Background (Matching Signup Style) - Using View wrapper for className compatibility */}
            <View className="absolute inset-0">
                <Svg height="100%" width="100%">
                    <Defs>
                        {/* Top-left haze */}
                        <RadialGradient
                            id="gradTopLeft"
                            cx="18%"
                            cy="8%"
                            rx="72%"
                            ry="62%"
                            fx="18%"
                            fy="8%"
                            gradientUnits="userSpaceOnUse"
                        >
                            <Stop offset="0%" stopColor="#DDD6FE" stopOpacity="1" />
                            <Stop offset="55%" stopColor="#EDE9FE" stopOpacity="0.55" />
                            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                        </RadialGradient>

                        {/* Bottom-right haze */}
                        <RadialGradient
                            id="gradBottomRight"
                            cx="82%"
                            cy="92%"
                            rx="72%"
                            ry="62%"
                            fx="82%"
                            fy="92%"
                            gradientUnits="userSpaceOnUse"
                        >
                            <Stop offset="0%" stopColor="#DDD6FE" stopOpacity="1" />
                            <Stop offset="55%" stopColor="#EDE9FE" stopOpacity="0.55" />
                            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                        </RadialGradient>
                    </Defs>

                    {/* Base */}
                    <Rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF" />

                    {/* Overlays */}
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#gradTopLeft)" />
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#gradBottomRight)" />
                </Svg>
            </View>

            {/* Logo Container - Using View wrapper for className compatibility */}
            <View className="items-center justify-center z-10">
                <Animated.View
                    style={[
                        {
                            opacity: fadeAnim,
                            transform: [
                                { scale: Animated.multiply(scaleAnim, pulseAnim) },
                            ],
                        },
                    ]}
                >
                    <Logo width={logoSize} height={logoHeight} />
                </Animated.View>
            </View>
        </View>
    );
}
