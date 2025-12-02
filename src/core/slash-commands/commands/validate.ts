/**
 * /dataspec:validate 命令实现
 * 验证表/指标定义或数据质量
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CommandDefinition, CommandContext, CommandResult } from '../types.js';
import { commandRegistry } from '../command-registry.js';

const ValidateCommand: CommandDefinition = {
  id: 'validate',
  name: 'dataspec validate',
  description: 'Validate definitions or data quality',
  category: 'validate',
  examples: [
    {
      command: '/dataspec:validate definition dw.sales_daily',
      description: 'Validate table definition',
      context: 'Checks definition file for correctness'
    },
    {
      command: '/dataspec:validate data dw.sales_daily --date 20250127',
      description: 'Validate data quality',
      context: 'Runs data quality checks for specific date'
    },
    {
      command: '/dataspec:validate definition --all --strict',
      description: 'Strict validation for all definitions',
      context: 'Comprehensive validation with strict rules'
    }
  ],
  parameters: [
    {
      name: 'type',
      type: 'choice',
      required: true,
      description: 'Validation type: definition or data',
      choices: ['definition', 'data']
    },
    {
      name: 'target',
      type: 'string',
      required: false,
      description: 'Target table or metric name'
    },
    {
      name: 'strict',
      type: 'boolean',
      required: false,
      description: 'Enable strict validation mode',
      defaultValue: false
    },
    {
      name: 'date',
      type: 'string',
      required: false,
      description: 'Date for data validation (YYYYMMDD)'
    },
    {
      name: 'all',
      type: 'boolean',
      required: false,
      description: 'Validate all definitions',
      defaultValue: false
    }
  ],
  handler: validateHandler,
  version: '0.2.0',
  requiresProject: true
};

interface ValidationResult {
  passed: number;
  warnings: number;
  errors: number;
  checks: ValidationCheck[];
}

interface ValidationCheck {
  category: string;
  name: string;
  status: 'pass' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}

/**
 * Validate 命令处理函数
 */
async function validateHandler(
  args: string[],
  options: Record<string, any>,
  context: CommandContext
): Promise<CommandResult> {
  try {
    const startTime = Date.now();

    // 验证项目是否已初始化
    if (!context.config) {
      return {
        success: false,
        message: 'Not a DataSpec project',
        errors: [{
          code: 'NOT_INITIALIZED',
          message: 'Please run /dataspec:init first to initialize the project',
          severity: 'error'
        }],
        executionTime: Date.now() - startTime
      };
    }

    const type = args[0] as 'definition' | 'data';
    const target = args[1];
    const { strict, date, all } = options;

    if (!type || !['definition', 'data'].includes(type)) {
      return {
        success: false,
        message: 'Invalid validation type',
        errors: [{
          code: 'INVALID_TYPE',
          message: 'Type must be either "definition" or "data"',
          severity: 'error'
        }],
        executionTime: Date.now() - startTime
      };
    }

    // 根据类型执行不同的验证逻辑
    if (type === 'definition') {
      return await validateDefinition(target, { strict, all }, context, startTime);
    } else {
      return await validateData(target, { date }, context, startTime);
    }

  } catch (error) {
    return {
      success: false,
      message: `Validate failed: ${error instanceof Error ? error.message : String(error)}`,
      errors: [{
        code: 'VALIDATE_FAILED',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
        stack: error instanceof Error ? error.stack : undefined
      }],
      executionTime: 0
    };
  }
}

/**
 * 验证定义
 */
