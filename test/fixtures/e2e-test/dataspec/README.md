# 性能测试 数据资产库

## 📚 目录结构

- `tables/`: 表定义
- `metrics/`: 指标定义
- `requests/`: BI 需求管理
  - `active/`: 进行中的需求
  - `archive/`: 已完成的需求
- `checks/`: 稽核规则
- `templates/`: 生成的 SQL 和配置

## 🚀 快速开始

### 创建表定义

```bash
dataspec table create dw.sales_daily
```

### 创建指标定义

```bash
dataspec metric create 纯销金额
```

### 验证

```bash
dataspec validate
```

### 生成 SQL

```bash
# 生成建表 SQL
dataspec generate ddl dw.sales_daily

# 生成 ETL SQL 模板
dataspec generate etl dw.sales_daily
```

## 📖 文档

- [AGENTS.md](./AGENTS.md) - AI 工具使用指南
- [dataspec.config.json](./dataspec.config.json) - 配置文件

## 🛠️ 使用的工具

- DataSpec - 数据资产管理工具
- 版本：0.1.0

---
最后更新：2025-12-02
