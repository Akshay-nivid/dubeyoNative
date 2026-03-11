import api from "./client";
import { normalizeError } from "./error";

async function request(method: string, url: string, options: any = {}) {
  try {
    const response = await api.request({
      method,
      url,
      ...options,
    });
    let res = {
      data: response.data?.data || response.data,
      token: response.data?.token,
      status: response.status,
      message: response.data?.message,
    };

    return res;
  } catch (err: any) {
    const error = normalizeError(err);
    console.log(
      "API Error:",
      JSON.stringify(err.response?.data || err.message, null, 2),
    );
    if (err.response?.status === 400) {
      console.log(
        "Validation Errors:",
        JSON.stringify(err.response?.data, null, 2),
      );
    }
    return {
      data: error.details || null,
      status: error.status ?? 400,
      token: null,
      message: error.message,
    };
  }
}

export const get = (url: string, options?: any) => request("get", url, options);

export const post = (url: string, data?: any, options?: any) =>
  request("post", url, { data, ...options });

export const put = (url: string, data?: any, options?: any) =>
  request("put", url, { data, ...options });

export const del = (url: string, options?: any) =>
  request("delete", url, options);
