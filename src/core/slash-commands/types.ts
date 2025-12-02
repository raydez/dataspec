/**
 * Slash Commands 类型定义
 */

export type ParameterType = 'string' | 'number' | 'boolean' | 'choice' | 'array' | 'object';

export type CommandCategory = 'project' | 'table' | 'metric' | 'generate' | 'validate' | 'search' | 'config' | 'help';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface CommandDefinition {
  // 基本信息
  id: string;
  name: string;
  description: string;
  category: CommandCategory;

  // 参数定义
  parameters: ParameterDefinition[];

  // 执行函数
  handler: CommandHandler;

  // 文档和示例
  examples: CommandExample[];
  aliases?: string[];
  notes?: string[];

  // 版本和兼容性
  version: string;
  deprecated?: boolean;
  deprecatedMessage?: string;

  // 执行配置
  requiresProject?: boolean;
  allowedInProject?: boolean;
  minArgs?: number;
  maxArgs?: number;
}

export interface ParameterDefinition {
  name: string;
  type: ParameterType;
  required: boolean;
  description: string;
  defaultValue?: any;
  choices?: string[];

  // 验证规则
  validation?: ValidationRule[];

  // 自动补全
  autocomplete?: AutocompleteConfig;
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'min' | 'max' | 'minLength' | 'maxLength' | 'custom';
  value?: any;
  message?: string;
  custom?: (value: any) => boolean | string;
}

export interface AutocompleteConfig {
  enabled: boolean;
  source?: 'static' | 'dynamic' | 'filesystem';
  options?: string[];
  minLength?: number;
}

export interface CommandExample {
  command: string;
  description: string;
  context?: string;
  expectedResult?: string;
}

export interface CommandContext {
  projectName?: string;
  projectType?: string;
  currentDirectory?: string;
  dialect?: string;
  config: any;
  tables?: string[];
  metrics?: string[];
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;

  // 详细信息
  details?: CommandResultDetails;

  // 建议操作
  suggestions?: CommandSuggestion[];

  // 错误信息
  errors?: CommandError[];

  // 执行统计
  executionTime: number;
}

export interface CommandResultDetails {
  filesCreated?: string[];
  filesModified?: string[];
  filesDeleted?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
  [key: string]: any;  // 允许任意额外字段
}

export interface CommandSuggestion {
  command: string;
  description: string;
  reason: string;
}

export interface CommandError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  suggestions?: string[];
  documentation?: string;
  stack?: string;
}

export interface CommandHandler {
  (args: string[], options: Record<string, any>, context: CommandContext): Promise<CommandResult>;
}

export interface SlashCommandRegistry {
  register(command: CommandDefinition): void;
  get(commandId: string): CommandDefinition | undefined;
  getAll(): CommandDefinition[];
  getByCategory(category: CommandCategory): CommandDefinition[];
  search(query: string): CommandDefinition[];
  execute(commandId: string, args: string[], options?: Record<string, any>): Promise<CommandResult>;
}

// 模板引擎相关类型
export interface SlashTemplate {
  command: string;
  template: string;
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'choice';
  required: boolean;
  description: string;
  validation?: ValidationRule[];
  defaultValue?: any;
}

export interface TemplateMetadata {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  tags?: string[];
  lastModified?: string;
}

// AI 工具集成相关类型
export interface AIIntegration {
  toolId: string;
  toolName: string;
  commandPrefix: string;
  configDir: string;
  autoGenerate: boolean;
  updateExisting: boolean;
  supported: boolean;
}

export interface ClaudeCodeIntegration extends AIIntegration {
  toolId: 'claude-code';
  toolName: 'Claude Code';
  commandPrefix: '/dataspec:';
  configDir: '.claude/commands';
}

// 项目配置相关类型
export interface SlashCommandConfig {
  enabled: boolean;
  defaultDialect: 'hive' | 'mysql' | 'clickhouse' | 'maxcompute';
  outputFormat: 'table' | 'json' | 'yaml';
  autoSave: boolean;
  showProgress: boolean;
  confirmDestructive: boolean;
}

export interface IntegrationsConfig {
  claudeCode: ClaudeCodeIntegration;
  cursor: AIIntegration;
  githubCopilot: AIIntegration;
  windsurf: AIIntegration;
}

export interface TemplatesConfig {
  customTemplatesDir: string;
  variableDelimiter: string;
  includeTimestamps: boolean;
}

export interface DataSpecConfig {
  version: string;
  projectName?: string;
  projectType?: string;

  // Slash Commands 配置
  slashCommands: SlashCommandConfig;

  // AI 工具集成
  integrations: IntegrationsConfig;

  // 模板配置
  templates: TemplatesConfig;
}