export const handleError = (error: any) => {
  return {
    success: false,
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error.details || error
    }
  };
};

export const handleSuccess = (data: any) => {
  return {
    success: true,
    data
  };
};