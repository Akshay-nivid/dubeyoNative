import { post } from "../api";

/** Normalize API link to string (handles { url } or { link } or plain string). */
function normalizeLink(link: unknown): string | null {
  if (typeof link === "string" && link.trim()) return link.trim();
  if (link && typeof link === "object") {
    const obj = link as Record<string, unknown>;
    const url = obj.url ?? obj.link ?? obj.src;
    if (typeof url === "string" && url.trim()) return url.trim();
  }
  return null;
}

export const getImages = async (productId: string, isAll = false) => {
  try {
    const res = await post("/helper/image-url", {
      productId,
      isAll,
    });

    const raw =
      res?.data?.links ??
      res?.data?.data?.links ??
      (Array.isArray(res?.data) ? res.data : []);
    const arr = Array.isArray(raw) ? raw : [];
    const normalized = arr
      .map(normalizeLink)
      .filter((url): url is string => url != null);
    return normalized;
  } catch (error) {
    console.error("Failed to fetch images:", error);
    return [];
  }
};
