/**
 * DataSpec - AI-native tool for data development teams
 * 
 * 主入口文件：导出核心 API 供外部程序使用
 */

// ============ 核心数据模型 ============
export * from './core/schemas/index.js';

// ============ 解析器 ============
export * from './core/parsers/index.js';

// ============ 验证器 ============
export * from './core/validators/index.js';

// ============ 代码生成器 ============
export * from './core/generators/index.js';

// ============ 模板 ============
export * from './core/templates/index.js';

// ============ 工具函数 ============
export * from './utils/index.js';

// ============ CLI 命令（可编程调用）============
export { initCommand } from './commands/init.js';
export type { InitOptions } from './commands/init.js';

export { validateCommand } from './commands/validate.js';
export type { ValidateOptions } from './commands/validate.js';

// ============ Slash Commands 系统 ============
// 注意：避免重复导出，使用显式导出
export {
  CommandRegistry,
  commandRegistry
} from './core/slash-commands/command-registry.js';

export {
  ParameterParser
} from './core/slash-commands/parameter-parser.js';

export type {
  CommandDefinition,
  CommandContext,
  CommandResult,
  ParameterDefinition,
  CommandCategory,
  ParameterType,
  ErrorSeverity,
  CommandExample,
  CommandSuggestion,
  CommandError,
  CommandHandler,
  SlashCommandRegistry,
  SlashTemplate,
  TemplateVariable,
  TemplateMetadata,
  AIIntegration,
  ClaudeCodeIntegration,
  SlashCommandConfig,
  IntegrationsConfig,
  TemplatesConfig,
  DataSpecConfig
} from './core/slash-commands/types.js';

export {
  ConfiguratorRegistry
} from './core/slash-commands/configurators/registry.js';

export type {
  SlashCommandConfigurator,
  CommandId,
  SlashCommandTarget
} from './core/slash-commands/configurators/base.js';
