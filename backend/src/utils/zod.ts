export function formatZodError(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "body",
    message: issue.message,
  }));
}
