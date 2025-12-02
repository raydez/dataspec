/**
 * Cursor 适配器
 * 为 Cursor 生成 slash 命令文件
 */

import { SlashCommandConfigurator, CommandId } from './base.js';
import { COMMAND_TEMPLATES } from './templates.js';

export class CursorConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'cursor';
  readonly toolName = 'Cursor';
  readonly isAvailable = true;

  /**
   * Cursor 命令文件路径: .cursorrules/dataspec-{command}.mdc
   */
  protected getCommandPath(id: CommandId): string {
    return `.cursorrules/dataspec-${id}.mdc`;
  }

  /**
   * Cursor 不需要 frontmatter
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
