# DataSpec 最佳实践

**版本：** 0.1.0  
**更新时间：** 2025-11-25

---

## 📖 目录

1. [项目组织](#项目组织)
2. [命名规范](#命名规范)
3. [文档编写](#文档编写)
4. [团队协作](#团队协作)
5. [CI/CD 集成](#cicd-集成)
6. [性能优化](#性能优化)

---

## 项目组织

### 推荐的目录结构

```
your-data-project/
├── dataspec/              # 数据定义（由 DataSpec 管理）
│   ├── AGENTS.md
│   ├── README.md
│   ├── dataspec.config.json
│   ├── tables/
│   ├── metrics/
│   └── templates/
├── sql/                   # 手写的 SQL 脚本
│   ├── adhoc/            # 临时查询
│   ├── migrations/       # 数据迁移
│   └── procedures/       # 存储过程
├── scripts/              # 数据处理脚本
│   ├── python/
│   └── shell/
├── airflow/              # Airflow DAGs
│   └── dags/
├── docs/                 # 项目文档
│   ├── architecture.md
│   ├── data-dictionary.md
│   └── onboarding.md
└── tests/                # 数据测试
    ├── data_quality/
    └── integration/
```

### 分层管理

**ODS 层（操作数据层）**
```
dataspec/tables/
├── ods.user_info/
├── ods.order_info/
└── ods.product_info/
```

**DWD 层（明细数据层）**
```
dataspec/tables/
├── dwd.user_behavior/
├── dwd.order_detail/
└── dwd.product_sale/
```

**DWS 层（汇总数据层）**
```
dataspec/tables/
├── dws.user_behavior_daily/
├── dws.order_summary_daily/
└── dws.product_sale_daily/
```

**ADS 层（应用数据层）**
```
dataspec/tables/
├── ads.user_profile/
├── ads.sales_dashboard/
└── ads.product_analysis/
```

---

## 命名规范

### 表名规范

**格式：** `{layer}.{business_domain}_{granularity}`

**示例：**
- ✅ `dwd.user_behavior_detail`
- ✅ `dws.order_summary_daily`
- ✅ `ads.sales_dashboard`
- ❌ `UserBehavior` (不使用驼峰)
- ❌ `user-behavior` (不使用连字符)

**分层前缀：**
- `ods` - 操作数据层
- `dwd` - 明细数据层
- `dws` - 汇总数据层
- `ads` - 应用数据层
- `dim` - 维度表
- `dws` - 事实表

### 字段名规范

**通用规则：**
- 使用小写字母、数字、下划线
- 以字母或下划线开头
- 见名知义，不使用缩写（除非是行业通用缩写）

**推荐命名：**
```sql
-- 主键
id, user_id, order_id

-- 时间字段
created_at, updated_at, deleted_at
start_time, end_time
order_date, payment_date

-- 金额字段
amount, total_amount, discount_amount
unit_price, total_price

-- 状态字段
status, order_status, payment_status
is_deleted, is_active, is_valid

-- 数量字段
count, total_count, item_count
quantity, total_quantity

-- 分区字段
dt, ds, hour
```

**避免的命名：**
- ❌ `col1, col2, col3` (无意义)
- ❌ `tmp, temp` (太泛化)
- ❌ `data, info` (太抽象)

### 指标名规范

**中文指标：**
- 使用简洁明确的中文
- 包含计量单位（如需要）
- 示例：`日活跃用户数`, `订单转化率`, `客单价`

**英文指标：**
- 使用业界通用缩写
- 示例：`DAU`, `MAU`, `ARPU`, `LTV`

**避免歧义：**
- ✅ `新增用户数` (明确)
- ❌ `用户数` (不明确：总数？新增？活跃？)

---

## 文档编写

### 表定义编写要点

#### 1. 基本信息必须完整

```markdown
## 基本信息
- **表名：** dw.user_behavior_daily ✅
- **中文名：** 用户行为日表 ✅
- **负责人：** 张三 ✅
- **更新频率：** daily ✅
- **数据来源：** ods.user_actions ✅
```

#### 2. 字段描述要详细

❌ **不好的描述：**
```markdown
| user_id | BIGINT | 用户 | 是 | 123 |
```

✅ **好的描述：**
```markdown
| user_id | BIGINT | 用户唯一标识，关联 dim_user 表 | 是 | 1234567890 |
```

#### 3. 包含数据质量规则

```markdown
## 数据质量规则
- user_id 不能为空，必须在 dim_user 中存在
- action_time 必须在合理范围内（不早于 2020-01-01）
- 同一用户同一天的记录数不超过 10000
- 数据量日环比波动不超过 50%
```

#### 4. 记录数据血缘

```markdown
## 依赖上游
- ods.user_actions (T+1 01:00 更新)
- dim.user (准实时更新)

## 下游消费
- ads.user_profile (用户画像)
- ads.user_retention (留存分析)
- BI 报表：用户行为分析看板
```

### 指标定义编写要点

#### 1. 业务定义清晰

```markdown
## 业务定义
日活跃用户数（DAU）是指在统计日期内，至少产生一次有效行为的去重用户数。

**有效行为定义：**
- 登录应用
- 浏览商品
- 下单
- 支付
- 其他核心交互行为

**去重规则：**
- 同一用户在同一天的多次行为只计算一次
```

#### 2. 计算公式精确

```markdown
## 计算公式

### 业务口径
```
DAU = COUNT(DISTINCT user_id)
WHERE action_date = 统计日期
  AND action_type IN ('login', 'browse', 'order', 'payment')
```

### 技术实现
```sql
SELECT
    dt,
    COUNT(DISTINCT user_id) AS dau
FROM dw.user_behavior_daily
WHERE dt = '${bizdate}'
    AND action_type IN ('login', 'browse', 'order', 'payment')
GROUP BY dt;
```
```

#### 3. 注意事项明确

```markdown
## 注意事项
1. **时区问题**：统计时间基于北京时间（UTC+8）
2. **去重范围**：仅在当日内去重，跨日用户会被重复计算
3. **测试账号**：需要过滤 user_type = 'test' 的测试账号
4. **异常处理**：user_id 为 NULL 的记录不计入统计
```

---

## 团队协作

### Git 工作流

#### 1. 分支策略

```bash
main            # 主分支，生产环境
├── develop     # 开发分支
│   ├── feature/add-user-table       # 功能分支
│   ├── feature/update-sales-metric  # 功能分支
│   └── hotfix/fix-order-ddl         # 紧急修复
```

#### 2. 提交规范

遵循 Conventional Commits：

```bash
# 新增表定义
git commit -m "feat(table): 添加用户行为日表定义"

# 修改指标
git commit -m "fix(metric): 修正 DAU 计算口径"

# 更新文档
git commit -m "docs: 完善数据质量规则说明"

# 生成 SQL
git commit -m "chore: 重新生成 DDL 和 ETL"
```

#### 3. Pull Request 流程

```bash
# 1. 创建分支
git checkout -b feature/add-order-table

# 2. 创建和编辑定义
dataspec table create dw.order_daily
# 编辑 dataspec/tables/dw.order_daily.md

# 3. 验证
dataspec validate

# 4. 提交
git add dataspec/
git commit -m "feat(table): 添加订单日表定义"

# 5. 推送
git push origin feature/add-order-table

# 6. 创建 PR 并等待审查
```

#### 4. Code Review 检查清单

**表定义审查：**
- [ ] 表名符合命名规范
- [ ] 字段描述清晰完整
- [ ] 包含必要的分区字段
- [ ] 数据质量规则合理
- [ ] 上下游依赖明确
- [ ] 通过 `dataspec validate`

**指标定义审查：**
- [ ] 业务定义清晰
- [ ] 计算公式正确
- [ ] SQL 实现与业务口径一致
- [ ] 维度完整
- [ ] 相关指标关联正确

---

## CI/CD 集成

### GitHub Actions 完整配置

```yaml
name: DataSpec CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'dataspec/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'dataspec/**'

jobs:
  validate:
    name: 验证数据定义
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install DataSpec
        run: npm install -g @raydez/dataspec

      - name: Validate definitions
        run: |
          dataspec validate --verbose > validation.log 2>&1
          cat validation.log

      - name: Generate validation report
        if: always()
        run: dataspec validate --json > validation-report.json

      - name: Upload validation report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: validation-report
          path: validation-report.json

      - name: Comment on PR
        if: failure() && github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('validation-report.json', 'utf8'));
            
            let body = '## ❌ DataSpec 验证失败\n\n';
            
            if (report.errors && report.errors.length > 0) {
              body += '### 错误列表\n\n';
              report.errors.forEach(error => {
                body += `- **${error.name}**: ${error.errors[0].message}\n`;
              });
            }
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });

  generate-sql:
    name: 生成 SQL 文件
    runs-on: ubuntu-latest
    needs: validate
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install DataSpec
        run: npm install -g @raydez/dataspec

      - name: Generate DDL
        run: |
          mkdir -p generated/sql
          # 为所有表生成 DDL
          # 这里需要根据实际情况编写脚本

      - name: Commit generated files
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add generated/
          git commit -m "chore: 自动生成 SQL 文件" || echo "No changes"
          git push
```

### 预提交钩子（Git Hooks）

创建 `.husky/pre-commit`：

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 验证 DataSpec 定义
echo "🔍 验证 DataSpec 定义..."
npx dataspec validate

if [ $? -ne 0 ]; then
  echo "❌ DataSpec 验证失败，请修复错误后再提交"
  exit 1
fi

echo "✅ DataSpec 验证通过"
```

---

## 性能优化

### 1. 大量表定义的管理

当表定义超过 100 个时：

**按业务域分组：**
```
dataspec/tables/
├── user/              # 用户域
├── order/             # 订单域
├── product/           # 商品域
└── marketing/         # 营销域
```

**使用配置文件过滤：**
```json
// dataspec.config.json
{
  "validation": {
    "include": ["dw.*", "ads.*"],
    "exclude": ["tmp.*", "test.*"]
  }
}
```

### 2. CI/CD 优化

**增量验证：**
```bash
# 只验证变更的文件
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD | grep '^dataspec/')
if [ -n "$CHANGED_FILES" ]; then
  dataspec validate --files $CHANGED_FILES
fi
```

**并行处理：**
```yaml
jobs:
  validate:
    strategy:
      matrix:
        scope: [tables, metrics, checks]
    steps:
      - run: dataspec validate --type ${{ matrix.scope }}
```

### 3. 文档大小控制

**保持表定义简洁：**
- 避免在表定义中包含大量示例 SQL
- 复杂的逻辑说明可以链接到外部文档
- 使用注释而不是大段文字

**定期归档：**
```bash
# 归档不再使用的表定义
mkdir -p dataspec/archive/2024
mv dataspec/tables/deprecated_* dataspec/archive/2024/
```

---

## 总结

遵循这些最佳实践可以帮助团队：

✅ 保持数据定义的一致性和规范性  
✅ 提高团队协作效率  
✅ 确保数据质量  
✅ 降低维护成本  
✅ 加速数据开发流程  

---

**DataSpec 最佳实践**  
**版本：** 0.1.0  
**更新时间：** 2025-01-15
