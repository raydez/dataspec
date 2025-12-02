/**
 * Slash Command Configurator 基类
 * 用于为不同的 AI 工具生成 slash 命令文件
 */

export type CommandId = 'init' | 'define' | 'generate' | 'validate' | 'publish';

export interface SlashCommandTarget {
  id: CommandId;
  path: string;
  kind: 'slash';
}

/**
 * 抽象基类：定义所有 AI 工具适配器的通用接口
 */
export abstract class SlashCommandConfigurator {
  /** 工具唯一标识符 */
  abstract readonly toolId: string;
  
  /** 工具显示名称 */
  abstract readonly toolName: string;
  
  /** 工具是否可用 */
  abstract readonly isAvailable: boolean;

  /**
   * 获取所有命令的目标路径和配置
   */
  getTargets(): SlashCommandTarget[] {
    const CORE_COMMANDS: CommandId[] = ['init', 'define', 'generate', 'validate', 'publish'];
    
    return CORE_COMMANDS.map((id) => ({
      id,
      path: this.getCommandPath(id),
      kind: 'slash' as const
    }));
  }

  /**
   * 生成所有命令文件
   * @param projectPath 项目根路径
   * @returns 生成的文件路径列表
   */
  async generateAll(projectPath: string): Promise<string[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const generatedFiles: string[] = [];

    for (const target of this.getTargets()) {
      const content = this.generateCommandContent(target.id);
      const fullPath = path.join(projectPath, target.path);
      
      // 确保目录存在
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // 写入文件
      await fs.writeFile(fullPath, content, 'utf-8');
      
      generatedFiles.push(target.path);
    }

    return generatedFiles;
  }

  /**
   * 生成单个命令的完整内容
   */
  protected generateCommandContent(commandId: CommandId): string {
    const template = this.getTemplate(commandId);
    const frontmatter = this.getFrontmatter(commandId);
    
    if (frontmatter) {
      return `${frontmatter}\n\n${template}`;
    }
    
    return template;
  }

  /**
   * 获取命令文件的相对路径
   * 子类必须实现，返回特定工具的命令文件路径
   */
  protected abstract getCommandPath(id: CommandId): string;

  /**
   * 获取命令的 frontmatter（YAML 元数据）
   * 子类必须实现，返回特定工具需要的元数据
   */
  protected abstract getFrontmatter(id: CommandId): string | undefined;

  /**
   * 获取命令的模板内容
   * 子类必须实现，返回命令的 Markdown 内容
   */
  protected abstract getTemplate(id: CommandId): string;
}
