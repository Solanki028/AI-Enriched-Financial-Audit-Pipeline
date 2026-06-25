export class ApiError extends Error {
  constructor({ message, status, errorCode, details }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}
