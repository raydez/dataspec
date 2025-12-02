/**
 * Slash Command 注册中心
 * 管理所有可用的 slash commands
 */

import { CommandDefinition, CommandCategory, CommandContext, CommandResult } from './types.js';

export class CommandRegistry {
  private commands: Map<string, CommandDefinition> = new Map();
  private categories: Map<CommandCategory, CommandDefinition[]> = new Map();

  /**
   * 注册一个新的命令
   */
  register(command: CommandDefinition): void {
    if (this.commands.has(command.id)) {
      console.warn(`Command ${command.id} is already registered. Overwriting...`);
    }

    this.commands.set(command.id, command);

    // 按分类组织
    const categoryCommands = this.categories.get(command.category) || [];
    categoryCommands.push(command);
    this.categories.set(command.category, categoryCommands);

    console.log(`✅ Registered command: ${command.id} (${command.category})`);
  }

  /**
   * 获取指定命令
   */
  get(commandId: string): CommandDefinition | undefined {
    return this.commands.get(commandId);
  }

  /**
   * 获取所有命令
   */
  getAll(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * 按分类获取命令
   */
  getByCategory(category: CommandCategory): CommandDefinition[] {
    return this.categories.get(category) || [];
  }

  /**
   * 搜索命令
   */
  search(query: string): CommandDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    const results: CommandDefinition[] = [];

    for (const command of this.commands.values()) {
      const aliases = command.aliases || [];
      const hasAliasMatch = aliases.some(alias => alias.toLowerCase().includes(lowercaseQuery));
      
      const matches = [
        command.id.includes(lowercaseQuery),
        command.name.toLowerCase().includes(lowercaseQuery),
        command.description.toLowerCase().includes(lowercaseQuery),
        hasAliasMatch
      ];

      if (matches.some(match => match)) {
        results.push(command);
      }
    }

    // 按匹配度排序
    return results.sort((a, b) => {
      const scoreA = this.calculateMatchScore(a, lowercaseQuery);
      const scoreB = this.calculateMatchScore(b, lowercaseQuery);
      return scoreB - scoreA;
    });
  }

  /**
   * 执行指定命令
   */
  async execute(
    commandId: string,
    args: string[] = [],
    options: Record<string, any> = {},
    context?: CommandContext
  ): Promise<CommandResult> {
    const command = this.get(commandId);
    if (!command) {
      return {
        success: false,
        message: `Unknown command: ${commandId}`,
        errors: [{
          code: 'COMMAND_NOT_FOUND',
          message: `Command '${commandId}' is not registered`,
          severity: 'error',
          suggestions: this.getSuggestions(commandId)
        }],
        executionTime: 0
      };
    }

    if (command.deprecated) {
      const alternatives = this.getAlternatives(command);
      return {
        success: false,
        message: `Deprecated command: ${commandId}`,
        errors: [{
          code: 'COMMAND_DEPRECATED',
          message: command.deprecatedMessage || `Command '${commandId}' is deprecated`,
          severity: 'warning'
        }],
        suggestions: alternatives.map(cmd => ({
          command: cmd,
          description: `Use ${cmd} instead`,
          reason: 'Alternative command'
        })),
        executionTime: 0
      };
    }

    try {
      const startTime = Date.now();
      const result = await command.handler(args, options, context || this.createDefaultContext());
      const executionTime = Date.now() - startTime;

      // 确保返回值包含 executionTime，如果 handler 已经返回了，使用 handler 的值
      return {
        ...result,
        executionTime: result.executionTime !== undefined ? result.executionTime : executionTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Command execution failed: ${error instanceof Error ? error.message : String(error)}`,
        errors: [{
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          severity: 'error',
          stack: error instanceof Error ? error.stack : undefined
        }],
        executionTime: 0
      };
    }
  }

  /**
   * 获取命令建议
   */
  private getSuggestions(commandId: string): string[] {
    const suggestions: string[] = [];
    const lowercaseCommandId = commandId.toLowerCase();

    for (const [id, cmd] of this.commands.entries()) {
      if (id !== commandId) {
        // 模糊匹配建议
        if (id.toLowerCase().includes(lowercaseCommandId) ||
            cmd.name.toLowerCase().includes(lowercaseCommandId)) {
          suggestions.push(`/${cmd.id}`);
        }
      }
    }

    return suggestions.slice(0, 3); // 限制建议数量
  }

  /**
   * 获取替代命令
   */
  private getAlternatives(deprecatedCommand: CommandDefinition): string[] {
    return this.getByCategory(deprecatedCommand.category)
      .filter(cmd => !cmd.deprecated)
      .map(cmd => `/${cmd.id}`)
      .slice(0, 3);
  }

  /**
   * 计算匹配分数
   */
  private calculateMatchScore(command: CommandDefinition, query: string): number {
    let score = 0;

    // ID 完全匹配
    if (command.id === query) score += 100;
    else if (command.id.includes(query)) score += 80;

    // 名称匹配
    const lowerName = command.name.toLowerCase();
    if (lowerName === query) score += 90;
    else if (lowerName.includes(query)) score += 70;

    // 描述匹配
    if (command.description.toLowerCase().includes(query)) score += 30;

    // 别名匹配
    if (command.aliases) {
      for (const alias of command.aliases) {
        if (alias.toLowerCase() === query) score += 95;
        else if (alias.toLowerCase().includes(query)) score += 75;
      }
    }

    return score;
  }

  /**
   * 创建默认上下文
   */
  private createDefaultContext(): CommandContext {
    return {
      currentDirectory: process.cwd(),
      config: {},
      tables: [],
      metrics: []
    };
  }

  /**
   * 获取命令统计信息
   */
  getStats(): {
    total: number;
    byCategory: Record<CommandCategory, number>;
    deprecated: number;
  } {
    const stats = {
      total: this.commands.size,
      byCategory: {} as Record<CommandCategory, number>,
      deprecated: 0
    };

    for (const cmd of this.commands.values()) {
      stats.byCategory[cmd.category] = (stats.byCategory[cmd.category] || 0) + 1;
      if (cmd.deprecated) stats.deprecated++;
    }

    return stats;
  }

  /**
   * 验证命令定义
   */
  validate(command: CommandDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.id || typeof command.id !== 'string') {
      errors.push('Command ID is required');
    }

    if (!command.name || typeof command.name !== 'string') {
      errors.push('Command name is required and must be a string');
    }

    if (!command.description || typeof command.description !== 'string') {
      errors.push('Command description is required and must be a string');
    }

    if (!command.category || !Object.values(['project', 'table', 'metric', 'generate', 'validate', 'search', 'config', 'help']).includes(command.category)) {
      errors.push('Invalid command category');
    }

    if (!command.handler || typeof command.handler !== 'function') {
      errors.push('Command handler is required');
    }

    if (!Array.isArray(command.parameters)) {
      errors.push('Command parameters must be an array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 全局命令注册表实例
export const commandRegistry = new CommandRegistry();