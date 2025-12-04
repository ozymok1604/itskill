/**
 * Redux Store Configuration
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import sectionsReducer from "./slices/sectionsSlice";
import testReducer from "./slices/testSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    sections: sectionsReducer,
    test: testReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["auth/setUser"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload", "meta.arg", "meta.baseQueryMeta"],
        // Ignore these paths in the state
        ignoredPaths: ["auth.user"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

