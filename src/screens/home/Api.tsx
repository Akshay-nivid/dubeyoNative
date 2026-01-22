import { Ionicons } from '@expo/vector-icons';
import React from 'react';

// Base URL for API - Replace with actual URL or env variable

export const Api = {
    Categories: "/category/all",
    CategoriesAll: "/category/all",
    NearestProducts: "/product/near?page=1&limit=10",
    NewlyProducts: "/product/getLatestProducts",
    SuggestedProducts: "/product/fetchPersonalizedHomeProducts",
    LocationProducts: "/product/fetchProductsByLocation",
    TrendingProducts: "/product/trending",
    SubcategoriesByCategory: "/subcategory/byCategory",
    FilterProducts: "/product/filterProducts",
    profile: "/user/me",
    Image: "/product/image/url",
    allProducts: "/product/all",
    // wishlist: "/wishlist/getmywishlist", // User requested to ignore wishlist
    getProductDetails: "/product/getproductdetails",
    thumbnail: "/product/image/thumbnail",
    getUserDashboardCounts: "/user/getUserDashboardCounts",
};

export const categoryCallBackData = [
    { category_id: 1, category_name: "Real Estate" },
    { category_id: 2, category_name: "Electronics" },
    { category_id: 3, category_name: "Fashion" },
    { category_id: 4, category_name: "Vehicles" },
    { category_id: 5, category_name: "Sports" },
    { category_id: 6, category_name: "Furniture" },
    { category_id: 7, category_name: "Books" },
    { category_id: 8, category_name: "Services" },
];

// Map category names to Ionicons names
interface IconProps {
    size: number;
    color: string;
}

export const categoryIcons: Record<string, (props: IconProps) => React.JSX.Element> = {
    "Motors": ({ size, color }) => <Ionicons name="car-sport-outline" size={size} color={color} />, // Alias for Vehicles if needed or distinct
    "Property": ({ size, color }) => <Ionicons name="home-outline" size={size} color={color} />,
    "Mobiles Tablets": ({ size, color }) => <Ionicons name="phone-portrait-outline" size={size} color={color} />,
    "Furniture Garden": ({ size, color }) => <Ionicons name="leaf-outline" size={size} color={color} />,

"Job": ({ size, color }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
    "Services": ({ size, color }) => <Ionicons name="construct-outline" size={size} color={color} />,
    "Classifieds": ({ size, color }) => <Ionicons name="time-outline" size={size} color={color} />,
    "Professinal For Hire": ({ size, color }) => <Ionicons name="people-outline" size={size} color={color} />,
};
