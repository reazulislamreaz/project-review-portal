import { z } from "zod";

const MAX_PROJECT_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_URL_LENGTH = 2048;

function httpOrHttpsUrl(fieldLabel: string) {
  return z
    .string({ error: `${fieldLabel} is required` })
    .trim()
    .min(1, `${fieldLabel} is required`)
    .max(MAX_URL_LENGTH, `${fieldLabel} must be at most ${MAX_URL_LENGTH} characters`)
    .url(`${fieldLabel} must be a valid URL`)
    .refine((value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    }, `${fieldLabel} must use http or https`);
}

export const createSubmissionSchema = z
  .object({
    projectName: z
      .string({ error: "Project name is required" })
      .trim()
      .min(1, "Project name is required")
      .max(
        MAX_PROJECT_NAME_LENGTH,
        `Project name must be at most ${MAX_PROJECT_NAME_LENGTH} characters`,
      ),
    repoUrl: httpOrHttpsUrl("Repository URL"),
    liveUrl: httpOrHttpsUrl("Live link"),
    description: z
      .string({ error: "Description is required" })
      .trim()
      .min(1, "Description is required")
      .max(
        MAX_DESCRIPTION_LENGTH,
        `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
      ),
  })
  .strict();

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
