import LogoWhite from "@/assets/images/logo_white.svg";
import { getToken } from "@/src/services/storage/tokenStorage";
import { colors } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, StatusBar, StyleSheet, View } from "react-native";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
export default function LoaderScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;
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
        // Subtle glow animation
        const glowAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.6,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.3,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        glowAnimation.start();
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
            glowAnimation.stop();
        };
    }, []);
    const logoSize = Math.min(SCREEN_WIDTH * 0.55, 220);
    const logoHeight = Math.min(SCREEN_HEIGHT * 0.12, 70);
    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

            {/* Gradient Background */}
            <LinearGradient
                colors={[colors.primary, "#0a6b7f", colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {/* Animated Glow Effect */}
            <Animated.View
                style={[
                    styles.glowContainer,
                    {
                        opacity: glowAnim,
                        transform: [{ scale: pulseAnim }],
                    },
                ]}
            >
                <View style={styles.glowCircle} />
            </Animated.View>
            {/* Logo Container */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { scale: Animated.multiply(scaleAnim, pulseAnim) },
                        ],
                    },
                ]}
            >
                <LogoWhite width={logoSize} height={logoHeight} />
            </Animated.View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primary,
    },
    glowContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    glowCircle: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        borderRadius: SCREEN_WIDTH * 0.4,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
});