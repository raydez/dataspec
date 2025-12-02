/**
 * TableValidator - 表定义验证器
 */

import { TableDefinition, TableDefinitionSchema } from '../schemas/table.schema.js';

export interface ValidationError {
  type: string;
  message: string;
  path?: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class TableValidator {
  /**
   * 验证表定义
   */
  validate(table: TableDefinition): ValidationResult {
    const errors: ValidationError[] = [];

    // 1. Schema 验证（Zod 自动）
    const parseResult = TableDefinitionSchema.safeParse(table);
    if (!parseResult.success) {
      parseResult.error.errors.forEach(err => {
        errors.push({
          type: 'SCHEMA_ERROR',
          message: err.message,
          path: err.path.join('.'),
          severity: 'error',
        });
      });
    }

    // 2. 业务规则验证
    this.validateTableName(table, errors);
    this.validateFields(table, errors);
    this.validateOwner(table, errors);
    this.validateDescription(table, errors);
    this.validateDataSources(table, errors);

    return {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors: errors.filter(e => e.severity === 'error'),
      warnings: errors.filter(e => e.severity === 'warning'),
    };
  }

  /**
   * 验证表名
   */
  private validateTableName(table: TableDefinition, errors: ValidationError[]): void {
    // 表名格式：database.table_name
    if (!table.name.match(/^[a-z_]+\.[a-z_]+$/)) {
      errors.push({
        type: 'INVALID_TABLE_NAME',
        message: '表名必须符合 database.table_name 格式，只允许小写字母和下划线',
        path: 'name',
        severity: 'error',
      });
    }

    // 表名长度
    const parts = table.name.split('.');
    if (parts[1].length > 50) {
      errors.push({
        type: 'TABLE_NAME_TOO_LONG',
        message: '表名长度不应超过 50 个字符',
        path: 'name',
        severity: 'warning',
      });
    }
  }

  /**
   * 验证字段
   */
  private validateFields(table: TableDefinition, errors: ValidationError[]): void {
    // 检查字段名重复
    const fieldNames = table.fields.map(f => f.name);
    const duplicates = fieldNames.filter((name, index) => 
      fieldNames.indexOf(name) !== index
    );
    
    if (duplicates.length > 0) {
      errors.push({
        type: 'DUPLICATE_FIELD_NAMES',
        message: `字段名重复: ${[...new Set(duplicates)].join(', ')}`,
        path: 'fields',
        severity: 'error',
      });
    }

    // 检查每个字段
    table.fields.forEach((field, index) => {
      // 字段名格式
      if (!field.name.match(/^[a-z_][a-z0-9_]*$/)) {
        errors.push({
          type: 'INVALID_FIELD_NAME',
          message: `字段名 "${field.name}" 格式错误，应为小写字母、数字、下划线`,
          path: `fields[${index}].name`,
          severity: 'error',
        });
      }

      // 描述长度
      if (field.description.length < 2) {
        errors.push({
          type: 'INSUFFICIENT_FIELD_DESCRIPTION',
          message: `字段 "${field.name}" 描述过短`,
          path: `fields[${index}].description`,
          severity: 'warning',
        });
      }
    });
  }

  /**
   * 验证负责人
   */
  private validateOwner(table: TableDefinition, errors: ValidationError[]): void {
    if (!table.owner || table.owner.includes('[请填写]')) {
      errors.push({
        type: 'NO_OWNER',
        message: '必须指定表负责人',
        path: 'owner',
        severity: 'error',
      });
    }
  }

  /**
   * 验证描述
   */
  private validateDescription(table: TableDefinition, errors: ValidationError[]): void {
    if (!table.description || table.description.length < 10) {
      errors.push({
        type: 'INSUFFICIENT_DESCRIPTION',
        message: '表描述至少需要 10 个字符',
        path: 'description',
        severity: 'warning',
      });
    }
  }

  /**
   * 验证数据来源
   */
  private validateDataSources(table: TableDefinition, errors: ValidationError[]): void {
    if (table.dataSources.length === 0 || 
        table.dataSources.some(s => s.includes('[请填写]') || s === '未指定')) {
      errors.push({
        type: 'NO_DATA_SOURCES',
        message: '必须指定至少一个有效的数据来源',
        path: 'dataSources',
        severity: 'error',
      });
    }
  }
}
