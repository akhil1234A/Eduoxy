import { fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { BaseQueryFn, FetchArgs } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { setToken, clearToken } from "../reducer/auth.reducer";
import { RootState } from "../redux";


// Define extraOptions type to include isRefreshing
interface CustomBaseQueryExtraOptions {
  isRefreshing?: boolean;
}

export const customBaseQuery: BaseQueryFn<
  string | FetchArgs,
  ApiResponse<unknown>,
  FetchBaseQueryError,
  CustomBaseQueryExtraOptions // Add custom extra options
> = async (args, api, extraOptions = {}) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    prepareHeaders: (headers) => {
      const state = api.getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include", // Send cookies
  });

  let result = await baseQuery(args, api, extraOptions);

  const url = typeof args === "string" ? args : args.url;
  const isAuthEndpoint = url === "/auth/login" || url === "/auth/refresh";

  if (result.error && result.error.status === 401 && !isAuthEndpoint) {
    if (!extraOptions.isRefreshing) {
      // console.log("Attempting token refresh for:", args);
      const refreshResult = await baseQuery(
        { url: "/auth/refresh", method: "POST" },
        { ...api, extra: { ...extraOptions, isRefreshing: true } },
        extraOptions
      );

      const refreshData = refreshResult.data as ApiResponse<Tokens> | undefined;
      if (refreshData?.success && refreshData.data?.accessToken) {
        const { accessToken, user } = refreshData.data;
        api.dispatch(setToken({ token: accessToken, user }));
        // console.log("Token refreshed successfully");
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(clearToken());
        toast.error("Session expired. Please log in again.");
        console.error("Refresh failed:", refreshResult.error || "No data");
        return {
          error: { status: "FETCH_ERROR", error: "Refresh failed" } as FetchBaseQueryError,
        };
      }
    } else {
      toast.error("Authentication failed. Please log in again.");
      return result;
    }
  }

  if (result.error) {
    const errorData = (result.error.data as ApiResponse<never>) || {};
    const errorMessage =
      errorData.error ||
      errorData.message ||
      result.error.status.toString() ||
      "An error occurred";
    toast.error(`Error: ${errorMessage}`);
    console.error("API error:", { args, error: result.error });
    return { error: result.error };
  }

  const isMutationRequest =
    typeof args !== "string" && args.method && args.method !== "GET";

  const resultData = result.data as ApiResponse<unknown>;
  if (isMutationRequest && resultData?.success) {
    toast.success(resultData.message);
  }

  if (result.meta?.response?.status === 204) {
    return { data: { success: true, message: "No content" } as ApiResponse<null> };
  }

  return { data: resultData};
};