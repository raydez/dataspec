/**
 * /dataspec:init 命令实现
 * 初始化 DataSpec 项目
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CommandDefinition, CommandContext, CommandResult } from '../types.js';
import { commandRegistry } from '../command-registry.js';
import { ConfiguratorRegistry } from '../configurators/index.js';
import { ParameterParser } from '../parameter-parser.js';

const InitCommand: CommandDefinition = {
  id: 'init',
  name: 'dataspec init',
  description: 'Initialize DataSpec project',
  category: 'project',
  version: '0.2.0',
  examples: [
    {
      command: '/dataspec:init "销售数据平台"',
      description: 'Initialize a new data warehouse project',
      context: 'Creates project structure, config file, and initial documentation'
    },
    {
      command: '/dataspec:init --project-type bi --dialect maxcompute',
      description: 'Initialize with BI project type and MaxCompute dialect',
      context: 'Suitable for business intelligence workflows'
    }
  ],
  parameters: [
    {
      name: 'projectName',
      type: 'string',
      required: true,
      description: 'Project name for documentation and configuration'
    },
    {
      name: 'projectType',
      type: 'choice',
      required: false,
      description: 'Project type',
      defaultValue: 'data-warehouse',
      choices: ['data-warehouse', 'bi', 'analytics', 'enterprise']
    },
    {
      name: 'dialect',
      type: 'choice',
      required: false,
      description: 'Default SQL dialect',
      defaultValue: 'hive',
      choices: ['hive', 'mysql', 'clickhouse', 'maxcompute']
    },
    {
      name: 'owner',
      type: 'string',
      required: false,
      description: 'Default project owner',
      defaultValue: process.env.USER || 'Unknown'
    },
    {
      name: 'interactive',
      type: 'boolean',
      required: false,
      description: 'Interactive mode',
      defaultValue: true
    },
    {
      name: 'skipGit',
      type: 'boolean',
      required: false,
      description: 'Skip Git repository initialization',
      defaultValue: false
    },
    {
      name: 'template',
      type: 'choice',
      required: false,
      description: 'Project template',
      defaultValue: 'basic',
      choices: ['basic', 'advanced', 'enterprise']
    }
  ],
  requiresProject: false,
  handler: initHandler
};

/**
 * 项目初始化处理函数
 */
