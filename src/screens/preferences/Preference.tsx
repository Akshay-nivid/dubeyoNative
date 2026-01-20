import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

import { get, post } from "@/src/services/api";
import { Api } from "./api";

interface Question {
  id: string;
  question: string;
  type: "text" | "select" | "radio" | "number";
  meta?: {
    min?: number;
    max?: number;
    default?: number;
  };
}

interface Option {
  id: string;
  name: string;
}

interface ConversationItem {
  question: Question;
  answer: string | string[] | null;
}

export default function PreferenceScreen() {
  const router = useRouter();

  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<
    string | Option | Option[] | number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    init();
    
    // Cleanup timeout on unmount
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const init = async () => {
    try {
      const res = await get(Api.getInitialQuestion);
      
      // Check if request failed
      if (res.status !== 200 || !res.data) {
        const errorMsg = (res as any).message || "No data";
        console.error("Failed to load initial question:", errorMsg);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMsg || "Failed to load preferences. Please try again.",
        });
        setLoading(false);
        // Don't redirect immediately, let user see the error
        return;
      }
      
      const q = res.data;
      setConversation([{ question: q, answer: null }]);
      await loadOptions(q.id);
      setLoading(false);
    } catch (error: any) {
      console.error("Failed to load initial question:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "Failed to load preferences. Please try again.",
      });
      setLoading(false);
    }
  };

  const loadOptions = async (questionId: string) => {
    try {
      const res = await post(Api.getQuestionOptions, { questionId });
      if (res.status === 200 && res.data) {
        setOptions(res.data || []);
      } else {
        const errorMsg = (res as any).message || "Failed to load options";
        console.error("Failed to load options:", errorMsg);
        setOptions([]);
      }
    } catch (error: any) {
      console.error("Failed to load options:", error);
      setOptions([]);
    }
  };

  const submitAnswer = async (answerOverride?: any) => {
    if (submitting) return;

    const answer = answerOverride ?? currentAnswer;
    if (!answer && answer !== 0) return;

    setSubmitting(true);

    const current = conversation[conversation.length - 1].question;

    const payload = {
      questionId: current.id,
      targetId: current.type === "radio" ? null : (answer as Option)?.id || null,
      answerValue:
        current.type === "radio"
          ? (answer as Option[]).map((a) => a.name)
          : (answer as Option)?.name || answer,
    };

    try {
      const res = await post(Api.answerQuestion, payload);
      
      if (res.status !== 200) {
        const errorMsg = (res as any).message || "Failed to submit answer. Please try again.";
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMsg,
        });
        setSubmitting(false);
        return;
      }
      
      const next = res?.data?.nextQuestion;

      setConversation((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          question: current,
          answer: payload.answerValue,
        };
        if (next) copy.push({ question: next, answer: null });
        return copy;
      });

      setCurrentAnswer(null);

      if (!next) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Preferences saved successfully!",
        });
        router.replace("/home");
        return;
      }

      await loadOptions(next.id);
      setSubmitting(false);
    } catch (error: any) {
      console.error("Submit answer error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || error?.response?.data?.message || "Failed to submit answer",
      });
      setSubmitting(false);
    }
  };

  const renderInput = (question: Question) => {
    if (question.type === "text") {
      return (
        <View className="w-full">
          <TextInput
            placeholder="Type here..."
            placeholderTextColor="#9CA3AF"
            value={(currentAnswer as string) || ""}
            onChangeText={(text) => setCurrentAnswer(text)}
            onSubmitEditing={() => {
              if (currentAnswer) {
                submitAnswer();
              }
            }}
            onBlur={() => {
              // Auto-submit on blur if there's an answer
              if (currentAnswer && (currentAnswer as string).trim()) {
                submitAnswer();
              }
            }}
            editable={!submitting}
            className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3.5 text-base text-gray-900"
            style={{ outline: "none" }}
          />
        </View>
      );
    }

    if (question.type === "select") {
      return (
        <View className="w-full gap-2">
          {options.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => {
                // Auto-submit immediately when option is clicked.
                submitAnswer(o);
              }}
              disabled={submitting}
              className="w-full rounded-xl bg-white border border-gray-200 px-4 py-4 flex-row items-center active:bg-blue-50"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View className="h-5 w-5 rounded-full border-2 border-gray-300 mr-3 items-center justify-center">
                <View className="h-3 w-3 rounded-full " />
              </View>
              <Text className="flex-1 text-base text-gray-900 font-medium">
                {o.name}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>
      );
    }

    if (question.type === "radio") {
      const selected = (currentAnswer as Option[]) || [];
      return (
        <View className="w-full gap-2">
          {options.map((o) => {
            const active = selected.some((x) => x.id === o.id);
            const nextValue = active
              ? selected.filter((x) => x.id !== o.id)
              : [...selected, o];

            return (
              <Pressable
                key={o.id}
                onPress={() => {
                  const newSelection = nextValue;
                  setCurrentAnswer(newSelection);
                  
                  // Clear existing timeout
                  if (submitTimeoutRef.current) {
                    clearTimeout(submitTimeoutRef.current);
                  }
                  
                  // Auto-submit after a short delay to allow multiple selections
                  submitTimeoutRef.current = setTimeout(() => {
                    if (newSelection.length > 0 && !submitting) {
                      submitAnswer(newSelection);
                    }
                  }, 500);
                }}
                disabled={submitting}
                className={`w-full rounded-xl border px-4 py-4 flex-row items-center ${
                  active
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200"
                }`}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View
                  className={`h-5 w-5 rounded-full border-2 mr-3 items-center justify-center ${
                    active ? "border-blue-600 bg-blue-600" : "border-gray-300"
                  }`}
                >
                  {active && (
                    <View className="h-3 w-3 rounded-full bg-white" />
                  )}
                </View>
                <Text
                  className={`flex-1 text-base ${
                    active ? "text-blue-900 font-medium" : "text-gray-900"
                  }`}
                >
                  {o.name}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (question.type === "number") {
      const min = question?.meta?.min ?? 0;
      const max = question?.meta?.max ?? 100000;
      const def = question?.meta?.default ?? min;
      const value = (currentAnswer as number) ?? def;

      const handleIncrement = () => {
        if (value < max) {
          const newValue = value + 1;
          setCurrentAnswer(newValue);
          // Auto-submit after value change
          setTimeout(() => submitAnswer(newValue), 500);
        }
      };

      const handleDecrement = () => {
        if (value > min) {
          const newValue = value - 1;
          setCurrentAnswer(newValue);
          // Auto-submit after value change
          setTimeout(() => submitAnswer(newValue), 500);
        }
      };

      const handleValueChange = (newValue: number) => {
        setCurrentAnswer(newValue);
        // Auto-submit after a delay when typing
        setTimeout(() => submitAnswer(newValue), 1000);
      };

      const percentage = ((value - min) / (max - min)) * 100;

      return (
        <View className="w-full">
          {/* Value Display */}
          <View className="items-center mb-6">
            <Text className="text-4xl font-bold text-blue-600 mb-1">
              {value.toLocaleString()}
            </Text>
            <View className="flex-row gap-4">
              <Text className="text-sm text-gray-500">Min: {min.toLocaleString()}</Text>
              <Text className="text-sm text-gray-500">Max: {max.toLocaleString()}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="relative mb-6">
            <View className="h-3 bg-gray-200 rounded-full" />
            <View
              className="absolute h-3 bg-blue-600 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </View>

          {/* Increment/Decrement Controls */}
          <View className="flex-row items-center justify-center gap-4">
            <Pressable
              onPress={handleDecrement}
              disabled={value <= min || submitting}
              className={`h-12 w-12 rounded-full items-center justify-center ${
                value <= min ? "bg-gray-200" : "bg-blue-100"
              }`}
            >
              <Ionicons
                name="remove"
                size={24}
                color={value <= min ? "#9CA3AF" : "#1E40AF"}
              />
            </Pressable>

            <View className="min-w-[120px] items-center">
              <TextInput
                value={value.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || min;
                  if (num >= min && num <= max) {
                    handleValueChange(num);
                  }
                }}
                keyboardType="number-pad"
                className="text-2xl font-bold text-blue-600 text-center"
                style={{ outline: "none" }}
                editable={!submitting}
              />
            </View>

            <Pressable
              onPress={handleIncrement}
              disabled={value >= max || submitting}
              className={`h-12 w-12 rounded-full items-center justify-center ${
                value >= max ? "bg-gray-200" : "bg-blue-100"
              }`}
            >
              <Ionicons
                name="add"
                size={24}
                color={value >= max ? "#9CA3AF" : "#1E40AF"}
              />
            </Pressable>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderAnswer = (answer: string | string[]) => {
    if (Array.isArray(answer)) return answer.join(", ");
    return answer;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-xl font-semibold text-gray-800 mb-4">
          Loading Preferences…
        </Text>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  // Show error state if no conversation started
  if (conversation.length === 0 && !loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <View className="items-center mb-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-xl font-semibold text-gray-800 mt-4 mb-2">
            Unable to Load Preferences
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            We couldn't load your preferences. Please try again or skip for now.
          </Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              init();
            }}
            className="bg-blue-600 px-6 py-3 rounded-xl mb-3"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace("/home")}
            className="px-6 py-3"
          >
            <Text className="text-blue-600 font-semibold">Skip</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-12 pb-4 flex-row justify-between items-center border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Set your preferences
        </Text>
        <Pressable
          onPress={() => router.replace("/home")}
          className="px-4 py-2"
        >
          <Text className="text-blue-600 font-semibold">Skip</Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6">
          {conversation.map((item, index) => (
            <View
              key={index}
              className="mb-6 rounded-2xl bg-white border border-gray-200 p-6 shadow-md"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {/* Question Header */}
              <View className="flex-row items-start mb-4">
                <View className="h-12 w-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <Text className="text-3xl">🤖</Text>
                </View>
                <Text className="flex-1 text-lg font-semibold text-gray-900 leading-6">
                  {item.question.question}
                </Text>
              </View>

              {/* Divider */}
              <View className="h-px bg-gray-200 mb-4" />

              {/* Answer or Input */}
              {item.answer !== null ? (
                <View className="rounded-xl bg-blue-50 border-2 border-blue-200 px-4 py-3.5">
                  <Text className="text-base text-blue-900 font-medium">
                    {renderAnswer(item.answer)}
                  </Text>
                </View>
              ) : (
                <View className="mt-2">{renderInput(item.question)}</View>
              )}
            </View>
          ))}

          {submitting && (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#1E40AF" />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
