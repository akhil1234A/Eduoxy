import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export const transactionApi = createApi({
  reducerPath: "transactionApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Transactions", "Courses"],
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation<
      { clientSecret: string },
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
      { message: string; data: any },
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

    getAdminEarnings: builder.query<{ message: string; data: any[] }, void>({
      query: () => ({
        url: "/transactions/admin/earnings",
        method: "GET",
      }),
      providesTags: ["Transactions"],
    }),

    getTeacherEarnings: builder.query<{ message: string; data: any[] }, string>({
      query: (teacherId) => ({
        url: `/transactions/teacher/earnings/${teacherId}`,
        method: "GET",
      }),
      providesTags: ["Transactions"],
    }),

    getStudentPurchases: builder.query<{ message: string; data: any[] }, string>({
      query: (userId) => ({
        url: `/transactions/student/purchases/${userId}`,
        method: "GET",
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