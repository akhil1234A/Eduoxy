import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Dashboard", "Students", "Teachers"],
  endpoints: (builder) => ({
    getStudents: builder.query<
  ApiResponse<{ users: IUser[]; total: number; page: number; limit: number; totalPages: number }>,
  { page?: number; limit?: number; searchTerm?: string }
>({
  query: ({ page = 1, limit = 10, searchTerm = "" } = {}) => ({
    url: "/admin/students",
    params: { page, limit, q: searchTerm },
  }),
  providesTags: ["Students"],
}),

getTeachers: builder.query<
  ApiResponse<{ users: IUser[]; total: number; page: number; limit: number; totalPages: number }>,
  { page?: number; limit?: number; searchTerm?: string }
>({
  query: ({ page = 1, limit = 10, searchTerm = "" } = {}) => ({
    url: "/admin/teachers",
    params: { page, limit, q: searchTerm },
  }),
  providesTags: ["Teachers"],
}),
    blockUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/block`,
        method: "PUT",
      }),
    }),
    unblockUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/unblock`,
        method: "PUT",
      }),
    }),
    getAdminDashboard: builder.query<
      ApiResponse<AdminDasboard>, 
      { 
        page?: number; 
        limit?: number; 
        dateFilterType?: 'week' | 'month' | 'custom'; 
        startDate?: string; 
        endDate?: string;
      }
    >({
      query: ({ page = 1, limit = 10, dateFilterType, startDate, endDate } = {}) => ({
        url: "/dashboard/admin",
        method: "GET",
        params: { 
          page, 
          limit, 
          dateFilterType, 
          startDate, 
          endDate 
        },
      }),
      providesTags: ["Dashboard"],
    }),

    getTeacherDashboard: builder.query<
      ApiResponse<TeacherDasboard>, 
      { 
        teacherId: string; 
        page?: number; 
        limit?: number; 
        dateFilterType?: 'week' | 'month' | 'custom'; 
        startDate?: string; 
        endDate?: string;
      }
    >({
      query: ({ teacherId, page = 1, limit = 10, dateFilterType, startDate, endDate }) => ({
        url: `/dashboard/teacher/${teacherId}`,
        method: "GET",
        params: { 
          page, 
          limit, 
          dateFilterType, 
          startDate, 
          endDate 
        },
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