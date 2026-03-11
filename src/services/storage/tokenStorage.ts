import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "dubeyo_token";
const CREDENTIALS_KEY = "dubeyo_credentials";

export async function setToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {} // Ignore errors during removal
}

export async function setCredentials(credentials: {
  email: string;
  password?: string;
}) {
  const jsonValue = JSON.stringify(credentials);
  await SecureStore.setItemAsync(CREDENTIALS_KEY, jsonValue);
}

export async function getCredentials() {
  const jsonValue = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  return jsonValue != null ? JSON.parse(jsonValue) : null;
}

export async function removeCredentials() {
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
  } catch {} // Ignore errors during removal
}
