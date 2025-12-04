/**
 * Sections Slice
 * Manages sections data
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiService } from "@/src/services/api";

export interface Section {
  _id: string;
  title: string;
  description: string;
  order: number;
  progress: number;
}

interface SectionsState {
  sections: Section[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SectionsState = {
  sections: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const getSections = createAsyncThunk(
  "sections/getSections",
  async (data: { subpositionId: string; uid?: string } | string, { rejectWithValue }) => {
    try {
      // Підтримуємо старий формат (тільки subpositionId) та новий (об'єкт)
      let subpositionId: string;
      let uid: string | undefined;
      
      if (typeof data === 'string') {
        subpositionId = data;
        uid = undefined; // Якщо передано тільки строку, uid не передаємо
      } else {
        subpositionId = data.subpositionId;
        uid = data.uid;
      }
      
      const response = await apiService.getSections(subpositionId, uid);
 
      return response.sections || response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sections");
    }
  }
);

const sectionsSlice = createSlice({
  name: "sections",
  initialState,
  reducers: {
    clearSections: (state) => {
      state.sections = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get sections
    builder
      .addCase(getSections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSections.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as Section[] | { sections: Section[] };
        state.sections = Array.isArray(payload)
          ? payload
          : (payload as { sections: Section[] }).sections || [];
        state.error = null;
      })
      .addCase(getSections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSections, clearError } = sectionsSlice.actions;

export default sectionsSlice.reducer;

