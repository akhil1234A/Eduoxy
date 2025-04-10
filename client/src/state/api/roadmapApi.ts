import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export const roadmapApi = createApi({
  reducerPath: "roadmapApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Roadmap"],
  endpoints: (builder) => ({
    getRoadmaps: builder.query<any[], void>({
      query: () => "roadmap",
      providesTags: ["Roadmap"],
    }),
    getRoadmapById: builder.query<any, string>({
      query: (id) => `roadmap/${id}`,
      providesTags: ["Roadmap"],
    }),
    createRoadmap: builder.mutation<any, any>({
      query: (roadmap) => ({
        url: "roadmap",
        method: "POST",
        body: roadmap,
      }),
      invalidatesTags: ["Roadmap"],
    }),
    updateRoadmap: builder.mutation<any, { id: string; roadmap: any }>({
      query: ({ id, roadmap }) => ({
        url: `roadmap/${id}`,
        method: "PUT",
        body: roadmap,
      }),
      invalidatesTags: ["Roadmap"],
    }),
    deleteRoadmap: builder.mutation<void, string>({
      query: (id) => ({
        url: `roadmap/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roadmap"],
    }),
    updateTopicProgress: builder.mutation<
      any,
      { roadmapId: string; sectionId: string; topicId: string; isCompleted: boolean }
    >({
      query: ({ roadmapId, sectionId, topicId, isCompleted }) => ({
        url: `roadmap/${roadmapId}/sections/${sectionId}/topics/${topicId}/progress`,
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