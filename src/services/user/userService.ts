import { Api } from "../../screens/home/Api";
import { get, post } from "../api";
import { removeToken } from "../storage/tokenStorage";

export const UserService = {
    getProfile: async () => {
        return await get(Api.userProfile);
    },

    updateProfile: async (data: any) => {
        return await post(Api.updateProfile, data);
    },

    updateProfilePic: async (formData: any) => {
        return await post(Api.updateProfilePic, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },

    resetPassword: async (data: any) => {
        return await post(Api.resetPassword, data);
    },

    logout: async () => {
        await removeToken();
    },
};
