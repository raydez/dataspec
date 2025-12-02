/**
 * 表定义模板生成器
 */

export function generateTableTemplate(tableName: string): string {
  // const [database, table] = tableName.split('.');
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `# 表定义：${tableName}

<!-- DATASPEC:TABLE:START -->
## 基本信息
- **表名：** ${tableName}
- **中文名：** [请填写]
- **负责人：** [请填写]
- **更新频率：** daily
- **数据来源：** [请填写上游数据源]

## 字段定义

| 字段名 | 类型 | 说明 | 是否必填 | 示例 |
|--------|------|------|---------|------|
| id | STRING | 主键ID | 是 | 12345 |
| biz_date | DATE | 业务日期 | 是 | 2025-01-15 |
| create_time | TIMESTAMP | 创建时间 | 是 | 2025-01-15 10:30:00 |
| update_time | TIMESTAMP | 更新时间 | 否 | 2025-01-15 10:30:00 |

> 💡 提示：请根据实际情况添加、修改或删除字段

## 分区字段
- **分区键：** dt
- **分区策略：** 按天分区（格式：YYYYMMDD）

## 数据质量规则
- id 不能为空且不能重复
- biz_date 不能为空
- create_time 不能为空
- [请根据业务需求添加其他规则]

## 依赖上游
- [上游表名] (更新时间：如 T+0 23:00)
- [如有多个上游，请逐行列出]

## 使用场景
[请描述此表的主要使用场景，如：用于每日销售分析报表]

<!-- DATASPEC:TABLE:END -->

## 变更历史
- ${currentDate}: 初始创建

---

## 开发说明

### 查询示例

\`\`\`sql
-- 查询最近7天的数据
SELECT *
FROM ${tableName}
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
 * 生成 AGENTS.md 文件（为 Claude Code 提供指令）
 */
export function generateAgentsTemplate(projectName: string = '数据中台'): string {
  return `# DataSpec 数据开发指令

## 项目上下文

这是 ${projectName} 的数据资产管理仓库，使用 DataSpec 工具管理表定义、指标定义等。

## 数据资产位置

- **表定义：** \`dataspec/tables/\`
- **指标定义：** \`dataspec/metrics/\`
- **稽核规则：** \`dataspec/checks/\`
- **生成的模板：** \`dataspec/templates/\`

## 编写 SQL 时的规则

### 1. 查找表定义

在编写 SQL 前，先查看 \`dataspec/tables/\` 目录，了解：
- 表的字段结构和类型
- 分区字段（必须在 WHERE 条件中使用）
- 数据更新频率
- 上游依赖关系

### 2. 遵循数据质量规则

生成的 SQL 必须包含：
- **分区过滤**：避免全表扫描，如 \`WHERE dt = '\${bizdate}'\`
- **关键字段非空检查**：如 \`AND id IS NOT NULL\`
- **数据合理性校验**：如金额字段 \`> 0\`
- **去重逻辑**：如有必要使用 \`DISTINCT\` 或 \`GROUP BY\`

### 3. SQL 模板格式

\`\`\`sql
-- 业务描述：[说明此 SQL 的用途]
-- 负责人：[姓名]
-- 生成时间：[日期]

SELECT
    -- 字段注释
    field1,
    field2
FROM table_name
WHERE dt = '\${bizdate}'      -- 必须使用分区过滤
    AND field IS NOT NULL     -- 关键字段非空
GROUP BY field1, field2;

-- 数据质量检查
SELECT
    COUNT(*) AS row_count,
    CASE
        WHEN COUNT(*) = 0 THEN '警告：无数据'
        ELSE '通过'
    END AS check_result
FROM table_name
WHERE dt = '\${bizdate}';
\`\`\`

### 4. 指标计算

在使用指标时，参考 \`dataspec/metrics/\` 中的定义：
- 使用统一的计算公式
- 注意口径差异（如纯销 vs 总销售）
- 引用正确的数据源表

### 5. 代码注释要求

- 复杂逻辑必须加注释
- SQL 开头说明业务目的
- 重要的过滤条件注释原因

## 常见任务

### 取数任务

当用户说"帮我取XX数据"时：
1. 搜索 \`dataspec/tables/\` 找到相关表
2. 生成 SQL，包含必要的过滤和校验
3. 添加 LIMIT 避免数据量过大
4. 包含数据质量检查

### 数据稽核

当用户说"生成稽核脚本"时：
1. 检查上游表更新时间
2. 检查数据量（不能为 0）
3. 检查关键字段空值率（< 1%）
4. 检查数据合理性（如金额 > 0）
5. 检查数据波动（与昨日对比）

### 指标答疑

当用户问"XX指标和YY指标有什么区别"时：
1. 查找 \`dataspec/metrics/\` 中的定义
2. 对比计算公式
3. 说明口径差异
4. 提供典型数据差异示例

## 禁止事项

- ❌ 不要生成全表扫描的 SQL（必须有分区过滤）
- ❌ 不要使用 \`SELECT *\`（明确指定字段）
- ❌ 不要忽略数据质量检查
- ❌ 不要引用未在 \`dataspec/\` 中定义的表或字段
- ❌ 不要在示例中使用真实的敏感数据

## 推荐做法

- ✅ 优先使用已定义的表和指标
- ✅ 生成的 SQL 包含业务注释
- ✅ 复杂逻辑使用 CTE（WITH 语句）
- ✅ 为数据分析师提供清晰的结果说明
- ✅ 建议优化低效的 SQL

---

> 此文件由 DataSpec 自动生成，用于为 Claude Code 等 AI 工具提供项目上下文。
`;
}
