import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery"; 


export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    signUp: builder.mutation<{ message: string }, SignUpRequest>({
      query: (body) => ({
        url: "/auth/signup",
        method: "POST",
        body,
      }),
    }),

    login: builder.mutation<Tokens, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),

    verifyOtp: builder.mutation<{ message: string }, VerifyOtpRequest>({
      query: (body) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body,
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useSignUpMutation,
  useLoginMutation,
  useVerifyOtpMutation,
  useLogoutMutation,
} = authApi;