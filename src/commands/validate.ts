/**
 * validate 命令 - 验证所有数据定义
 */

import { ItemDiscovery } from '../utils/item-discovery.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { TableParser } from '../core/parsers/table-parser.js';
import { TableValidator } from '../core/validators/table-validator.js';
import chalk from 'chalk';

export interface ValidateOptions {
  type?: 'table' | 'metric' | 'all';
  json?: boolean;
  verbose?: boolean;
}

export async function validateCommand(options: ValidateOptions = {}): Promise<void> {
  const type = options.type || 'all';
  
  console.log(chalk.blue('🔍 开始验证数据定义...\n'));

  const results = {
    tables: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [] as any[],
    },
    metrics: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [] as any[],
    },
  };

  // 验证表定义
  if (type === 'table' || type === 'all') {
    await validateTables(results.tables, options);
  }

  // 验证指标定义
  if (type === 'metric' || type === 'all') {
    await validateMetrics(results.metrics, options);
  }

  // 输出结果
  if (options.json) {
    outputJSON(results);
  } else {
    outputFriendly(results, options);
  }

  // 退出码
  const totalFailed = results.tables.failed + results.metrics.failed;
  if (totalFailed > 0) {
    process.exit(1);
  }
}

/**
 * 验证所有表定义
 */
async function validateTables(
  results: { total: number; passed: number; failed: number; warnings: number; errors: any[] },
  options: ValidateOptions
): Promise<void> {
  const tables = await ItemDiscovery.discoverTables();
  results.total = tables.length;

  if (tables.length === 0) {
    return;
  }

  const parser = new TableParser();
  const validator = new TableValidator();

  for (const tableName of tables) {
    const filePath = ItemDiscovery.getTablePath(tableName);
    
    try {
      // 读取并解析
      const content = await FileSystemUtils.readFile(filePath);
      const tableDefinition = parser.parse(content);
      
      // 验证
      const validationResult = validator.validate(tableDefinition);
      
      if (validationResult.valid) {
        results.passed++;
        if (!options.json) {
          console.log(chalk.green(`✓ ${tableName}`));
        }
      } else {
        results.failed++;
        if (!options.json) {
          console.log(chalk.red(`✗ ${tableName}`));
        }
        
        results.errors.push({
          name: tableName,
          type: 'table',
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        });
      }
      
      results.warnings += validationResult.warnings.length;
      
      // 详细输出
      if (options.verbose && !options.json) {
        if (validationResult.errors.length > 0) {
          validationResult.errors.forEach(err => {
            console.log(chalk.red(`  ✗ ${err.message}`));
            if (err.path) {
              console.log(chalk.gray(`    位置: ${err.path}`));
            }
          });
        }
        
        if (validationResult.warnings.length > 0) {
          validationResult.warnings.forEach(warn => {
            console.log(chalk.yellow(`  ⚠ ${warn.message}`));
            if (warn.path) {
              console.log(chalk.gray(`    位置: ${warn.path}`));
            }
          });
        }
      }
    } catch (error: any) {
      results.failed++;
      if (!options.json) {
        console.log(chalk.red(`✗ ${tableName} - 解析失败: ${error.message}`));
      }
      
      results.errors.push({
        name: tableName,
        type: 'table',
        parseError: error.message,
      });
    }
  }
}

/**
 * 验证所有指标定义
 */
async function validateMetrics(
  results: { total: number; passed: number; failed: number; warnings: number; errors: any[] },
  _options: ValidateOptions
): Promise<void> {
  const metrics = await ItemDiscovery.discoverMetrics();
  results.total = metrics.length;

  // TODO: 实现指标验证
  // 当前跳过
}

/**
 * JSON 输出
 */
function outputJSON(results: any): void {
  const output = {
    status: results.tables.failed + results.metrics.failed === 0 ? 'success' : 'failed',
    data: {
      tables: {
        total: results.tables.total,
        passed: results.tables.passed,
        failed: results.tables.failed,
        warnings: results.tables.warnings,
      },
      metrics: {
        total: results.metrics.total,
        passed: results.metrics.passed,
        failed: results.metrics.failed,
        warnings: results.metrics.warnings,
      },
    },
    errors: [...results.tables.errors, ...results.metrics.errors],
    timestamp: new Date().toISOString(),
  };
  
  console.log(JSON.stringify(output, null, 2));
}

/**
 * 友好输出
 */
function outputFriendly(results: any, options: ValidateOptions): void {
  console.log();
  console.log(chalk.cyan('━'.repeat(60)));
  console.log(chalk.cyan('验证结果汇总\n'));
  
  if (results.tables.total > 0) {
    console.log(chalk.white('表定义:'));
    console.log(chalk.white(`  总数: ${results.tables.total}`));
    console.log(chalk.green(`  通过: ${results.tables.passed}`));
    if (results.tables.failed > 0) {
      console.log(chalk.red(`  失败: ${results.tables.failed}`));
    }
    if (results.tables.warnings > 0) {
      console.log(chalk.yellow(`  警告: ${results.tables.warnings}`));
    }
    console.log();
  }
  
  if (results.metrics.total > 0) {
    console.log(chalk.white('指标定义:'));
    console.log(chalk.white(`  总数: ${results.metrics.total}`));
    console.log(chalk.green(`  通过: ${results.metrics.passed}`));
    if (results.metrics.failed > 0) {
      console.log(chalk.red(`  失败: ${results.metrics.failed}`));
    }
    if (results.metrics.warnings > 0) {
      console.log(chalk.yellow(`  警告: ${results.metrics.warnings}`));
    }
    console.log();
  }
  
  const totalFailed = results.tables.failed + results.metrics.failed;
  
  if (totalFailed === 0) {
    console.log(chalk.green('✅ 所有定义验证通过！'));
  } else {
    console.log(chalk.red(`❌ ${totalFailed} 个定义验证失败`));
    
    if (!options.verbose) {
      console.log(chalk.gray('\n提示：使用 --verbose 选项查看详细错误信息'));
    }
  }
  
  console.log(chalk.cyan('━'.repeat(60)));
  console.log();
}
