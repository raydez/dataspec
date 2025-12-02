/**
 * 命令模板内容
 * 这些模板是通用的 Markdown 内容，适用于所有 AI 工具
 */

import { CommandId } from './base.js';

export const COMMAND_DESCRIPTIONS: Record<CommandId, string> = {
  init: 'Initialize DataSpec project',
  define: 'Define data tables or metrics',
  generate: 'Generate SQL, ETL or documentation',
  validate: 'Validate definitions or data quality',
  publish: 'Publish changes to production'
};

export const COMMAND_TEMPLATES: Record<CommandId, string> = {
  init: `# DataSpec Init Command

Initialize a new DataSpec project with standard structure and configuration.

## Purpose
Create a complete DataSpec project structure with:
- Configuration file (dataspec.config.json)
- Directory structure (tables, metrics, checks, templates)
- Example files and documentation
- AI tool integration (slash commands)

## Parameters
- \`--name\` (optional): Project name for documentation
- \`--dialect\` (optional): SQL dialect [hive|maxcompute|mysql|clickhouse]
- \`--template\` (optional): Project template [basic|enterprise|bi]
- \`--skip-examples\`: Skip creating example files
- \`--skip-git\`: Skip Git initialization

## Usage Examples

\`\`\`bash
# Basic initialization
/dataspec:init

# With custom name and dialect
/dataspec:init --name "Sales Data Platform" --dialect maxcompute

# Enterprise template
/dataspec:init --template enterprise --dialect hive
\`\`\`

## Steps

1. **Check prerequisites**
   - Verify no existing DataSpec project in current directory
   - Check for required dependencies

2. **Create directory structure**
   \`\`\`
   dataspec/
   ├── tables/          # Table definitions
   ├── metrics/         # Metric definitions
   ├── checks/          # Data quality checks
   ├── templates/       # SQL and workflow templates
   └── dataspec.config.json
   \`\`\`

3. **Generate configuration file**
   - Create dataspec.config.json with project settings
   - Set default SQL dialect
   - Configure paths and options

4. **Create example files** (unless --skip-examples)
   - Example table definition
   - Example metric definition
   - Template files

5. **Initialize Git** (unless --skip-git)
   - Run \`git init\`
   - Create .gitignore

6. **Generate AI tool integrations**
   - Create slash command files for all supported AI tools
   - Configure tool-specific settings

## Output

The command will output:
- ✅ List of created directories
- ✅ Generated files
- ✅ Next steps and suggestions

## Related Commands
- \`/dataspec:define\` - Define tables or metrics
- \`/dataspec:generate\` - Generate code from definitions
`,

  define: `# DataSpec Define Command

Define data tables or metrics in DataSpec format.

## Purpose
Create structured definitions for:
- **Tables**: Data warehouse tables with schema, partitions, and metadata
- **Metrics**: Business metrics with calculation logic and dimensions

## Parameters
- \`type\`: \`table\` or \`metric\` (required)
- \`name\`: Full name (database.table for tables, metric name for metrics)
- \`--template\`: Use a predefined template
- \`--owner\`: Data owner name
- \`--description\`: Brief description

## Usage Examples

\`\`\`bash
# Define a new table
/dataspec:define table dw.sales_daily --owner "Data Team" --description "Daily sales aggregation"

# Define a new metric
/dataspec:define metric 销售额 --template basic_metric

# Use a template
/dataspec:define table ods.orders --template fact_table
\`\`\`

## Steps

1. **Validate name format**
   - Tables: Must be \`database.table_name\`
   - Metrics: Any valid name

2. **Check for duplicates**
   - Verify the definition doesn't already exist

3. **Select or create template**
   - Use specified template or default
   - Fill in basic information

4. **Generate definition file**
   - Create \`tables/database.table_name.md\` for tables
   - Create \`metrics/metric_name.md\` for metrics

5. **Update configuration**
   - Add to dataspec.config.json

## Definition Structure

### Table Definition
\`\`\`markdown
# Table: dw.sales_daily

## Basic Info
- **Owner**: Data Team
- **Type**: Fact Table
- **Update Frequency**: Daily

## Schema
| Column | Type | Description | Nullable |
|--------|------|-------------|----------|
| date | string | Business date | No |
| sales_amount | decimal | Total sales | No |

## Partitions
- date (format: YYYYMMDD)

## Dependencies
- Source: ods.orders
\`\`\`

### Metric Definition
\`\`\`markdown
# Metric: 销售额

## Definition
Sum of order amounts

## Formula
\`\`\`sql
SELECT SUM(amount) as sales_amount
FROM dw.orders
WHERE status = 'completed'
\`\`\`

## Dimensions
- Time period
- Region
- Product category
\`\`\`

## Related Commands
- \`/dataspec:generate\` - Generate DDL or ETL
- \`/dataspec:validate\` - Validate definition
`,

  generate: `# DataSpec Generate Command

Generate SQL, ETL workflows, or documentation from DataSpec definitions.

## Purpose
Transform DataSpec definitions into:
- **DDL**: CREATE TABLE statements
- **ETL**: Data pipeline code
- **Docs**: Documentation in various formats

## Parameters
- \`type\`: \`ddl\` | \`etl\` | \`docs\` (required)
- \`target\`: Table or metric name
- \`--output\`: Output file path
- \`--format\`: Output format (for docs: html, pdf, markdown)
- \`--dialect\`: Override SQL dialect

## Usage Examples

\`\`\`bash
# Generate DDL for a table
/dataspec:generate ddl dw.sales_daily

# Generate ETL workflow
/dataspec:generate etl dw.sales_daily --output etl/sales_daily.sql

# Generate documentation for all tables
/dataspec:generate docs --all --format html
\`\`\`

## Steps

1. **Load definition**
   - Read table or metric definition file
   - Parse structure and metadata

2. **Validate definition**
   - Check for required fields
   - Validate schema and dependencies

3. **Apply template**
   - Select appropriate template based on type and dialect
   - Fill in definition data

4. **Generate output**
   - Create SQL/code file
   - Format and validate syntax

5. **Save or display**
   - Write to specified output file or stdout

## Generated Output Examples

### DDL (Hive)
\`\`\`sql
CREATE TABLE IF NOT EXISTS dw.sales_daily (
  date STRING COMMENT 'Business date',
  sales_amount DECIMAL(18,2) COMMENT 'Total sales'
)
PARTITIONED BY (dt STRING)
STORED AS PARQUET;
\`\`\`

### ETL
\`\`\`sql
INSERT OVERWRITE TABLE dw.sales_daily PARTITION(dt='\${bizdate}')
SELECT
  order_date as date,
  SUM(amount) as sales_amount
FROM ods.orders
WHERE dt = '\${bizdate}'
GROUP BY order_date;
\`\`\`

## Related Commands
- \`/dataspec:define\` - Define tables or metrics
- \`/dataspec:validate\` - Validate before generating
`,

  validate: `# DataSpec Validate Command

Validate table/metric definitions or data quality.

## Purpose
Perform validation on:
- **Definitions**: Check definition files for correctness
- **Data**: Run data quality checks

## Parameters
- \`type\`: \`definition\` | \`data\` (required)
- \`target\`: Table or metric name
- \`--strict\`: Enable strict validation mode
- \`--date\`: Date for data validation (YYYYMMDD)

## Usage Examples

\`\`\`bash
# Validate a table definition
/dataspec:validate definition dw.sales_daily

# Validate data for a specific date
/dataspec:validate data dw.sales_daily --date 20250127

# Strict validation for all definitions
/dataspec:validate definition --all --strict
\`\`\`

## Validation Checks

### Definition Validation
- ✅ Required fields present
- ✅ Schema format correct
- ✅ Data types valid
- ✅ Dependencies exist
- ✅ Naming conventions followed

### Data Validation
- ✅ Null checks
- ✅ Value range checks
- ✅ Uniqueness constraints
- ✅ Referential integrity
- ✅ Custom business rules

## Output

\`\`\`
Validation Results for dw.sales_daily
=====================================

✅ Definition structure: PASS
✅ Schema validation: PASS
⚠️  Partition check: WARNING - Missing partition for date=20250126
❌ Data quality: FAIL - Found 15 null values in sales_amount

Summary: 2 passed, 1 warning, 1 failed
\`\`\`

## Related Commands
- \`/dataspec:define\` - Create or update definitions
- \`/dataspec:generate\` - Generate code
`,

  publish: `# DataSpec Publish Command

Publish table definitions and changes to production environment.

## Purpose
Deploy DataSpec definitions to production:
- Execute DDL statements
- Update metadata catalog
- Create/update tables
- Version control and rollback support

## Parameters
- \`target\`: Table or metric name
- \`--dry-run\`: Show changes without executing
- \`--force\`: Force publish even with warnings
- \`--env\`: Target environment [dev|staging|prod]

## Usage Examples

\`\`\`bash
# Dry run (preview changes)
/dataspec:publish dw.sales_daily --dry-run

# Publish to staging
/dataspec:publish dw.sales_daily --env staging

# Force publish
/dataspec:publish dw.sales_daily --force
\`\`\`

## Steps

1. **Pre-flight checks**
   - Validate definition
   - Check for breaking changes
   - Verify permissions

2. **Generate deployment plan**
   - Show what will be changed
   - List affected objects

3. **Confirm with user** (unless --force)
   - Display changes
   - Prompt for confirmation

4. **Execute changes**
   - Run DDL statements
   - Update metadata
   - Create backups

5. **Verify and report**
   - Check execution results
   - Log changes
   - Send notifications

## Safety Features

- 🔒 **Dry-run mode**: Preview changes without executing
- 🔄 **Rollback support**: Automatic backup before changes
- ⚠️  **Breaking change detection**: Warn about data loss
- 📝 **Audit logging**: Track all changes

## Related Commands
- \`/dataspec:validate\` - Validate before publishing
- \`/dataspec:generate\` - Generate DDL to review
`
};
