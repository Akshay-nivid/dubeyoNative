import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "dubeyo_token";

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
