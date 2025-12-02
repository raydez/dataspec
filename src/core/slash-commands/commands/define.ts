/**
 * /dataspec:define 命令实现
 * 定义数据表或指标（统一入口）
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CommandDefinition, CommandContext, CommandResult } from '../types.js';
import { commandRegistry } from '../command-registry.js';

const DefineCommand: CommandDefinition = {
  id: 'define',
  name: 'dataspec define',
  description: 'Define data tables or metrics',
  category: 'table',
  examples: [
    {
      command: '/dataspec:define table dw.sales_daily',
      description: 'Define a new table',
      context: 'Creates table definition file with standard structure'
    },
    {
      command: '/dataspec:define metric 销售额 --category "基础指标"',
      description: 'Define a new metric',
      context: 'Creates metric definition with calculation logic'
    },
    {
      command: '/dataspec:define table ods.orders --template fact_table',
      description: 'Define table using a template',
      context: 'Uses predefined template for faster setup'
    }
  ],
  parameters: [
    {
      name: 'type',
      type: 'choice',
      required: true,
      description: 'Type of definition: table or metric',
      choices: ['table', 'metric']
    },
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Name of the table (database.table) or metric'
    },
    {
      name: 'owner',
      type: 'string',
      required: false,
      description: 'Data owner name',
      defaultValue: process.env.USER || 'Unknown'
    },
    {
      name: 'template',
      type: 'choice',
      required: false,
      description: 'Template to use',
      choices: ['basic', 'fact_table', 'dim_table', 'ods_table', 'basic_metric', 'derived_metric']
    },
    {
      name: 'description',
      type: 'string',
      required: false,
      description: 'Brief description'
    }
  ],
  handler: defineHandler,
  version: '0.2.0',
  requiresProject: true
};

/**
 * Define 命令处理函数
 */
async function defineHandler(
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

    // 解析参数
    const type = args[0] as 'table' | 'metric';
    const name = args[1];
    const { owner, template, description } = options;

    if (!type || !['table', 'metric'].includes(type)) {
      return {
        success: false,
        message: 'Invalid type',
        errors: [{
          code: 'INVALID_TYPE',
          message: 'Type must be either "table" or "metric"',
          severity: 'error'
        }],
        executionTime: Date.now() - startTime
      };
    }

    if (!name) {
      return {
        success: false,
        message: 'Name is required',
        errors: [{
          code: 'MISSING_NAME',
          message: 'Please provide a name for the definition',
          severity: 'error'
        }],
        executionTime: Date.now() - startTime
      };
    }

    // 根据类型执行不同的逻辑
    if (type === 'table') {
      return await defineTable(name, { owner, template, description }, context, startTime);
    } else {
      return await defineMetric(name, { owner, template, description }, context, startTime);
    }

  } catch (error) {
    return {
      success: false,
      message: `Define failed: ${error instanceof Error ? error.message : String(error)}`,
      errors: [{
        code: 'DEFINE_FAILED',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
        stack: error instanceof Error ? error.stack : undefined
      }],
      executionTime: 0
    };
  }
}

/**
 * 定义表
 */
