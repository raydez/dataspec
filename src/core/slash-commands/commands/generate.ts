/**
 * /dataspec:generate 命令实现
 * 从 DataSpec 定义生成 SQL、ETL 或文档
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CommandDefinition, CommandContext, CommandResult } from '../types.js';
import { commandRegistry } from '../command-registry.js';

const GenerateCommand: CommandDefinition = {
  id: 'generate',
  name: 'dataspec generate',
  description: 'Generate SQL, ETL or documentation from DataSpec definitions',
  category: 'generate',
  examples: [
    {
      command: '/dataspec:generate ddl dw.sales_daily',
      description: 'Generate CREATE TABLE statement',
      context: 'Converts table definition to SQL DDL'
    },
    {
      command: '/dataspec:generate etl dw.sales_daily --output etl/sales.sql',
      description: 'Generate ETL script',
      context: 'Creates data pipeline code'
    },
    {
      command: '/dataspec:generate docs --all --format html',
      description: 'Generate documentation for all tables',
      context: 'Creates comprehensive data catalog'
    }
  ],
  parameters: [
    {
      name: 'type',
      type: 'choice',
      required: true,
      description: 'Type of output: ddl, etl, or docs',
      choices: ['ddl', 'etl', 'docs']
    },
    {
      name: 'target',
      type: 'string',
      required: false,
      description: 'Target table or metric name (optional for docs)'
    },
    {
      name: 'output',
      type: 'string',
      required: false,
      description: 'Output file path'
    },
    {
      name: 'format',
      type: 'choice',
      required: false,
      description: 'Output format (for docs)',
      choices: ['markdown', 'html', 'pdf'],
      defaultValue: 'markdown'
    },
    {
      name: 'all',
      type: 'boolean',
      required: false,
      description: 'Generate for all definitions',
      defaultValue: false
    },
    {
      name: 'dialect',
      type: 'choice',
      required: false,
      description: 'SQL dialect override',
      choices: ['hive', 'maxcompute', 'mysql', 'clickhouse']
    }
  ],
  handler: generateHandler,
  version: '0.2.0',
  requiresProject: true
};

/**
 * Generate 命令处理函数
 */
async function generateHandler(
  args: string[],
  options: Record<string, any>,
  context: CommandContext
): Promise<CommandResult> {
  try {
    const startTime = Date.now();

    // 验证项目是否已初始化
    if (!context.config) {
      return {
        success: false,
        message: 'Not a DataSpec project',
        errors: [{
          code: 'NOT_INITIALIZED',
          message: 'Please run /dataspec:init first to initialize the project',
          severity: 'error'
        }],
        executionTime: Date.now() - startTime
      };
    }

    const type = args[0] as 'ddl' | 'etl' | 'docs';
    const target = args[1];
    const { output, format, all, dialect } = options;

    if (!type || !['ddl', 'etl', 'docs'].includes(type)) {
      return {
        success: false,
        message: 'Invalid type',
        errors: [{
          code: 'INVALID_TYPE',
          message: 'Type must be one of: ddl, etl, docs',
          severity: 'error'
        }],
        executionTime: Date.now() - startTime
      };
    }

    // 根据类型执行不同的生成逻辑
    switch (type) {
      case 'ddl':
        return await generateDDL(target, { output, dialect: dialect || context.config.dialect }, context, startTime);
      case 'etl':
        return await generateETL(target, { output, dialect: dialect || context.config.dialect }, context, startTime);
      case 'docs':
        return await generateDocs({ target, all, format, output }, context, startTime);
      default:
        return {
          success: false,
          message: 'Unknown generation type',
          executionTime: Date.now() - startTime
        };
    }

  } catch (error) {
    return {
      success: false,
      message: `Generate failed: ${error instanceof Error ? error.message : String(error)}`,
      errors: [{
        code: 'GENERATE_FAILED',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
        stack: error instanceof Error ? error.stack : undefined
      }],
      executionTime: 0
    };
  }
}

