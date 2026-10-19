// An error we throw on purpose, with an HTTP status the client can understand.
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}
