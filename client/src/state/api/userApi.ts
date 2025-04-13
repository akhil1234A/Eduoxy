import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";


export interface IMessage {
  courseId: string;
  senderId: string; 
  receiverId: string; 
  message: string;
  timestamp: string;
  isRead: boolean;
}

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
  name: string;
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
  tagTypes: ["Chat"],
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
        formData.append("name", data.name);
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
    getChatHistory: builder.query<
      { message: string; data: IMessage[] },
      { courseId: string; senderId: string; receiverId: string }
    >({
      query: ({ courseId, senderId, receiverId }) => ({
        url: `/chat/history?courseId=${courseId}&senderId=${senderId}&receiverId=${receiverId}`,
        method: "GET",
      }),
      providesTags: ["Chat"],
    }),
  }),
});

export const { useUpdatePasswordMutation, useUpdateProfileMutation, useGetProfileQuery, useGetChatHistoryQuery } = userApi;