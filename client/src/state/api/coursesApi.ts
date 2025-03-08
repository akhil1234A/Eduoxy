import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";
import { setSections } from "@/state/index"; 

export const coursesApi = createApi({
  reducerPath: "coursesApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Courses"],
  endpoints: (build) => ({
    getPublicCourses: build.query<Course[], { category?: string }>({
      query: ({ category }) => ({
        url: "courses/public",
        params: { category },
      }),
      providesTags: ["Courses"],
    }),

    getAdminCourses: build.query<Course[], { category?: string }>({
      query: ({ category }) => ({
        url: "courses/admin",
        params: { category },
      }),
      providesTags: ["Courses"],
    }),

    getTeacherCourses: build.query<Course[], { category?: string }>({
      query: ({ category }) => ({
        url: "courses/teacher",
        params: { category },
      }),
      providesTags: ["Courses"],
    }),

    getCourse: build.query<Course, string>({
      query: (id) => `courses/${id}`,
      providesTags: (result, error, id) => [{ type: "Courses", id }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          const data = result.data; 
          dispatch(setSections(data.sections || []));
          // console.log("Course sections loaded into Redux:", data.sections);
        } catch (err) {
          console.error("Failed to fetch course from coursesApi:", err);
          dispatch(setSections([])); 
        }
      },
    }),

    createCourse: build.mutation<
      Course,
      { teacherId: string; teacherName: string }
    >({
      query: (body) => ({
        url: "courses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Courses"],
    }),

    updateCourse: build.mutation<
      Course,
      { courseId: string; formData: FormData }
    >({
      query: ({ courseId, formData }) => ({
        url: `courses/${courseId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Courses"},
        "Courses",
      ],
    }),

    deleteCourse: build.mutation<{ message: string }, string>({
      query: (courseId) => ({
        url: `courses/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Courses"],
    }),

    unlistCourse: build.mutation<Course, string>({
      query: (courseId) => ({
        url: `courses/${courseId}/unlist`,
        method: "PUT",
      }),
      invalidatesTags: ["Courses"],
    }),

    publishCourse: build.mutation<Course, string>({
      query: (courseId) => ({
        url: `courses/${courseId}/publish`,
        method: "PUT",
      }),
      invalidatesTags: ["Courses"],
    }),
  }),
});

export const {
  useGetPublicCoursesQuery,
  useGetAdminCoursesQuery,
  useGetTeacherCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  usePublishCourseMutation,
  useUnlistCourseMutation,
} = coursesApi;