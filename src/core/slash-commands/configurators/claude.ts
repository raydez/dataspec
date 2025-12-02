/**
 * Claude Code 适配器
 * 为 Claude Code 生成 slash 命令文件
 */

import { SlashCommandConfigurator, CommandId } from './base.js';
import { COMMAND_DESCRIPTIONS, COMMAND_TEMPLATES } from './templates.js';

export class ClaudeConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'claude-code';
  readonly toolName = 'Claude Code';
  readonly isAvailable = true;

  /**
   * Claude Code 命令文件路径: .claude/commands/dataspec-{command}.md
   */
  protected getCommandPath(id: CommandId): string {
    return `.claude/commands/dataspec-${id}.md`;
  }

  /**
   * Claude Code 需要 YAML frontmatter
   */
  protected getFrontmatter(id: CommandId): string {
    return `---
description: ${COMMAND_DESCRIPTIONS[id]}
---`;
  }

  /**
   * 获取命令模板内容
   */
  protected getTemplate(id: CommandId): string {
    return COMMAND_TEMPLATES[id];
  }
}
