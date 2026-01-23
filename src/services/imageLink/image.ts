import { post } from "../api";

export const getImages = async (productId: string, isAll = false) => {
    try {
        const res = await post("/helper/image-url", {
            productId,
            isAll,
        });

        return res?.data?.links ?? res?.data?.data?.links ?? [];
    } catch (error) {
        console.error("Failed to fetch images:", error);
        return [];
    }
};