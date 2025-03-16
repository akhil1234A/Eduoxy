import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export const transactionApi = createApi({
  reducerPath: "transactionApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Transactions", "Courses"],
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation<
      { clientSecret: string },
      { amount: number }
    >({
      query: (data) => ({
        url: "/transactions/stripe/payment-intent",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Courses", "Transactions"],
    }),

    createTransaction: builder.mutation<
      { message: string; data: Transaction },
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
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useCreateTransactionMutation,
} = transactionApi;
