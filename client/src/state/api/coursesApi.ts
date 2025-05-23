import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';
import { setSections } from '@/state/index';

export const coursesApi = createApi({
  reducerPath: 'coursesApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Courses', 'UserCourseProgress'],
  endpoints: (build) => ({
    getPublicCourses: build.query<ApiResponse<InitialCoursesType>, { category?: string; page?: number; limit?: number }>({
      query: ({ category, page = 1, limit = 10 }) => ({
        url: '/courses/public',
        params: { category, page, limit },
      }),
      providesTags: ['Courses'],
    }),

    getAdminCourses: build.query<ApiResponse<InitialCoursesType>, { category?: string; page?: number; limit?: number }>({
      query: ({ category, page = 1, limit = 10 }) => ({
        url: '/courses/admin',
        params: { category, page, limit },
      }),
      providesTags: ['Courses'],
    }),

    getTeacherCourses: build.query<ApiResponse<InitialCoursesType>, { category?: string; page?: number; limit?: number }>({
      query: ({ category, page = 1, limit = 10 }) => ({
        url: '/courses/teacher',
        params: { category, page, limit },
      }),
      providesTags: ['Courses'],
    }),

    getCourse: build.query<ApiResponse<Course>, string>({
      query: (id) => `/courses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Courses', id }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          const course = result.data.data;
          dispatch(setSections(course?.sections || []));
        } catch (err) {
          console.error('Failed to fetch course from coursesApi:', err);
          dispatch(setSections([]));
        }
      },
    }),

    createCourse: build.mutation<Course, FormData>({
      query: (formData) => ({
        url: '/courses',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Courses'],
    }),

    updateCourse: build.mutation<Course, { courseId: string; formData: FormData }>({
      query: ({ courseId, formData }) => ({
        url: `/courses/${courseId}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: () => [{ type: 'Courses' }, 'Courses'],
    }),

    deleteCourse: build.mutation<{ message: string }, string>({
      query: (courseId) => ({
        url: `/courses/${courseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),

    unlistCourse: build.mutation<Course, string>({
      query: (courseId) => ({
        url: `/courses/${courseId}/unlist`,
        method: 'PUT',
      }),
      invalidatesTags: ['Courses'],
    }),

    publishCourse: build.mutation<Course, string>({
      query: (courseId) => ({
        url: `/courses/${courseId}/publish`,
        method: 'PUT',
      }),
      invalidatesTags: ['Courses'],
    }),

    getUserEnrolledCourses: build.query<
      ApiResponse<InitialCoursesType>,
      { userId: string; page?: number; limit?: number }
    >({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: `/users/course-progress/${userId}/enrolled-courses`,
        params: { page, limit },
      }),
      providesTags: ['Courses', 'UserCourseProgress'],
    }),

    getUserCourseProgress: build.query<ApiResponse<UserCourseProgress>, { userId: string; courseId: string }>({
      query: ({ userId, courseId }) => ({
        url: `/users/course-progress/${userId}/courses/${courseId}`,
      }),
      providesTags: ['UserCourseProgress'],
    }),

    updateUserCourseProgress: build.mutation<
      UserCourseProgress,
      {
        userId: string;
        courseId: string;
        progressData: { sections: SectionProgress[] };
      }
    >({
      query: ({ userId, courseId, progressData }) => ({
        url: `/users/course-progress/${userId}/courses/${courseId}`,
        method: 'PUT',
        body: progressData,
      }),
      invalidatesTags: ['UserCourseProgress'],
      async onQueryStarted({ userId, courseId, progressData }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          coursesApi.util.updateQueryData('getUserCourseProgress', { userId, courseId }, (draft) => {
            Object.assign(draft, {
              ...draft,
              sections: progressData.sections,
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    searchCourses: build.query<
      ApiResponse<InitialCoursesType>,
      { searchTerm: string; category?: string; page?: number; limit?: number }
    >({
      query: ({ searchTerm, category, page = 1, limit = 10 }) => ({
        url: '/courses/search',
        params: {
          q: searchTerm,
          category,
          page,
          limit,
        },
      }),
      providesTags: ['Courses'],
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
  useGetUserCourseProgressQuery,
  useUpdateUserCourseProgressMutation,
  useGetUserEnrolledCoursesQuery,
  useSearchCoursesQuery,
} = coursesApi;