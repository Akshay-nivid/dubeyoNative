import api from "./client";
import { normalizeError } from "./error";

async function request(method: string, url: string, options: any = {}) {
  try {
    const response = await api.request({
      method,
      url,
      ...options,
    });
    let res={
      data:response.data?.data||response.data,
      token: response.data?.token,
      status: response.status,
    }
    
    return res
  } catch (err: any) {
    const error = normalizeError(err);
    console.log(err)
    return {
      data: null,
      status: error.status ?? 400,
      message: error.message,
    };
  }
}

export const get = (url: string, options?: any) => request("get", url, options);

export const post = (url: string, data?: any, options?: any) => request("post", url, { ...options, data });

export const put = (url: string, data?: any, options?: any) => request("put", url, { ...options, data });

export const del = (url: string, options?: any) => request("delete", url, options);
