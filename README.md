# DataSpec

> AI-native tool for data development teams

DataSpec 是一个为数据开发团队量身定制的智能化工具，帮助团队管理数据资产、生成 SQL 代码、实现数据稽核自动化。

## ✨ 特性

- 📚 **数据资产管理** - 集中管理表定义、指标定义
- 🤖 **AI 深度集成** - 为 Claude Code 等 AI 工具提供数据资产上下文
- 💻 **SQL 自动生成** - 一键生成 DDL、ETL 模板、稽核 SQL
- ✅ **数据质量保障** - 内置验证规则，确保数据定义规范
- 🔍 **稽核自动化** - 生成稽核规则和调度配置

## 🚀 快速开始

### 安装

```bash
npm install -g @raydez/dataspec
```

### 初始化项目

```bash
# 在数据仓库代码目录中初始化
dataspec init

# 创建表定义
dataspec table create dw.sales_daily

# 编辑生成的文件
vim dataspec/tables/dw.sales_daily.md

# 验证定义
dataspec validate
```

## 📖 文档

- [用户手册](docs/user-guide.md) - 详细使用说明
- [技术架构](docs/architecture.md) - 技术设计文档
- [开发计划](docs/development-plan.md) - 开发路线图
- [示例教程](docs/examples.md) - 实际案例

## 🎯 核心命令

```bash
# 项目管理
dataspec init                           # 初始化项目
dataspec validate                       # 验证所有定义

# 表定义管理
dataspec table create <name>            # 创建表定义
dataspec table list                     # 列出所有表
dataspec table show <name>              # 查看表详情

# 指标定义管理
dataspec metric create <name>           # 创建指标定义
dataspec metric list                    # 列出所有指标
dataspec metric show <name>             # 查看指标详情

# SQL 生成（通过 Slash Commands）
/dataspec:generate ddl <table>          # 生成 DDL
/dataspec:generate etl <table>          # 生成 ETL 模板
```

### 🌐 SQL 方言支持

DataSpec 支持多种主流数据仓库引擎的 SQL 方言：

| 方言 | 引擎 | 状态 | 特性 |
|------|------|------|------|
| **Hive** | Apache Hive | ✅ 完整支持 | DDL, ETL, 稽核, 分区表 |
| **MaxCompute** | 阿里云 ODPS | ✅ 完整支持 | DDL, ETL, 生命周期, TBLPROPERTIES |
| **MySQL** | MySQL | ✅ 基础支持 | DDL, ETL 模板 |
| **ClickHouse** | ClickHouse | ⚠️ 框架支持 | DDL, ETL 框架 |

```bash
# 通过 Slash Commands 指定方言生成 SQL
/dataspec:generate ddl dw.sales_daily --dialect maxcompute
/dataspec:generate etl dw.sales_daily --dialect hive
```

## 💡 使用场景

### 1. BI 需求开发
- 规范化需求文档
- 自动生成 SQL 框架
- 节省 20% 开发时间

### 2. 数据稽核自动化
- 定义稽核规则
- 生成稽核 SQL
- 集成调度系统

### 3. 指标定义管理
- 统一指标口径
- 快速对比差异
- 减少数据答疑

### 4. AI 辅助开发
- 为 Claude Code 提供上下文
- 生成符合规范的 SQL
- 提升代码质量 40%

## 🏗️ 项目结构

```
dataspec/
├── tables/          # 表定义
│   └── dw.sales_daily.md
├── metrics/         # 指标定义
│   └── 纯销金额.md
├── requests/        # BI 需求（未来）
├── checks/          # 稽核规则（未来）
└── templates/       # 生成的文件
    ├── sql/
    └── dolphinscheduler/
```

## 🛠️ 开发

### 环境要求

- Node.js >= 20.19.0
- pnpm >= 8.0.0

### 本地开发

```bash
# 克隆代码
git clone https://github.com/raydez/dataspec.git
cd dataspec

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 运行测试
pnpm test

# 构建
pnpm build

# 本地链接
npm link
```

## 🤝 贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md)。

## 📝 许可证

MIT License

## 🔗 相关文档

- [数据开发工具改造评估报告](../数据开发工具改造评估报告.md)
- [技术架构方案](../DataSpec技术架构方案.md)
- [详细开发计划](../DataSpec详细开发计划.md)
