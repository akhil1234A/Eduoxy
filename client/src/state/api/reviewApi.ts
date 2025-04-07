import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export interface IReview {
  _id: string;
  userId: string;
  courseId: string;
  userName: string;
  rating: number;
  review: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddReviewRequest {
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  review: string;
}

export interface DeleteReviewRequest {
  reviewId: string;
  userId: string;
}

export const reviewApi = createApi({
  reducerPath: "reviewApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Review"],
  endpoints: (builder) => ({
    getReviewsByCourseId: builder.query<{ message: string; data: IReview[] }, string>({
      query: (courseId) => ({
        url: `/review/course/${courseId}`,
        method: "GET",
      }),
      providesTags: ["Review"],
    }),
    addReview: builder.mutation<{ message: string; data: IReview }, AddReviewRequest>({
      query: (data) => ({
        url: "/review",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Review"],
    }),
    deleteReview: builder.mutation<{ message: string }, DeleteReviewRequest>({
      query: ({ reviewId, userId }) => ({
        url: `/review/${reviewId}`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: ["Review"],
    }),
  }),
});

export const {
  useGetReviewsByCourseIdQuery,
  useAddReviewMutation,
  useDeleteReviewMutation,
} = reviewApi; 