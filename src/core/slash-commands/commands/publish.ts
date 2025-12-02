/**
 * /dataspec:publish 命令实现
 * 发布表定义和变更到生产环境
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CommandDefinition, CommandContext, CommandResult } from '../types.js';
import { commandRegistry } from '../command-registry.js';

const PublishCommand: CommandDefinition = {
  id: 'publish',
  name: 'dataspec publish',
  description: 'Publish changes to production environment',
  category: 'generate',
  examples: [
    {
      command: '/dataspec:publish dw.sales_daily --dry-run',
      description: 'Preview changes without executing',
      context: 'Shows what will be changed'
    },
    {
      command: '/dataspec:publish dw.sales_daily --env staging',
      description: 'Publish to staging environment',
      context: 'Deploy to non-production environment first'
    },
    {
      command: '/dataspec:publish dw.sales_daily --force',
      description: 'Force publish with warnings',
      context: 'Skip confirmation prompts'
    }
  ],
  parameters: [
    {
      name: 'target',
      type: 'string',
      required: true,
      description: 'Target table or metric name'
    },
    {
      name: 'dryRun',
      type: 'boolean',
      required: false,
      description: 'Preview changes without executing',
      defaultValue: false
    },
    {
      name: 'force',
      type: 'boolean',
      required: false,
      description: 'Force publish even with warnings',
      defaultValue: false
    },
    {
      name: 'env',
      type: 'choice',
      required: false,
      description: 'Target environment',
      choices: ['dev', 'staging', 'prod'],
      defaultValue: 'dev'
    }
  ],
  handler: publishHandler,
  version: '0.2.0',
  requiresProject: true
};

interface PublishPlan {
  actions: PublishAction[];
  warnings: string[];
  breakingChanges: string[];
}

interface PublishAction {
  type: 'create' | 'alter' | 'drop';
  target: string;
  sql: string;
  description: string;
}

/**
 * Publish 命令处理函数
 */
async function publishHandler(
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

    const target = args[0];
    const { dryRun, force, env } = options;

    if (!target) {
      return {
        success: false,
        message: 'Target is required',
        errors: [{
          code: 'MISSING_TARGET',
          message: 'Please specify a table or metric name',
          severity: 'error'
        }],
        executionTime: Date.now() - startTime
      };
    }

    // Step 1: 预检查
    console.log(`\n🔍 Pre-flight checks for ${target}`);
    console.log('═'.repeat(80));
    
    const projectDir = context.currentDirectory || process.cwd();
    const tableDefPath = path.join(projectDir, 'dataspec', 'tables', `${target}.md`);
    
    // 检查定义是否存在
    try {
      await fs.access(tableDefPath);
      console.log('✅ Definition file found');
    } catch {
      return {
        success: false,
        message: `Definition not found for ${target}`,
        errors: [{
          code: 'DEFINITION_NOT_FOUND',
          message: `Table definition does not exist: ${tableDefPath}`,
          severity: 'error'
        }],
        executionTime: Date.now() - startTime
      };
    }

    // Step 2: 生成发布计划
    console.log('\n📋 Generating deployment plan...');
    const plan = await generatePublishPlan(target, tableDefPath, env);
    
    // Step 3: 显示变更
    console.log('\n📝 Planned Changes:');
    console.log('─'.repeat(80));
    
    for (const action of plan.actions) {
      const icon = action.type === 'create' ? '🆕' : 
                   action.type === 'alter' ? '🔄' : '🗑️';
      console.log(`${icon} ${action.type.toUpperCase()}: ${action.description}`);
      console.log(`   SQL: ${action.sql.substring(0, 100)}...`);
    }

    // Step 4: 显示警告
    if (plan.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of plan.warnings) {
        console.log(`   - ${warning}`);
      }
    }

    // Step 5: 显示破坏性变更
    if (plan.breakingChanges.length > 0) {
      console.log('\n🚨 Breaking Changes Detected:');
      for (const change of plan.breakingChanges) {
        console.log(`   - ${change}`);
      }
      
      if (!force) {
        const result: CommandResult = {
          success: false,
          message: 'Breaking changes detected, use --force to proceed',
          errors: [{
            code: 'BREAKING_CHANGES',
            message: 'Breaking changes require --force flag',
            severity: 'error'
          }],
          executionTime: Date.now() - startTime
        };
        (result as any).warnings = plan.breakingChanges.map(msg => ({ message: msg, code: 'BREAKING_CHANGE' }));
        return result;
      }
    }

    // Dry-run 模式
    if (dryRun) {
      console.log('\n✅ Dry-run completed (no changes made)');
      return {
        success: true,
        message: 'Dry-run completed successfully',
        details: {
          target,
          env,
          plan,
          dryRun: true
        },
        executionTime: Date.now() - startTime
      };
    }

    // Step 6: 执行发布（需要确认）
    console.log('\n❓ Ready to publish?');
    console.log('   Environment: ' + env);
    console.log('   Actions: ' + plan.actions.length);
    console.log('   Warnings: ' + plan.warnings.length);
    console.log('   Breaking Changes: ' + plan.breakingChanges.length);
    
    if (!force) {
      console.log('\n⚠️  This is a simulation. Actual publishing requires:');
      console.log('   1. Database connection');
      console.log('   2. Appropriate permissions');
      console.log('   3. User confirmation');
      console.log('\n   Use --dry-run to preview changes');
      console.log('   Use --force to skip confirmation (not recommended)');
    }

    // TODO: 实际的数据库操作
    console.log('\n🚧 Publishing (TODO: Implement actual DB operations)');

    return {
      success: true,
      message: `Publish plan generated for ${target} (TODO: Full implementation)`,
      details: {
        target,
        env,
        plan,
        dryRun,
        note: 'Full implementation requires database connection'
      },
      suggestions: [{
        command: `/dataspec:publish ${target} --dry-run`,
        description: 'Preview changes before publishing',
        reason: 'Safety check'
      }],
      executionTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      success: false,
      message: `Publish failed: ${error instanceof Error ? error.message : String(error)}`,
      errors: [{
        code: 'PUBLISH_FAILED',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
        stack: error instanceof Error ? error.stack : undefined
      }],
      executionTime: 0
    };
  }
}

/**
 * 生成发布计划
 */
async function generatePublishPlan(
  tableName: string,
  defPath: string,
  env: string
): Promise<PublishPlan> {
  // 读取定义
  await fs.readFile(defPath, 'utf-8');
  
  // 简化的计划生成
  const actions: PublishAction[] = [
    {
      type: 'create',
      target: tableName,
      sql: `CREATE TABLE IF NOT EXISTS ${tableName} (...)`,
      description: `Create table ${tableName}`
    }
  ];

  const warnings: string[] = [];
  const breakingChanges: string[] = [];

  // 检测可能的破坏性变更
  if (env === 'prod') {
    warnings.push('Publishing to production environment');
  }

  // TODO: 实际应该比较现有表结构和新定义
  // 检测列删除、类型变更等破坏性操作

  return {
    actions,
    warnings,
    breakingChanges
  };
}

// 注册命令
commandRegistry.register(PublishCommand);

export { PublishCommand, publishHandler };
