import { z } from 'zod';

/**
 * 任务项 Schema
 */
export const TaskItemSchema = z.object({
  name: z.string().min(1),
  completed: z.boolean().default(false),
});

export type TaskItem = z.infer<typeof TaskItemSchema>;

/**
 * 数据需求元数据 Schema
 */
export const DataRequestMetadataSchema = z.object({
  format: z.literal('dataspec-request'),
  version: z.string().default('1.0'),
});

export type DataRequestMetadata = z.infer<typeof DataRequestMetadataSchema>;

/**
 * 数据需求 Schema
 * 用于 BI 需求管理（未来扩展）
 */
export const DataRequestSchema = z.object({
  metadata: DataRequestMetadataSchema,
  id: z.string().min(1),
  name: z.string().min(1),
  requester: z.string().min(1),
  businessBackground: z.string().min(10, '业务背景至少需要 10 个字符'),
  dataNeeds: z.string().min(10, '数据需求至少需要 10 个字符'),
  businessScenario: z.string().min(10, '业务场景至少需要 10 个字符'),
  deliverables: z.array(z.string()).default([]),
  status: z.enum(['draft', 'reviewing', 'developing', 'testing', 'delivered']).default('draft'),
  tasks: z.array(TaskItemSchema).default([]),
  tables: z.array(z.string()).optional(),
  metrics: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type DataRequest = z.infer<typeof DataRequestSchema>;

/**
 * 验证数据需求
 */
export function validateDataRequest(data: unknown): { 
  success: boolean; 
  data?: DataRequest; 
  error?: z.ZodError 
} {
  const result = DataRequestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
