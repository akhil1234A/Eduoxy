export const RESPONSE_MESSAGES = {
  ADMIN_MANAGEMENT: {
    STUDENT_LISTED_SUCCESS: "Students listed successfully",
    TEACHER_LISTED_SUCCESS: "Teachers listed successfully",
    COURSE_LISTED_SUCCESS: "Courses listed successfully",
    STUDENT_LISTED_ERROR: "Failed to list students",

    TEACHER_LISTED_ERROR: "Failed to list teachers",
    COURSE_LISTED_ERROR: "Failed to list courses",

    USER_BLOCKED_SUCCESS: "User blocked successfully",
    USER_UNBLOCKED_SUCCESS: "User unblocked successfully",
    USER_BLOCKED_ERROR: "Failed to block user",
    USER_UNBLOCKED_ERROR: "Failed to unblock user",
  },

  AUTH: {
    SIGNUP_SUCCESS: "User registered. OTP sent to email.",
    SIGNUP_FAILURE: "Signup failed",

    LOGIN_SUCCESS: "Login successful",
    LOGIN_FAILURE: "Login failed",
    USER_NOT_VERIFIED: "User not verified. OTP sent to email.",

    OTP_VERIFIED: "OTP verified successfully",
    OTP_VERIFICATION_FAILED: "OTP verification failed",

    TOKEN_REFRESHED: "Token refreshed",
    TOKEN_REFRESH_FAILED: "Refresh failed",

    LOGOUT_SUCCESS: "Logged out",
    LOGOUT_FAILED: "Logout failed",

    GOOGLE_LOGIN_SUCCESS: "Google login successful",
    GOOGLE_LOGIN_FAILED: "Google authentication failed",

    PASSWORD_RESET_REQUESTED: "Password reset token sent successfully",
    PASSWORD_RESET_FAILED: "Failed to request password reset",
    PASSWORD_RESET_SUCCESS: "Password reset successfully",
    PASSWORD_RESET_FAILURE: "Failed to reset password",

    OTP_SENT_SUCCESS: "OTP sent successfully",
    OTP_SENT_FAILURE: "Failed to send OTP",
  },
  CHAT: {
    MISSING_QUERY_PARAMS: "Missing required query parameters",
    CHAT_HISTORY_SUCCESS: "Chat history retrieved successfully",
    CHAT_HISTORY_ERROR: "Error retrieving chat history",
  },
  COURSE: {
    NOT_FOUND: "Course not found",
    NOT_FOUND_OR_UNAUTHORIZED: "Course not found or not authorized",

    UNAUTHORIZED: "Unauthorized",

    TEACHER_REQUIRED: "Teacher ID and name are required",
    INVALID_SECTIONS: "Invalid sections format: Must be an array",

    // Success messages
    UNLIST_SUCCESS: "Course unlisted successfully",
    PUBLISH_SUCCESS: "Course published successfully",
    CREATE_SUCCESS: "Course created successfully",
    UPDATE_SUCCESS: "Course updated successfully",
    DELETE_SUCCESS: "Course deleted successfully",
    RETRIEVE_SUCCESS: "Course retrieved successfully",
    RETRIEVE_ALL_SUCCESS: "Courses retrieved successfully",
    RETRIEVE_ADMIN_SUCCESS: "All courses retrieved successfully",
    RETRIEVE_TEACHER_SUCCESS: "Your courses retrieved successfully",

    // Error messages
    UNLIST_ERROR: "Error unlisting course",
    PUBLISH_ERROR: "Error publishing course",
    CREATE_ERROR: "Error creating course",
    UPDATE_ERROR: "Error updating course",
    DELETE_ERROR: "Error deleting course",
    RETRIEVE_ERROR: "Error retrieving course",
    RETRIEVE_ALL_ERROR: "Error retrieving courses",
    SEARCH_ERROR: "Error searching courses",
  },
  USER_COURSE_PROGRESS: {
    ENROLLED_COURSES_SUCCESS: "Enrolled courses retrieved successfully",
    ENROLLED_COURSES_ERROR: "Error retrieving enrolled courses",

    PROGRESS_NOT_FOUND: "Course progress not found for this user",
    PROGRESS_RETRIEVE_SUCCESS: "Course progress retrieved successfully",
    PROGRESS_RETRIEVE_ERROR: "Error retrieving user course progress",

    PROGRESS_UPDATE_SUCCESS: "Course progress updated successfully",
    PROGRESS_UPDATE_ERROR: "Error updating user course progress",
  },
  DASHBOARD: {
    ADMIN_SUCCESS: "Admin dashboard retrieved successfully",
    ADMIN_ERROR: "Error retrieving admin dashboard",

    TEACHER_SUCCESS: "Teacher dashboard retrieved successfully",
    TEACHER_ERROR: "Error retrieving teacher dashboard",

    TEACHER_ID_REQUIRED: "Teacher ID is required",
    USER_SUCCESS: "Successfully retrieved user dashboard data",
    USER_ERROR: "Failed to retrieve user dashboard data",
    USER_ID_REQUIRED: "User ID is required",
  },
  LIVE_CLASS: {
    CREATE_SUCCESS: "Live class created successfully",
    CREATE_FAIL: "Failed to create live class",

    SCHEDULE_SUCCESS: "Live class schedule retrieved successfully",
    SCHEDULE_FAIL: "Failed to retrieve live class schedule",

    JOIN_SUCCESS: "Joined live class successfully",
    JOIN_FAIL: "Failed to join live class",

    LEAVE_SUCCESS: "Left live class successfully",
    LEAVE_FAIL: "Failed to leave live class",

    START_SUCCESS: "Live class started successfully",
    START_FAIL: "Failed to start live class",
  },
  REVIEW: {
    FETCH_SUCCESS: "Reviews fetched successfully",
    FETCH_FAIL: "Error fetching reviews",

    ADD_SUCCESS: "Review added successfully",
    ADD_FAIL: "Error adding review",

    DELETE_SUCCESS: "Review deleted successfully",
    DELETE_FAIL: "Error deleting review",
    DELETE_UNAUTHORIZED: "Review not found or unauthorized",
  },
  ROADMAP: {
    CREATE_SUCCESS: "Roadmap created successfully",
    CREATE_FAIL: "Failed to create roadmap",

    FETCH_SUCCESS: "Roadmap retrieved successfully",
    FETCH_ALL_SUCCESS: "Roadmaps retrieved successfully",
    FETCH_FAIL: "Failed to get roadmap",
    NOT_FOUND: "Roadmap not found",

    UPDATE_SUCCESS: "Roadmap updated successfully",
    UPDATE_FAIL: "Failed to update roadmap",

    DELETE_SUCCESS: "Roadmap deleted successfully",
    DELETE_FAIL: "Failed to delete roadmap",

    TOPIC_UPDATE_SUCCESS: "Topic progress updated successfully",
    TOPIC_UPDATE_FAIL: "Failed to update topic progress",
    TOPIC_NOT_FOUND: "Roadmap, section, or topic not found",
  },
  TRANSACTION: {
    CREATE_PAYMENT_INTENT_SUCCESS: "Stripe payment intent created successfully",
    CREATE_PAYMENT_INTENT_FAIL: "Error creating stripe payment intent",
    CREATE_TRANSACTION_SUCCESS: "Purchased Course successfully",
    CREATE_TRANSACTION_FAIL: "Error creating transaction",
    GET_ADMIN_EARNINGS_SUCCESS: "Admin earnings retrieved successfully",
    GET_ADMIN_EARNINGS_FAIL: "Error retrieving admin earnings",
    GET_TEACHER_EARNINGS_SUCCESS: "Teacher earnings retrieved successfully",
    GET_TEACHER_EARNINGS_FAIL: "Error retrieving teacher earnings",
    GET_STUDENT_PURCHASES_SUCCESS: "Student purchases retrieved successfully",
    GET_STUDENT_PURCHASES_FAIL: "Error retrieving student purchases",
    USER_ID_REQUIRED: "User ID is required",
    TEACHER_ID_REQUIRED: "Teacher ID is required",
  },
  USER: {
    UPDATE_PASSWORD_SUCCESS: "Password updated successfully",
    UPDATE_PASSWORD_FAIL: "Failed to update password",
    UPDATE_PROFILE_SUCCESS: "Instructor profile updated successfully",
    UPDATE_PROFILE_FAIL: "Failed to update instructor profile",
    GET_PROFILE_SUCCESS: "Profile fetched successfully",
    GET_PROFILE_FAIL: "Failed to fetch profile",
    MISSING_FIELDS: "Missing required fields",
  },
  FORUM: {
    GET_FORUMS_SUCCESS: "Forums fetched successfully",
    GET_FORUMS_ERROR: "Error fetching forums",
    GET_FORUM_SUCCESS: "Forum fetched successfully",
    GET_FORUM_ERROR: "Error fetching forum",
    CREATE_FORUM_SUCCESS: "Forum created successfully",
    CREATE_FORUM_ERROR: "Error creating forum",
    UPDATE_FORUM_SUCCESS: "Forum updated successfully",
    UPDATE_FORUM_ERROR: "Error updating forum",
    DELETE_FORUM_SUCCESS: "Forum deleted successfully",
    DELETE_FORUM_ERROR: "Error deleting forum",
    GET_POSTS_SUCCESS: "Posts fetched successfully",
    GET_POSTS_ERROR: "Error fetching posts",
    CREATE_POST_SUCCESS: "Post created successfully",
    CREATE_POST_ERROR: "Error creating post",
    GET_POST_SUCCESS: "Post fetched successfully",
    GET_POST_ERROR: "Error fetching post",
    UPDATE_POST_SUCCESS: "Post updated successfully",
    UPDATE_POST_ERROR: "Error updating post",
    DELETE_POST_SUCCESS: "Post deleted successfully",
    DELETE_POST_ERROR: "Error deleting post",
    GET_REPLIES_SUCCESS: "Replies fetched successfully",
    GET_REPLIES_ERROR: "Error fetching replies",
    CREATE_REPLY_SUCCESS: "Reply created successfully",
    CREATE_REPLY_ERROR: "Error creating reply",
    UPDATE_REPLY_SUCCESS: "Reply updated successfully",
    UPDATE_REPLY_ERROR: "Error updating reply",
    DELETE_REPLY_SUCCESS: "Reply deleted successfully",
    DELETE_REPLY_ERROR: "Error deleting reply",
  },
  CERTIFICATE: {
    GENERATED_SUCCESS: "Certificate generated successfully",
    GENERATED_ERROR: "Failed to generate certificate",
    RETRIEVE_SUCCESS: "Successfully retrieved certificate(s)",
    RETRIEVE_ERROR: "Failed to retrieve certificate(s)",
    NOT_FOUND: "Certificate not found",
  },
};
