import { get, post } from "./index";

export const searchProducts = (query: string, limit: number = 20) => {
    return get("/search", { params: { query, limit } });
};

export const searchPrompts = (data: FormData) => {
    return post("/search/prompts", data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};