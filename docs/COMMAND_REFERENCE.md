# DataSpec 命令参考

**版本**: v0.1.1

完整的命令参数和示例说明。

---

## 命令索引

### CLI 命令
- [dataspec init](#dataspec-init---初始化项目)
- [dataspec validate](#dataspec-validate---验证定义)

### Slash Commands (用于 AI 工具)
- [/dataspec:init](#dataspecinit---初始化项目)
- [/dataspec:define](#dataspecdefine---定义表指标)
- [/dataspec:generate](#dataspecgenerate---生成代码)
- [/dataspec:validate](#dataspecvalidate---验证)
- [/dataspec:publish](#dataspecpublish---发布)

---

## `dataspec init` - 初始化项目

### 描述
在当前目录初始化新的 DataSpec 项目。

### 语法
```bash
dataspec init [options]
```

### 参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--project-name` | string | 否 | - | 项目名称 |
| `--force` | boolean | 否 | false | 强制重新初始化（覆盖已有文件）|

### 示例

```bash
# 基础初始化
dataspec init

# 指定项目名称
dataspec init --project-name "Sales Platform"

# 强制重新初始化
dataspec init --force
```

---

## `dataspec validate` - 验证定义

### 描述
验证所有数据定义文件的完整性和正确性。

### 语法
```bash
dataspec validate [options]
```

### 参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--type` | choice | 否 | all | 验证类型 (table|metric|all) |
| `--json` | boolean | 否 | false | 以 JSON 格式输出结果 |
| `--verbose` | boolean | 否 | false | 显示详细错误信息 |

### 示例

```bash
# 验证所有定义
dataspec validate

# 只验证表定义
dataspec validate --type table

# JSON 格式输出
dataspec validate --json

# 详细输出
dataspec validate --verbose
```

---

## `/dataspec:init` - 初始化项目

### 描述
创建新的 DataSpec 项目，包含标准目录结构和配置文件。

### 语法
```bash
/dataspec:init "项目名称" [options]
```

### 参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `项目名称` | string | 是 | - | 项目名称 |
| `--project-type` | choice | 否 | data-warehouse | 项目类型 |
| `--dialect` | choice | 否 | hive | SQL 方言 |
| `--owner` | string | 否 | 当前用户 | 项目负责人 |
| `--interactive` | boolean | 否 | true | 交互模式 |
| `--skip-git` | boolean | 否 | false | 跳过 Git 初始化 |
| `--template` | choice | 否 | basic | 项目模板 |

### 选项值

**`--dialect`**:
- `hive` - Apache Hive
- `maxcompute` - 阿里云 MaxCompute
- `mysql` - MySQL
- `clickhouse` - ClickHouse

**`--template`**:
- `basic` - 基础模板
- `enterprise` - 企业模板（包含更多示例）
- `bi` - BI 分析模板

### 示例

```bash
# 基础初始化
/dataspec:init "Sales Platform"

# 指定项目类型和方言
/dataspec:init "销售数据平台" --project-type bi --dialect maxcompute

# 指定负责人和模板
/dataspec:init "企业数据平台" --owner "Data Team" --template advanced --dialect hive

# 跳过 Git 初始化
/dataspec:init "测试项目" --skip-git --interactive false
```

### 输出

```
🚀 Initializing DataSpec project: Sales Platform
📁 Project directory: /path/to/project
🔧 Project type: data-warehouse
🗄️ SQL dialect: maxcompute

✅ Created directory structure
✅ Generated configuration file
✅ Created example files
✅ Initialized Git repository

📝 Generating AI tool integrations...
   ⚙️  Generating commands for Claude Code...
   ✅ Claude Code: 5 commands generated

✅ DataSpec project initialized successfully!

Next steps:
   /dataspec:define table dw.your_table
   /dataspec:generate ddl dw.your_table
```

---

## `/dataspec:define` - 定义表/指标

### 描述
创建数据表或业务指标的定义文件。

### 语法
```bash
/dataspec:define <type> <name> [options]
```

### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | choice | 是 | `table` 或 `metric` |
| `name` | string | 是 | 表名（database.table）或指标名 |
| `--owner` | string | 否 | 数据负责人 |
| `--template` | choice | 否 | 使用的模板 |
| `--description` | string | 否 | 简要描述 |

### 模板选项

**表模板** (`type=table`):
- `basic` - 基础表
- `fact_table` - 事实表
- `dim_table` - 维度表
- `ods_table` - ODS 表

**指标模板** (`type=metric`):
- `basic_metric` - 基础指标
- `derived_metric` - 派生指标

### 示例

```bash
# 定义事实表
/dataspec:define table dw.sales_daily --owner "Data Team" --template fact_table

# 定义维度表
/dataspec:define table dim.products --template dim_table

# 定义指标
/dataspec:define metric 销售额 --description "总销售金额"

# 定义派生指标
/dataspec:define metric 人均销售额 --template derived_metric
```

### 输出

```
✅ Table definition created: dw.sales_daily
📁 File: dataspec/tables/dw.sales_daily.md

🎯 Next steps:
   /dataspec:generate ddl dw.sales_daily
   /dataspec:validate definition dw.sales_daily
```

### 生成的文件结构

```markdown
# Table: dw.sales_daily

<!-- DATASPEC:TABLE:START -->
## Basic Info
- **Owner**: Data Team
- **Type**: Fact Table

## Schema
| Column | Type | Description | Nullable |
|--------|------|-------------|----------|
| id | bigint | Primary key | No |

## Partitions
- dt (string) - Business date YYYYMMDD
<!-- DATASPEC:TABLE:END -->
```

---

## `/dataspec:generate` - 生成代码

### 描述
从定义文件生成 SQL DDL、ETL 脚本或文档。

### 语法
```bash
/dataspec:generate <type> [target] [options]
```

### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | choice | 是 | `ddl`, `etl`, 或 `docs` |
| `target` | string | 条件 | 目标表名（docs 可选） |
| `--output` | string | 否 | 输出文件路径 |
| `--format` | choice | 否 | 输出格式（docs 用） |
| `--all` | boolean | 否 | 生成所有定义 |
| `--dialect` | choice | 否 | 覆盖 SQL 方言 |

### 生成类型

**`ddl`** - CREATE TABLE 语句:
- 生成建表 SQL
- 支持多种方言
- 包含分区、存储格式等

**`etl`** - ETL 脚本:
- 生成数据加工脚本
- INSERT/MERGE 语句
- 包含验证查询

**`docs`** - 文档:
- 生成数据目录
- 支持 markdown/html/pdf
- 可批量生成

### 示例

```bash
# 生成 DDL
/dataspec:generate ddl dw.sales_daily

# 生成并保存到文件
/dataspec:generate ddl dw.sales_daily --output sql/create_sales_daily.sql

# 生成 ETL
/dataspec:generate etl dw.sales_daily --output etl/sales_etl.sql

# 生成 MaxCompute DDL
/dataspec:generate ddl dw.sales_daily --dialect maxcompute

# 生成所有表的文档
/dataspec:generate docs --all --format html
```

### 输出示例 (DDL)

```sql
-- DDL for dw.sales_daily
-- Generated by DataSpec
-- Dialect: Hive

CREATE TABLE IF NOT EXISTS dw.sales_daily (
  id BIGINT COMMENT 'Primary key',
  sales_amount DECIMAL(18,2) COMMENT 'Total sales',
  create_time TIMESTAMP COMMENT 'Creation time'
)
COMMENT 'Daily sales aggregation'
PARTITIONED BY (dt STRING COMMENT 'Business date YYYYMMDD')
STORED AS PARQUET
LOCATION '/user/hive/warehouse/dw.db/sales_daily'
TBLPROPERTIES (
  'creator' = 'dataspec',
  'created_at' = '2025-01-27T...'
);
```

---

## `/dataspec:validate` - 验证

### 描述
验证定义文件的正确性或数据质量。

### 语法
```bash
/dataspec:validate <type> [target] [options]
```

### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | choice | 是 | `definition` 或 `data` |
| `target` | string | 条件 | 目标表/指标名 |
| `--strict` | boolean | 否 | 严格模式 |
| `--date` | string | 否 | 数据验证日期（YYYYMMDD） |
| `--all` | boolean | 否 | 验证所有定义 |

### 验证类型

**`definition`** - 定义验证:
- 文件存在性
- 必需章节检查
- DataSpec 标记验证
- 内容完整性

**`data`** - 数据验证:
- 空值检查
- 值范围验证
- 唯一性约束
- 引用完整性

### 示例

```bash
# 验证表定义
/dataspec:validate definition dw.sales_daily

# 严格模式
/dataspec:validate definition dw.sales_daily --strict

# 验证所有定义
/dataspec:validate definition --all

# 验证数据质量
/dataspec:validate data dw.sales_daily --date 20250127
```

### 输出示例

```
📋 Validation Results for dw.sales_daily
════════════════════════════════════════════════════════════
✅ [File] File exists: Definition file found
✅ [Structure] DataSpec markers: Valid markers found
✅ [Content] Basic info: Present
✅ [Content] Schema: Present
⚠️  [Content] Dependencies: Upstream not specified
   💡 Suggestion: Add upstream source tables

────────────────────────────────────────────────────────────
Summary: 4 passed, 1 warning, 0 errors
════════════════════════════════════════════════════════════
```

---

## `/dataspec:publish` - 发布

### 描述
将表定义发布到生产环境。

### 语法
```bash
/dataspec:publish <target> [options]
```

### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `target` | string | 是 | 目标表名 |
| `--dry-run` | boolean | 否 | 仅预览，不执行 |
| `--force` | boolean | 否 | 强制执行 |
| `--env` | choice | 否 | 目标环境 |

### 环境选项

- `dev` - 开发环境
- `staging` - 预发布环境
- `prod` - 生产环境

### 示例

```bash
# 预览变更（推荐）
/dataspec:publish dw.sales_daily --dry-run

# 发布到 staging
/dataspec:publish dw.sales_daily --env staging

# 发布到生产
/dataspec:publish dw.sales_daily --env prod

# 强制发布（跳过确认）
/dataspec:publish dw.sales_daily --env prod --force
```

### 输出示例

```
🔍 Pre-flight checks for dw.sales_daily
════════════════════════════════════════════════════════════
✅ Definition file found
✅ Validation passed

📋 Generating deployment plan...

📝 Planned Changes:
────────────────────────────────────────────────────────────
🆕 CREATE: Create table dw.sales_daily
   SQL: CREATE TABLE IF NOT EXISTS dw.sales_daily (...)

⚠️  Warnings:
   - Publishing to production environment

🚨 Breaking Changes: None

✅ Dry-run completed (no changes made)

To execute: Remove --dry-run flag
```

---

## 错误代码参考

| 错误代码 | 说明 | 解决方法 |
|----------|------|----------|
| `NOT_INITIALIZED` | 项目未初始化 | 运行 `/dataspec:init` |
| `INVALID_TABLE_NAME` | 表名格式错误 | 使用 `database.table` 格式 |
| `TABLE_EXISTS` | 表已存在 | 使用不同的表名 |
| `TABLE_NOT_FOUND` | 表定义不存在 | 先运行 `/dataspec:define` |
| `MISSING_TARGET` | 缺少目标参数 | 指定表名或使用 `--all` |
| `INVALID_TYPE` | 类型参数错误 | 检查命令参数 |

---

**最后更新**: 2025-11-27
