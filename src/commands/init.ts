/**
 * init 命令 - 初始化 DataSpec 项目
 */

import { FileSystemUtils } from '../utils/file-system.js';
import chalk from 'chalk';

export interface InitOptions {
  projectName?: string;
  force?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  console.log(chalk.blue('🚀 初始化 DataSpec 项目...\n'));

  // 检查是否已存在
  const dataspecDir = 'dataspec';
  if (await FileSystemUtils.directoryExists(dataspecDir) && !options.force) {
    console.error(chalk.red('❌ dataspec/ 目录已存在'));
    console.log(chalk.yellow('提示：使用 --force 选项可以强制重新初始化'));
    process.exit(1);
  }

  // 创建目录结构
  const dirs = [
    'dataspec/tables',
    'dataspec/metrics',
    'dataspec/requests/active',
    'dataspec/requests/archive',
    'dataspec/checks',
    'dataspec/templates/sql',
    'dataspec/templates/checks',
    'dataspec/templates/dolphinscheduler',
    '.claude/commands', // Claude Code slash commands 目录
    '.claude/commands/dataspec', // dataspec命令分类目录
  ];

  console.log(chalk.cyan('📁 创建目录结构...'));
  for (const dir of dirs) {
    await FileSystemUtils.createDirectory(dir);
    console.log(chalk.gray(`  ✓ ${dir}`));
  }

  // 生成 AGENTS.md
  console.log(chalk.cyan('\n📝 生成 AGENTS.md...'));
  const agentsContent = generateAgentsTemplate(options.projectName || 'DataSpec项目');
  await FileSystemUtils.writeFile('AGENTS.md', agentsContent);
  console.log(chalk.gray('  ✓ AGENTS.md'));

  // 生成 Claude Code AGENTS.md
  console.log(chalk.cyan('\n🤖 生成 Claude Code CLAUDE.md...'));
  const claudeAgentsContent = generateClaudeAgentsTemplate(options.projectName || 'DataSpec项目');
  await FileSystemUtils.writeFile('CLAUDE.md', claudeAgentsContent);
  console.log(chalk.gray('  ✓ CLAUDE.md'));

  // 生成 DataSpec AGENTS.md
  console.log(chalk.cyan('\n📝 生成 DataSpec AGENTS.md...'));
  const dataSpecAgentsContent = generateAgentsTemplate(options.projectName || 'DataSpec项目');
  await FileSystemUtils.writeFile('dataspec/AGENTS.md', dataSpecAgentsContent);
  console.log(chalk.gray('  ✓ dataspec/AGENTS.md'));

  // 生成 README.md
  console.log(chalk.cyan('\n📝 生成 README.md...'));
  const readmeContent = generateReadmeTemplate(options.projectName || 'DataSpec项目');
  await FileSystemUtils.writeFile('dataspec/README.md', readmeContent);
  console.log(chalk.gray('  ✓ dataspec/README.md'));

  // 生成配置文件
  console.log(chalk.cyan('\n⚙️  生成配置文件...'));
  const configContent = generateConfigTemplate(options.projectName || 'DataSpec项目');
  await FileSystemUtils.writeFile('dataspec/dataspec.config.json', configContent);
  console.log(chalk.gray('  ✓ dataspec/dataspec.config.json'));

  // 生成 Claude Code slash commands 和分类目录结构
  console.log(chalk.cyan('\n🤖 生成 Claude Code slash commands...'));
  const defineCommand = generateDefineCommand();
  const validateCommand = generateValidateCommand();
  const generateCommand = generateGenerateCommand();

  await FileSystemUtils.writeFile('.claude/commands/dataspec/define.md', defineCommand);
  console.log(chalk.gray('  ✓ .claude/commands/dataspec/define.md'));

  await FileSystemUtils.writeFile('.claude/commands/dataspec/validate.md', validateCommand);
  console.log(chalk.gray('  ✓ .claude/commands/dataspec/validate.md'));

  await FileSystemUtils.writeFile('.claude/commands/dataspec/generate.md', generateCommand);
  console.log(chalk.gray('  ✓ .claude/commands/dataspec/generate.md'));

  console.log(chalk.green('\n✅ DataSpec 初始化完成！\n'));
  
