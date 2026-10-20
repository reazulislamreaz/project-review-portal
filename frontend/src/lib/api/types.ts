export type Role = "STUDENT" | "MENTOR";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthResult = {
  user: SafeUser;
  token: string;
};

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SafeSubmission = {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: SubmissionStatus;
  studentId: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiFieldError = {
  field: string;
  message: string;
};

export type ApiFailure = {
  success: false;
  message: string;
  errors?: ApiFieldError[];
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: ApiFieldError[];

  constructor(message: string, status: number, fieldErrors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
