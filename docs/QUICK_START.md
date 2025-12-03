# DataSpec 快速开始指南

**版本**: v0.1.1  
**阅读时间**: 5 分钟

---

## 🚀 5 分钟上手 DataSpec

### 1. 初始化项目

在 Claude Code 中运行：

```bash
/dataspec:init "My Data Project" --dialect hive
```

或者使用 CLI：

```bash
dataspec init
```

**结果**: 创建完整的项目结构、配置文件和 AI 命令文件

---

### 2. 定义一个表

```bash
/dataspec:define table dw.sales_daily --owner "Data Team"
```

**结果**: 生成 `dataspec/tables/dw.sales_daily.md`

---

### 3. 生成 DDL

```bash
/dataspec:generate ddl dw.sales_daily
```

**结果**: 输出 Hive CREATE TABLE 语句

---

### 4. 验证定义

```bash
dataspec validate
```

**结果**: 检查所有定义文件的完整性和正确性

---

## 📚 5 个核心命令

| 命令 | 用途 | 示例 |
|------|------|------|
| `init` | 初始化项目 | `/dataspec:init` |
| `define` | 定义表/指标 | `/dataspec:define table dw.sales` |
| `generate` | 生成代码 | `/dataspec:generate ddl dw.sales` |
| `validate` | 验证 | `/dataspec:validate definition dw.sales` |
| `publish` | 发布 | `/dataspec:publish dw.sales --dry-run` |

---

## 🔄 标准工作流

```
1. init      → 初始化项目
2. define    → 定义表
3. generate  → 生成 DDL
4. validate  → 验证定义
5. publish   → 发布到生产
```

---

## 💡 最佳实践

### 表命名规范
- 格式：`database.table_name`
- 示例：`dw.sales_daily`, `ods.orders`

### 始终使用 dry-run
```bash
/dataspec:publish dw.sales_daily --dry-run
```

### 保持定义文件同步
- 编辑 `dw.sales_daily.md` 文件
- 运行 `validate` 检查定义是否正确
- 重新 `generate` DDL

---

## 🆘 需要帮助？

- 详细文档: [用户指南](./USER_GUIDE.md)
- 问题反馈: GitHub Issues

---

**下一步**: 查看 [完整用户指南](./USER_GUIDE.md) 了解更多功能
