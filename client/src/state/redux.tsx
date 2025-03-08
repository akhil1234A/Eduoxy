import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { coursesApi } from "./api/coursesApi";
import { authApi } from "./api/authApi";
import { adminApi } from "./api/adminApi";
import authReducer from './reducer/auth.reducer';
import globalReducer from '@/state/index'
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

export const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [coursesApi.reducerPath]: coursesApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,
  auth:authReducer,
  global: globalReducer
});

export const setupApiStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ["global.courseEditor.sections"],
        },
      }).concat(authApi.middleware, coursesApi.middleware, adminApi.middleware),
  });
};

// Export store types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof setupApiStore>["dispatch"];

// Export typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export * from "./api/authApi";
export * from "./api/coursesApi";
export * from './api/adminApi'
export { authApi, coursesApi, adminApi};