  console.log(chalk.cyan('📁 目录结构：'));
  console.log('  dataspec/');
  console.log('  ├── AGENTS.md           # AI 工具指令');
  console.log('  ├── README.md           # 项目说明');
  console.log('  ├── dataspec.config.json # 配置文件');
  console.log('  ├── tables/             # 表定义');
  console.log('  ├── metrics/            # 指标定义');
  console.log('  ├── requests/           # BI 需求');
  console.log('  │   ├── active/         # 进行中');
  console.log('  │   └── archive/        # 已完成');
  console.log('  ├── checks/             # 稽核规则');
  console.log('  └── templates/          # 生成的文件');
  console.log('      ├── sql/');
  console.log('      ├── checks/');
  console.log('      └── dolphinscheduler/');
  console.log('  .claude/');
  console.log('  └── commands/           # Claude Code slash commands');
  console.log('      └── dataspec/        # dataspec命令分类');
  console.log('          ├── define.md');
  console.log('          ├── validate.md');
  console.log('          └── generate.md');

  console.log(chalk.cyan('\n🎯 下一步：'));
  console.log(chalk.white('  # 创建表定义'));
  console.log(chalk.gray('  /dataspec:define table dw.sales_daily\n'));
  console.log(chalk.white('  # 创建指标定义'));
  console.log(chalk.gray('  /dataspec:define metric 销售额\n'));
  console.log(chalk.white('  # 验证定义'));
  console.log(chalk.gray('  /dataspec:validate\n'));
  console.log(chalk.white('  # 生成 DDL'));
  console.log(chalk.gray('  /dataspec:generate ddl dw.sales_daily\n'));
}

function generateAgentsTemplate(projectName: string): string {
  return `# ${projectName} - 数据开发 AI 助手指令

## 项目上下文

这是 ${projectName} 的数据资产管理仓库。

## 数据资产位置

- **表定义：** dataspec/tables/
- **指标定义：** dataspec/metrics/
- **BI 需求：** dataspec/requests/
- **稽核规则：** dataspec/checks/
- **生成的 SQL：** dataspec/templates/sql/

## 编写 SQL 时的规则

### 1. 查找表定义

在编写 SQL 前，先查看 \`dataspec/tables/\` 目录，了解：
- 表的字段结构和类型
- 分区字段（必须在 WHERE 条件中使用）
- 数据更新频率
- 上游依赖关系

### 2. 遵循数据质量规则

生成的 SQL 必须包含：
- 分区过滤（避免全表扫描）
- 关键字段非空检查
- 数据合理性校验（如金额 > 0）
- 去重逻辑（如有必要）

### 3. SQL 模板格式

\`\`\`sql
-- 业务描述
-- 负责人：XXX
-- 生成时间：YYYY-MM-DD

SELECT
    -- 字段注释
    field1,
    field2
FROM table_name
WHERE dt = '\${bizdate}'  -- 必须使用分区过滤
    AND field IS NOT NULL  -- 关键字段非空
GROUP BY field1, field2;
\`\`\`

### 4. 指标计算

在使用指标时，参考 \`dataspec/metrics/\` 中的定义：
- 使用统一的计算公式
- 注意口径差异
- 引用正确的数据源表

## 禁止事项

- ❌ 不要生成全表扫描的 SQL（必须有分区过滤）
- ❌ 不要使用 SELECT *（明确指定字段）
- ❌ 不要忽略数据质量检查
- ❌ 不要引用未定义的表或字段

## 常用命令

\`\`\`bash
# 搜索表定义
dataspec table search <关键词>

# 查看表详情
dataspec table show <表名>

# 搜索指标定义
dataspec metric search <关键词>

# 生成 SQL
dataspec generate ddl <表名>
dataspec generate etl <表名>
\`\`\`

---
由 DataSpec 自动生成
`;
}

function generateReadmeTemplate(projectName: string): string {
  return `# ${projectName} 数据资产库

## 📚 目录结构

- \`tables/\`: 表定义
- \`metrics/\`: 指标定义
- \`requests/\`: BI 需求管理
  - \`active/\`: 进行中的需求
  - \`archive/\`: 已完成的需求
- \`checks/\`: 稽核规则
- \`templates/\`: 生成的 SQL 和配置

## 🚀 快速开始

### 创建表定义

\`\`\`bash
dataspec table create dw.sales_daily
\`\`\`

### 创建指标定义

\`\`\`bash
dataspec metric create 纯销金额
\`\`\`

### 验证

\`\`\`bash
dataspec validate
\`\`\`

### 生成 SQL

\`\`\`bash
# 生成建表 SQL
dataspec generate ddl dw.sales_daily

# 生成 ETL SQL 模板
dataspec generate etl dw.sales_daily
\`\`\`

## 📖 文档

- [AGENTS.md](./AGENTS.md) - AI 工具使用指南
- [dataspec.config.json](./dataspec.config.json) - 配置文件

## 🛠️ 使用的工具

- DataSpec - 数据资产管理工具
- 版本：0.1.0

---
最后更新：${new Date().toISOString().split('T')[0]}
`;
}

