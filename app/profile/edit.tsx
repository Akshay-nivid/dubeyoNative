import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileRoute() {
    const router = useRouter();

    return (
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>Edit Profile Screen (Placeholder)</Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 10, backgroundColor: "#ddd", borderRadius: 8 }}>
                <Text>Go Back</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
