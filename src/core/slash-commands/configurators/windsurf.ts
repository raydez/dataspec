/**
 * Windsurf 适配器
 * 为 Windsurf AI 生成 slash 命令文件
 */

import { SlashCommandConfigurator, CommandId } from './base.js';
import { COMMAND_TEMPLATES } from './templates.js';

export class WindsurfConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'windsurf';
  readonly toolName = 'Windsurf';
  readonly isAvailable = true;

  /**
   * Windsurf 命令文件路径: .windsurf/commands/dataspec-{command}.md
   */
  protected getCommandPath(id: CommandId): string {
    return `.windsurf/commands/dataspec-${id}.md`;
  }

  /**
   * Windsurf 不需要 frontmatter
   */
  protected getFrontmatter(_id: CommandId): string | undefined {
    return undefined;
  }

  /**
   * 获取命令模板内容
   */
  protected getTemplate(id: CommandId): string {
    return COMMAND_TEMPLATES[id];
  }
}
