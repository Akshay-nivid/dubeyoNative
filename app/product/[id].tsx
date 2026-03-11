import { useLocalSearchParams } from "expo-router";
import React from "react";
import ProductDetailScreen from "@/src/screens/product/ProductDetail";

const ProductDetails = () => {
  const { id } = useLocalSearchParams();
  const productId = Array.isArray(id) ? id[0] : id || "";

  return <ProductDetailScreen productId={productId} />;
};

export default ProductDetails;
