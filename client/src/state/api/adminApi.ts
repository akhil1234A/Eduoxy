import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: customBaseQuery,
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
  }),
});

export const {
  useGetStudentsQuery,
  useGetTeachersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
} = adminApi;