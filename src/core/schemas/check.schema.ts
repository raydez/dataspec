import { z } from 'zod';

/**
 * 检查项 Schema
 */
export const CheckItemSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['upstream', 'row_count', 'null_rate', 'data_validity', 'fluctuation']),
  sql: z.string().optional(),
  alertCondition: z.string().min(1),
  alertLevel: z.enum(['critical', 'warning', 'info']).default('warning'),
});

export type CheckItem = z.infer<typeof CheckItemSchema>;

/**
 * 稽核规则元数据 Schema
 */
export const CheckMetadataSchema = z.object({
  format: z.literal('dataspec-check'),
  version: z.string().default('1.0'),
});

export type CheckMetadata = z.infer<typeof CheckMetadataSchema>;

/**
 * 稽核规则定义 Schema
 * 用于数据稽核自动化（未来扩展）
 */
export const CheckDefinitionSchema = z.object({
  metadata: CheckMetadataSchema,
  tableName: z.string().regex(/^[a-z_]+\.[a-z_]+$/, '表名必须符合 database.table_name 格式'),
  schedule: z.string().min(1), // Cron 表达式
  dependsOn: z.array(z.string()).optional(),
  checkItems: z.array(CheckItemSchema).min(1, '至少需要一个检查项'),
  alertChannels: z.array(z.enum(['feishu', 'email', 'sms'])).default(['feishu']),
  alertRecipients: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type CheckDefinition = z.infer<typeof CheckDefinitionSchema>;

/**
 * 验证稽核规则
 */
export function validateCheckDefinition(data: unknown): { 
  success: boolean; 
  data?: CheckDefinition; 
  error?: z.ZodError 
} {
  const result = CheckDefinitionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
