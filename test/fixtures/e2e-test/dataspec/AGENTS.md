# 性能测试 - 数据开发 AI 助手指令

## 项目上下文

这是 性能测试 的数据资产管理仓库。

## 数据资产位置

- **表定义：** dataspec/tables/
- **指标定义：** dataspec/metrics/
- **BI 需求：** dataspec/requests/
- **稽核规则：** dataspec/checks/
- **生成的 SQL：** dataspec/templates/sql/

## 编写 SQL 时的规则

### 1. 查找表定义

在编写 SQL 前，先查看 `dataspec/tables/` 目录，了解：
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

```sql
-- 业务描述
-- 负责人：XXX
-- 生成时间：YYYY-MM-DD

SELECT
    -- 字段注释
    field1,
    field2
FROM table_name
WHERE dt = '${bizdate}'  -- 必须使用分区过滤
    AND field IS NOT NULL  -- 关键字段非空
GROUP BY field1, field2;
```

### 4. 指标计算

在使用指标时，参考 `dataspec/metrics/` 中的定义：
- 使用统一的计算公式
- 注意口径差异
- 引用正确的数据源表

## 禁止事项

- ❌ 不要生成全表扫描的 SQL（必须有分区过滤）
- ❌ 不要使用 SELECT *（明确指定字段）
- ❌ 不要忽略数据质量检查
- ❌ 不要引用未定义的表或字段

## 常用命令

```bash
# 搜索表定义
dataspec table search <关键词>

# 查看表详情
dataspec table show <表名>

# 搜索指标定义
dataspec metric search <关键词>

# 生成 SQL
dataspec generate ddl <表名>
dataspec generate etl <表名>
```

---
由 DataSpec 自动生成
