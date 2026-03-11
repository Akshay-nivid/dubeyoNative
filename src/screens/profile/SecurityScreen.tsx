import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { colors } from "../../../theme";
import PasswordField from "../../components/PasswordField";
import { get, put } from "../../services/api";
import { Api } from "../home/Api";

export default function SecurityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await get(Api.profile);
      const userData = res?.data?.data || res?.data || res;
      if (userData?.email) {
        setEmail(userData.email);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load user data",
      });
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    if (!passwordData.oldPassword) {
      newErrors.oldPassword = "Current Password is required";
    }
    if (!passwordData.password) {
      newErrors.password = "New Password is required";
    } else if (passwordData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (passwordData.password !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (
      passwordData.oldPassword &&
      passwordData.password &&
      passwordData.oldPassword === passwordData.password
    ) {
      newErrors.password = "New password must be different from old password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    try {
      setSaving(true);
      const res = await put(Api.resetPassword, {
        oldPassword: passwordData.oldPassword,
        password: passwordData.password,
        confirmPassword: passwordData.confirmPassword,
      });

      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Password updated successfully",
        });
        // Reset form
        setPasswordData({
          oldPassword: "",
          password: "",
          confirmPassword: "",
        });
        setIsEditingPassword(false);
        setErrors({});
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: res.data?.message || "Failed to update password",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update password",
      });
      console.error("Error updating password:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPasswordData({
      oldPassword: "",
      password: "",
      confirmPassword: "",
    });
    setIsEditingPassword(false);
    setErrors({});
  };

  if (loading) {
    return (
      <View className="flex-1 bg-bg_primary items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base text-text_tertiary">
          Loading security settings...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg_primary">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 flex-row items-center justify-between border-b border-border_primary">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.palette_dark_blue}
          />
        </Pressable>
        <Text className="text-xl font-bold text-palette_dark_blue">
          Security
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 pt-6">
          {/* Email Section */}
          <View className="mb-6">
            <View className="mb-3">
              <Text className="text-base font-semibold text-palette_dark_blue">
                Email
              </Text>
            </View>
            <View className="bg-white rounded-xl px-4 py-4 border border-border_primary">
              <Text className="text-base text-palette_dark_blue">
                {email || "No email linked"}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-border_primary mb-6" />

          {/* Password Section */}
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-semibold text-palette_dark_blue">
                Password
              </Text>
              {!isEditingPassword && (
                <Pressable
                  onPress={() => setIsEditingPassword(true)}
                  className="flex-row items-center"
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text className="ml-1 text-sm font-medium text-primary">
                    Edit
                  </Text>
                </Pressable>
              )}
            </View>

            {!isEditingPassword ? (
              <View className="bg-white rounded-xl px-4 py-4 border border-border_primary">
                <Text className="text-base text-palette_dark_blue">
                  ••••••••
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-xl p-4 border border-border_primary">
                <PasswordField
                  // id="oldPassword" // Removed id as it might not be needed or causing type errors if not handled
                  label="Current Password"
                  name="oldPassword"
                  // placeholder="Enter current password"
                  // required
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  editable={!saving}
                />
                {errors.oldPassword && (
                  <Text
                    className="text-sm mb-2 ml-1"
                    style={{ color: colors.error }}
                  >
                    {errors.oldPassword}
                  </Text>
                )}

                <PasswordField
                  // id="password"
                  label="New Password"
                  name="password"
                  // placeholder="Enter new password"
                  // required
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                  editable={!saving}
                />
                {errors.password && (
                  <Text
                    className="text-sm mb-2 ml-1"
                    style={{ color: colors.error }}
                  >
                    {errors.password}
                  </Text>
                )}

                <PasswordField
                  // id="confirmPassword"
                  label="Confirm New Password"
                  name="confirmPassword"
                  // placeholder="Confirm new password"
                  // required
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  editable={!saving}
                />
                {errors.confirmPassword && (
                  <Text
                    className="text-sm mb-2 ml-1"
                    style={{ color: colors.error }}
                  >
                    {errors.confirmPassword}
                  </Text>
                )}

                {/* Action Buttons */}
                <View className="flex-row justify-end gap-3 mt-4">
                  <Pressable
                    onPress={handleCancel}
                    disabled={saving}
                    className="px-6 py-3 rounded-xl border border-border_primary"
                    style={{
                      backgroundColor: colors.bg_white,
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    <Text className="text-base font-semibold text-palette_dark_blue">
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSavePassword}
                    disabled={saving}
                    className="px-6 py-3 rounded-xl"
                    style={{
                      backgroundColor: saving
                        ? colors.bg_gray_400
                        : colors.primary,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.text_light} />
                    ) : (
                      <Text className="text-base font-semibold text-white">
                        Save
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
