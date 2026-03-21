import { API_BASE_URL } from "@/src/constants/env";
import { get, post } from "@/src/services/api";
import { getToken } from "@/src/services/storage/tokenStorage";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { PostAdApi } from "../screens/postAd/Api";

/* ─────────────────────────────────────────────────────────────
   TYPES & INTERFACES
───────────────────────────────────────────────────────────── */

export const GENERATION_STEPS = {
  PREVIEW: 0,
  BASIC_FORM: 1,
  SPECS_FORM: 2,
  DONE: 3,
} as const;

export type GenerationStep = (typeof GENERATION_STEPS)[keyof typeof GENERATION_STEPS];

export interface Question {
  key?: string;
  slug?: string;
  field?: string;
  question?: string;
  label?: string;
  options?: any[];
  dataType?: string;
  [key: string]: any;
}

interface CategoryInfo {
  id?: string;
  _id?: string;
  value?: string;
  name?: string;
  label?: string;
}

export interface PostAdData {
  title: string;
  enhancedDescription: string;
  categoryId?: string;
  subcategoryId?: string;
  divisionId?: string;
  category?: CategoryInfo;
  subcategory?: CategoryInfo;
  division?: any;
  price: string | number;
  images?: string[];
  specs?: Record<string, any>;
  isAmenitiesRequired?: boolean;
  [key: string]: any;
}

export interface AmenityItem {
  name: string;
  type: string;
  distance_km: number;
  coordinates?: { lat: number; lon: number };
}

export type AmenitiesData = Record<string, AmenityItem[]>;

/* ─────────────────────────────────────────────────────────────
   CONSTANTS & CONFIG
───────────────────────────────────────────────────────────── */

const REDUNDANT_KEY_PATTERNS = [
  /\blocation\b/,
  /\bprice\b/,
  /\bcoordinates\b/,
  /\baddress\b/,
  /\bgps\b/,
];

/* ─────────────────────────────────────────────────────────────
   UTILITIES (Pure Helpers)
───────────────────────────────────────────────────────────── */

/**
 * Normalizes a field key to a standard format (lowercase, no spaces, alphanumeric).
 */
