/**
 * SQLGenerator 单元测试
 */

import { describe, it, expect } from 'vitest';
import { SQLGenerator } from '../../src/core/generators/sql-generator.js';
import { TableDefinition } from '../../src/core/schemas/table.schema.js';

const mockTable: TableDefinition = {
  metadata: {
    format: 'dataspec-table',
    version: '1.0',
  },
  name: 'dw.sales_daily',
  displayName: '销售日表',
  description: '每日销售数据汇总表',
  owner: '张三',
  updateFrequency: 'daily',
  fields: [
    {
      name: 'order_id',
      type: 'STRING',
      description: '订单ID',
      nullable: false,
    },
    {
      name: 'amount',
      type: 'DECIMAL',
      description: '金额',
      nullable: false,
    },
    {
      name: 'dt',
      type: 'STRING',
      description: '日期分区',
      nullable: false,
    },
  ],
  partitionKeys: ['dt'],
  dataSources: ['ods.orders'],
};

describe('SQLGenerator - Hive', () => {
  const generator = new SQLGenerator('hive');

  it('应该生成正确的 Hive DDL', () => {
    const ddl = generator.generateDDL(mockTable);
    
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS dw.sales_daily');
    expect(ddl).toContain('order_id STRING');
    expect(ddl).toContain('amount DECIMAL(18,2)');
    expect(ddl).toContain('PARTITIONED BY');
    expect(ddl).toContain('dt STRING');
    expect(ddl).toContain('STORED AS PARQUET');
  });

  it('应该生成包含注释的 DDL', () => {
    const ddl = generator.generateDDL(mockTable, { includeComments: true });
    
    expect(ddl).toContain('COMMENT \'订单ID\'');
    expect(ddl).toContain('COMMENT \'金额\'');
    expect(ddl).toContain('COMMENT \'销售日表\'');
  });

  it('应该生成正确的 ETL 模板', () => {
    const etl = generator.generateETL(mockTable);
    
    expect(etl).toContain('INSERT OVERWRITE TABLE dw.sales_daily');
    expect(etl).toContain('PARTITION (dt = \'${bizdate}\')');
    expect(etl).toContain('order_id');
    expect(etl).toContain('amount');
  });

  it('应该生成稽核 SQL', () => {
    const checkSql = generator.generateCheckSQL(mockTable);
    
    expect(checkSql).toContain('数据稽核 SQL');
    expect(checkSql).toContain('数据量检查');
    expect(checkSql).toContain('关键字段非空检查');
    expect(checkSql).toContain('数据量日环比波动检查');
  });
});

describe('SQLGenerator - MySQL', () => {
  const generator = new SQLGenerator('mysql');

  it('应该生成正确的 MySQL DDL', () => {
    const ddl = generator.generateDDL(mockTable);
    
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS');
    expect(ddl).toContain('dw_sales_daily');
    expect(ddl).toContain('VARCHAR(255)');
    expect(ddl).toContain('DECIMAL(18,2)');
    expect(ddl).toContain('ENGINE=InnoDB');
  });

  it('应该处理 NOT NULL 约束', () => {
    const ddl = generator.generateDDL(mockTable);
    
    expect(ddl).toContain('NOT NULL');
  });
});

describe('SQLGenerator - MaxCompute', () => {
  const generator = new SQLGenerator('maxcompute');

  it('应该生成正确的 MaxCompute DDL', () => {
    const ddl = generator.generateDDL(mockTable);

    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS dw.sales_daily');
    expect(ddl).toContain('order_id STRING');    // MaxCompute 中 STRING 类型保持不变
    expect(ddl).toContain('amount DECIMAL(18,2)');
    expect(ddl).toContain('PARTITIONED BY');
    expect(ddl).toContain('dt STRING');
    expect(ddl).toContain('LIFECYCLE 365');
    expect(ddl).toContain('TBLPROPERTIES');
  });

  it('应该生成包含注释的 MaxCompute DDL', () => {
    const ddl = generator.generateDDL(mockTable, { includeComments: true });

    expect(ddl).toContain('COMMENT \'订单ID\'');
    expect(ddl).toContain('COMMENT \'金额\'');
    expect(ddl).toContain('COMMENT \'销售日表\'');
    expect(ddl).toContain('MaxCompute DDL');
  });

  it('应该生成正确的 MaxCompute ETL 模板', () => {
    const etl = generator.generateETL(mockTable);

    expect(etl).toContain('INSERT OVERWRITE TABLE dw.sales_daily');
    expect(etl).toContain('PARTITION (dt = \'${bizdate}\')');
    expect(etl).toContain('order_id');
    expect(etl).toContain('amount');
    expect(etl).toContain('MaxCompute 最佳实践');
  });

  it('应该正确映射 MaxCompute 数据类型', () => {
    const testTable: TableDefinition = {
      ...mockTable,
      fields: [
        { name: 'str_field', type: 'STRING', description: 'test', nullable: true },
        { name: 'int_field', type: 'INT', description: 'test', nullable: true },
        { name: 'bigint_field', type: 'BIGINT', description: 'test', nullable: true },
        { name: 'decimal_field', type: 'DECIMAL', description: 'test', nullable: true },
        { name: 'date_field', type: 'DATE', description: 'test', nullable: true },
        { name: 'timestamp_field', type: 'TIMESTAMP', description: 'test', nullable: true },
        { name: 'bool_field', type: 'BOOLEAN', description: 'test', nullable: true },
        { name: 'double_field', type: 'DOUBLE', description: 'test', nullable: true },
        { name: 'float_field', type: 'FLOAT', description: 'test', nullable: true },
      ],
      partitionKeys: [],
    };

    const ddl = generator.generateDDL(testTable);

    expect(ddl).toContain('str_field STRING');
    expect(ddl).toContain('int_field BIGINT');     // INT -> BIGINT
    expect(ddl).toContain('bigint_field BIGINT');
    expect(ddl).toContain('decimal_field DECIMAL(18,2)');
    expect(ddl).toContain('date_field STRING');     // DATE -> STRING
    expect(ddl).toContain('timestamp_field DATETIME'); // TIMESTAMP -> DATETIME
    expect(ddl).toContain('bool_field BOOLEAN');
    expect(ddl).toContain('double_field DOUBLE');
    expect(ddl).toContain('float_field DOUBLE');    // FLOAT -> DOUBLE
  });
});

describe('SQLGenerator - 类型映射', () => {
  const generator = new SQLGenerator('hive');

  it('应该正确映射数据类型', () => {
    const testTable: TableDefinition = {
      ...mockTable,
      fields: [
        { name: 'str_field', type: 'STRING', description: 'test', nullable: true },
        { name: 'int_field', type: 'INT', description: 'test', nullable: true },
        { name: 'bigint_field', type: 'BIGINT', description: 'test', nullable: true },
        { name: 'decimal_field', type: 'DECIMAL', description: 'test', nullable: true },
        { name: 'date_field', type: 'DATE', description: 'test', nullable: true },
        { name: 'timestamp_field', type: 'TIMESTAMP', description: 'test', nullable: true },
      ],
      partitionKeys: [],
    };

    const ddl = generator.generateDDL(testTable);

    expect(ddl).toContain('str_field STRING');
    expect(ddl).toContain('int_field INT');
    expect(ddl).toContain('bigint_field BIGINT');
    expect(ddl).toContain('decimal_field DECIMAL(18,2)');
    expect(ddl).toContain('timestamp_field TIMESTAMP');
  });
});
