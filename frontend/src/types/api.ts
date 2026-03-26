/**
 * API Client error class with status codes and messages
 */
export class APIError extends Error {
  constructor(
    public status: number,
    public endpoint: string,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "APIError";
    Object.setPrototypeOf(this, new.target.prototype);
  }

  isAuthError(): boolean {
    return this.status === 401;
  }

  isPermissionError(): boolean {
    return this.status === 403;
  }

  isRateLimited(): boolean {
    return this.status === 429;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }
}
