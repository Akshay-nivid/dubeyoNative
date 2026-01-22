import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Api } from "../Api";
import { post } from "@/src/services/api";

interface ClassifiedShowCardProps {
    open: boolean;
    onClose: () => void;
    category: any;
}

const ClassifiedShowCard: React.FC<ClassifiedShowCardProps> = ({ open, onClose, category }) => {
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);
    const [data, setData] = useState({
        subcategoryId: "",
        divisionId: "",
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (category?.id && open) {
            fetchSubcategories(category?.id);
        }
    }, [category?.id, open]);

    // Axios instance matching Home.tsx

    const fetchSubcategories = async (categoryId: any) => {
        try {
            setLoading(true);
            const res = await post(Api.SubcategoriesByCategory, { categoryId });
            if (res?.status === 200) {
                const list = res.data.data || [];
                setSubcategories(list);
                if (list.length > 0) {
                    setSelectedSubcategory(list[0]);
                    setData((d) => ({ ...d, subcategoryId: list[0]?.id ?? "" }));
                } else {
                    // Reset if no subcategories
                    setSelectedSubcategory(null);
                }
            }
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch subcategories", err);
            setLoading(false);
        }
    };

    const handleSelectDivision = (division: any) => {
        setData((prev) => ({
            ...prev,
            divisionId: division.id,
        }));
    };

    const handleChangeSubCategory = (sub: any) => {
        setSelectedSubcategory(sub);
        setData((prev) => ({
            ...prev,
            subcategoryId: sub?.id,
            divisionId: "", // reset division
        }));
    };

    const handleViewItems = () => {
        onClose();
        // navigate logic
        console.log("View items", data);
        // router.push(...)
    };

    return (
        <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 bg-black/60 justify-end">
                <TouchableOpacity className="flex-1" onPress={onClose} activeOpacity={1} />

                <View className="bg-white rounded-t-[30px] h-[70%] w-full overflow-hidden">
                    <View className="p-6 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
                        <Text className="text-xl font-bold text-gray-800">{category?.name || "Category"}</Text>
                        <TouchableOpacity onPress={onClose} className="bg-gray-200 rounded-full p-2">
                            <Text className="text-gray-600 font-bold px-2">X</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator size="large" color="#0891b2" />
                        </View>
                    ) : subcategories.length > 0 ? (
                        <View className="flex-1 flex-row">
                            {/* Sidebar for Subcategories */}
                            <View className="w-[35%] bg-gray-50 h-full border-r border-gray-100">
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                                    {subcategories.map(sub => (
                                        <TouchableOpacity
                                            key={sub.id}
                                            onPress={() => handleChangeSubCategory(sub)}
                                            className={`p-4 border-l-4 ${selectedSubcategory?.id === sub.id ? 'border-cyan-600 bg-white' : 'border-transparent'}`}
                                        >
                                            <Text className={`text-sm ${selectedSubcategory?.id === sub.id ? 'font-bold text-cyan-700' : 'text-gray-500'}`}>
                                                {sub.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Main Content for Divisions */}
                            <View className="flex-1 p-5 bg-white">
                                <Text className="text-base font-semibold text-gray-800 mb-4">Select Type</Text>
                                <View className="flex-row flex-wrap gap-3">
                                    {selectedSubcategory?.division_type?.length > 0 ? (
                                        selectedSubcategory.division_type.map((d: any) => (
                                            <TouchableOpacity
                                                key={d.id}
                                                onPress={() => handleSelectDivision(d)}
                                                className={`px-4 py-2 rounded-full border ${data.divisionId === d.id ? 'bg-cyan-600 border-cyan-600' : 'border-gray-200 bg-white'}`}
                                            >
                                                <Text className={`${data.divisionId === d.id ? 'text-white' : 'text-gray-600'} text-xs font-medium`}>{d.name}</Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text className="text-gray-400 italic">No types available</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View className="flex-1 justify-center items-center">
                            <Text>No subcategories found</Text>
                        </View>
                    )}

                    <View className="p-4 border-t border-gray-100 bg-white shadow-lg">
                        <TouchableOpacity
                            className="bg-cyan-600 items-center justify-center py-4 rounded-xl shadow-md active:bg-cyan-700"
                            onPress={handleViewItems}
                        >
                            <Text className="text-white font-bold text-base tracking-wide">VIEW ITEMS</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ClassifiedShowCard;
