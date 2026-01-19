import Constants from "expo-constants";

export const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "http://localhost:5000";
export const googleAndroidClientId = Constants.expoConfig?.extra?.googleAndroidClientId ?? "";
export const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId ?? "";
export const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId ?? "";