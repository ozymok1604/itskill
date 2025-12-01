/**
 * User Slice
 * Manages user profile data
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiService } from "@/src/services/api";

interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  isSyncing: false,
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
      return response.user;
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
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch user");
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
      return response.user;
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
    // Sync user
    builder
      .addCase(syncUser.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncUser.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.profile = action.payload;
      })
      .addCase(syncUser.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Fetch user
    builder
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update user
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
  },
});

export const { setProfile, clearProfile, clearError } = userSlice.actions;

export default userSlice.reducer;