async function defineTable(
  name: string,
  options: { owner?: string; template?: string; description?: string },
  context: CommandContext,
  startTime: number
): Promise<CommandResult> {
  // 验证表名格式 (database.table)
  if (!name.includes('.')) {
    return {
      success: false,
      message: 'Invalid table name format',
      errors: [{
        code: 'INVALID_TABLE_NAME',
        message: 'Table name must be in format: database.table_name',
        severity: 'error'
      }],
      suggestions: [{
        command: `/dataspec:define table dw.${name}`,
        description: 'Use full qualified table name',
        reason: 'Table name must include database prefix'
      }],
      executionTime: Date.now() - startTime
    };
  }

  const [database, tableName] = name.split('.');
  const projectDir = context.currentDirectory || process.cwd();
  const tablesDir = path.join(projectDir, 'dataspec', 'tables');
  const tableFilePath = path.join(tablesDir, `${name}.md`);

  // 检查表是否已存在
  try {
    await fs.access(tableFilePath);
    return {
      success: false,
      message: `Table ${name} already exists`,
      errors: [{
        code: 'TABLE_EXISTS',
        message: `Definition file already exists: ${tableFilePath}`,
        severity: 'error'
      }],
      suggestions: [{
        command: `/dataspec:generate ddl ${name}`,
        description: 'Generate DDL from existing definition',
        reason: 'Table is already defined'
      }],
      executionTime: Date.now() - startTime
    };
  } catch {
    // 文件不存在，继续创建
  }

  // 创建目录
  await fs.mkdir(tablesDir, { recursive: true });

  // 生成表定义内容
  const tableContent = generateTableDefinition({
    database,
    tableName,
    owner: options.owner || context.config?.owner || process.env.USER || 'Unknown',
    template: options.template || 'basic',
    description: options.description || `Data table: ${name}`,
    dialect: context.config?.dialect || 'hive'
  });

  // 写入文件
  await fs.writeFile(tableFilePath, tableContent, 'utf-8');

  console.log(`\n✅ Table definition created: ${name}`);
  console.log(`📁 File: ${tableFilePath}`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   /dataspec:generate ddl ${name}`);
  console.log(`   /dataspec:validate definition ${name}`);

  return {
    success: true,
    message: `Table ${name} defined successfully`,
    details: {
      type: 'table',
      name,
      filePath: tableFilePath,
      template: options.template || 'basic'
    },
    suggestions: [
      {
        command: `/dataspec:generate ddl ${name}`,
        description: 'Generate CREATE TABLE statement',
        reason: 'Convert definition to SQL DDL'
      },
      {
        command: `/dataspec:validate definition ${name}`,
        description: 'Validate table definition',
        reason: 'Check for errors and best practices'
      }
    ],
    executionTime: Date.now() - startTime
  };
}

/**
 * 定义指标
 */
async function defineMetric(
  name: string,
  options: { owner?: string; template?: string; description?: string },
  context: CommandContext,
  startTime: number
): Promise<CommandResult> {
  const projectDir = context.currentDirectory || process.cwd();
  const metricFilePath = path.join(projectDir, 'dataspec', 'metrics', `${name}.md`);

  // 检查指标是否已存在
  try {
    await fs.access(metricFilePath);
    return {
      success: false,
      message: `Metric ${name} already exists`,
      errors: [{
        code: 'METRIC_EXISTS',
        message: `Definition file already exists: ${metricFilePath}`,
        severity: 'error'
      }],
      executionTime: Date.now() - startTime
    };
  } catch {
    // 文件不存在，继续创建
  }

  // 确保目录存在
  await fs.mkdir(path.dirname(metricFilePath), { recursive: true });

  // 生成指标定义内容
  const metricContent = generateMetricDefinition({
    name,
    owner: options.owner || context.config?.owner || process.env.USER || 'Unknown',
    template: options.template || 'basic_metric',
    description: options.description || `Business metric: ${name}`
  });

  // 写入文件
  await fs.writeFile(metricFilePath, metricContent, 'utf-8');

  console.log(`\n✅ Metric definition created: ${name}`);
  console.log(`📁 File: ${metricFilePath}`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   Edit the metric definition to add calculation logic`);
  console.log(`   /dataspec:validate definition ${name}`);

  return {
    success: true,
    message: `Metric ${name} defined successfully`,
    details: {
      type: 'metric',
      name,
      filePath: metricFilePath,
      template: options.template || 'basic_metric'
    },
    suggestions: [
      {
        command: `/dataspec:validate definition ${name}`,
        description: 'Validate metric definition',
        reason: 'Check for completeness and correctness'
      }
    ],
    executionTime: Date.now() - startTime
  };
}

/**
 * 生成表定义内容
 */
