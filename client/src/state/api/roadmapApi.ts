import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export const roadmapApi = createApi({
  reducerPath: "roadmapApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Roadmap"],
  endpoints: (builder) => ({
    getRoadmaps: builder.query<ApiResponse<RoadmapResponse>, { page: number; limit: number; searchTerm: string }>({
      query: ({ page, limit, searchTerm }) => ({
        url: "/roadmap",
        params: { page, limit, searchTerm },
      }),
    }),
    getRoadmapById: builder.query<ApiResponse<Roadmap>, string>({
      query: (id) => `/roadmap/${id}`,
      providesTags: ["Roadmap"],
    }),
    createRoadmap: builder.mutation<ApiResponse<Roadmap>, Roadmap>({
      query: (roadmap) => ({
        url: "/roadmap",
        method: "POST",
        body: roadmap,
      }),
      invalidatesTags: ["Roadmap"],
    }),
    updateRoadmap: builder.mutation<ApiResponse<Roadmap>, { id: string; roadmap: Roadmap }>({
      query: ({ id, roadmap }) => ({
        url: `/roadmap/${id}`,
        method: "PUT",
        body: roadmap,
      }),
      invalidatesTags: ["Roadmap"],
    }),
    deleteRoadmap: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/roadmap/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roadmap"],
    }),
    updateTopicProgress: builder.mutation<
      ApiResponse<void>,
      { roadmapId: string; sectionId: string; topicId: string; isCompleted: boolean }
    >({
      query: ({ roadmapId, sectionId, topicId, isCompleted }) => ({
        url: `/roadmap/${roadmapId}/sections/${sectionId}/topics/${topicId}/progress`,
        method: "PUT",
        body: { isCompleted },
      }),
      invalidatesTags: ["Roadmap"],
    }),
  }),
});

export const {
  useGetRoadmapsQuery,
  useGetRoadmapByIdQuery,
  useCreateRoadmapMutation,
  useUpdateRoadmapMutation,
  useDeleteRoadmapMutation,
  useUpdateTopicProgressMutation,
} = roadmapApi; 