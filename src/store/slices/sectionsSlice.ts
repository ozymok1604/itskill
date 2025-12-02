/**
 * Sections Slice
 * Manages sections data
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiService } from "@/src/services/api";

export interface Section {
  sectionId: string;
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
  async (subpositionId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getSections(subpositionId);
 
    
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
        state.sections = Array.isArray(action.payload)
          ? action.payload
          : action.payload.sections || [];
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