/**
 * 生成 DDL
 */
async function generateDDL(
  tableName: string,
  options: { output?: string; dialect: string },
  context: CommandContext,
  startTime: number
): Promise<CommandResult> {
  if (!tableName) {
    return {
      success: false,
      message: 'Table name is required for DDL generation',
      errors: [{
        code: 'MISSING_TARGET',
        message: 'Please specify a table name',
        severity: 'error'
      }],
      executionTime: Date.now() - startTime
    };
  }

  const projectDir = context.currentDirectory || process.cwd();
  const tableDefPath = path.join(projectDir, 'dataspec', 'tables', `${tableName}.md`);

  // 检查表定义是否存在
  try {
    await fs.access(tableDefPath);
  } catch {
    return {
      success: false,
      message: `Table ${tableName} not found`,
      errors: [{
        code: 'TABLE_NOT_FOUND',
        message: `Table definition does not exist: ${tableDefPath}`,
        severity: 'error'
      }],
      suggestions: [{
        command: `/dataspec:define table ${tableName}`,
        description: 'Create table definition first',
        reason: 'Table must be defined before generating DDL'
      }],
      executionTime: Date.now() - startTime
    };
  }

  // 读取表定义
  const tableDefContent = await fs.readFile(tableDefPath, 'utf-8');
  
  // 解析表定义并生成 DDL
  const ddl = generateDDLFromDefinition(tableName, tableDefContent, options.dialect);

  // 输出到文件或控制台
  if (options.output) {
    const outputPath = path.join(projectDir, options.output);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, ddl, 'utf-8');
    console.log(`\n✅ DDL generated: ${outputPath}`);
  } else {
    console.log(`\n📄 Generated DDL for ${tableName}:`);
    console.log('─'.repeat(80));
    console.log(ddl);
    console.log('─'.repeat(80));
  }

  return {
    success: true,
    message: `DDL generated for ${tableName}`,
    details: {
      tableName,
      dialect: options.dialect,
      outputPath: options.output,
      ddl: options.output ? undefined : ddl
    },
    executionTime: Date.now() - startTime
  };
}

/**
 * 生成 ETL
 */
async function generateETL(
  tableName: string,
  options: { output?: string; dialect: string },
  context: CommandContext,
  startTime: number
): Promise<CommandResult> {
  if (!tableName) {
    return {
      success: false,
      message: 'Table name is required for ETL generation',
      errors: [{
        code: 'MISSING_TARGET',
        message: 'Please specify a table name',
        severity: 'error'
      }],
      executionTime: Date.now() - startTime
    };
  }

  const projectDir = context.currentDirectory || process.cwd();
  const tableDefPath = path.join(projectDir, 'dataspec', 'tables', `${tableName}.md`);

  // 检查表定义是否存在
  try {
    await fs.access(tableDefPath);
  } catch {
    return {
      success: false,
      message: `Table ${tableName} not found`,
      errors: [{
        code: 'TABLE_NOT_FOUND',
        message: `Table definition does not exist: ${tableDefPath}`,
        severity: 'error'
      }],
      executionTime: Date.now() - startTime
    };
  }

  // 读取表定义
  const tableDefContent = await fs.readFile(tableDefPath, 'utf-8');
  
  // 生成 ETL 脚本
  const etl = generateETLFromDefinition(tableName, tableDefContent, options.dialect);

  // 输出到文件或控制台
  if (options.output) {
    const outputPath = path.join(projectDir, options.output);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, etl, 'utf-8');
    console.log(`\n✅ ETL script generated: ${outputPath}`);
  } else {
    console.log(`\n📄 Generated ETL for ${tableName}:`);
    console.log('─'.repeat(80));
    console.log(etl);
    console.log('─'.repeat(80));
  }

  return {
    success: true,
    message: `ETL generated for ${tableName}`,
    details: {
      tableName,
      dialect: options.dialect,
      outputPath: options.output,
      etl: options.output ? undefined : etl
    },
    executionTime: Date.now() - startTime
  };
}

