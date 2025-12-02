/**
 * Configurator 注册中心
 * 管理所有 AI 工具的 slash 命令适配器
 */

import { SlashCommandConfigurator } from './base.js';

export class ConfiguratorRegistry {
  private static configurators: Map<string, SlashCommandConfigurator> = new Map();

  /**
   * 注册一个 configurator
   */
  static register(configurator: SlashCommandConfigurator): void {
    this.configurators.set(configurator.toolId, configurator);
  }

  /**
   * 获取指定工具的 configurator
   */
  static get(toolId: string): SlashCommandConfigurator | undefined {
    return this.configurators.get(toolId);
  }

  /**
   * 获取所有已注册的 configurators
   */
  static getAll(): SlashCommandConfigurator[] {
    return Array.from(this.configurators.values());
  }

  /**
   * 获取所有可用的 configurators
   */
  static getAvailable(): SlashCommandConfigurator[] {
    return this.getAll().filter(c => c.isAvailable);
  }

  /**
   * 检查某个工具是否已注册
   */
  static has(toolId: string): boolean {
    return this.configurators.has(toolId);
  }

  /**
   * 获取已注册工具的数量
   */
  static count(): number {
    return this.configurators.size;
  }
}
