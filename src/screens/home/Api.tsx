import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { get } from '@/src/services/api';
import { getImages } from '@/src/services/imageLink/image';

// Base URL for API - Replace with actual URL or env variable

export const Api = {
    Categories: "/category/all",
    CategoriesAll: "/category/all",
    NearestProducts: "/product/near?page=1&limit=10",
    NewlyProducts: "/product/getLatestProducts",
    SuggestedProducts: "/product/fetchPersonalizedHomeProducts",
    TrendingProducts: "/product/trending",
    SubcategoriesByCategory: "/subcategory/byCategory",
    FilterProducts: "/product/filterProducts",
    profile: "/user/me",
    userProfile: "/user/profile",
    updateProfile: "/user/update",
    updateProfilePic: "/user/update-profile-pic",
    resetPassword: "/user/reset-password",
    Image: "/product/image/url",
    allProducts: "/product/all",
    getProductDetails: "/product/getproductdetails",
    thumbnail: "/product/image/thumbnail",
    getUserDashboardCounts: "/user/getUserDashboardCounts",
};

// API Functions
export const fetchCategories = async () => {
    return get(Api.CategoriesAll);
};

export const fetchSuggestedProducts = async () => {
    return get(Api.SuggestedProducts);
};

export const fetchTrendingProducts = async () => {
    return get(Api.TrendingProducts);
};

export const fetchNewProducts = async () => {
    return get(Api.NewlyProducts);
};

export const fetchNearestProducts = async (lat: number, lon: number) => {
    return get(`${Api.NearestProducts}&latitude=${lat}&longitude=${lon}`);
};

export const fetchProductImages = async (productId: number | string) => {
    try {
        const images = await getImages(String(productId), false);
        return { data: images };
    } catch (error) {
        console.error("Failed to fetch product images:", error);
        return { data: [] };
    }
};

export const fetchProfile = async () => {
    return get(Api.profile);
};



// Map category names to Ionicons names
interface IconProps {
    size: number;
    color: string;
}

export const categoryIcons: Record<string, (props: IconProps) => React.JSX.Element> = {
    "Motors": ({ size, color }) => <Ionicons name="car-sport-outline" size={size} color={color} />,
    "Property": ({ size, color }) => <Ionicons name="home-outline" size={size} color={color} />,
    "Mobiles Tablets": ({ size, color }) => <Ionicons name="phone-portrait-outline" size={size} color={color} />,
    "Furniture Garden": ({ size, color }) => <Ionicons name="leaf-outline" size={size} color={color} />,
    "Job": ({ size, color }) => <Ionicons name="briefcase-outline" size={size} color={color} />,

    "Job": ({ size, color }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
    "Services": ({ size, color }) => <Ionicons name="construct-outline" size={size} color={color} />,
    "Classifieds": ({ size, color }) => <Ionicons name="time-outline" size={size} color={color} />,
    "Professional For Hire": ({ size, color }) => <Ionicons name="people-outline" size={size} color={color} />,
    "Professinal For Hire": ({ size, color }) => <Ionicons name="people-outline" size={size} color={color} />, // Keep typo for backward compatibility
};