/**
 * 生成文档
 */
async function generateDocs(
  options: { target?: string; all?: boolean; format?: string; output?: string },
  _context: CommandContext,
  startTime: number
): Promise<CommandResult> {
  // TODO: 实现完整的文档生成逻辑
  console.log(`\n📚 Generating documentation...`);
  console.log(`   Format: ${options.format || 'markdown'}`);
  console.log(`   Scope: ${options.all ? 'All tables' : options.target || 'Current'}`);

  return {
    success: true,
    message: 'Documentation generation (TODO: Full implementation)',
    details: {
      format: options.format || 'markdown',
      target: options.target,
      all: options.all
    },
    executionTime: Date.now() - startTime
  };
}

/**
 * 从定义生成 DDL
 */
function generateDDLFromDefinition(tableName: string, _definition: string, dialect: string): string {
  const [database, table] = tableName.split('.');
  
  // 简化的 DDL 生成（实际应该解析 markdown 表格）
  if (dialect === 'hive') {
    return `-- DDL for ${tableName}
-- Generated by DataSpec
-- Dialect: Hive

CREATE TABLE IF NOT EXISTS ${tableName} (
  id BIGINT COMMENT 'Primary key',
  create_time TIMESTAMP COMMENT 'Creation time',
  update_time TIMESTAMP COMMENT 'Last update time'
)
COMMENT 'Data table: ${tableName}'
PARTITIONED BY (dt STRING COMMENT 'Business date YYYYMMDD')
STORED AS PARQUET
LOCATION '/user/hive/warehouse/${database}.db/${table}'
TBLPROPERTIES (
  'creator' = 'dataspec',
  'created_at' = '${new Date().toISOString()}'
);

-- Create partition example
-- ALTER TABLE ${tableName} ADD IF NOT EXISTS PARTITION (dt='20250127');
`;
  } else if (dialect === 'maxcompute') {
    return `-- DDL for ${tableName}
-- Generated by DataSpec
-- Dialect: MaxCompute

CREATE TABLE IF NOT EXISTS ${tableName} (
  id BIGINT COMMENT 'Primary key',
  create_time DATETIME COMMENT 'Creation time',
  update_time DATETIME COMMENT 'Last update time',
  dt STRING COMMENT 'Business date YYYYMMDD'
)
PARTITIONED BY (dt)
LIFECYCLE 365
COMMENT 'Data table: ${tableName}';
`;
  } else {
    return `-- DDL for ${tableName}
-- Generated by DataSpec
-- Dialect: ${dialect}

CREATE TABLE IF NOT EXISTS ${tableName} (
  id BIGINT PRIMARY KEY,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;
  }
}

/**
 * 从定义生成 ETL
 */
function generateETLFromDefinition(tableName: string, _definition: string, dialect: string): string {
  
  if (dialect === 'hive') {
    return `-- ETL for ${tableName}
-- Generated by DataSpec

-- Insert data with partition
INSERT OVERWRITE TABLE ${tableName} PARTITION(dt='\${bizdate}')
SELECT
  id,
  create_time,
  update_time
FROM source_table
WHERE dt = '\${bizdate}'
;

-- Verification query
SELECT 
  dt,
  COUNT(*) as record_count
FROM ${tableName}
WHERE dt = '\${bizdate}'
GROUP BY dt;
`;
  } else {
    return `-- ETL for ${tableName}
-- Generated by DataSpec

INSERT INTO ${tableName} (id, create_time, update_time)
SELECT
  id,
  CURRENT_TIMESTAMP as create_time,
  CURRENT_TIMESTAMP as update_time
FROM source_table
WHERE process_date = CURRENT_DATE;
`;
  }
}

// 注册命令
commandRegistry.register(GenerateCommand);

export { GenerateCommand, generateHandler };
