/**
 * SQLGenerator - SQL 生成器
 */

import { TableDefinition } from '../schemas/table.schema.js';

export type SQLDialect = 'hive' | 'mysql' | 'clickhouse' | 'maxcompute';

export interface GenerateOptions {
  dialect?: SQLDialect;
  includeComments?: boolean;
}

export class SQLGenerator {
  private dialect: SQLDialect;

  constructor(dialect: SQLDialect = 'hive') {
    this.dialect = dialect;
  }

  /**
   * 生成 DDL (CREATE TABLE)
   */
  generateDDL(table: TableDefinition, options: GenerateOptions = {}): string {
    const dialect = options.dialect || this.dialect;
    
    switch (dialect) {
      case 'hive':
        return this.generateHiveDDL(table, options);
      case 'mysql':
        return this.generateMySQLDDL(table, options);
      case 'clickhouse':
        return this.generateClickHouseDDL(table, options);
      case 'maxcompute':
        return this.generateMaxComputeDDL(table, options);
      default:
        throw new Error(`不支持的 SQL 方言: ${dialect}`);
    }
  }

  /**
   * 生成 ETL 模板
   */
  generateETL(table: TableDefinition, options: GenerateOptions = {}): string {
    const dialect = options.dialect || this.dialect;
    
    switch (dialect) {
      case 'hive':
        return this.generateHiveETL(table, options);
      case 'mysql':
        return this.generateMySQLETL(table, options);
      case 'clickhouse':
        return this.generateClickHouseETL(table, options);
      case 'maxcompute':
        return this.generateMaxComputeETL(table, options);
      default:
        throw new Error(`不支持的 SQL 方言: ${dialect}`);
    }
  }

  /**
   * 生成稽核 SQL
   */
  generateCheckSQL(table: TableDefinition, _options: GenerateOptions = {}): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    let sql = `-- 数据稽核 SQL\n`;
    sql += `-- 表名：${table.name}\n`;
    sql += `-- 负责人：${table.owner}\n`;
    sql += `-- 生成时间：${currentDate}\n\n`;

    // 1. 数据量检查
    sql += `-- 1. 数据量检查\n`;
    sql += `SELECT\n`;
    sql += `    '${table.name}' AS table_name,\n`;
    sql += `    '\${bizdate}' AS dt,\n`;
    sql += `    COUNT(*) AS row_count,\n`;
    sql += `    CASE\n`;
    sql += `        WHEN COUNT(*) = 0 THEN 'CRITICAL'\n`;
    sql += `        WHEN COUNT(*) < 100 THEN 'WARNING'\n`;
    sql += `        ELSE 'OK'\n`;
    sql += `    END AS status\n`;
    sql += `FROM ${table.name}\n`;
    
    if (table.partitionKeys && table.partitionKeys.includes('dt')) {
      sql += `WHERE dt = '\${bizdate}';\n\n`;
    } else {
      sql += `;\n\n`;
    }

    // 2. 关键字段非空检查
    const requiredFields = table.fields.filter(f => !f.nullable);
    if (requiredFields.length > 0) {
      sql += `-- 2. 关键字段非空检查\n`;
      sql += `SELECT\n`;
      sql += `    '${table.name}' AS table_name,\n`;
      sql += `    '\${bizdate}' AS dt,\n`;
      
      requiredFields.forEach((field, index) => {
        sql += `    SUM(CASE WHEN ${field.name} IS NULL THEN 1 ELSE 0 END) AS ${field.name}_null_count`;
        if (index < requiredFields.length - 1) {
          sql += ',\n';
        } else {
          sql += '\n';
        }
      });
      
      sql += `FROM ${table.name}\n`;
      if (table.partitionKeys && table.partitionKeys.includes('dt')) {
        sql += `WHERE dt = '\${bizdate}';\n\n`;
      } else {
        sql += `;\n\n`;
      }
    }

    // 3. 数据重复检查（如果有主键）
    sql += `-- 3. 数据重复检查\n`;
    sql += `-- TODO: 根据业务主键检查重复数据\n\n`;