function generateClaudeAgentsTemplate(projectName: string): string {
  return `# ${projectName} - Claude Code AI 助手指令

## 项目上下文

这是 ${projectName} 的数据资产管理仓库。

## Claude Code 集成

本 项目已配置 Claude Code slash commands，请使用以下命令：

### 核心命令

- **创建表定义**
  \`\`\`bash
/dataspec:define table dw.table_name --owner "负责人" --description "表描述"
\`\`\`

- **创建指标定义**
  \`\`\`bash
/dataspec:define metric 指标名称 --owner "负责人" --category "指标分类"
\`\`\`

- **验证所有定义**
  \`\`\`bash
/dataspec:validate
\`\`\`

- **生成 SQL 和文档**
  \`\`\`bash
/dataspec:generate ddl dw.table_name --dialect hive
/dataspec:generate etl dw.table_name --template basic
/dataspec:generate docs --format markdown --all
\`\`\`

## 文件位置

- **表定义：** \`dataspec/tables/\`
- **指标定义：** \`dataspec/metrics/\`
- **请求管理：** \`dataspec/requests/\`
- **稽核规则：** \`dataspec/checks/\`
- **生成的文件：** \`dataspec/templates/\`

## 数据开发最佳实践

### 1. 编写 SQL 的规则

- **分区过滤：** 必须在 WHERE 条件中使用分区字段，避免全表扫描
- **数据质量：** 检查关键字段非空，验证数据合理性
- **类型安全：** 使用正确的数据类型，避免精度丢失
- **性能优化：** 合理使用索引和分区策略

### 2. 表设计原则

- **规范化命名：** 使用统一的命名规范（数据库.table）
- **合理分区：** 根据数据量和查询模式选择分区字段
- **添加注释：** 为字段和表添加清晰的业务注释
- **版本管理：** 使用版本控制管理表结构变更

### 3. 指标定义标准

- **统一定义：** 使用标准化的指标定义模板
- **明确口径：** 清晰描述指标的计算逻辑和业务口径
- **数据源追踪：** 明确指标依赖的数据源和表
- **验证机制：** 建立指标验证和监控机制

## 工作流程建议

1. **需求分析：** 与业务团队明确需求和指标口径
2. **表设计：** 先设计表结构，再进行开发
3. **开发测试：** 在开发环境进行充分的测试
4. **代码评审：** 建立代码评审机制
5. **部署监控：** 部署后监控数据质量和性能

## 获取帮助

- **使用 \`/dataspec:define --help\`** 查看定义命令的详细选项
- **使用 \`/dataspec:generate --help\`** 查看生成命令的详细选项
- **使用 \`/dataspec:validate --help\`** 查看验证命令的详细选项

---
由 DataSpec 自动生成
`;
}

function generateConfigTemplate(projectName: string): string {
  const config = {
    version: '1.0',
    projectName: projectName,
    databases: [
      {
        name: 'hive_prod',
        type: 'hive',
        defaultPartition: 'dt'
      }
    ],
    aiTools: ['cursor', 'windsurf', 'claude'],
    templates: {
      defaultDialect: 'hive',
      outputDir: './dataspec/templates'
    },
    validation: {
      strictMode: true,
      customRules: []
    }
  };

  return JSON.stringify(config, null, 2);
}

/**
 * 生成 Claude Code slash commands 内容
 */

