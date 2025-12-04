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
        // Перевіряємо, чи питання з таким ID вже існує (щоб уникнути дублікатів)
        const existingIndex = state.test.questions.findIndex(q => q.id === action.payload.id);
        if (existingIndex === -1) {
          // Додаємо нове питання
          state.test.questions.push(action.payload);
          // Сортуємо питання за ID (щоб вони були в правильному порядку)
          state.test.questions.sort((a, b) => {
            const aNum = parseInt(a.id, 10);
            const bNum = parseInt(b.id, 10);
            return aNum - bNum;
          });
          console.log(`✅ Added question ${action.payload.id}, total: ${state.test.questions.length}`);
          console.log(`📋 Questions order:`, state.test.questions.map(q => q.id).join(', '));
        } else {
          // Оновлюємо існуюче питання (якщо воно змінилося)
          state.test.questions[existingIndex] = action.payload;
          console.log(`🔄 Updated question ${action.payload.id}`);
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
        state.test = action.payload;
        state.error = null;
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

