import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { coursesApi } from "./api/coursesApi";
import { authApi } from "./api/authApi";
import { adminApi } from "./api/adminApi";
import { userApi } from "./api/userApi";
import { transactionApi } from "./api/transactionApi";
import { codeRunnerApi } from "./api/codeRunnerApi";

// import authReducer from './reducer/auth.reducer';
import globalReducer from '@/state/index'
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
export const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [coursesApi.reducerPath]: coursesApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,
  [transactionApi.reducerPath]: transactionApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [codeRunnerApi.reducerPath]: codeRunnerApi.reducer,
  // auth:authReducer,
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
      }).concat(authApi.middleware, coursesApi.middleware, adminApi.middleware, transactionApi.middleware, userApi.middleware, codeRunnerApi.middleware),
  });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof setupApiStore>["dispatch"];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export * from "./api/authApi";
export * from "./api/coursesApi";
export * from './api/adminApi'
export * from './api/transactionApi'
export * from './api/userApi'
export * from './api/codeRunnerApi'
export { authApi, coursesApi, adminApi, transactionApi, userApi, codeRunnerApi};