function generateDefineCommand(): string {
  return `# DataSpec - Define

使用 DataSpec 定义新的数据表或业务指标。

## 使用方法

\`\`\`
/dataspec:define table dw.table_name
/dataspec:define metric 指标名称
\`\`\`

## 选项

### 表定义选项
- \`--owner\`: 数据负责人
- \`--template\`: 表模板 (basic, fact_table, dim_table, ods_table)
- \`--description\`: 表描述

### 指标定义选项
- \`--owner\`: 指标负责人
- \`--category\`: 指标分类
- \`--template\`: 指标模板 (basic_metric, derived_metric)
- \`--description\`: 指标描述

## 示例

### 创建表
\`\`\`
# 创建基础表
/dataspec:define table dw.sales_daily --owner "数据团队" --description "日销售数据"

# 创建事实表模板
/dataspec:define table dw.user_behavior --template fact_table
\`\`\`

### 创建指标
\`\`\`
# 创建基础指标
/dataspec:define metric 销售额 --owner "数据团队" --category "基础指标"

# 创建衍生指标
/dataspec:define metric 客单价 --template derived_metric --description "平均客户订单金额"
\`\`\`

## 输出

### 表定义输出
- 创建文件：\`dataspec/tables/{table_name}.md\`
- 自动生成标准表结构模板
- 包含字段定义、分区信息、业务描述

### 指标定义输出
- 创建文件：\`dataspec/metrics/{metric_name}.md\`
- 自动生成指标定义模板
- 包含计算逻辑、数据源、业务口径

## 下一步

- 编辑定义文件，添加字段、计算公式和业务逻辑
- 使用 \`/dataspec:generate ddl {table_name}\` 生成建表 SQL
- 使用 \`/dataspec:validate\` 验证定义
`;
}

function generateValidateCommand(): string {
  return `# DataSpec - Validate Definitions

验证所有数据定义的完整性和正确性。

## 使用方法

\`\`\`
/dataspec:validate
\`\`\`

## 选项

- \`--type\`: 验证类型 (table|metric|all)
- \`--verbose\`: 显示详细错误信息

## 验证内容

### 表定义验证
- 文件存在性检查
- DataSpec 标记完整性
- 基本信息完整度（owner、description）
- Schema 定义完整性

### 指标定义验证
- 文件存在性检查
- 计算公式存在性
- 数据源引用有效性

## 输出

显示验证报告，包括：
- 通过的定义数量
- 警告信息和建议
- 错误信息和修复建议

## 下一步

根据验证结果修复问题定义，然后重新验证
`;
}

function generateGenerateCommand(): string {
  return `# DataSpec - Generate SQL, ETL or Documentation

从 DataSpec 定义生成 SQL 语句、ETL 脚本或文档。

## 使用方法

\`\`\`
/dataspec:generate <type> <target>
\`\`\`

## 类型

- \`ddl\`: 生成 CREATE TABLE 语句
- \`etl\`: 生成 ETL 脚本
- \`docs\`: 生成数据文档

## 选项

- \`--dialect\`: SQL 方言 (hive, maxcompute, mysql, clickhouse)
- \`--output\`: 输出文件路径
- \`--format\`: 输出格式，用于 docs 类型 (markdown, html, pdf)
- \`--all\`: 为所有定义生成
- \`--template\`: ETL 模板类型

## 示例

### 生成 DDL

\`\`\`
# 生成 Hive 建表语句
/dataspec:generate ddl dw.sales_daily

# 生成到指定文件
/dataspec:generate ddl dw.sales_daily --output sql/create_sales_daily.sql

# 生成 MySQL DDL
/dataspec:generate ddl dw.sales_daily --dialect mysql
\`\`\`

### 生成 ETL

\`\`\`
# 生成 ETL 脚本
/dataspec:generate etl dw.sales_daily

# 生成到指定文件
/dataspec:generate etl dw.sales_daily --output etl/sales_etl.sql

# 生成带模板的 ETL
/dataspec:generate etl dw.sales_daily --template incremental
\`\`\`

### 生成文档

\`\`\`
# 生成 Markdown 文档
/dataspec:generate docs --format markdown

# 生成 HTML 文档
/dataspec:generate docs --format html

# 为所有表生成文档
/dataspec:generate docs --all --format html
\`\`\`

## 输出

### DDL 输出
- 标准 CREATE TABLE 语句
- 包含字段类型和注释
- 分区字段和分区策略
- 表属性配置

### ETL 输出
- 数据管道脚本
- 包含数据质量检查
- 支持增量加载模板
- 错误处理和日志记录

### 文档输出
- 完整的数据目录
- 字段说明和业务含义
- 数据血缘关系
- 质量规则和约束

## 特性

- 根据 DataSpec 配置自动选择 SQL 方言
- 支持多种数据库类型映射
- 包含数据质量和合规性检查
- 模板化的 ETL 生成
- 灵活的文档格式输出

## 下一步

- 复制生成的 SQL 执行建表
- 部署 ETL 脚本到调度系统
- 发布数据文档供团队使用
- 使用 \`/dataspec:validate\` 验证生成的代码
`;
}
