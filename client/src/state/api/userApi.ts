import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export interface UpdatePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePasswordResponse {
  message: string;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    updatePassword: builder.mutation<UpdatePasswordResponse, UpdatePasswordRequest>({
      query: ({ userId, currentPassword, newPassword }) => ({
        url: "/user/update-password",
        method: "PUT", 
        body: { userId, currentPassword, newPassword },
      }),
    }),
  }),
});

export const { useUpdatePasswordMutation } = userApi;