    // 4. 数据波动检查
    if (table.partitionKeys && table.partitionKeys.includes('dt')) {
      sql += `-- 4. 数据量日环比波动检查\n`;
      sql += `WITH today_count AS (\n`;
      sql += `    SELECT COUNT(*) AS cnt\n`;
      sql += `    FROM ${table.name}\n`;
      sql += `    WHERE dt = '\${bizdate}'\n`;
      sql += `),\n`;
      sql += `yesterday_count AS (\n`;
      sql += `    SELECT COUNT(*) AS cnt\n`;
      sql += `    FROM ${table.name}\n`;
      sql += `    WHERE dt = DATE_SUB('\${bizdate}', 1)\n`;
      sql += `)\n`;
      sql += `SELECT\n`;
      sql += `    '${table.name}' AS table_name,\n`;
      sql += `    '\${bizdate}' AS dt,\n`;
      sql += `    t.cnt AS today_count,\n`;
      sql += `    y.cnt AS yesterday_count,\n`;
      sql += `    ROUND((t.cnt - y.cnt) * 100.0 / y.cnt, 2) AS change_percent,\n`;
      sql += `    CASE\n`;
      sql += `        WHEN ABS((t.cnt - y.cnt) * 100.0 / y.cnt) > 50 THEN 'CRITICAL'\n`;
      sql += `        WHEN ABS((t.cnt - y.cnt) * 100.0 / y.cnt) > 20 THEN 'WARNING'\n`;
      sql += `        ELSE 'OK'\n`;
      sql += `    END AS status\n`;
      sql += `FROM today_count t, yesterday_count y;\n`;
    }

