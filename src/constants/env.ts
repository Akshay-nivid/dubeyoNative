import Constants from "expo-constants";

export const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "http://192.168.68.100";
export const googleAndroidClientId = Constants.expoConfig?.extra?.googleAndroidClientId ?? "";
export const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId ?? "";
export const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId ?? "";

// console.log("API_BASE_URL:", API_BASE_URL);