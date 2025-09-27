export function createApiResponse<T>(data: T) {
  return {
    success: true,
    data: data,
    error: null
  };
}

export function createApiError(message: string) {
  return {
    success: false,
    data: null,
    error: {
      message: message
    }
  };
}