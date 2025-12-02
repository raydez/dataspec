import { z } from 'zod';

/**
 * 指标定义元数据 Schema
 */
export const MetricMetadataSchema = z.object({
  format: z.literal('dataspec-metric'),
  version: z.string().default('1.0'),
});

export type MetricMetadata = z.infer<typeof MetricMetadataSchema>;

/**
 * 变更历史 Schema
 */
export const ChangeHistorySchema = z.object({
  date: z.string(),
  description: z.string(),
});

export type ChangeHistory = z.infer<typeof ChangeHistorySchema>;

/**
 * 指标定义 Schema
 */
export const MetricDefinitionSchema = z.object({
  metadata: MetricMetadataSchema,
  name: z.string().min(1),
  category: z.string().min(1),
  businessDefinition: z.string().min(10, '业务定义至少需要 10 个字符'),
  owner: z.string().min(1),
  formula: z.string().min(1),
  sqlLogic: z.string().optional(),
  dataSource: z.string().min(1),
  dimensions: z.array(z.string()).default([]),
  relatedMetrics: z.array(z.string()).optional(),
  changeHistory: z.array(ChangeHistorySchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type MetricDefinition = z.infer<typeof MetricDefinitionSchema>;

/**
 * 验证指标定义
 */
export function validateMetricDefinition(data: unknown): { success: boolean; data?: MetricDefinition; error?: z.ZodError } {
  const result = MetricDefinitionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
