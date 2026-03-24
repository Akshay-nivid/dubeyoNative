import { get } from "@/src/services/api";
import { useEffect, useState } from "react";
import { PostAdApi } from "../screens/postAd/Api";

export const usePostAdData = (
  categoryId?: string,
  subcategoryId?: string,
  brandId?: string,
) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        // Fetch Categories
        const catRes = await get(PostAdApi.categories);
        setCategories(catRes.data?.data || catRes.data || []);

        // Fetch Subcategories once
        setIsLoadingSubcategories(true);
        const subRes = await get(PostAdApi.subcategories);
        const allSubs =
          subRes.data?.data || subRes.data?.subcategories || subRes.data || [];
        setAllSubcategories(Array.isArray(allSubs) ? allSubs : []);
      } catch (err) {
        console.error("Failed loading dropdown data", err);
      } finally {
        setIsLoadingSubcategories(false);
      }
    };
    fetchDropdowns();
  }, []);

  // Filter subcategories locally when category changes
  useEffect(() => {
    if (categoryId && allSubcategories.length > 0) {
      const filtered = allSubcategories.filter((sub: any) => {
        const subCatId =
          sub.categoryId ||
          sub.category_id ||
          sub.category?.id ||
          sub.category?._id;
        return subCatId === categoryId;
      });
      setSubcategories(filtered);
    } else {
      setSubcategories([]);
    }
  }, [categoryId, allSubcategories]);

  // Fetch divisions if subcategory changes
  useEffect(() => {
    const fetchDivisions = async () => {
      if (!subcategoryId) {
        setDivisions([]);
        return;
      }

      try {
        setIsLoadingDivisions(true);
        const res = await get(
          `${PostAdApi.divisionBySubcategory}?subCategoryId=${subcategoryId}`,
        );
        const divisionsData = res?.data?.data || res?.data || [];
        setDivisions(Array.isArray(divisionsData) ? divisionsData : []);
      } catch (error) {
        console.error("Failed to fetch divisions", error);
      } finally {
        setIsLoadingDivisions(false);
      }
    };
    fetchDivisions();
  }, [subcategoryId]);

  // Fetch brands if subcategory changes
  useEffect(() => {
    const fetchBrands = async () => {
      if (!subcategoryId) {
        setBrands([]);
        return;
      }

      try {
        setIsLoadingBrands(true);
        const res = await get(
          `${PostAdApi.brandsBySubcategory}?subcategoryId=${subcategoryId}`,
        );
        const brandsData =
          res?.data?.brands || res?.data?.data || res?.data || [];
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      } catch (error) {
        console.error("Failed to fetch brands", error);
      } finally {
        setIsLoadingBrands(false);
      }
    };
    fetchBrands();
  }, [subcategoryId]);

  // Fetch models if brand changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!brandId) {
        setModels([]);
        return;
      }

      try {
        setIsLoadingModels(true);
        const res = await get(`${PostAdApi.modelsByBrand}/${brandId}`);
        const modelsData =
          res?.data?.models || res?.data?.data || res?.data || [];
        setModels(Array.isArray(modelsData) ? modelsData : []);
      } catch (error) {
        console.error("Failed to fetch models", error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, [brandId]);

  return {
    categories,
    subcategories,
    divisions,
    brands,
    models,
    isLoadingSubcategories,
    isLoadingDivisions,
    isLoadingBrands,
    isLoadingModels,
  };
};
