import { z } from 'zod';

/**
 * 数据库配置 Schema
 */
export const DatabaseConfigSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['hive', 'mysql', 'clickhouse', 'postgresql']),
  defaultPartition: z.string().optional(),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

/**
 * 模板配置 Schema
 */
export const TemplateConfigSchema = z.object({
  defaultDialect: z.enum(['hive', 'mysql', 'clickhouse']).default('hive'),
  outputDir: z.string().default('./dataspec/templates'),
});

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

/**
 * 验证配置 Schema
 */
export const ValidationConfigSchema = z.object({
  strictMode: z.boolean().default(true),
  customRules: z.array(z.string()).default([]),
});

export type ValidationConfig = z.infer<typeof ValidationConfigSchema>;

/**
 * DataSpec 配置文件 Schema
 * 参考：架构方案第4.3节
 */
export const DataSpecConfigSchema = z.object({
  version: z.string().default('1.0'),
  projectName: z.string().min(1),
  databases: z.array(DatabaseConfigSchema).default([]),
  aiTools: z.array(z.string()).default(['cursor', 'windsurf']),
  templates: TemplateConfigSchema.default({}),
  validation: ValidationConfigSchema.default({}),
});

export type DataSpecConfig = z.infer<typeof DataSpecConfigSchema>;

/**
 * 验证配置文件
 */
export function validateConfig(data: unknown): { 
  success: boolean; 
  data?: DataSpecConfig; 
  error?: z.ZodError 
} {
  const result = DataSpecConfigSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
