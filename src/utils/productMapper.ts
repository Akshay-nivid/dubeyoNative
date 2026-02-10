
export interface ProductItem {
    id: string | number;
    title: string;
    image: string;
    images?: string[];
    price: string;
    status?: string;
    originalPrice?: number;
    discountedPrice?: number;
    specs?: Record<string, any>;
    features?: string[];
    seller?: {
        name?: string;
        profilePic?: string;
        verified?: boolean;
    };
    location?: {
        type: string;
        coordinates: number[];
    };
}

/**
 * Formats a price value to a consistent string, handling null/undefined/0.
 */
export const formatPrice = (val: any): string => {
    if (val === null || val === undefined) return "Price on request";
    if (typeof val === "object") return "Price on request";
    if (val === 0 || val === "0" || val === "0.00") return "AED 0";
    const num = parseFloat(String(val));
    if (isNaN(num)) return "Price on request";
    // Default to AED if not provided, though typically currency is separate
    return `AED ${num.toFixed(2)}`;
};

/**
 * Extracts the best available image URL from a product object.
 * Checks signedImages map first, then various product properties.
 */
export const getProductImageUrl = (p: any, signedImages: Record<string, string> = {}): string | null => {
    const id = p?.product_id ?? p?.id ?? p?._id;
    const idStr = id != null ? String(id) : "";

    // Check signed images map
    const fromSigned = idStr && signedImages[idStr];
    if (typeof fromSigned === "string" && !fromSigned.includes("undefined"))
        return fromSigned;

    // Check direct properties
    if (typeof p?.image === "string" && !p.image.includes("undefined"))
        return p.image;
    if (typeof p?.thumbnail === "string" && !p.thumbnail.includes("undefined"))
        return p.thumbnail;

    // Check images array
    const first = Array.isArray(p?.images) && p.images[0];
    if (first) {
        const url = typeof first === "string" ? first : first?.url ?? first?.link ?? first?.src;
        if (typeof url === "string" && url.trim() && !url.includes("undefined"))
            return url.trim();
    }

    return null;
};

/**
 * Helper to extract seller information from various possible locations in the product object.
 */
const extractSellerInfo = (p: any, sellerDataCache: Record<string | number, { name: string; profilePic?: string }> = {}) => {
    const id = p?.product_id ?? p?.id ?? p?._id;

    // Check cache first
    if (id && sellerDataCache[id]) {
        return {
            name: sellerDataCache[id].name,
            profilePic: sellerDataCache[id].profilePic,
            verified: p.seller?.verified || p.seller?.isVerified || false
        };
    }

    let sellerName: string | undefined;
    let sellerProfilePic: string | undefined;
    let sellerVerified: boolean | undefined = p.seller?.verified || p.seller?.isVerified || false;

    // Helper to extract from a potential seller object
    const extractFromObject = (obj: any) => {
        if (!obj) return;

        // Name
        if (typeof obj.name === "string" && obj.name.trim()) {
            sellerName = obj.name.trim();
        } else if (typeof obj.firstName === "string" && typeof obj.lastName === "string") {
            sellerName = `${obj.firstName.trim()} ${obj.lastName.trim()}`;
        } else if (typeof obj.firstName === "string" && obj.firstName.trim()) {
            sellerName = obj.firstName.trim();
        } else if (typeof obj.username === "string" && obj.username.trim()) {
            sellerName = obj.username.trim();
        }

        // Profile Pic
        if (typeof obj.profilePic === "string" && obj.profilePic.trim()) {
            sellerProfilePic = obj.profilePic.trim();
        } else if (typeof obj.profile_pic === "string" && obj.profile_pic.trim()) {
            sellerProfilePic = obj.profile_pic.trim();
        } else if (typeof obj.avatar === "string" && obj.avatar.trim()) {
            sellerProfilePic = obj.avatar.trim();
        }

        // Verified status (if present in sub-object)
        if (typeof obj.verified === "boolean") sellerVerified = obj.verified;
        if (typeof obj.isVerified === "boolean") sellerVerified = obj.isVerified;
    };

    if (p.seller && typeof p.seller === 'object') extractFromObject(p.seller);
    if (!sellerName && p.user && typeof p.user === 'object') extractFromObject(p.user);
    if (!sellerName && p.createdBy && typeof p.createdBy === 'object') extractFromObject(p.createdBy);

    if (sellerName) {
        return {
            name: sellerName,
            profilePic: sellerProfilePic,
            verified: sellerVerified
        };
    }
    return undefined;
};

/**
 * Normalizes a raw product object from API into a standard ProductItem for the UI.
 */
export const normalizeProduct = (
    p: any,
    signedImages: Record<string, string> = {},
    sellerDataCache: Record<string | number, { name: string; profilePic?: string }> = {}
): ProductItem => {
    const id = p?.product_id ?? p?.id ?? p?._id;
    const idStr = id != null ? String(id) : "";

    // Image
    const noImageUrl = "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
    const img = getProductImageUrl(p, signedImages) ?? noImageUrl;

    // Images Array
    let imagesArray: string[] = [];
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
        imagesArray = p.images
            .map((img: any) => {
                if (typeof img === 'string') return img;
                if (img && typeof img === 'object') {
                    return img.url || img.image || img.src || null;
                }
                return null;
            })
            .filter((img: string | null): img is string => img !== null);
    }
    if (imagesArray.length === 0 && img && img !== noImageUrl) {
        imagesArray = [img];
    }

    // Title
    const title = typeof p.title === "string" ? p.title :
        typeof p.product_name === "string" ? p.product_name :
            typeof p.name === "string" ? p.name :
                "Untitled";

    // Price
    const priceStr = formatPrice(p.price ?? p.product_price);

    // Original/Discounted Price
    const originalPrice = typeof p.originalPrice === "number" ? p.originalPrice :
        typeof p.price === "number" ? p.price : 0;
    const discountedPrice = typeof p.finalPrice === "number" ? p.finalPrice :
        typeof p.price === "number" ? p.price : 0;

    // Specs & Features
    const specs = p.specs || p.specifications || {};
    const features = p.features || p.tags || p.verificationBadges || [];

    // Seller
    const seller = extractSellerInfo(p, sellerDataCache);

    return {
        id: idStr,
        title,
        image: img,
        images: imagesArray,
        price: priceStr,
        status: typeof p.status === "string" ? p.status : "available",
        originalPrice,
        discountedPrice,
        specs,
        features,
        seller,
        location: p.location,
    };
};
