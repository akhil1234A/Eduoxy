import { z } from "zod";

export const resourceSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Resource title is required"),
  url: z.string().url("Invalid URL format"),
});

export const topicSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Topic title is required"),
  description: z.string().min(1, "Topic description is required"),
  isCompleted: z.boolean().default(false),
  resources: z.array(resourceSchema),
});

export const roadmapSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Section title is required"),
  topics: z.array(topicSchema).min(1, "At least one topic is required"),
});

export const roadmapSchema = z.object({
  title: z.string().min(1, "Roadmap title is required"),
  description: z.string().min(1, "Roadmap description is required"),
  sections: z.array(roadmapSectionSchema).min(1, "At least one section is required"),
});

export type Resource = z.infer<typeof resourceSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type RoadmapSection = z.infer<typeof roadmapSectionSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>; 