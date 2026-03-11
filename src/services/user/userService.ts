import { Api } from "../../screens/home/Api";
import { get, post, put } from "../api";
import { removeToken } from "../storage/tokenStorage";
import { API_BASE_URL } from "../../constants/env";
import { getToken } from "../storage/tokenStorage";

export const UserService = {
  getProfile: async () => {
    return await get(Api.userProfile);
  },

  updateProfile: async (data: any) => {
    return await put(Api.updateProfile, data);
  },

  updateProfilePic: async (formData: FormData) => {
    // Use native fetch for FormData to bypass axios FormData transformation issues
    const token = await getToken();

    try {
      const response = await fetch(`${API_BASE_URL}${Api.updateProfilePic}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - browser/React Native will set multipart/form-data with boundary automatically
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}` }));
        return {
          data: null,
          status: response.status,
          message:
            errorData?.message ||
            `Request failed with status ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        data: data?.data || data,
        status: response.status,
        message: data?.message,
      };
    } catch (error: any) {
      console.error("Error uploading profile picture with fetch:", error);
      // Fallback to axios if fetch fails
      return await put(Api.updateProfilePic, formData, {
        timeout: 30000, // 30 seconds for file upload
      });
    }
  },

  resetPassword: async (data: any) => {
    return await put(Api.resetPassword, data);
  },

  logout: async () => {
    await removeToken();
  },
};
