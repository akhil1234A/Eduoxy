import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { coursesApi } from "./api/coursesApi";
import { authApi } from "./api/authApi";
import authReducer from './reducer/auth.reducer';
import globalReducer from '@/state/index'
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

export const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [coursesApi.reducerPath]: coursesApi.reducer,
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
      }).concat(authApi.middleware, coursesApi.middleware),
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
export { authApi, coursesApi };