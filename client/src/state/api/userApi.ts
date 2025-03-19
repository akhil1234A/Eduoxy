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

export interface UpdateProfileRequest {
  userId: string;
  title?: string;
  bio?: string;
  profileImage?: File;
}

export interface UpdateProfileResponse {
  message: string;
  user: IUser;
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
    updateProfile: builder.mutation<UpdateProfileResponse, UpdateProfileRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("userId", data.userId);
        if (data.title) formData.append("title", data.title);
        if (data.bio) formData.append("bio", data.bio);
        if (data.profileImage) formData.append("profileImage", data.profileImage);

        return {
          url: "/user/update-profile",
          method: "PUT",
          body: formData,
          formData: true,
        };
      },
    }),
    getProfile: builder.query<IUser, string>({
      query: (userId) => ({
        url: `/user/profile?userId=${userId}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useUpdatePasswordMutation, useUpdateProfileMutation, useGetProfileQuery } = userApi;