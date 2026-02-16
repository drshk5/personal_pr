import type { ApiErrorResponse } from "@/types/common";

export interface ErrorDetails {
  message: string;
  errors?: string[];
}

export const extractErrorDetails = (error: unknown): ErrorDetails => {
  const apiError = error as ApiErrorResponse;
  let errorMessage = "An error occurred while processing your request";
  let errorArray: string[] | undefined;

  if (apiError?.apiError?.message) {
    errorMessage = apiError.apiError.message;
  } else if (
    apiError?.response?.data &&
    typeof apiError.response.data === "object" &&
    "statusCode" in apiError.response.data &&
    ("message" in apiError.response.data || "Message" in apiError.response.data)
  ) {
    errorMessage = (apiError.response.data.message ||
      apiError.response.data.Message) as string;

    // Check if errors array exists
    if (
      apiError.response.data.errors &&
      Array.isArray(apiError.response.data.errors)
    ) {
      errorArray = apiError.response.data.errors;
    }
  } else if (apiError?.message && typeof apiError.message === "string") {
    errorMessage = apiError.message;
  } else if (
    apiError &&
    typeof apiError === "object" &&
    "statusCode" in apiError &&
    ("message" in apiError || "Message" in apiError)
  ) {
    errorMessage = (apiError.message || apiError.Message) as string;
  } else if (apiError?.response?.data?.message) {
    errorMessage = apiError.response.data.message;

    // Check if errors array exists
    if (
      apiError.response?.data?.errors &&
      Array.isArray(apiError.response.data.errors)
    ) {
      errorArray = apiError.response.data.errors;
    }
  } else if (apiError?.response?.data?.detail) {
    errorMessage = apiError.response.data.detail;
  } else if (apiError?.response?.data?.title) {
    errorMessage = apiError.response.data.title;
  } else if (apiError?.response?.data?.errors) {
    const errors = apiError.response.data.errors;

    // Check if errors is an array
    if (Array.isArray(errors)) {
      errorArray = errors;
      errorMessage = "Validation failed";
    } else {
      // errors is an object
      const firstErrorKey = Object.keys(errors)[0];
      const firstError = errors[firstErrorKey];
      errorMessage = Array.isArray(firstError)
        ? firstError[0]
        : typeof firstError === "object" && firstError !== null
          ? JSON.stringify(firstError)
          : String(firstError);
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return {
    message: errorMessage,
    errors: errorArray,
  };
};

export const extractErrorMessage = (error: unknown): string => {
  return extractErrorDetails(error).message;
};
