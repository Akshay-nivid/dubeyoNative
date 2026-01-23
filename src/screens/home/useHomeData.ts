import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import {
  fetchCategories,
  fetchSuggestedProducts,
  fetchTrendingProducts,
  fetchNewProducts,
  fetchNearestProducts,
  fetchProductImages,
  fetchProfile,
  categoryIcons,
} from "@/src/screens/home/Api";

export const useHomeData = () => {
  const { place, coordinates } = useUserLocation();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [profile, setProfile] = useState<string | null>(null);

  const [suggested, setSuggested] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [newAds, setNewAds] = useState<any[]>([]);
  const [nearest, setNearest] = useState<any[]>([]);

  const [signedImages, setSignedImages] = useState({
    suggested: {} as Record<string | number, string>,
    trending: {} as Record<string | number, string>,
    newads: {} as Record<string | number, string>,
    nearest: {} as Record<string | number, string>,
  });

  /* ================== IMAGE HANDLER ================== */
  const loadImages = async (products: any[], categoryType: 'suggested' | 'trending' | 'newads' | 'nearest') => {
    const result: Record<string | number, string> = {};

    await Promise.all(
      products.map(async (p) => {
        try {
          const id = p.id || p.product_id || p._id;
          if (!id) return;
          
          const res = await fetchProductImages(id);
          const imageUrl = res?.data?.[0] || p.image || (Array.isArray(p.images) && p.images[0]?.url) || (Array.isArray(p.images) && p.images[0]);
          if (imageUrl) {
            result[id] = imageUrl;
          }
        } catch {}
      })
    );

    setSignedImages((prev) => ({ ...prev, [categoryType]: result }));
  };

  /* ================== FETCH HOME ================== */
  const fetchHome = useCallback(async () => {
    setLoading(true);
    try {
      const [
        categoryRes,
        suggestedRes,
        trendingRes,
        newAdsRes,
        profileRes,
      ] = await Promise.all([
        fetchCategories().catch(() => ({ data: [] })),
        fetchSuggestedProducts().catch(() => ({ data: [] })),
        fetchTrendingProducts().catch(() => ({ data: [] })),
        fetchNewProducts().catch(() => ({ data: [] })),
        fetchProfile().catch(() => ({ data: { firstName: "User", profilePic: null } })),
      ]);

      const categoriesData = categoryRes?.data || [];
      const suggestedData = suggestedRes?.data || [];
      const trendingData = trendingRes?.data || [];
      const newAdsData = newAdsRes?.data || [];
      const profileData = profileRes?.data || {};

      setCategories(categoriesData);
      setSuggested(suggestedData);
      setTrending(trendingData);
      setNewAds(newAdsData);
      setProfile(profileData?.profilePic || null);

      // Load images in parallel
      await Promise.all([
        loadImages(suggestedData, 'suggested'),
        loadImages(trendingData, 'trending'),
        loadImages(newAdsData, 'newads'),
      ]);
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================== NEAREST ================== */
  useEffect(() => {
    if (!coordinates?.lat || !coordinates?.lon) return;

    fetchNearestProducts(coordinates.lat, coordinates.lon)
      .then((res) => {
        const nearestData = res?.data || [];
        setNearest(nearestData);
        loadImages(nearestData, 'nearest');
      })
      .catch(() => {});
  }, [coordinates]);

  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

  /* ================== CATEGORIES TO RENDER ================== */
  const categoriesToRender = useMemo(() => {
    if (!categories || categories.length === 0) {
      return Object.keys(categoryIcons).map((name) => ({
        key: name,
        name,
        categoryId: null,
      }));
    }
    return categories.map((c: any) => ({
      key: c.value || c.id || c.category_id || c.categoryId,
      name: c.label || c.name || c.category_name,
      categoryId: c.value || c.id || c.category_id || c.categoryId,
    }));
  }, [categories]);

  return {
    loading,
    place,
    profile,
    signedImages,
    nearestProducts: nearest,
    trendingProducts: trending,
    suggestedProducts: suggested,
    newAdsProducts: newAds,
    categoriesToRender,
    refresh: fetchHome,
  };
};