export const normalizeFieldKey = (field: any): string =>
  String(field || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");

/**
 * Gets a stable, normalized identifier for a dynamic item.
 */
export const getStableKey = (item: any, fallbackKey?: string): string => {
  if (!item) return "";
  const rawIdentifier =
    item.key || item.slug || item.field || item.label || item.name || fallbackKey || "";
  return typeof rawIdentifier === "string" ? normalizeFieldKey(rawIdentifier) : "";
};

const normalizeBooleanString = (val: any): any => {
  if (val === "Yes") return true;
  if (val === "No") return false;
  return val;
};

const hasValidValue = (val: any): boolean => {
  if (val == null || val === "") return false;
  if (typeof val === "string" && val.toLowerCase() === "null") return false;
  return true;
};

const resolveEntityId = (entity: any): string | undefined =>
  entity?.id || entity?._id || entity?.value || undefined;

/* ─────────────────────────────────────────────────────────────
   DATA TRANSFORMERS
───────────────────────────────────────────────────────────── */

/**
 * Extracts and cleans a list of questions from various backend payload fields.
 */
const transformQuestions = (payload: any): Question[] => {
  if (!payload || typeof payload !== "object") return [];

  const rawQuestions: Question[] = [
    ...(Array.isArray(payload.question) ? payload.question : []),
    ...(Array.isArray(payload.questions) ? payload.questions : []),
    ...(Array.isArray(payload.dynamicQuestions) ? payload.dynamicQuestions : []),
    ...(Array.isArray(payload.additionalQuestions) ? payload.additionalQuestions : []),
  ];

  const seenText = new Set<string>();

  return rawQuestions
    .filter((q) => {
      const text = String(q.question || q.label || q.field || "").toLowerCase().trim();
      const key = getStableKey(q).toLowerCase();

      if (!text || seenText.has(text)) return false;

      const isRedundant = REDUNDANT_KEY_PATTERNS.some(
        (pattern) => pattern.test(key) || pattern.test(text)
      );
      if (isRedundant) return false;

      seenText.add(text);
      return true;
    })
    .map((q) => {
      const rawOptions = Array.isArray(q.options)
        ? q.options.filter((o: any) => o != null)
        : [];

      // Inject standard Yes/No if missing for boolean types
      if (q.dataType === "boolean" && rawOptions.length === 0) {
        return { ...q, options: ["Yes", "No"] };
      }
      return { ...q, options: rawOptions };
    });
};

/**
 * Normalizes a complex specifications object or array into a flat Record.
 */
const transformSpecifications = (specs: Record<string, any> | any[] = {}): Record<string, any> => {
  if (!specs || typeof specs !== "object") return {};

  if (Array.isArray(specs)) {
    return Object.fromEntries(
      specs
        .filter((s: any) => s && hasValidValue(s.value))
        .map((s: any) => [getStableKey(s), normalizeBooleanString(s.value)])
    );
  }

  const normalized: Record<string, any> = {};
  Object.entries(specs).forEach(([key, spec]) => {
    if (!spec) return;

    const rawValue =
      typeof spec === "object" && spec !== null && "value" in spec ? spec.value : spec;
    const value = normalizeBooleanString(rawValue);

    if (!hasValidValue(value)) return;

    const stableKey =
      typeof spec === "object" && spec !== null
        ? getStableKey(spec, key)
        : normalizeFieldKey(key);

    normalized[stableKey] = value;
  });

  return normalized;
};

/* ─────────────────────────────────────────────────────────────
   MAIN HOOK
───────────────────────────────────────────────────────────── */

export const usePostAdAI = () => {
  // --- UI STATE ---
  const [generationStep, setGenerationStep] = useState<GenerationStep>(GENERATION_STEPS.PREVIEW);
  const [isFormLoading, setIsFormLoading] = useState(true);

  // --- DATA STATE ---
  const [data, setData] = useState<PostAdData>({ title: "", enhancedDescription: "", price: "" });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [specMetadata, setSpecMetadata] = useState<Record<string, any>>({});
  const [imageKeys, setImageKeys] = useState<string[]>([]);

  // --- AMENITIES STATE ---
  const [amenities, setAmenities] = useState<AmenitiesData | null>(null);
  const [isAmenitiesLoading, setIsAmenitiesLoading] = useState(false);

  // --- REFS (FOR CONCURRENCY & CANCELLATION) ---
  const abortControllerRef = useRef<AbortController | null>(null);
  const generationIdRef = useRef<number>(0);
  const amenitiesAbortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      amenitiesAbortRef.current?.abort();
    };
  }, []);

  /**
   * Generates a fresh AbortSignal, cancelling any previous main pipeline calls.
   */
  const createAbortSignal = (): AbortSignal => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  };

  /**
   * Uploads local image URIs to the server and returns their unique keys.
   */
  const uploadImages = useCallback(async (uris: string[], signal?: AbortSignal): Promise<string[]> => {
    const uploadedKeys: string[] = [];
    const token = await getToken();
    const targetUrl = `${API_BASE_URL}${PostAdApi.uploadImage}`;

    await Promise.all(
      uris.map(async (uri) => {
        if (signal?.aborted) return;
        try {
          const formData = new FormData();
          const fileName = uri.split("/").pop() || "image.jpg";
          let ext = fileName.includes(".")
            ? fileName.split(".").pop()?.toLowerCase() || "jpg"
            : "jpg";

          if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
            ext = "jpg";
          }

          formData.append("image", {
            uri,
            name: fileName.includes(".") ? fileName : `${fileName}.jpg`,
            type: `image/${ext === "jpg" ? "jpeg" : ext}`,
          } as any);

          const response = await fetch(targetUrl, {
            method: "POST",
            body: formData,
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            signal,
          });

          const result = await response.json();
          if (!signal?.aborted && result?.data) {
            uploadedKeys.push(result.data);
          }
        } catch (err) {
          if ((err as any).name !== "AbortError") {
            console.warn("[uploadImages] Error uploading:", uri, err);
          }
        }
      })
    );

    return signal?.aborted ? [] : uploadedKeys;
  }, []);

  /**
   * Fetches nearby highlights (amenities) from the backend based on coordinates.
   */
  const fetchAmenities = useCallback(async (lat: number, lon: number): Promise<void> => {
    // Cancel any in-flight amenities requests
    amenitiesAbortRef.current?.abort();
    const signal = (amenitiesAbortRef.current = new AbortController()).signal;

    setIsAmenitiesLoading(true);
    try {
      const response = await get(PostAdApi.getLocationHighlights, { params: { lat, lon }, signal });

      if (!signal.aborted && response?.data?.data) {
        setAmenities(response.data.data);
      }
    } catch (err) {
      if ((err as any).name !== "AbortError") {
        console.warn("[fetchAmenities] Failed:", err);
        setAmenities({});
      }
    } finally {
      if (!signal.aborted) {
        setIsAmenitiesLoading(false);
      }
    }
  }, []);

  /**
   * Final Step: Enhances description and identifies missing specifications.
   */
  const fetchFinalStep = useCallback(
    async ({
      descriptionText,
      intermediateData,
      imageKeys,
      subcategoryId,
      categoryLabel,
      subcategoryLabel,
      currentGenerationId,
      signal,
      location,
      brandId,
    }: any) => {
      if (currentGenerationId !== generationIdRef.current || signal?.aborted) return;

      try {
        const contextPrefix = `ITEM: ${categoryLabel}${
          subcategoryLabel ? ` > ${subcategoryLabel}` : ""
        }\n\n`;
        const contextualDetails = contextPrefix + descriptionText;

        const rawSpecs = Array.isArray(intermediateData?.specs) ? intermediateData.specs : [];
        const missingSpecs: Question[] = rawSpecs.filter((s: any) => !hasValidValue(s.value));
        const missingSpecKeys: string[] = missingSpecs
          .map((s: any) => getStableKey(s))
          .filter(Boolean);

        // Add special check for division if invalid
        const isDivInvalid =
          !intermediateData?.division ||
          (typeof intermediateData.division === "object" &&
            !hasValidValue(intermediateData.division?.id || intermediateData.division?._id));

        if (isDivInvalid && !missingSpecKeys.includes("division")) {
          missingSpecKeys.push("division");
        }

        const response = await post(
          PostAdApi.finalPreview,
          {
            details: contextualDetails,
            specs: missingSpecs,
            location,
            subcategoryId,
            images: imageKeys,
            brandId,
          },
          { signal }
        );

        if (currentGenerationId !== generationIdRef.current) return;

        const payload = response?.data ?? response ?? {};
        let extractedQs = transformQuestions(payload);

        // Merge with missing specs to ensure labels are correct
        const existingKeys = new Set(extractedQs.map((q) => getStableKey(q)));

        const additionalFromMissing: Question[] = missingSpecKeys
          .filter((key) => !existingKeys.has(key))
          .map((key) => {
            const matchedSpec = rawSpecs.find((s: any) => getStableKey(s) === key);
            const label = matchedSpec?.name || matchedSpec?.label || key;
            return {
              ...(matchedSpec || {}),
              key,
              field: key,
              label,
              question: `Please specify the ${label.toLowerCase()}`,
              options: Array.isArray(matchedSpec?.options) ? matchedSpec.options : [],
              dataType: matchedSpec?.dataType,
            };
          });

        const finalQuestions = [...extractedQs, ...additionalFromMissing].map((q) => {
          const matchingSpec = rawSpecs.find((s: any) => getStableKey(s) === getStableKey(q));
          return matchingSpec
            ? {
                ...q,
                options:
                  Array.isArray(matchingSpec.options) && matchingSpec.options.length > 0
                    ? matchingSpec.options
                    : q.options,
                dataType: matchingSpec.dataType || q.dataType,
              }
            : q;
        });

        if (finalQuestions.length > 0) {
          setQuestions(finalQuestions);
          const metadataUpdates: Record<string, any> = {};
          finalQuestions.forEach((q) => {
            const key = getStableKey(q);
            if (key) {
              metadataUpdates[key] = {
                ...q,
                dataType: q.dataType || specMetadata[key]?.dataType,
              };
            }
          });
          setSpecMetadata((prev) => ({ ...prev, ...metadataUpdates }));
        }

        const { specs: rawFinalSpecs, ...otherData } = payload;
        const normalizedFinalSpecs =
          Array.isArray(rawFinalSpecs) && rawFinalSpecs.every((s: any) => typeof s === "string")
            ? undefined
            : transformSpecifications(rawFinalSpecs);

        setData((prev) => ({
          ...prev,
          ...otherData,
          enhancedDescription: otherData.enhanced_description || prev.enhancedDescription,
          categoryId: resolveEntityId(otherData.category) || prev.categoryId,
          subcategoryId: resolveEntityId(otherData.subcategory) || prev.subcategoryId,
          divisionId: resolveEntityId(otherData.division) || prev.divisionId,
          specs: { ...(prev.specs || {}), ...(normalizedFinalSpecs || {}) },
        }));

        setIsFormLoading(false);
        setGenerationStep(GENERATION_STEPS.DONE);
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("[fetchFinalStep] Error:", err);
          setIsFormLoading(false);
          setGenerationStep(GENERATION_STEPS.DONE);
        }
      }
    },
    [specMetadata]
  );

  /**
   * Intermediate Step: Identifies relevant specifications and category structure.
   */
  const fetchIntermediateStep = useCallback(
    async (
      basicData: any,
      currentGenerationId: number,
      signal: AbortSignal,
      location?: { lat: number; lon: number } | null
    ) => {
      if (currentGenerationId !== generationIdRef.current || signal.aborted) return;

      try {
        const subcategoryId = resolveEntityId(basicData?.subcategory) || basicData?.subcategoryId;
        const detailsText =
          basicData?.details || basicData?.enhanced_description || basicData?.description;

        const response = await post(
          PostAdApi.intermediatePreview,
          {
            subcategoryId,
            details: detailsText,
            images: basicData.images || [],
          },
          { signal }
        );

        if (currentGenerationId !== generationIdRef.current) return;

        const intermediate = response?.data || {};
        const metadata: Record<string, any> = {};
        const specsFound: Record<string, any> = {};

        // 1. Process explicit specs array
        if (Array.isArray(intermediate.specs)) {
          intermediate.specs.forEach((s: any) => {
            const k = getStableKey(s);
            if (k) {
              metadata[k] = s;
              specsFound[k] = s;
            }
          });
        }

        // 2. Process inferred specs from top-level fields
        const EXCLUDE_KEYS = new Set([
          "slug",
          "images",
          "questions",
          "specs",
          "specifications",
          "category",
          "subcategory",
          "division",
          "title",
          "description",
          "details",
          "enhanced_description",
        ]);
        Object.entries(intermediate).forEach(([key, value]) => {
          const isPotentialSpec =
            !EXCLUDE_KEYS.has(key) &&
            value &&
            typeof value === "object" &&
            "value" in (value as any) &&
            hasValidValue((value as any).value);
          if (isPotentialSpec) {
            const stableKey = getStableKey(value as any, key);
            if (stableKey) {
              metadata[stableKey] = value;
              specsFound[stableKey] = value;
            }
          }
        });

        setSpecMetadata((prev) => ({ ...prev, ...metadata }));
        setData((prev) => ({
          ...prev,
          ...intermediate,
          enhancedDescription: intermediate.enhanced_description || prev.enhancedDescription,
          categoryId: resolveEntityId(intermediate.category) || prev.categoryId,
          subcategoryId: resolveEntityId(intermediate.subcategory) || prev.subcategoryId,
          divisionId: resolveEntityId(intermediate.division) || prev.divisionId,
          brandId: resolveEntityId(intermediate.brand) || prev.brandId,
          specs:
            Object.keys(specsFound).length > 0
              ? transformSpecifications(specsFound)
              : prev.specs || {},
        }));

        setGenerationStep(GENERATION_STEPS.SPECS_FORM);

        // Resolve labels for the final context
        const categoryLabel =
          intermediate.category?.name ||
          intermediate.category?.label ||
          basicData.category?.name ||
          basicData.category?.label ||
          "";
        const subLabel =
          intermediate.subcategory?.name ||
          intermediate.subcategory?.label ||
          basicData.subcategory?.name ||
          basicData.subcategory?.label ||
          "";

        const finalParams = {
          descriptionText: detailsText,
          subcategoryId:
            resolveEntityId(intermediate.subcategory) ||
            resolveEntityId(basicData.subcategory) ||
            basicData.subcategoryId,
          intermediateData: intermediate,
          imageKeys: basicData.images || [],
          categoryLabel,
          subcategoryLabel: subLabel,
          currentGenerationId,
          signal,
          location,
          brandId: resolveEntityId(intermediate.brand),
        };

        await fetchFinalStep(finalParams);
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("[fetchIntermediateStep] Error:", err);
          setIsFormLoading(false);
          setGenerationStep(GENERATION_STEPS.DONE);
          Toast.show({
            type: "info",
            text1: "AI Analysis Partial",
            text2: "Some details may need manual review.",
          });
        }
      }
    },
    [fetchFinalStep]
  );

  /**
   * Initial Entry Point: Categorizes the product and starts parallel tasks.
   */
  const fetchPreview = useCallback(
    async (
      description: string,
      images: string[],
      location?: { lat: number; lon: number } | null
    ) => {
      const currentGenerationId = ++generationIdRef.current;
      const signal = createAbortSignal();

      // Reset questions only (Keep amenities unless we specifically need to)
      setQuestions([]);

      try {
        setIsFormLoading(true);
        setGenerationStep(GENERATION_STEPS.PREVIEW);

        // --- Task 1: Upload Images ---
        const uploadedImageKeys = await uploadImages(images, signal);

        if (signal.aborted || currentGenerationId !== generationIdRef.current) return;

        if (uploadedImageKeys.length === 0 && images.length > 0) {
          Toast.show({ type: "error", text1: "Upload Failed", text2: "Could not process images." });
          setIsFormLoading(false);
          return;
        }
        setImageKeys(uploadedImageKeys);

        // --- Task 2: No immediate parallel load (Moved to after AI analysis) ---

        // --- Task 3: Primary AI Analysis ---
        const activeImageSet = uploadedImageKeys.length > 0 ? uploadedImageKeys : images;
        const response = await post(
          PostAdApi.previewProduct,
          { description, images: activeImageSet },
          { signal }
        );

        if (currentGenerationId !== generationIdRef.current) return;

        const basicResult = response?.data;
        if (!basicResult) throw new Error("Preview API returned no data");

        setData({
          ...basicResult,
          title: basicResult.title || "",
          enhancedDescription:
            basicResult.details ||
            basicResult.enhanced_description ||
            basicResult.description ||
            "",
          categoryId: resolveEntityId(basicResult.category),
          subcategoryId: resolveEntityId(basicResult.subcategory),
          price: basicResult.price || "",
          isAmenitiesRequired: basicResult.isAmenitiesRequired ?? false,
        });

        setGenerationStep(GENERATION_STEPS.BASIC_FORM);

        // --- Task 4: Parallel Amenity Load (Conditional) ---
        if (basicResult.isAmenitiesRequired && location?.lat && location?.lon) {
          fetchAmenities(location.lat, location.lon);
        }

        // --- Task 5: Continue to Next Stage ---
        await fetchIntermediateStep(
          { ...basicResult, images: activeImageSet },
          currentGenerationId,
          signal,
          location
        );
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("[fetchPreview] Initial analysis failed:", err);
          Toast.show({
            type: "error",
            text1: "AI Busy",
            text2: "Could not analyze the ad. Please try again.",
          });
          setIsFormLoading(false);
        }
      }
    },
    [uploadImages, fetchIntermediateStep, fetchAmenities]
  );

  return {
    generationStep,
    isFormLoading,
    data,
    setData,
    questions,
    specMetadata,
    imageKeys,
    amenities,
    isAmenitiesLoading,
    fetchPreview,
    fetchAmenities,
  };
};
