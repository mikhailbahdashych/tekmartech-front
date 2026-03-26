export interface ApiError {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}