async function validateDefinition(
  target: string | undefined,
  options: { strict?: boolean; all?: boolean },
  context: CommandContext,
  startTime: number
): Promise<CommandResult> {
  const projectDir = context.currentDirectory || process.cwd();
  
  if (!target && !options.all) {
    return {
      success: false,
      message: 'Target or --all flag is required',
      errors: [{
        code: 'MISSING_TARGET',
        message: 'Please specify a table/metric name or use --all',
        severity: 'error'
      }],
      executionTime: Date.now() - startTime
    };
  }

  const results: ValidationResult[] = [];

  if (options.all) {
    // 验证所有定义
    const tablesDir = path.join(projectDir, 'dataspec', 'tables');
    const metricsDir = path.join(projectDir, 'dataspec', 'metrics');
    
    try {
      const tables = await fs.readdir(tablesDir);
      for (const table of tables) {
        const result = await validateSingleDefinition(table, 'table', options.strict || false, projectDir || '');
        results.push(result);
      }
    } catch {
      // Tables directory might not exist
    }
    
    try {
      const metrics = await fs.readdir(metricsDir);
      for (const metric of metrics) {
        const metricName = metric.replace('.md', '');
        const result = await validateSingleDefinition(metricName, 'metric', options.strict || false, projectDir || '');
        results.push(result);
      }
    } catch {
      // Metrics directory might not exist
    }
  } else if (target) {
    // 验证单个定义
    const isTable = target.includes('.');
    const result = await validateSingleDefinition(
      target, 
      isTable ? 'table' : 'metric', 
      options.strict || false, 
      projectDir || ''
    );
    results.push(result);
  }

  // 汇总结果
  const summary = results.reduce((acc, r) => ({
    passed: acc.passed + r.passed,
    warnings: acc.warnings + r.warnings,
    errors: acc.errors + r.errors,
    checks: [...acc.checks, ...r.checks]
  }), { passed: 0, warnings: 0, errors: 0, checks: [] as ValidationCheck[] });

  // 类型安全的返回对象
  const allChecks = summary.checks;

  // 输出结果
  console.log(`\n📋 Validation Results`);
  console.log('═'.repeat(80));
  
  for (const check of summary.checks) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} [${check.category}] ${check.name}: ${check.message}`);
    if (check.suggestion) {
      console.log(`   💡 Suggestion: ${check.suggestion}`);
    }
  }

  console.log('\n' + '─'.repeat(80));
  console.log(`Summary: ${summary.passed} passed, ${summary.warnings} warnings, ${summary.errors} errors`);
  console.log('═'.repeat(80));

  const hasErrors = summary.errors > 0;
  const hasWarnings = summary.warnings > 0;

  const result: CommandResult = {
    success: !hasErrors,
    message: hasErrors ? 'Validation failed with errors' : 
             hasWarnings ? 'Validation passed with warnings' : 
             'Validation passed',
    details: {
      passed: summary.passed,
      warningsCount: summary.warnings,
      errorsCount: summary.errors,
      checks: allChecks,
      target: target || 'all',
      strict: options.strict
    },
    executionTime: Date.now() - startTime
  };

  if (hasWarnings && allChecks) {
    (result as any).warnings = allChecks
      .filter(c => c.status === 'warning')
      .map(c => ({ message: c.message, code: 'VALIDATION_WARNING' }));
  }

  if (hasErrors) {
    result.errors = allChecks
      .filter(c => c.status === 'error')
      .map(c => ({ 
        message: c.message, 
        code: 'VALIDATION_ERROR',
        severity: 'error' as const
      }));
  }

  return result;
}

/**
 * 验证单个定义
 */
async function validateSingleDefinition(
  name: string,
  type: 'table' | 'metric',
  strict: boolean,
  projectDir: string
): Promise<ValidationResult> {
  name = name || '';
  const checks: ValidationCheck[] = [];
  
  const defPath = type === 'table'
    ? path.join(projectDir, 'dataspec', 'tables', `${name}.md`)
    : path.join(projectDir, 'dataspec', 'metrics', `${name}.md`);

  // 检查文件是否存在
  try {
    await fs.access(defPath);
    checks.push({
      category: 'File',
      name: 'File exists',
      status: 'pass',
      message: 'Definition file found'
    });
  } catch {
    checks.push({
      category: 'File',
      name: 'File exists',
      status: 'error',
      message: 'Definition file not found',
      suggestion: `Create definition with /dataspec:define ${type} ${name}`
    });
    return { passed: 0, warnings: 0, errors: 1, checks };
  }

  // 读取并验证内容
  const content = await fs.readFile(defPath, 'utf-8');
  
  // 检查必需的标记
  const hasStartMarker = content.includes(`DATASPEC:${type.toUpperCase()}:START`);
  const hasEndMarker = content.includes(`DATASPEC:${type.toUpperCase()}:END`);
  
  if (hasStartMarker && hasEndMarker) {
    checks.push({
      category: 'Structure',
      name: 'DataSpec markers',
      status: 'pass',
      message: 'Valid DataSpec markers found'
    });
  } else {
    checks.push({
      category: 'Structure',
      name: 'DataSpec markers',
      status: strict ? 'error' : 'warning',
      message: 'Missing or invalid DataSpec markers',
      suggestion: 'Add <!-- DATASPEC:TYPE:START --> and <!-- DATASPEC:TYPE:END --> markers'
    });
  }

  // 检查基本信息
  if (content.includes('## Basic Info') || content.includes('## 基本信息')) {
    checks.push({
      category: 'Content',
      name: 'Basic info section',
      status: 'pass',
      message: 'Basic info section present'
    });
  } else {
    checks.push({
      category: 'Content',
      name: 'Basic info section',
      status: 'warning',
      message: 'Basic info section missing',
      suggestion: 'Add ## Basic Info section with owner and description'
    });
  }

  // 类型特定验证
  if (type === 'table') {
    // 验证表定义
    if (content.includes('## Schema') || content.includes('## 字段定义')) {
      checks.push({
        category: 'Content',
        name: 'Schema definition',
        status: 'pass',
        message: 'Schema section present'
      });
    } else {
      checks.push({
        category: 'Content',
        name: 'Schema definition',
        status: 'error',
        message: 'Schema section missing',
        suggestion: 'Add ## Schema section with column definitions'
      });
    }
  } else {
    // 验证指标定义
    if (content.includes('## Calculation Formula') || content.includes('## 计算公式')) {
      checks.push({
        category: 'Content',
        name: 'Calculation formula',
        status: 'pass',
        message: 'Calculation formula present'
      });
    } else {
      checks.push({
        category: 'Content',
        name: 'Calculation formula',
        status: 'error',
        message: 'Calculation formula missing',
        suggestion: 'Add ## Calculation Formula section with SQL'
      });
    }
  }

  // 统计结果
  const passed = checks.filter(c => c.status === 'pass').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  const errors = checks.filter(c => c.status === 'error').length;

  return { passed, warnings, errors, checks };
}

/**
 * 验证数据
 */
async function validateData(
  target: string | undefined,
  options: { date?: string },
  _context: CommandContext,
  startTime: number
): Promise<CommandResult> {
  if (!target) {
    return {
      success: false,
      message: 'Target table is required for data validation',
      errors: [{
        code: 'MISSING_TARGET',
        message: 'Please specify a table name',
        severity: 'error'
      }],
      executionTime: Date.now() - startTime
    };
  }

  // TODO: 实现实际的数据验证逻辑
  // 这需要连接到数据库并执行查询
  
  console.log(`\n🔍 Data Validation for ${target}`);
  console.log('═'.repeat(80));
  console.log(`Date: ${options.date || 'Latest'}`);
  console.log('\n⚠️  Data validation requires database connection (TODO: Implement)');
  console.log('\nPlanned checks:');
  console.log('  - Null value checks');
  console.log('  - Value range validation');
  console.log('  - Uniqueness constraints');
  console.log('  - Referential integrity');
  console.log('  - Custom business rules');

  return {
    success: true,
    message: 'Data validation (TODO: Full implementation)',
    details: {
      target,
      date: options.date,
      note: 'Full implementation requires database connection'
    },
    executionTime: Date.now() - startTime
  };
}

// 注册命令
commandRegistry.register(ValidateCommand);

export { ValidateCommand, validateHandler };