    return sql;
  }

  /**
   * 生成 Hive DDL
   */
  private generateHiveDDL(table: TableDefinition, options: GenerateOptions): string {
    const includeComments = options.includeComments !== false;
    const currentDate = new Date().toISOString().split('T')[0];
    
    let sql = '';
    
    if (includeComments) {
      sql += `-- Hive DDL\n`;
      sql += `-- 表名：${table.name}\n`;
      sql += `-- 中文名：${table.displayName}\n`;
      sql += `-- 负责人：${table.owner}\n`;
      sql += `-- 生成时间：${currentDate}\n\n`;
    }

    sql += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;
    
    // 字段定义（排除分区字段）
    const partitionKeys = table.partitionKeys || [];
    const regularFields = table.fields.filter(f => !partitionKeys.includes(f.name));
    
    regularFields.forEach((field, index) => {
      sql += `    ${field.name} ${this.mapTypeToHive(field.type)}`;
      if (includeComments && field.description) {
        sql += ` COMMENT '${field.description}'`;
      }
      if (index < regularFields.length - 1) {
        sql += ',\n';
      } else {
        sql += '\n';
      }
    });
    
    sql += `)\n`;
    
    if (includeComments && table.displayName) {
      sql += `COMMENT '${table.displayName}'\n`;
    }
    
    // 分区
    if (partitionKeys.length > 0) {
      sql += `PARTITIONED BY (\n`;
      partitionKeys.forEach((key, index) => {
        const field = table.fields.find(f => f.name === key);
        const type = field ? this.mapTypeToHive(field.type) : 'STRING';
        sql += `    ${key} ${type}`;
        if (index < partitionKeys.length - 1) {
          sql += ',\n';
        } else {
          sql += '\n';
        }
      });
      sql += `)\n`;
    }
    
    sql += `STORED AS PARQUET\n`;
    sql += `TBLPROPERTIES (\n`;
    sql += `    'owner' = '${table.owner}',\n`;
    sql += `    'created_date' = '${currentDate}'\n`;
    sql += `);\n`;
    
    return sql;
  }

  /**
   * 生成 Hive ETL
   */
  private generateHiveETL(table: TableDefinition, options: GenerateOptions): string {
    const includeComments = options.includeComments !== false;
    const currentDate = new Date().toISOString().split('T')[0];
    
    let sql = '';
    
    if (includeComments) {
      sql += `-- Hive ETL 模板\n`;
      sql += `-- 表名：${table.name}\n`;
      sql += `-- 中文名：${table.displayName}\n`;
      sql += `-- 负责人：${table.owner}\n`;
      sql += `-- 生成时间：${currentDate}\n\n`;
    }

    sql += `INSERT OVERWRITE TABLE ${table.name}\n`;
    
    // 分区
    if (table.partitionKeys && table.partitionKeys.includes('dt')) {
      sql += `PARTITION (dt = '\${bizdate}')\n`;
    }
    
    sql += `SELECT\n`;
    
    // 字段列表
    const partitionKeys = table.partitionKeys || [];
    const regularFields = table.fields.filter(f => !partitionKeys.includes(f.name));
    
    regularFields.forEach((field, index) => {
      if (includeComments && field.description) {
        sql += `    ${field.name}  -- ${field.description}`;
      } else {
        sql += `    ${field.name}`;
      }
      if (index < regularFields.length - 1) {
        sql += ',\n';
      } else {
        sql += '\n';
      }
    });
    
    sql += `FROM (\n`;
    sql += `    SELECT\n`;
    
    regularFields.forEach((field, index) => {
      sql += `        NULL AS ${field.name}  -- TODO: 填写字段逻辑`;
      if (index < regularFields.length - 1) {
        sql += ',\n';
      } else {
        sql += '\n';
      }
    });
    
    sql += `    FROM ${table.dataSources[0] || 'source_table'}\n`;
    
    if (table.partitionKeys && table.partitionKeys.includes('dt')) {
      sql += `    WHERE dt = '\${bizdate}'\n`;
    }
    
    sql += `) t;\n`;
    
    return sql;
  }

  /**
   * 生成 MySQL DDL
   */
  private generateMySQLDDL(table: TableDefinition, options: GenerateOptions): string {
    const includeComments = options.includeComments !== false;
    const currentDate = new Date().toISOString().split('T')[0];
    
    let sql = '';
    
    if (includeComments) {
      sql += `-- MySQL DDL\n`;
      sql += `-- 表名：${table.name}\n`;
      sql += `-- 负责人：${table.owner}\n`;
      sql += `-- 生成时间：${currentDate}\n\n`;
    }

    const tableName = table.name.replace('.', '_');
    sql += `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;
    
    table.fields.forEach((field, index) => {
      sql += `    \`${field.name}\` ${this.mapTypeToMySQL(field.type)}`;
      if (!field.nullable) {
        sql += ` NOT NULL`;
      }
      if (includeComments && field.description) {
        sql += ` COMMENT '${field.description}'`;
      }
      if (index < table.fields.length - 1) {
        sql += ',\n';
      } else {
        sql += '\n';
      }
    });
    
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
    
    if (includeComments && table.displayName) {
      sql += ` COMMENT='${table.displayName}'`;
    }
    
    sql += `;\n`;
    
    return sql;
  }

  /**
   * 生成 MySQL ETL
   */
  private generateMySQLETL(table: TableDefinition, _options: GenerateOptions): string {
    const tableName = table.name.replace('.', '_');
    
    let sql = `-- MySQL ETL 模板\n`;
    sql += `-- TODO: 实现 MySQL ETL 逻辑\n\n`;
    sql += `INSERT INTO \`${tableName}\` VALUES (...);\n`;
    
    return sql;
  }

  /**
   * 生成 ClickHouse DDL
   */
  private generateClickHouseDDL(table: TableDefinition, _options: GenerateOptions): string {
    const tableName = table.name.replace('.', '_');
    
    let sql = `-- ClickHouse DDL\n`;
    sql += `-- TODO: 实现 ClickHouse DDL\n\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${tableName} (...) ENGINE = MergeTree();\n`;
    
    return sql;
  }

  /**
   * 生成 ClickHouse ETL
   */
  private generateClickHouseETL(table: TableDefinition, _options: GenerateOptions): string {
    const tableName = table.name.replace('.', '_');

    let sql = `-- ClickHouse ETL 模板\n`;
    sql += `-- TODO: 实现 ClickHouse ETL 逻辑\n\n`;
    sql += `INSERT INTO ${tableName} VALUES (...);\n`;

    return sql;
  }

  /**
   * 生成 MaxCompute DDL
   */
  private generateMaxComputeDDL(table: TableDefinition, options: GenerateOptions): string {
    const includeComments = options.includeComments !== false;
    const currentDate = new Date().toISOString().split('T')[0];

    let sql = '';

    if (includeComments) {
      sql += `-- MaxCompute DDL\n`;
      sql += `-- 表名：${table.name}\n`;
      sql += `-- 中文名：${table.displayName}\n`;
      sql += `-- 负责人：${table.owner}\n`;
      sql += `-- 生成时间：${currentDate}\n\n`;
    }

    // MaxCompute DDL 语法
    sql += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;

    // 字段定义（排除分区字段）
    const partitionKeys = table.partitionKeys || [];
    const regularFields = table.fields.filter(f => !partitionKeys.includes(f.name));

    regularFields.forEach((field, index) => {
      sql += `    ${field.name} ${this.mapTypeToMaxCompute(field.type)}`;
      if (includeComments && field.description) {
        sql += ` COMMENT '${field.description}'`;
      }
      if (index < regularFields.length - 1) {
        sql += ',\n';
      } else {
        sql += '\n';
      }
    });

    sql += `)\n`;

    // 表注释
    if (includeComments && table.displayName) {
      sql += `COMMENT '${table.displayName}'\n`;
    }

    // 分区定义
    if (partitionKeys.length > 0) {
      sql += `PARTITIONED BY (\n`;
      partitionKeys.forEach((key, index) => {
        const field = table.fields.find(f => f.name === key);
        const type = field ? this.mapTypeToMaxCompute(field.type) : 'STRING';
        sql += `    ${key} ${type}`;
        if (includeComments && field?.description) {
          sql += ` COMMENT '${field.description}'`;
        }
        if (index < partitionKeys.length - 1) {
          sql += ',\n';
        } else {
          sql += '\n';
        }
      });
      sql += `)\n`;
    }

    // 生命周期管理
    sql += `LIFECYCLE 365\n`;

    // 表属性
    sql += `TBLPROPERTIES (\n`;
    sql += `    'owner' = '${table.owner}',\n`;
    sql += `    'created_date' = '${currentDate}',\n`;
    sql += `    'update_frequency' = '${table.updateFrequency || 'daily'}',\n`;
    sql += `    'data_source' = '${(table.dataSources || []).join(',')}'\n`;
    sql += `);\n`;

    return sql;
  }

  /**
   * 生成 MaxCompute ETL
   */
  private generateMaxComputeETL(table: TableDefinition, options: GenerateOptions): string {
    const includeComments = options.includeComments !== false;
    const currentDate = new Date().toISOString().split('T')[0];

    let sql = '';

    if (includeComments) {
      sql += `-- MaxCompute ETL 模板\n`;
      sql += `-- 表名：${table.name}\n`;
      sql += `-- 中文名：${table.displayName}\n`;
      sql += `-- 负责人：${table.owner}\n`;
      sql += `-- 生成时间：${currentDate}\n\n`;
    }

    // MaxCompute INSERT 语法
    sql += `INSERT OVERWRITE TABLE ${table.name}\n`;

    // 分区
    if (table.partitionKeys && table.partitionKeys.includes('dt')) {
      sql += `PARTITION (dt = '${'${bizdate}'}')\n`;
    }

    sql += `SELECT\n`;

    // 字段列表
    const partitionKeys = table.partitionKeys || [];
    const regularFields = table.fields.filter(f => !partitionKeys.includes(f.name));

    regularFields.forEach((field, index) => {
      if (includeComments && field.description) {
        sql += `    ${field.name}  -- ${field.description}`;
      } else {
        sql += `    ${field.name}`;
      }
      if (index < regularFields.length - 1) {
        sql += ',\n';
      } else {
        sql += '\n';
      }
    });

    sql += `FROM (\n`;
    sql += `    SELECT\n`;

    regularFields.forEach((field, index) => {
      sql += `        NULL AS ${field.name}  -- TODO: 填写字段转换逻辑`;
      if (index < regularFields.length - 1) {
        sql += ',\n';
      } else {
        sql += '\n';
      }
    });

    // 如果有分区字段，也要包含分区字段
    if (partitionKeys.includes('dt')) {
      sql += `        ,'${'${bizdate}'}' AS dt\n`;
    }

    sql += `    FROM ${table.dataSources?.[0] || 'source_table'}\n`;

    if (partitionKeys.includes('dt')) {
      sql += `    WHERE dt = '${'${bizdate}'}'\n`;
    }

    sql += `) t;\n`;

    // 添加一些常用的 MaxCompute 最佳实践注释
    if (includeComments) {
      sql += `\n-- MaxCompute 最佳实践：\n`;
      sql += `-- 1. 使用分区表减少数据扫描量\n`;
      sql += `-- 2. 合理设置生命周期管理成本\n`;
      sql += `-- 3. 使用 INSERT OVERWRITE 而非 INSERT INTO\n`;
      sql += `-- 4. 大表操作时使用动态分区\n`;
    }

    return sql;
  }

  /**
   * 类型映射：通用 -> Hive
   */
  private mapTypeToHive(type: string): string {
    const typeMap: Record<string, string> = {
      'STRING': 'STRING',
      'INT': 'INT',
      'BIGINT': 'BIGINT',
      'DECIMAL': 'DECIMAL(18,2)',
      'DATE': 'STRING',
      'TIMESTAMP': 'TIMESTAMP',
      'BOOLEAN': 'BOOLEAN',
      'DOUBLE': 'DOUBLE',
      'FLOAT': 'FLOAT',
    };
    
    return typeMap[type.toUpperCase()] || 'STRING';
  }

  /**
   * 类型映射：通用 -> MySQL
   */
  private mapTypeToMySQL(type: string): string {
    const typeMap: Record<string, string> = {
      'STRING': 'VARCHAR(255)',
      'INT': 'INT',
      'BIGINT': 'BIGINT',
      'DECIMAL': 'DECIMAL(18,2)',
      'DATE': 'DATE',
      'TIMESTAMP': 'DATETIME',
      'BOOLEAN': 'TINYINT(1)',
      'DOUBLE': 'DOUBLE',
      'FLOAT': 'FLOAT',
    };

    return typeMap[type.toUpperCase()] || 'VARCHAR(255)';
  }

  /**
   * 类型映射：通用 -> MaxCompute
   */
  private mapTypeToMaxCompute(type: string): string {
    const typeMap: Record<string, string> = {
      'STRING': 'STRING',
      'INT': 'BIGINT',           // MaxCompute 推荐 BIGINT 而非 INT
      'BIGINT': 'BIGINT',
      'DECIMAL': 'DECIMAL(18,2)',
      'DATE': 'STRING',          // MaxCompute 使用 STRING 存储日期
      'TIMESTAMP': 'DATETIME',   // MaxCompute 的时间类型
      'BOOLEAN': 'BOOLEAN',
      'DOUBLE': 'DOUBLE',
      'FLOAT': 'DOUBLE',         // MaxCompute 统一使用 DOUBLE
      'ARRAY': 'ARRAY<STRING>',  // MaxCompute 支持 ARRAY 类型
      'MAP': 'MAP<STRING, STRING>', // MaxCompute 支持 MAP 类型
      'STRUCT': 'STRUCT<field1:STRING>', // MaxCompute 支持 STRUCT 类型
    };

    return typeMap[type.toUpperCase()] || 'STRING';
  }
}