async function initHandler(
  args: string[],
  options: Record<string, any>,
  context: CommandContext
): Promise<CommandResult> {
  try {
    const startTime = Date.now();

    // 解析参数
    const parseResult = ParameterParser.parse(args, InitCommand.parameters, options);
    if (!parseResult.success) {
      return {
        success: false,
        message: 'Parameter parsing failed',
        errors: parseResult.errors.map(err => ({
          code: 'PARSE_ERROR',
          message: err.message,
          severity: 'error'
        })),
        executionTime: 0
      };
    }

    const {
      projectName,
      projectType = 'data-warehouse',
      dialect = 'hive',
      owner = process.env.USER || 'Unknown',
      interactive = true,
      skipGit = false,
      template = 'basic'
    } = parseResult.args;

    const projectDir = context.currentDirectory || process.cwd();

    console.log(`🚀 Initializing DataSpec project: ${projectName}`);
    console.log(`📁 Project directory: ${projectDir}`);
    console.log(`🔧 Project type: ${projectType}`);
    console.log(`🗄️ SQL dialect: ${dialect}`);

    // 检查是否已初始化
    if (await isProjectInitialized(projectDir)) {
      return {
        success: false,
        message: 'Directory is already a DataSpec project',
        errors: [{
          code: 'PROJECT_EXISTS',
          message: 'This directory is already initialized as a DataSpec project',
          severity: 'error'
        }],
        executionTime: Date.now() - startTime,
        suggestions: [
          {
            command: '/dataspec:validate',
            description: 'Validate existing project configuration',
            reason: 'Check and fix any issues in the current project'
          }
        ]
      };
    }

    // 创建项目结构
    const createdFiles: string[] = [];

    // 创建配置文件
    const configContent = generateProjectConfig({
      projectName,
      projectType,
      dialect,
      owner,
      _template: template
    });
    await fs.writeFile(path.join(projectDir, 'dataspec.config.json'), configContent, 'utf-8');
    createdFiles.push('dataspec.config.json');

    // 创建目录结构
    await createDirectoryStructure(projectDir, template);
    createdFiles.push('dataspec/tables/');
    createdFiles.push('dataspec/metrics/');
    createdFiles.push('dataspec/checks/');
    createdFiles.push('dataspec/templates/');
    createdFiles.push('dataspec/docs/');

    // 生成示例文件
    if (interactive) {
      await generateExampleFiles(projectDir, projectName, dialect, template);
    }

    // 初始化 Git 仓库
    if (!skipGit) {
      try {
        await initializeGitRepository(projectDir, projectName);
        createdFiles.push('.git/');
        createdFiles.push('.gitignore');
      } catch (error) {
        console.warn(`⚠️ Git initialization failed: ${error}`);
      }
    }

    // 生成 AI 工具的 slash 命令文件
    console.log('\n📝 Generating AI tool integrations...');
    const configurators = ConfiguratorRegistry.getAvailable();
    let generatedCommandFiles: string[] = [];
    
    for (const configurator of configurators) {
      try {
        console.log(`   ⚙️  Generating commands for ${configurator.toolName}...`);
        const files = await configurator.generateAll(projectDir);
        generatedCommandFiles = generatedCommandFiles.concat(files);
        console.log(`   ✅ ${configurator.toolName}: ${files.length} commands generated`);
      } catch (error) {
        console.warn(`   ⚠️  ${configurator.toolName}: Failed to generate commands - ${error}`);
      }
    }
    
    if (generatedCommandFiles.length > 0) {
      createdFiles.push(...generatedCommandFiles);
      console.log(`\n✅ Generated ${generatedCommandFiles.length} slash command files for ${configurators.length} AI tools`);
    }

    // 更新项目上下文
    context.projectName = projectName;
    context.projectType = projectType;
    context.dialect = dialect;
    context.config = JSON.parse(configContent);

    console.log('\n✅ DataSpec project initialized successfully!');
    console.log('\n🎯 Next steps:');
    console.log(`   /dataspec:table create dw.${projectName.toLowerCase()}_daily --dialect ${dialect}`);
    console.log(`   /dataspec:metric create "用户数" --category "基础指标"`);
    console.log(`   /dataspec:validate`);
    console.log(`   /dataspec:help`);

    return {
      success: true,
      message: `Project '${projectName}' initialized successfully`,
      details: {
        filesCreated: createdFiles,
        warnings: skipGit ? ['Git repository not initialized'] : [],
        metadata: {
          projectName,
          projectType,
          dialect,
          owner,
          template,
          projectDir
        }
      },
      suggestions: [
        {
          command: '/dataspec:table create',
          description: 'Create your first table definition',
          reason: 'Start defining your data model'
        },
        {
          command: '/dataspec:help',
          description: 'Explore available commands',
          reason: 'Learn more about DataSpec capabilities'
        }
      ],
      executionTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      success: false,
      message: `Project initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      errors: [{
        code: 'INIT_FAILED',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
        stack: error instanceof Error ? error.stack : undefined
      }],
      executionTime: 0
    };
  }
}

/**
 * 检查项目是否已初始化
 */
async function isProjectInitialized(dir: string): Promise<boolean> {
  try {
    await fs.access(path.join(dir, 'dataspec.config.json'));
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成项目配置
 */
function generateProjectConfig(config: {
  projectName: string;
  projectType: string;
  dialect: string;
  owner: string;
  _template: string;
}): string {
  return JSON.stringify({
    version: '1.0',
    projectName: config.projectName,
    projectType: config.projectType,
    dialect: config.dialect,
    owner: config.owner,
    _template: config._template,
    slashCommands: {
      enabled: true,
      defaultDialect: config.dialect,
      outputFormat: 'table',
      autoSave: true,
      showProgress: true,
      confirmDestructive: true
    },
    integrations: {
      claudeCode: {
        enabled: true,
        commandPrefix: '/dataspec:',
        configDir: '.claude/commands',
        autoGenerate: true,
        updateExisting: true,
        supported: true
      }
    },
    templates: {
      customTemplatesDir: 'dataspec/templates/custom',
      variableDelimiter: '$',
      includeTimestamps: true
    }
  }, null, 2);
}

/**
 * 创建目录结构
 */
async function createDirectoryStructure(projectDir: string, template: string): Promise<void> {
  const directories = [
    'dataspec',
    'dataspec/tables',
    'dataspec/metrics',
    'dataspec/checks',
    'dataspec/templates',
    'dataspec/docs',
    'dataspec/templates/sql',
    'dataspec/templates/etl',
    'dataspec/templates/dqc'
  ];

  // 高级模板包含额外目录
  if (template === 'advanced' || template === 'enterprise') {
    directories.push(
      'dataspec/templates/monitoring',
      'dataspec/templates/governance',
      'dataspec/templates/security'
    );
  }

  for (const dir of directories) {
    await fs.mkdir(path.join(projectDir, dir), { recursive: true });
  }
}

/**
 * 生成示例文件
 */
async function generateExampleFiles(
  projectDir: string,
  _projectName: string,
  _dialect: string,
  _template: string
): Promise<void> {
  // 生成示例表定义
  const tableTemplate = getTableTemplate(_projectName, _dialect);
  await fs.writeFile(
    path.join(projectDir, 'dataspec/tables/dw.example_daily.md'),
    tableTemplate,
    'utf-8'
  );

  // 生成示例指标定义
  const metricTemplate = getMetricTemplate();
  await fs.writeFile(
    path.join(projectDir, 'dataspec/metrics/用户数.md'),
    metricTemplate,
    'utf-8'
  );
}

/**
 * 获取表定义模板
 */
function getTableTemplate(_projectName: string, _dialect: string): string {
  return `# 表定义：dw.example_daily

<!-- DATASPEC:TABLE:START -->
## 基本信息
- **表名**: dw.example_daily
- **所有者**: ${_projectName}
- **负责人：** ${process.env.USER || 'Unknown'}
- **更新频率：** daily
- **数据来源：** upstream_table

## 字段定义

| 字段名 | 类型 | 说明 | 是否必填 | 示例 |
|--------|------|------|---------|------|
| user_id | STRING | 用户ID | 是 | user_123 |
| event_time | TIMESTAMP | 事件时间 | 是 | 2025-01-15 10:30:00 |
| event_type | STRING | 事件类型 | 是 | login |
| dt | DATE | 日期分区 | 是 | 20250115 |

## 分区字段
- **分区键：** dt
- **分区策略：** 按天分区（格式：YYYYMMDD）

## 数据质量规则
- user_id 不能为空
- event_time 不能为空
- event_type 在预定义范围内
- dt 不能为空且格式正确

## 依赖上游
- ods.user_events (更新时间：T+0 23:00)

## 使用场景
用于${_projectName}的日常事件数据分析和报表生成。

<!-- DATASPEC:TABLE:END -->

## 变更历史
- 2025-01-27: 初始创建

---

## 开发说明

### 查询示例

\`\`\`sql
-- 查询最近7天的数据
SELECT *
FROM dw.example_daily
WHERE dt >= DATE_SUB(CURRENT_DATE, 7)
  AND dt < CURRENT_DATE
LIMIT 100;
\`\`\`

### 注意事项

- ⚠️ 查询时必须添加分区过滤条件（dt），避免全表扫描
- ⚠️ 分区字段 dt 格式为 YYYYMMDD（如 20250115）
- ⚠️ 如需修改表结构，请先咨询负责人
- ⚠️ 使用前请先阅读字段说明，确保理解字段含义

### 联系方式

如有疑问，请联系表负责人或数据团队。
`;
}

/**
 * 获取指标定义模板
 */
function getMetricTemplate(): string {
  return `# 指标定义：用户数

<!-- DATASPEC:METRIC:START -->
## 基本信息
- **指标名称：** 用户数
- **指标分类：** 基础指标
- **负责人：** ${process.env.USER || 'Unknown'}

## 业务定义
统计特定时间范围内活跃的用户数量，用户去重计算。

## 计算公式
\`\`\`sql
SELECT COUNT(DISTINCT user_id) AS user_count
FROM dw.example_daily
WHERE dt BETWEEN '\${start_date}' AND '\${end_date}'
\`\`\`

## 技术实现

### 数据来源
- **主表：** dw.example_daily
- **字段：** user_id

### 计算维度
- **时间维度：** dt
- **业务维度：** event_type

<!-- DATASPEC:METRIC:END -->

## 变更历史
- 2025-01-27: 初始创建

---

## 开发说明

### 计算示例

\`\`\`sql
-- 查询最近30天活跃用户数
SELECT COUNT(DISTINCT user_id) AS user_count
FROM dw.example_daily
WHERE dt BETWEEN DATE_SUB(CURRENT_DATE, 29) AND CURRENT_DATE
  AND event_type IN ('login', 'active')
  AND user_id IS NOT NULL;
\`\`\`

### 注意事项

- ⚠️ 计算时必须按日期分区过滤，避免全表扫描
- ⚠️ 使用 DISTINCT 确保用户去重
- ⚠️ 可根据业务需求调整事件类型过滤条件
`;
}

/**
 * 初始化 Git 仓库
 */
async function initializeGitRepository(projectDir: string, _projectName: string): Promise<void> {
  const { execSync } = require('child_process');

  // 执行 git init
  execSync('git init', { cwd: projectDir });

  // 创建 .gitignore
  const gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# DataSpec specific
dataspec/templates/generated/
dataspec/temp/
*.backup
`;

  await fs.writeFile(path.join(projectDir, '.gitignore'), gitignore, 'utf-8');

  // 添加并提交初始文件
  execSync('git add .', { cwd: projectDir });
  execSync('git commit -m "Initial DataSpec project setup"', { cwd: projectDir });
}

// 注册命令
commandRegistry.register(InitCommand);