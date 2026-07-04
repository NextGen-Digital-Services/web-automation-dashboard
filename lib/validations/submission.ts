import { z } from "zod";

export const submissionSchema = z.object({
  websiteUrl: z
    .string()
    .min(1, "Website URL is required")
    .url("Please enter a valid website URL (e.g., https://example.com)"),
  businessName: z
    .string()
    .min(1, "Business name is required")
    .min(2, "Business name must be at least 2 characters"),
  priority: z.enum(["low", "medium", "high"]),
});

export type SubmissionFormValues = z.infer<typeof submissionSchema>;