function generateTableDefinition(config: {
  database: string;
  tableName: string;
  owner: string;
  template: string;
  description: string;
  dialect: string;
}): string {
  const { database, tableName, owner, template, description, dialect } = config;
  const fullName = `${database}.${tableName}`;
  const today = new Date().toISOString().split('T')[0];

  return `# Table: ${fullName}

<!-- DATASPEC:TABLE:START -->
## Basic Info
- **Owner**: ${owner}
- **Type**: ${getTableType(template)}
- **Update Frequency**: Daily
- **Description**: ${description}

## Schema

| Column | Type | Description | Nullable | Default |
|--------|------|-------------|----------|---------|
| id | bigint | Primary key | No | - |
| create_time | timestamp | Creation time | No | CURRENT_TIMESTAMP |
| update_time | timestamp | Last update time | No | CURRENT_TIMESTAMP |

## Partitions
- dt (string) - Business date in YYYYMMDD format

## Storage
- **Format**: ${dialect === 'hive' ? 'PARQUET' : 'Default'}
- **Compression**: SNAPPY
- **Location**: /user/hive/warehouse/${database}.db/${tableName}

## Dependencies
- **Upstream**: 
  - Source tables (to be specified)
- **Downstream**: 
  - Consuming applications (to be specified)

<!-- DATASPEC:TABLE:END -->

## Change History
- ${today}: Initial creation by ${owner}

---

## Development Notes

### Query Examples

\`\`\`sql
-- Query recent data
SELECT *
FROM ${fullName}
WHERE dt >= DATE_SUB(CURRENT_DATE, 7)
  AND dt < CURRENT_DATE
LIMIT 100;
\`\`\`

### Important Notes

- ⚠️ Always add partition filter (dt) to avoid full table scan
- ⚠️ Partition format is YYYYMMDD (e.g., 20250127)
- ⚠️ Contact table owner before schema changes
- ⚠️ Read field descriptions carefully before use

### Contact

For questions, contact the table owner or data team.
`;
}

/**
 * 生成指标定义内容
 */
function generateMetricDefinition(config: {
  name: string;
  owner: string;
  template: string;
  description: string;
}): string {
  const { name, owner, template, description } = config;
  const today = new Date().toISOString().split('T')[0];

  return `# Metric: ${name}

<!-- DATASPEC:METRIC:START -->
## Basic Info
- **Metric Name**: ${name}
- **Category**: ${getMetricCategory(template)}
- **Owner**: ${owner}
- **Description**: ${description}

## Business Definition
${getMetricBusinessDefinition(template, name)}

## Calculation Formula
\`\`\`sql
SELECT COUNT(DISTINCT user_id) AS metric_value
FROM dw.example_table
WHERE dt BETWEEN '\${start_date}' AND '\${end_date}'
-- TODO: Add specific calculation logic
\`\`\`

## Technical Implementation

### Data Sources
- **Main Table**: dw.example_table
- **Fields**: user_id

### Dimensions
- **Time Dimension**: dt (date)
- **Business Dimensions**: region, category

### Aggregation Method
- Type: ${template === 'derived_metric' ? 'Derived (calculated from other metrics)' : 'Direct aggregation'}
- Granularity: Daily

<!-- DATASPEC:METRIC:END -->

## Change History
- ${today}: Initial creation by ${owner}

---

## Development Notes

### Calculation Example

\`\`\`sql
-- Calculate for last 30 days
SELECT 
  dt,
  COUNT(DISTINCT user_id) AS ${name.replace(/\s+/g, '_')}
FROM dw.example_table
WHERE dt BETWEEN DATE_SUB(CURRENT_DATE, 29) AND CURRENT_DATE
GROUP BY dt
ORDER BY dt DESC;
\`\`\`

### Important Notes

- ⚠️ Always add partition filter to avoid full table scan
- ⚠️ Use appropriate aggregation function
- ⚠️ Consider performance for large datasets
- ⚠️ Validate results against business expectations
`;
}

/**
 * 获取表类型
 */
function getTableType(template: string): string {
  const types: Record<string, string> = {
    'fact_table': 'Fact Table',
    'dim_table': 'Dimension Table',
    'ods_table': 'ODS Table',
    'basic': 'Data Table'
  };
  return types[template] || 'Data Table';
}

/**
 * 获取指标分类
 */
function getMetricCategory(template: string): string {
  const categories: Record<string, string> = {
    'basic_metric': 'Basic Metric',
    'derived_metric': 'Derived Metric'
  };
  return categories[template] || 'Basic Metric';
}

/**
 * 获取指标业务定义
 */
function getMetricBusinessDefinition(template: string, name: string): string {
  if (template === 'derived_metric') {
    return `This is a derived metric calculated from other base metrics. Please specify the calculation logic and source metrics.`;
  }
  return `Statistical measure for ${name}. Please provide detailed business definition and calculation rules.`;
}

// 注册命令
commandRegistry.register(DefineCommand);

export { DefineCommand, defineHandler };
