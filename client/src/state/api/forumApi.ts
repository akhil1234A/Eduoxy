import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";
import { IFile } from "@/types/file";

export interface CreateForumRequest {
  userId: string;
  title: string;
  description: string;
  topics?: string[];
}

export interface UpdateForumRequest {
  forumId: string;
  userId: string;
  title: string;
  description: string;
  topics?: string[];
}

export interface DeleteForumRequest {
  forumId: string;
  userId: string;
}

export interface CreatePostRequest {
  forumId: string;
  userId: string;
  userName: string;
  content: string;
  topic: string;
  files?: IFile[];
}

export interface UpdatePostRequest {
  postId: string;
  userId: string;
  content: string;
  topic: string;
  files?: IFile[];
}

export interface DeletePostRequest {
  postId: string;
  userId: string;
}

export interface CreateReplyRequest {
  postId: string;
  userId: string;
  userName: string;
  content: string;
  files?: IFile[];
  parentReplyId?: string | null;
}

export interface CreateNestedReplyRequest {
  postId: string;
  parentReplyId: string;
  userId: string;
  userName: string;
  content: string;
  files?: IFile[];
}

export interface UpdateReplyRequest {
  replyId: string;
  userId: string;
  content: string;
  files?: IFile[];
}

export interface DeleteReplyRequest {
  replyId: string;
  userId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const forumApi = createApi({
  reducerPath: "forumApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Forum", "Post", "Reply", "ReplyTree"],
  endpoints: (builder) => ({
    getForums: builder.query<ApiResponse<IPaginated<IForum>>, { page: number; pageSize: number; query?: string }>({
      query: ({ page, pageSize, query }) => ({
        url: `/forums?page=${page}&pageSize=${pageSize}${query ? `&query=${encodeURIComponent(query)}` : ""}`,
        method: "GET",
      }),
      providesTags: ["Forum"],
    }),
    createForum: builder.mutation<ApiResponse<IForum>, CreateForumRequest>({
      query: ({ userId, title, description, topics }) => ({
        url: "/forums",
        method: "POST",
        body: { userId, title, description, topics },
      }),
      invalidatesTags: ["Forum"],
    }),
    getPosts: builder.query<ApiResponse<IPaginated<IPost>>, { forumId: string; page: number; pageSize: number; query?: string }>({
      query: ({ forumId, page, pageSize, query }) => ({
        url: `/forums/${forumId}/posts?page=${page}&pageSize=${pageSize}${query ? `&query=${encodeURIComponent(query)}` : ""}`,
        method: "GET",
      }),
      providesTags: ["Post"],
    }),
    createPost: builder.mutation<ApiResponse<IPost>, CreatePostRequest>({
      query: ({ forumId, userId, userName, content, topic, files }) => ({
        url: `/forums/${forumId}/posts`,
        method: "POST",
        body: { userId, userName, content, topic, files },
      }),
      invalidatesTags: ["Post"],
    }),
    getPost: builder.query<ApiResponse<IPost>, string>({
      query: (postId) => ({
        url: `/forums/posts/${postId}`,
        method: "GET",
      }),
      providesTags: ["Post"],
    }),
    updatePost: builder.mutation<ApiResponse<IPost>, UpdatePostRequest>({
      query: ({ postId, userId, content, topic, files }) => ({
        url: `/forums/posts/${postId}`,
        method: "PUT",
        body: { userId, content, topic, files },
      }),
      invalidatesTags: ["Post"],
    }),
    deletePost: builder.mutation<ApiResponse<null>, DeletePostRequest>({
      query: ({ postId, userId }) => ({
        url: `/forums/posts/${postId}`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: ["Post", "Reply", "ReplyTree"],
    }),
    getReplies: builder.query<ApiResponse<IPaginated<IReplyTreeNode>>, { postId: string; page: number; pageSize: number }>({
      query: ({ postId, page, pageSize }) => ({
        url: `/forums/posts/${postId}/replies?page=${page}&pageSize=${pageSize}`,
        method: "GET",
      }),
      providesTags: (result, error, { postId }) => [{ type: "Reply", id: postId }, { type: "ReplyTree", id: postId }],
    }),
    createReply: builder.mutation<ApiResponse<IReply>, CreateReplyRequest>({
      query: ({ postId, userId, userName, content, files, parentReplyId }) => ({
        url: `/forums/posts/${postId}/replies`,
        method: "POST",
        body: { userId, userName, content, files, parentReplyId },
      }),
      invalidatesTags: (result, error, { postId, parentReplyId }) => [
        { type: "Reply" as const, id: postId },
        { type: "ReplyTree" as const, id: postId },
        ...(parentReplyId ? [{ type: "Reply" as const, id: `${postId}-${parentReplyId}` }] : []),
      ],
    }),
    createNestedReply: builder.mutation<ApiResponse<IReply>, CreateNestedReplyRequest>({
      query: ({ postId, parentReplyId, userId, userName, content, files }) => ({
        url: `/forums/replies/${postId}/${parentReplyId}/replies`,
        method: "POST",
        body: { userId, userName, content, files },
      }),
      invalidatesTags: (result, error, { postId, parentReplyId }) => [
        { type: "Reply", id: postId },
        { type: "ReplyTree", id: postId },
        { type: "Reply", id: `${postId}-${parentReplyId}` },
      ],
    }),
    updateReply: builder.mutation<ApiResponse<IReply>, UpdateReplyRequest>({
      query: ({ replyId, userId, content, files }) => ({
        url: `/forums/replies/${replyId}`,
        method: "PUT",
        body: { userId, content, files },
      }),
      invalidatesTags: (result, error, { replyId }) => [
        { type: "Reply", id: replyId },
        { type: "ReplyTree" },
      ],
    }),
    deleteReply: builder.mutation<ApiResponse<null>, DeleteReplyRequest>({
      query: ({ replyId, userId }) => ({
        url: `/forums/replies/${replyId}`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: (result, error, { replyId }) => [
        { type: "Reply", id: replyId },
        { type: "ReplyTree" },
      ],
    }),
    getForum: builder.query<ApiResponse<IForum>, string>({
      query: (forumId) => ({
        url: `/forums/${forumId}`,
        method: "GET",
      }),
      providesTags: (result, error, forumId) => [{ type: "Forum", id: forumId }],
    }),
    updateForum: builder.mutation<ApiResponse<IForum>, UpdateForumRequest>({
      query: ({ forumId, userId, title, description, topics }) => ({
        url: `/forums/${forumId}`,
        method: "PUT",
        body: { userId, title, description, topics },
      }),
      invalidatesTags: (result, error, { forumId }) => [{ type: "Forum", id: forumId }],
    }),
    deleteForum: builder.mutation<ApiResponse<null>, DeleteForumRequest>({
      query: ({ forumId, userId }) => ({
        url: `/forums/${forumId}`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: ["Forum"],
    }),
  }),
});

export const {
  useGetForumsQuery,
  useCreateForumMutation,
  useGetForumQuery,
  useUpdateForumMutation,
  useDeleteForumMutation,
  useGetPostsQuery,
  useCreatePostMutation,
  useGetPostQuery,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetRepliesQuery,
  useCreateReplyMutation,
  useCreateNestedReplyMutation,
  useUpdateReplyMutation,
  useDeleteReplyMutation,
} = forumApi;