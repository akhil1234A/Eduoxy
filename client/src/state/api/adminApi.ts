import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    getStudents: builder.query<IUser[], void>({
      query: () => "admin/students",
    }),
    getTeachers: builder.query<IUser[], void>({
      query: () => "admin/teachers",
    }),
    blockUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `admin/users/${userId}/block`,
        method: "PUT",
      }),
    }),
    unblockUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `admin/users/${userId}/unblock`,
        method: "PUT",
      }),
    }),
    getAdminDashboard: builder.query<{ message: string; data: any }, void>({
      query: () => ({
        url: "/dashboard/admin",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),

    getTeacherDashboard: builder.query<{ message: string; data: any }, string>({
      query: (teacherId) => ({
        url: `/dashboard/teacher/${teacherId}`,
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetTeachersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetAdminDashboardQuery,
  useGetTeacherDashboardQuery,
} = adminApi;