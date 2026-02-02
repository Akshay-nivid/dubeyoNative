import axios from "axios";

export function normalizeError(error: any) {
  if (axios.isCancel(error)) {
    return { status: null, message: "Request cancelled" };
  }

  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data?.message || `Request failed (${error.response.status})`,
      details: error.response.data,
    };
  }

  if (error.request) {
    return {
      status: null,
      message: error.message?.includes("Network Error") 
        ? "Network error. Please check your connection." 
        : "No response from server",
    };
  }

  return {
    status: null,
    message: error.message || "Unknown error",
  };
}
