/**
 * User Slice
 * Manages user profile data
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiService } from "@/src/services/api";

interface Progress {
  lessonsCompleted: number;
  testsTaken: number;
  totalLessonsAvailable: number | null;
  progressPercentage: number;
}

interface QuestionsStats {
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  accuracyPercentage: number;
}

interface Section {
  sectionId: string;
  title: string;
  description: string;
  order: number;
  progress: number;
}

interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  avatar?: string;
  position?: string;
  subposition?: string;
  level?: string;
  progress?: Progress;
  questionsStats?: QuestionsStats;
  sections?: Section[];
  createdAt?: string;
  updatedAt?: string;
}

interface Subposition{
  id: string;
  name: string;

}

interface Position {
  _id: string;
  name: string;
  subpositions: Subposition[];   
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
  positions: Position[];
  isLoadingPositions: boolean;
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  isSyncing: false,
  positions: [],
  isLoadingPositions: false,
};

// Async thunks
export const syncUser = createAsyncThunk(
  "user/syncUser",
  async (
    { uid, email }: { uid: string; email: string | null },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.syncUser(uid, email);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to sync user");
    }
  }
);

export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (uid: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getUser(uid);
      console.log(response,'response')
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch user");
    }
  }
);

export const getPositions = createAsyncThunk(
  "user/getPositions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getPositions();
      console.log(response, "getPositions response");
      return response.positions || response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch positions");
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "user/updateUserProfile",
  async (
    { uid, data }: { uid: string; data: Partial<UserProfile> },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.updateUser(uid, data);
      // API may return { user } or the user object directly depending on backend
      return (response as any).user || response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update user");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.profile = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncUser.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncUser.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.profile = action.payload.user || action.payload;
        state.error = null;
      })
      .addCase(syncUser.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload.user || action.payload;
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(getPositions.pending, (state) => {
        state.isLoadingPositions = true;
        state.error = null;
      })
      .addCase(getPositions.fulfilled, (state, action) => {
        state.isLoadingPositions = false;
        state.positions = Array.isArray(action.payload) 
          ? action.payload 
          : action.payload.positions || [];
      })
      .addCase(getPositions.rejected, (state, action) => {
        state.isLoadingPositions = false;
        state.error = action.payload as string;
      });
  },
});

export const { setProfile, clearProfile, clearError } = userSlice.actions;

export default userSlice.reducer;

