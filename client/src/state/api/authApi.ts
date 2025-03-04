import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery"; 
import { clearToken } from "../reducer/auth.reducer";


export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    signUp: builder.mutation<ApiResponse<void>, SignUpRequest>({
      query: (body) => ({
        url: "/auth/signup",
        method: "POST",
        body,
      }),
    }),

    login: builder.mutation<ApiResponse<Tokens>, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    refresh: builder.mutation<ApiResponse<Tokens>, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
        credentials: "include", // Send refreshToken cookie
      }),
    }),
    verifyOtp: builder.mutation<ApiResponse<void>, VerifyOtpRequest>({
      query: (body) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body,
      }),
    }),

    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
        credentials: "include",
      }),
      onQueryStarted: async (_, { dispatch }) => {
        dispatch(clearToken()); 
        dispatch(authApi.util.invalidateTags(["Auth"]));
      },
    }),
  }),
});

export const {
  useSignUpMutation,
  useLoginMutation,
  useRefreshMutation,
  useVerifyOtpMutation,
  useLogoutMutation,
} = authApi;