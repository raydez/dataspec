/**
 * Configurators 导出
 */

export * from './base.js';
export * from './registry.js';
export * from './templates.js';
export * from './claude.js';

import { ConfiguratorRegistry } from './registry.js';
import { ClaudeConfigurator } from './claude.js';

/**
 * 自动注册所有适配器
 * 目前仅支持 Claude Code，其他工具后续添加
 */
export function registerAllConfigurators(): void {
  ConfiguratorRegistry.register(new ClaudeConfigurator());
  // TODO: 后续添加更多工具
  // ConfiguratorRegistry.register(new CursorConfigurator());
  // ConfiguratorRegistry.register(new WindsurfConfigurator());
}

// 自动注册
registerAllConfigurators();
