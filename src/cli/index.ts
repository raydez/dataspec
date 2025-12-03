#!/usr/bin/env node
/**
 * DataSpec CLI 主程序
 * 
 * 使用 Commander.js 管理所有命令
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from '../commands/init.js';
import { validateCommand } from '../commands/validate.js';

const program = new Command();

// 基本信息
program
  .name('dataspec')
  .description('AI-native tool for data development teams')
  .version('0.1.1');

// ============ init 命令 ============
program
  .command('init')
  .description('初始化 DataSpec 项目')
  .option('--project-name <name>', '项目名称')
  .option('--force', '强制重新初始化（覆盖已有文件）')
  .action(async (options) => {
    try {
      await initCommand({
        projectName: options.projectName,
        force: options.force,
      });
    } catch (error: any) {
      console.error(chalk.red(`\n❌ 初始化失败: ${error.message}`));
      process.exit(1);
    }
  });

// ============ validate 命令 ============
program
  .command('validate')
  .description('验证所有数据定义')
  .option('--type <type>', '验证类型 (table|metric|all)', 'all')
  .option('--json', '以 JSON 格式输出结果')
  .option('--verbose', '显示详细错误信息')
  .action(async (options) => {
    try {
      await validateCommand({
        type: options.type as 'table' | 'metric' | 'all',
        json: options.json,
        verbose: options.verbose,
      });
    } catch (error: any) {
      console.error(chalk.red(`\n❌ 验证失败: ${error.message}`));
      process.exit(1);
    }
  });

// ============ table 和 metric 命令 ============
// 注意：table 和 metric 的创建通过 AI 工具的 Slash commands 完成
// 使用 /dataspec:define table <name> 或 /dataspec:define metric <name>

// ============ 解析命令行参数 ============
program.parse();
