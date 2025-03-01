import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { coursesApi } from "./api/coursesApi";
import { authApi } from "./api/authApi";
import authReducer from './reducer/auth.reducer'

export const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [coursesApi.reducerPath]: coursesApi.reducer,
  auth:authReducer
});

export const setupApiStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {/* ... */},
      }).concat(authApi.middleware, coursesApi.middleware),
  });
};

export * from "./api/authApi";
export * from "./api/coursesApi";
export { authApi, coursesApi };