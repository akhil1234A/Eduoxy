import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export const transactionApi = createApi({
  reducerPath: "transactionApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Transactions", "Courses"],
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation<
      ApiResponse<{ clientSecret: string }>,
      { amount: number; userId: string; courseId: string }
    >({
      query: (data) => ({
        url: "/transactions/stripe/payment-intent",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Courses", "Transactions"],
    }),

    createTransaction: builder.mutation<
      ApiResponse<Transaction>,
      {
        userId: string;
        courseId: string;
        transactionId: string;
        amount: number;
        paymentProvider: "stripe";
      }
    >({
      query: (data) => ({
        url: "/transactions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Courses", "Transactions"],
    }),

    getAdminEarnings: builder.query<
      ApiResponse<{ transactions: Transaction[]; total: number; totalPages: number }>,
      { page?: number; limit?: number; searchTerm?: string }
    >({
      query: ({ page = 1, limit = 10, searchTerm = "" } = {}) => ({
        url: "/transactions/admin/earnings",
        method: "GET",
        params: { page, limit, q: searchTerm },
      }),
      providesTags: ["Transactions"],
    }),

    getTeacherEarnings: builder.query<
      ApiResponse<{ transactions: Transaction[]; total: number; totalPages: number }>,
      { teacherId: string; page?: number; limit?: number; searchTerm?: string }
    >({
      query: ({ teacherId, page = 1, limit = 10, searchTerm = "" }) => ({
        url: `/transactions/teacher/earnings/${teacherId}`,
        method: "GET",
        params: { page, limit, q: searchTerm },
      }),
      providesTags: ["Transactions"],
    }),

    getStudentPurchases: builder.query<
      ApiResponse<{ transactions: Transaction[]; total: number; totalPages: number }>,
      { userId: string; page?: number; limit?: number; searchTerm?: string }
    >({
      query: ({ userId, page = 1, limit = 10, searchTerm = "" }) => ({
        url: `/transactions/student/purchases/${userId}`,
        method: "GET",
        params: { page, limit, q: searchTerm },
      }),
      providesTags: ["Transactions"],
    }),
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useCreateTransactionMutation,
  useGetAdminEarningsQuery,
  useGetTeacherEarningsQuery,
  useGetStudentPurchasesQuery,
} = transactionApi;