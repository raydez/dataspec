# DataSpec 用户手册

**版本：** 0.1.0  
**更新时间：** 2025-11-25

---

## 📖 目录

1. [快速开始](#快速开始)
2. [核心概念](#核心概念)
3. [命令参考](#命令参考)
4. [最佳实践](#最佳实践)
5. [常见问题](#常见问题)

---

## 快速开始

### 安装

```bash
# 全局安装
npm install -g @dpxing/dataspec

# 或作为项目依赖
npm install --save-dev @dpxing/dataspec
```

### 初始化项目

```bash
# 在项目根目录执行
dataspec init --project-name "数据中台"
```

这将创建以下目录结构：

```
dataspec/
├── AGENTS.md              # AI 工具指令
├── README.md              # 项目说明
├── dataspec.config.json   # 配置文件
├── tables/                # 表定义
├── metrics/               # 指标定义
├── requests/              # BI 需求
└── templates/             # 生成的文件
```

### 5 分钟快速上手

```bash
# 1. 创建表定义
dataspec table create dw.user_behavior_daily

# 2. 编辑表定义文件
# vim dataspec/tables/dw.user_behavior_daily.md

# 3. 验证定义
dataspec validate

# 4. 生成 DDL
dataspec generate ddl dw.user_behavior_daily

# 5. 生成 ETL 模板
dataspec generate etl dw.user_behavior_daily
```

---

## 核心概念

### 表定义（Table Definition）

表定义是描述数据表结构的 Markdown 文档，包含：

- **基本信息**：表名、中文名、负责人、更新频率
- **字段定义**：字段名、类型、描述、是否必填
- **分区字段**：分区键和分区策略
- **数据质量规则**：非空检查、合理性校验
- **依赖关系**：上游数据源、下游消费者

**示例：**

```markdown
# 表定义：dw.user_behavior_daily

## 基本信息
- **表名：** dw.user_behavior_daily
- **中文名：** 用户行为日表
- **负责人：** 张三
- **更新频率：** daily
- **数据来源：** ods.user_actions

## 字段定义

| 字段名 | 类型 | 说明 | 是否必填 | 示例 |
|--------|------|------|---------|------|
| user_id | BIGINT | 用户ID | 是 | 123456 |
| action_type | STRING | 行为类型 | 是 | click |
| action_time | TIMESTAMP | 行为时间 | 是 | 2025-01-15 10:30:00 |
| dt | STRING | 日期分区 | 是 | 2025-01-15 |

## 分区字段
- **分区键：** dt
- **分区策略：** 按日分区

## 数据质量规则
- user_id 不能为空
- action_time 必须在合理范围内
- 数据量日环比波动不超过 50%
```

### 指标定义（Metric Definition）

指标定义是描述业务指标的文档，包含：

- **业务定义**：指标的业务含义
- **计算公式**：业务口径和技术实现
- **数据来源**：指标依赖的数据表
- **维度**：指标的分析维度
- **相关指标**：与该指标相关的其他指标

**示例：**

```markdown
# 指标定义：DAU

## 基本信息
- **指标名称：** DAU
- **指标分类：** 用户指标
- **业务口径负责人：** 李四
- **更新频率：** T+1 日

## 业务定义
日活跃用户数（Daily Active Users），指在统计日期内至少有一次行为的去重用户数。

## 计算公式

### 业务口径
```
DAU = COUNT(DISTINCT user_id)
WHERE action_date = 统计日期
```

### 技术实现
```sql
SELECT
    COUNT(DISTINCT user_id) AS dau
FROM dw.user_behavior_daily
WHERE dt = '${bizdate}'
```

## 数据来源
- **主表：** dw.user_behavior_daily

## 维度
- 日期
- 渠道
- 平台（iOS/Android/Web）
```

---

## 命令参考

### 初始化命令

```bash
dataspec init [options]

选项:
  --project-name <name>  项目名称
  --force               强制重新初始化

示例:
  dataspec init
  dataspec init --project-name "数据中台"
```

### 表定义管理

#### 创建表定义

```bash
dataspec table create <name> [options]

参数:
  name                  表名（格式：database.table_name）

选项:
  --template <type>     模板类型（hive, mysql, clickhouse）

示例:
  dataspec table create dw.sales_daily
  dataspec table create dw.user_profile --template hive
```

#### 列出所有表

```bash
dataspec table list [options]

选项:
  --filter <pattern>    过滤表名（支持通配符）
  --owner <name>        按负责人过滤
  --json               JSON 格式输出

示例:
  dataspec table list
  dataspec table list --filter "dw.*"
  dataspec table list --json
```

#### 查看表详情

```bash
dataspec table show <name> [options]

参数:
  name                  表名

选项:
  --json               JSON 格式输出

示例:
  dataspec table show dw.sales_daily
  dataspec table show dw.sales_daily --json
```

#### 搜索表

```bash
dataspec table search <keyword>

参数:
  keyword              搜索关键词

示例:
  dataspec table search sales
  dataspec table search user
```

### 指标定义管理

#### 创建指标定义

```bash
dataspec metric create <name> [options]

参数:
  name                  指标名称

选项:
  --category <category> 指标分类
  --owner <name>        负责人

示例:
  dataspec metric create "DAU" --category "用户指标"
  dataspec metric create "纯销金额" --owner "张三"
```

#### 列出所有指标

```bash
dataspec metric list [options]

选项:
  --category <category> 按分类过滤
  --json               JSON 格式输出

示例:
  dataspec metric list
  dataspec metric list --category "销售指标"
```

#### 查看指标详情

```bash
dataspec metric show <name> [options]

参数:
  name                  指标名称

选项:
  --json               JSON 格式输出

示例:
  dataspec metric show "DAU"
  dataspec metric show "纯销金额" --json
```

#### 对比两个指标

```bash
dataspec metric compare <metric1> <metric2>

参数:
  metric1              第一个指标
  metric2              第二个指标

示例:
  dataspec metric compare "DAU" "MAU"
  dataspec metric compare "纯销金额" "毛销金额"
```

### SQL 生成

#### 生成 DDL

```bash
dataspec generate ddl <table> [options]

参数:
  table                 表名

选项:
  --dialect <type>      SQL 方言（hive, mysql, clickhouse）
  --output <file>       输出文件路径

示例:
  dataspec generate ddl dw.sales_daily
  dataspec generate ddl dw.sales_daily --dialect mysql
  dataspec generate ddl dw.sales_daily --output ./sql/create.sql
```

#### 生成 ETL 模板

```bash
dataspec generate etl <table> [options]

参数:
  table                 表名

选项:
  --dialect <type>      SQL 方言（hive, mysql, clickhouse）
  --output <file>       输出文件路径

示例:
  dataspec generate etl dw.sales_daily
  dataspec generate etl dw.sales_daily --output ./sql/etl.sql
```

#### 生成稽核 SQL

```bash
dataspec generate check-sql <table> [options]

参数:
  table                 表名

选项:
  --output <file>       输出文件路径

示例:
  dataspec generate check-sql dw.sales_daily
  dataspec generate check-sql dw.sales_daily --output ./sql/check.sql
```

### 验证

```bash
dataspec validate [options]

选项:
  --type <type>         验证类型（table, metric, all）
  --json               JSON 格式输出
  --verbose            显示详细错误信息

示例:
  dataspec validate
  dataspec validate --type table
  dataspec validate --verbose
  dataspec validate --json > report.json
```

---

## 最佳实践

### 1. 项目组织

```
your-project/
├── dataspec/           # 数据定义
├── sql/               # 手写的 SQL
├── scripts/           # 脚本
└── docs/              # 文档
```

### 2. 命名规范

**表名：**
- 格式：`database.table_name`
- 只允许小写字母、数字、下划线
- 示例：`dw.user_behavior_daily`, `ods.order_info`

**字段名：**
- 只允许小写字母、数字、下划线
- 以字母或下划线开头
- 示例：`user_id`, `order_amount`, `create_time`

**指标名：**
- 使用中文或英文
- 简洁明确
- 示例：`DAU`, `纯销金额`, `用户转化率`

### 3. Git 工作流

```bash
# 1. 创建分支
git checkout -b feature/add-sales-table

# 2. 创建或修改定义
dataspec table create dw.sales_daily

# 3. 验证
dataspec validate

# 4. 提交
git add dataspec/
git commit -m "feat: 添加销售日表定义"

# 5. 推送并创建 PR
git push origin feature/add-sales-table
```

### 4. CI/CD 集成

在 `.github/workflows/dataspec.yml` 中：

```yaml
name: DataSpec Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @dpxing/dataspec
      - run: dataspec validate --json
```

### 5. 与 AI 工具配合

DataSpec 自动生成 `AGENTS.md` 文件，引导 AI 工具：

- 编写 SQL 时参考表定义
- 使用统一的指标口径
- 遵循数据质量规则
- 避免全表扫描等反模式

---

## 常见问题

### Q1: 如何批量导入现有表定义？

暂不支持批量导入，建议逐个创建。未来版本将支持从 DDL 导入。

### Q2: 支持哪些数据库？

当前支持：
- ✅ Hive（完整支持）
- ✅ MySQL（基础支持）
- 🚧 ClickHouse（开发中）

### Q3: 生成的 SQL 可以直接执行吗？

- **DDL**：可以直接执行
- **ETL**：需要填写具体的业务逻辑
- **稽核 SQL**：可以直接执行，但建议根据实际情况调整阈值

### Q4: 如何处理敏感信息？

DataSpec 只管理元数据（表结构、字段定义），不涉及实际数据。敏感的业务规则可以在注释中说明。

### Q5: 可以与其他工具集成吗？

可以！DataSpec 支持：
- JSON 输出（便于与其他工具集成）
- Git 版本控制
- CI/CD 自动化
- AI 工具（通过 AGENTS.md）

---

## 反馈与支持

- **GitHub Issues**: [提交问题](https://github.com/raydez/dataspec/issues)
- **文档**: [在线文档](https://dataspec.dev)
- **示例**: [示例仓库](https://github.com/raydez/dataspec-examples)

---

**DataSpec - AI-native tool for data development teams**  
**版本：** 0.1.0  
**许可：** MIT

---

## Slash 命令使用

DataSpec 提供了 5 个核心 slash 命令，可在 AI 工具中直接使用。

### 1. `/dataspec:init` - 初始化项目

**用途**: 创建新的 DataSpec 项目

**参数**:
- `--name` (可选): 项目名称
- `--dialect` (可选): SQL 方言 [hive|maxcompute|mysql|clickhouse]
- `--template` (可选): 项目模板 [basic|enterprise|bi]
- `--skip-examples`: 跳过创建示例文件
- `--skip-git`: 跳过 Git 初始化

**示例**:

```bash
# 基础初始化
/dataspec:init

# 指定名称和方言
/dataspec:init --name "Sales Data Platform" --dialect maxcompute

# 使用企业模板
/dataspec:init --template enterprise --dialect hive
```

**执行结果**:
- ✅ 创建项目目录结构
- ✅ 生成配置文件
- ✅ 创建示例文件
- ✅ 为所有 AI 工具生成 slash 命令文件

---

### 2. `/dataspec:define` - 定义表/指标

**用途**: 创建数据表或业务指标的定义文件

**参数**:
- `type` (必需): `table` 或 `metric`
- `name` (必需): 表名（database.table）或指标名
- `--owner` (可选): 数据负责人
- `--template` (可选): 使用模板
- `--description` (可选): 简要描述

**示例**:

```bash
# 定义表
/dataspec:define table dw.sales_daily --owner "Data Team"

# 定义指标
/dataspec:define metric 销售额 --description "总销售金额"

# 使用模板
/dataspec:define table ods.orders --template fact_table
```

**支持的模板**:
- **表模板**: `basic`, `fact_table`, `dim_table`, `ods_table`
- **指标模板**: `basic_metric`, `derived_metric`

**执行结果**:
- ✅ 创建结构化的定义文件（Markdown 格式）
- ✅ 包含标准章节：基本信息、Schema、分区、依赖关系等
- ✅ 添加 DataSpec 标记用于后续处理

**生成的文件示例**:

```markdown
# Table: dw.sales_daily

<!-- DATASPEC:TABLE:START -->
## Basic Info
- **Owner**: Data Team
- **Type**: Fact Table
- **Update Frequency**: Daily

## Schema
| Column | Type | Description | Nullable |
|--------|------|-------------|----------|
| id | bigint | Primary key | No |
| sales_amount | decimal | Total sales | No |
| dt | string | Business date | No |

## Partitions
- dt (string) - Business date YYYYMMDD

## Dependencies
- **Upstream**: ods.orders
- **Downstream**: reports.daily_summary
<!-- DATASPEC:TABLE:END -->
```

---

### 3. `/dataspec:generate` - 生成代码

**用途**: 从定义文件生成 SQL DDL、ETL 脚本或文档

**参数**:
- `type` (必需): `ddl` | `etl` | `docs`
- `target` (可选): 目标表或指标名
- `--output` (可选): 输出文件路径
- `--format` (可选): 输出格式（for docs: markdown|html|pdf）
- `--all` (可选): 生成所有定义
- `--dialect` (可选): 覆盖 SQL 方言

**示例**:

```bash
# 生成 DDL
/dataspec:generate ddl dw.sales_daily

# 生成 ETL 并保存到文件
/dataspec:generate etl dw.sales_daily --output etl/sales_daily.sql

# 生成所有表的文档
/dataspec:generate docs --all --format html
```

**支持的 SQL 方言**:
- **Hive**: 支持分区、PARQUET 格式
- **MaxCompute**: 支持 LIFECYCLE、分区
- **MySQL**: 支持主键、索引
- **ClickHouse**: 支持 MergeTree 引擎

**生成的 DDL 示例（Hive）**:

```sql
-- DDL for dw.sales_daily
-- Generated by DataSpec

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

**生成的 ETL 示例（Hive）**:

```sql
-- ETL for dw.sales_daily
-- Generated by DataSpec

INSERT OVERWRITE TABLE dw.sales_daily PARTITION(dt='${bizdate}')
SELECT
  order_id as id,
  SUM(amount) as sales_amount,
  CURRENT_TIMESTAMP as create_time
FROM ods.orders
WHERE dt = '${bizdate}'
GROUP BY order_id;

-- Verification query
SELECT 
  dt,
  COUNT(*) as record_count,
  SUM(sales_amount) as total_sales
FROM dw.sales_daily
WHERE dt = '${bizdate}'
GROUP BY dt;
```

---

### 4. `/dataspec:validate` - 验证

**用途**: 验证定义文件的正确性或数据质量

**参数**:
- `type` (必需): `definition` | `data`
- `target` (可选): 目标表或指标名
- `--strict` (可选): 启用严格验证模式
- `--date` (可选): 数据验证日期（YYYYMMDD）
- `--all` (可选): 验证所有定义

**示例**:

```bash
# 验证表定义
/dataspec:validate definition dw.sales_daily

# 验证数据质量
/dataspec:validate data dw.sales_daily --date 20250127

# 严格模式验证所有定义
/dataspec:validate definition --all --strict
```

**定义验证检查项**:
- ✅ 文件存在性
- ✅ DataSpec 标记（`<!-- DATASPEC:TYPE:START/END -->`）
- ✅ 必需章节（Basic Info, Schema, etc.）
- ✅ 内容完整性
- ✅ 格式规范

**验证输出示例**:

```
📋 Validation Results
════════════════════════════════════════════════════════════
✅ [File] File exists: Definition file found
✅ [Structure] DataSpec markers: Valid DataSpec markers found
✅ [Content] Basic info section: Basic info section present
✅ [Content] Schema definition: Schema section present
⚠️  [Content] Dependencies: Upstream sources not specified
   💡 Suggestion: Add upstream source tables

────────────────────────────────────────────────────────────
Summary: 4 passed, 1 warning, 0 errors
════════════════════════════════════════════════════════════
```

---

### 5. `/dataspec:publish` - 发布

**用途**: 将表定义发布到生产环境

**参数**:
- `target` (必需): 目标表名
- `--dry-run` (可选): 预览变更，不实际执行
- `--force` (可选): 强制发布（跳过确认）
- `--env` (可选): 目标环境 [dev|staging|prod]

**示例**:

```bash
# 预览变更（推荐）
/dataspec:publish dw.sales_daily --dry-run

# 发布到 staging
/dataspec:publish dw.sales_daily --env staging

# 强制发布到生产
/dataspec:publish dw.sales_daily --env prod --force
```

**安全特性**:
- 🔒 **Dry-run 模式**: 预览变更不执行
- 🔄 **破坏性变更检测**: 自动检测可能导致数据丢失的变更
- ⚠️  **环境隔离**: 区分 dev/staging/prod
- 📝 **审计日志**: 记录所有变更

**发布输出示例**:

```
🔍 Pre-flight checks for dw.sales_daily
════════════════════════════════════════════════════════════
✅ Definition file found
✅ Definition validation passed

📋 Generating deployment plan...

📝 Planned Changes:
────────────────────────────────────────────────────────────
🆕 CREATE: Create table dw.sales_daily
   SQL: CREATE TABLE IF NOT EXISTS dw.sales_daily (...)

⚠️  Warnings:
   - Publishing to production environment
   - Table will be created with current date partition

✅ Dry-run completed (no changes made)

Next: Remove --dry-run to execute changes
```

---

## 完整工作流示例

以下是一个完整的数据表开发流程：

### 场景：创建日销售汇总表

#### 步骤 1: 初始化项目

```bash
/dataspec:init --name "Sales Analytics" --dialect hive
```

#### 步骤 2: 定义表

```bash
/dataspec:define table dw.sales_daily \
  --owner "Data Team" \
  --template fact_table \
  --description "Daily sales aggregation by product"
```

编辑生成的 `dataspec/tables/dw.sales_daily.md` 文件，完善字段定义：

```markdown
## Schema
| Column | Type | Description | Nullable |
|--------|------|-------------|----------|
| dt | string | Business date YYYYMMDD | No |
| product_id | bigint | Product ID | No |
| sales_amount | decimal(18,2) | Total sales amount | No |
| order_count | int | Number of orders | No |
| create_time | timestamp | Record creation time | No |
```

#### 步骤 3: 生成 DDL

```bash
/dataspec:generate ddl dw.sales_daily --output sql/create_sales_daily.sql
```

#### 步骤 4: 验证定义

```bash
/dataspec:validate definition dw.sales_daily
```

如果有错误，根据提示修改定义文件。

#### 步骤 5: 生成 ETL 脚本

```bash
/dataspec:generate etl dw.sales_daily --output etl/sales_daily_etl.sql
```

编辑 ETL 脚本，添加业务逻辑。

#### 步骤 6: 预览发布

```bash
/dataspec:publish dw.sales_daily --dry-run --env staging
```

#### 步骤 7: 发布到 Staging

```bash
/dataspec:publish dw.sales_daily --env staging
```

#### 步骤 8: 验证数据

```bash
/dataspec:validate data dw.sales_daily --date 20250127
```

#### 步骤 9: 发布到生产

```bash
/dataspec:publish dw.sales_daily --env prod
```

---

## 最佳实践

### 1. 命名规范

**表命名**:
- 使用小写字母和下划线
- 格式：`database.table_name`
- 示例：`dw.sales_daily`, `ods.orders`, `dim.products`

**指标命名**:
- 使用中文或英文
- 简洁明了，表达业务含义
- 示例：`销售额`, `活跃用户数`, `GMV`

### 2. 定义文件管理

**保持定义文件的完整性**:
- ✅ 及时更新字段描述
- ✅ 记录依赖关系
- ✅ 添加查询示例
- ✅ 维护变更历史

**使用 Git 版本控制**:
```bash
git add dataspec/
git commit -m "feat: add sales_daily table definition"
```

### 3. 工作流建议

**开发流程**:
1. 在 `dev` 环境开发和测试
2. 验证通过后发布到 `staging`
3. Staging 验证无误后发布到 `prod`

**团队协作**:
- 使用 Pull Request 审查定义变更
- 重要表的 Schema 变更需要团队讨论
- 记录变更原因和影响范围

### 4. 性能优化

**分区设计**:
- 合理设计分区字段（通常是日期）
- 避免分区过多或过少
- 示例：按日期分区 `dt`

**字段选择**:
- 只选择必要的字段
- 使用合适的数据类型
- 添加字段注释

### 5. 文档维护

**保持文档同步**:
- Schema 变更时及时更新定义文件
- 重新生成 DDL 和 ETL 脚本
- 运行验证确保一致性

---

## 常见问题

### Q1: 如何修改已有表的定义？

直接编辑 `dataspec/tables/{table_name}.md` 文件，然后：

```bash
/dataspec:validate definition {table_name}
/dataspec:generate ddl {table_name}
```

### Q2: 如何处理破坏性变更？

使用 `--dry-run` 预览变更：

```bash
/dataspec:publish {table_name} --dry-run
```

如果有破坏性变更，系统会警告。需要使用 `--force` 强制执行。

### Q3: 支持哪些 SQL 方言？

当前支持：
- Hive
- MaxCompute
- MySQL
- ClickHouse

可以在初始化时指定，或在生成时覆盖：

```bash
/dataspec:generate ddl {table_name} --dialect maxcompute
```

### Q4: 如何批量生成多个表的 DDL？

使用 `--all` 参数：

```bash
/dataspec:generate ddl --all --output-dir sql/
```

### Q5: 定义文件可以自定义格式吗？

定义文件是标准的 Markdown 格式，可以自由编辑。但请保留 DataSpec 标记：

```markdown
<!-- DATASPEC:TABLE:START -->
...
<!-- DATASPEC:TABLE:END -->
```

---

## 获取帮助

- **文档**: [API Reference](./API_REFERENCE.md)
- **GitHub**: https://github.com/your-org/dataspec
- **Issues**: https://github.com/your-org/dataspec/issues

---

**最后更新**: 2025-01-27
