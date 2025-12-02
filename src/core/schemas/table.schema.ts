import { z } from 'zod';

/**
 * 字段定义 Schema
 */
export const FieldDefinitionSchema = z.object({
  name: z.string().min(1).regex(/^[a-z_][a-z0-9_]*$/, '字段名只能包含小写字母、数字和下划线，且必须以字母或下划线开头'),
  type: z.string().min(1), // STRING, INT, BIGINT, DECIMAL, DATE, TIMESTAMP, etc.
  description: z.string().min(1),
  nullable: z.boolean().default(true),
  defaultValue: z.string().optional(),
  example: z.string().optional(),
  constraints: z.array(z.string()).optional(),
});

export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>;

/**
 * 表定义元数据 Schema
 */
export const TableMetadataSchema = z.object({
  format: z.literal('dataspec-table'),
  version: z.string().default('1.0'),
});

export type TableMetadata = z.infer<typeof TableMetadataSchema>;

/**
 * 表定义 Schema
 */
export const TableDefinitionSchema = z.object({
  metadata: TableMetadataSchema,
  name: z.string().regex(/^[a-z_]+\.[a-z_]+$/, '表名必须符合 database.table_name 格式'),
  displayName: z.string().min(1),
  description: z.string().min(10, '表描述至少需要 10 个字符'),
  owner: z.string().min(1),
  updateFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']),
  fields: z.array(FieldDefinitionSchema).min(1, '表必须至少有一个字段'),
  partitionKeys: z.array(z.string()).optional(),
  indexes: z.array(z.string()).optional(),
  dataSources: z.array(z.string()).min(1, '必须指定至少一个数据来源'),
  consumers: z.array(z.string()).optional(),
  qualityRules: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type TableDefinition = z.infer<typeof TableDefinitionSchema>;

/**
 * 验证表定义
 */
export function validateTableDefinition(data: unknown): { success: boolean; data?: TableDefinition; error?: z.ZodError } {
  const result = TableDefinitionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
