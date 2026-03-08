export type ApiResponse<T> = {
  data: T
}

export type ApiError = {
  error: string
  code?: string
}
