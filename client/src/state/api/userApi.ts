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
  tagTypes: ["Chat", "Dashboard", "Certificates"],
  endpoints: (builder) => ({
    updatePassword: builder.mutation<ApiResponse<UpdatePasswordResponse>, UpdatePasswordRequest>({
      query: ({ userId, currentPassword, newPassword }) => ({
        url: "/user/update-password",
        method: "PUT", 
        body: { userId, currentPassword, newPassword },
      }),
    }),
    updateProfile: builder.mutation<ApiResponse<UpdateProfileResponse>, UpdateProfileRequest>({
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
    getProfile: builder.query<ApiResponse<IUser>, string>({
      query: (userId) => ({
        url: `/user/profile?userId=${userId}`,
        method: "GET",
      }),
    }),
    getChatHistory: builder.query<
      ApiResponse<IMessage[]>,
      { courseId: string; senderId: string; receiverId: string }
    >({
      query: ({ courseId, senderId, receiverId }) => ({
        url: `/chat/history?courseId=${courseId}&senderId=${senderId}&receiverId=${receiverId}`,
        method: "GET",
      }),
      providesTags: ["Chat"],
    }),
    getUserDashboard: builder.query<ApiResponse<UserDashboardData>, string>({
      query: (userId) => ({
        url: `/dashboard/user/${userId}`,
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),
    generateCertificate: builder.mutation<ApiResponse<Certificate>, GenerateCertificateRequest>({
      query: ({ userId, courseId, courseName }) => ({
        url: "/certificates",
        method: "POST",
        body: { userId, courseId, courseName },
      }),
      invalidatesTags: ["Certificates"],
    }),
    getUserCertificates: builder.query<
      ApiResponse<UserCertificatesResponse>,
      { userId: string; page: number; limit: number }
    >({
      query: ({ userId, page, limit }) => ({
        url: `/certificates/user/${userId}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Certificates"],
    }),
    getCertificateById: builder.query<ApiResponse<Certificate>, string>({
      query: (certificateId) => ({
        url: `/certificates/${certificateId}`,
        method: "GET",
      }),
      providesTags: ["Certificates"],
    }),
    logTimeSpent: builder.mutation<ApiResponse<void>, TimeTrackingRequest>({
      query: ({ userId, courseId, chapterId, timeSpentSeconds }) => ({
        url: "/time-tracking",
        method: "POST",
        body: { userId, courseId, chapterId, timeSpentSeconds },
      }),
    }),
    getTotalTimeSpent: builder.query<
      ApiResponse<{ totalSeconds: number }>,
      { userId: string; courseId?: string }
    >({
      query: ({ userId, courseId }) => ({
        url: `/time-tracking/user/${userId}${courseId ? `?courseId=${courseId}` : ""}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useUpdatePasswordMutation, useUpdateProfileMutation, useGetProfileQuery, useGetChatHistoryQuery, useGetUserDashboardQuery, useGetUserCertificatesQuery, useGenerateCertificateMutation, useGetCertificateByIdQuery, useLogTimeSpentMutation, useGetTotalTimeSpentQuery } = userApi;