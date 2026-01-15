import LoginForm from "@/src/screens/login/Login";
import {  View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <LoginForm />
    </View>
  );
}
