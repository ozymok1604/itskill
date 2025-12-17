/**
 * Test Slice
 * Manages test data and state
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiService } from "@/src/services/api";

export interface Question {
  id: string;
  question: string;
  code?: string;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswer: string;
  explanation?: string;
}

export interface Test {
  questions: Question[];
  testNumber: number;
  section: string;
  position: string;
  subposition: string;
  level: string;
}

interface TestState {
  test: Test | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

const initialState: TestState = {
  test: null,
  isLoading: false,
  isStreaming: false,
  error: null,
};

// Safe string conversion with depth limit to prevent stack overflow
function toShortString(value: unknown, maxLen = 140, depth = 0): string {
  // Prevent infinite recursion
  if (depth > 3) return "[nested]";
  
  if (typeof value === "string") {
    return value.length > maxLen ? value.slice(0, maxLen - 1) + "…" : value;
  }
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  
  if (Array.isArray(value)) {
    // If it's an array, try to join first few elements
    const items = value.slice(0, 3).map(v => toShortString(v, 50, depth + 1));
    return items.join(", ");
  }
  
  if (typeof value === "object") {
    const v: any = value;
    // Common cases if AI returns structured payloads
    if (typeof v.text === "string") return toShortString(v.text, maxLen, depth + 1);
    if (typeof v.value === "string") return toShortString(v.value, maxLen, depth + 1);
    if (typeof v.label === "string") return toShortString(v.label, maxLen, depth + 1);
    if (typeof v.title === "string") return toShortString(v.title, maxLen, depth + 1);
    if (typeof v.content === "string") return toShortString(v.content, maxLen, depth + 1);
    if (typeof v.answer === "string") return toShortString(v.answer, maxLen, depth + 1);
    if (typeof v.explanation === "string") return toShortString(v.explanation, maxLen, depth + 1);
    if (typeof v.name === "string") return toShortString(v.name, maxLen, depth + 1);
    if (typeof v.description === "string") return toShortString(v.description, maxLen, depth + 1);
    
    try {
      const s = JSON.stringify(value);
      return s.length > maxLen ? s.slice(0, maxLen - 1) + "…" : s;
    } catch {
      return "[object]";
    }
  }
  
  try {
    return String(value);
  } catch {
    return "";
  }
}

// Default fallback options when AI returns garbage
const FALLBACK_OPTIONS = [
  { id: "A", text: "Option A" },
  { id: "B", text: "Option B" },
  { id: "C", text: "Option C" },
  { id: "D", text: "Option D" },
];

// Check if a question is completely unusable
function isValidQuestion(input: any): boolean {
  if (!input || typeof input !== "object") return false;
  // Must have at least a question text or some identifiable content
  const hasQuestion = input.question && typeof input.question === "string" && input.question.trim().length > 0;
  const hasId = input.id !== undefined && input.id !== null;
  return hasQuestion || hasId;
}

function normalizeQuestion(input: any): Question | null {
  try {
    // Skip completely invalid inputs
    if (!input || typeof input !== "object") {
      console.warn("⚠️ Invalid question input (not an object):", typeof input);
      return null;
    }

    // Extract question text safely
    let questionText = "";
    if (typeof input.question === "string") {
      questionText = input.question;
    } else if (input.question && typeof input.question === "object") {
      // AI might nest the question
      questionText = toShortString(input.question, 500);
    } else if (typeof input.text === "string") {
      questionText = input.text;
    } else if (typeof input.title === "string") {
      questionText = input.title;
    }

    // If no question text at all, skip this question
    if (!questionText || questionText.trim().length === 0) {
      console.warn("⚠️ Question has no text, skipping:", input);
      return null;
    }

    // Parse options with multiple fallback strategies
    let rawOptions = input?.options;
    let optionsArray: any[] = [];

    if (Array.isArray(rawOptions)) {
      optionsArray = rawOptions;
    } else if (rawOptions && typeof rawOptions === "object") {
      // Options might be an object like { A: "text", B: "text" }
      optionsArray = Object.entries(rawOptions).map(([id, text]) => ({ id, text }));
    } else if (input.answers && Array.isArray(input.answers)) {
      // AI might use "answers" instead of "options"
      optionsArray = input.answers;
    } else if (input.choices && Array.isArray(input.choices)) {
      // Or "choices"
      optionsArray = input.choices;
    }

    // Normalize each option
    const normalizedOptions = optionsArray.slice(0, 4).map((opt, idx) => {
      let text = "";
      
      if (typeof opt === "string") {
        text = opt;
      } else if (opt && typeof opt === "object") {
        text = toShortString(opt?.text ?? opt?.value ?? opt?.answer ?? opt?.label ?? opt, 200);
      } else {
        text = toShortString(opt, 200);
      }

      return {
        id: String.fromCharCode(65 + idx), // Always use A, B, C, D
        text: text || `Option ${String.fromCharCode(65 + idx)}`,
      };
    });

    // Ensure we always have exactly 4 options
    const finalOptions = [...normalizedOptions];
    while (finalOptions.length < 4) {
      const idx = finalOptions.length;
      finalOptions.push({
        id: String.fromCharCode(65 + idx),
        text: `Option ${String.fromCharCode(65 + idx)}`,
      });
    }

    // Normalize correct answer
    let correct = "A";
    if (typeof input.correctAnswer === "string") {
      correct = input.correctAnswer.toUpperCase().trim();
    } else if (typeof input.correct === "string") {
      correct = input.correct.toUpperCase().trim();
    } else if (typeof input.answer === "string") {
      correct = input.answer.toUpperCase().trim();
    } else if (typeof input.correctAnswer === "number") {
      correct = String.fromCharCode(65 + input.correctAnswer);
    }
    
    // Validate correct answer is A-D
    if (!["A", "B", "C", "D"].includes(correct)) {
      // Try to extract just the letter
      const match = correct.match(/[A-D]/);
      correct = match ? match[0] : "A";
    }

    // Normalize explanation
    let explanation = "";
    if (typeof input.explanation === "string") {
      explanation = input.explanation;
    } else if (input.explanation && typeof input.explanation === "object") {
      explanation = toShortString(input.explanation, 500);
    }

    // Normalize ID
    let id = "1";
    if (input.id !== undefined && input.id !== null) {
      id = String(input.id);
    }

    // Normalize code block
    let code: string | undefined = undefined;
    if (input.code) {
      if (typeof input.code === "string") {
        code = input.code;
      } else {
        code = toShortString(input.code, 2000);
      }
    }

    return {
      id,
      question: questionText.slice(0, 1000), // Limit question length
      code,
      options: finalOptions.slice(0, 4),
      correctAnswer: correct,
      explanation: explanation.slice(0, 1000), // Limit explanation length
    };
  } catch (err) {
    console.error("❌ Failed to normalize question:", err, "Input:", input);
    return null;
  }
}

export const createTest = createAsyncThunk(
  "test/createTest",
  async (
    data: {
      position: string;
      subposition: string;
      level: string;
      section: string;
      testNumber: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response: any = await apiService.createTest(data);
      console.log(response, "response");

      // Якщо повертається масив питань напряму
      if (Array.isArray(response)) {
        return {
          questions: response,
          testNumber: data.testNumber,
          section: data.section,
          position: data.position,
          subposition: data.subposition,
          level: data.level,
        };
      }

      // Якщо повертається об'єкт з полем test
      if (response && response.test) {
        return response.test;
      }

      // Якщо повертається об'єкт з полем questions
      if (response && response.questions) {
        return response;
      }

      // Якщо повертається весь response як об'єкт
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create test");
    }
  }
);

const testSlice = createSlice({
  name: "test",
  initialState,
  reducers: {
    clearTest: (state) => {
      state.test = null;
      state.error = null;
      state.isStreaming = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    startStreaming: (state, action: PayloadAction<Omit<Test, "questions">>) => {
      state.isStreaming = true;
      state.isLoading = true;
      state.error = null;
      state.test = {
        ...action.payload,
        questions: [],
      };
    },
    addQuestion: (state, action: PayloadAction<Question>) => {
      if (state.test) {
        try {
          const normalized = normalizeQuestion(action.payload as any);
          
          // Skip if normalization failed (invalid question)
          if (!normalized) {
            console.warn("⚠️ Skipping invalid question from stream");
            return;
          }

          // Перевіряємо, чи питання з таким ID вже існує (щоб уникнути дублікатів)
          const existingIndex = state.test.questions.findIndex(q => q.id === normalized.id);
          if (existingIndex === -1) {
            // Додаємо нове питання
            state.test.questions.push(normalized);
            // Сортуємо питання за ID (щоб вони були в правильному порядку)
            state.test.questions.sort((a, b) => {
              const aNum = parseInt(a.id, 10) || 0;
              const bNum = parseInt(b.id, 10) || 0;
              return aNum - bNum;
            });
            console.log(`✅ Added question ${normalized.id}, total: ${state.test.questions.length}`);
          } else {
            // Оновлюємо існуюче питання (якщо воно змінилося)
            state.test.questions[existingIndex] = normalized;
            console.log(`🔄 Updated question ${normalized.id}`);
          }
        } catch (err) {
          console.error("❌ Error adding question:", err);
        }
      }
    },
    completeStreaming: (state) => {
      state.isStreaming = false;
      state.isLoading = false;
    },
    setStreamingError: (state, action: PayloadAction<string>) => {
      state.isStreaming = false;
      state.isLoading = false;
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTest.fulfilled, (state, action) => {
        state.isLoading = false;
        try {
          const payload: any = action.payload as any;
          if (payload && Array.isArray(payload.questions)) {
            const normalizedQuestions = payload.questions
              .map((q: any) => normalizeQuestion(q))
              .filter((q: Question | null): q is Question => q !== null);
            state.test = {
              ...payload,
              questions: normalizedQuestions,
            };
          } else if (payload && Array.isArray(payload)) {
            // In case the thunk ever returns questions array directly
            const normalizedQuestions = payload
              .map((q: any) => normalizeQuestion(q))
              .filter((q: Question | null): q is Question => q !== null);
            state.test = {
              questions: normalizedQuestions,
              testNumber: 1,
              section: "",
              position: "",
              subposition: "",
              level: "",
            };
          } else {
            state.test = payload;
          }
          state.error = null;
        } catch (err) {
          console.error("❌ Error processing test response:", err);
          state.error = "Failed to process test data";
        }
      })
      .addCase(createTest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearTest, 
  clearError, 
  startStreaming, 
  addQuestion, 
  completeStreaming, 
  setStreamingError 
} = testSlice.actions;
export default testSlice.reducer;

