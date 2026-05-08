import { z } from 'zod';

export const ProblemSchema = z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    rating: z.number().nullable(),
    is_predicted: z.boolean().optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Unknown']),
    is_premium: z.boolean(),
    tags: z.array(z.string()),
});

export const SubtopicSchema = z.object({
    title: z.string(),
    title_zh: z.string().optional(),
    description: z.string().optional(),
    description_zh: z.string().optional(),
    problems: z.array(ProblemSchema),
});

export const SectionSchema = z.object({
    title: z.string(),
    title_zh: z.string().optional(),
    description: z.string().optional(),
    description_zh: z.string().optional(),
    subtopics: z.array(SubtopicSchema),
    problems: z.array(ProblemSchema),
});

export const TopicSchema = z.object({
    id: z.string(),
    group: z.string(),
    title: z.string(),
    sections: z.array(SectionSchema),
});

export const TaxonomySchema = z.array(TopicSchema);

export type RawProblem = z.infer<typeof ProblemSchema>;
export type RawSubtopic = z.infer<typeof SubtopicSchema>;
export type RawSection = z.infer<typeof SectionSchema>;
export type RawTopic = z.infer<typeof TopicSchema>;
export type RawTaxonomy = z.infer<typeof TaxonomySchema>;

export function validateTaxonomy(data: unknown): RawTaxonomy {
    return TaxonomySchema.parse(data);
}
