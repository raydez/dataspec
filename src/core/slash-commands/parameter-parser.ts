/**
 * Slash Commands 参数解析器
 * 解析和验证命令参数
 */

import { ParameterDefinition, ValidationRule } from './types.js';

export interface ParseResult {
  success: boolean;
  args: Record<string, any>;
  errors: ParseError[];
  warnings: ParseWarning[];
  unrecognizedArgs: string[];
}

export interface ParseError {
  parameter: string;
  message: string;
  code: string;
  value?: any;
}

export interface ParseWarning {
  parameter: string;
  message: string;
  value: any;
}

export class ParameterParser {
  /**
   * 解析命令行参数
   */
  static parse(
    args: string[],
    parameters: ParameterDefinition[],
    options: Record<string, any> = {}
  ): ParseResult {
    const result: ParseResult = {
      success: true,
      args: {},
      errors: [],
      warnings: [],
      unrecognizedArgs: []
    };

    // 直接解析传入的参数（不跳过第一个）
    const argsToParse = args;

    // 解析命名参数 (--param value) 和 (--param=value)
    let i = 0;
    while (i < argsToParse.length) {
      const arg = argsToParse[i];

      if (arg.startsWith('--')) {
        const parseResult = this.parseNamedArgument(arg, argsToParse, i, parameters, options);
        if (parseResult.error) {
          // 如果是未知参数，放入 unrecognizedArgs 而不是 errors
          if (parseResult.error.code === 'UNKNOWN_PARAMETER') {
            result.unrecognizedArgs.push(arg);
            i += 1;
          } else {
            result.errors.push(parseResult.error);
            i += parseResult.consumed || 1;
          }
        } else if (parseResult.warning) {
          result.warnings.push(parseResult.warning);
          i += parseResult.consumed || 1;
        } else if (parseResult.parsed) {
          Object.assign(result.args, parseResult.parsed);
          i += parseResult.consumed || 1;
        } else {
          i += parseResult.consumed || 1;
        }
      } else {
        // 位置参数
        result.unrecognizedArgs.push(arg);
        i++;
      }
    }

    // 应用默认值
    this.applyDefaultValues(result.args, parameters);

    // 验证必需参数
    this.validateRequiredParameters(result.args, parameters, result.errors);

    // 执行自定义验证规则
    this.validateParameters(result.args, parameters, result.errors);

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * 解析命名参数
   */
  private static parseNamedArgument(
    arg: string,
    _allArgs: string[],
    _currentIndex: number,
    parameters: ParameterDefinition[],
    _options: Record<string, any>
  ): {
    parsed?: Record<string, any>;
    consumed?: number;
    error?: ParseError;
    warning?: ParseWarning;
  } {
    // 移除 -- 前缀
    const cleanArg = arg.substring(2);

    // 检查是否包含等号 (--param=value)
    if (cleanArg.includes('=')) {
      const [name, value] = cleanArg.split('=', 2);
      return this.parseNameValuePair(name, value, parameters, _allArgs, _currentIndex);
    } else {
      // 布尔参数 (--flag)
      return this.parseBooleanFlag(cleanArg, parameters, _allArgs, _currentIndex);
    }
  }

  /**
   * 解析名称-值对
   */
  private static parseNameValuePair(
    name: string,
    value: string,
    parameters: ParameterDefinition[],
    allArgs: string[],
    currentIndex: number
  ): {
    parsed?: Record<string, any>;
    consumed?: number;
    error?: ParseError;
  } {
    // 将 kebab-case 转换为 camelCase
    const camelCaseName = this.toCamelCase(name);
    const paramDef = parameters.find(p => p.name === camelCaseName || p.name === name);

    if (!paramDef) {
      return {
        error: {
          parameter: name,
          message: `Unknown parameter: --${name}`,
          code: 'UNKNOWN_PARAMETER',
          value
        }
      };
    }

    try {
      const parsedValue = this.parseValue(value, paramDef);

      // 检查值是否在可选列表中
      if (paramDef.choices && paramDef.type === 'choice') {
        if (!paramDef.choices.includes(parsedValue)) {
          return {
            error: {
              parameter: name,
              message: `Value "${parsedValue}" is not in allowed choices: ${paramDef.choices.join(', ')}`,
              code: 'INVALID_CHOICE',
              value: parsedValue
            }
          };
        }
      }

      return {
        parsed: { [camelCaseName]: parsedValue },
        consumed: 1
      };
    } catch (error) {
      return {
        error: {
          parameter: camelCaseName,
          message: `Invalid value for parameter --${name}: ${error instanceof Error ? error.message : String(error)}`,
          code: 'INVALID_VALUE',
          value
        }
      };
    }
  }

  /**
   * 解析布尔标志或读取下一个参数作为值
   */
  private static parseBooleanFlag(
    name: string,
    parameters: ParameterDefinition[],
    allArgs: string[],
    currentIndex: number
  ): {
    parsed?: Record<string, any>;
    consumed?: number;
    error?: ParseError;
  } {
    // 检查是否是 --no-xxx 格式的否定布尔标志
    let isNegated = false;
    let actualName = name;
    if (name.startsWith('no-')) {
      isNegated = true;
      actualName = name.substring(3); // 移除 "no-" 前缀
    }
    
    // 将 kebab-case 转换为 camelCase
    const camelCaseName = this.toCamelCase(actualName);
    const paramDef = parameters.find(p => p.name === camelCaseName || p.name === actualName);

    if (!paramDef) {
      return {
        error: {
          parameter: name,
          message: `Unknown parameter: --${name}`,
          code: 'UNKNOWN_PARAMETER'
        }
      };
    }

    // 如果是布尔类型，直接返回 true/false
    if (paramDef.type === 'boolean') {
      return {
        parsed: { [camelCaseName]: !isNegated },
        consumed: 1
      };
    }

    // 否则，读取下一个参数作为值
    const nextIndex = currentIndex + 1;
    if (nextIndex >= allArgs.length) {
      return {
        error: {
          parameter: name,
          message: `Parameter --${name} requires a value`,
          code: 'MISSING_VALUE'
        }
      };
    }

    const value = allArgs[nextIndex];
    
    try {
      const parsedValue = this.parseValue(value, paramDef);
      
      // 检查值是否在可选列表中
      if (paramDef.choices && paramDef.type === 'choice') {
        if (!paramDef.choices.includes(parsedValue)) {
          return {
            error: {
              parameter: camelCaseName,
              message: `Value "${parsedValue}" is not in allowed choices: ${paramDef.choices.join(', ')}`,
              code: 'INVALID_VALUE',
              value: parsedValue
            }
          };
        }
      }
      
      return {
        parsed: { [camelCaseName]: parsedValue },
        consumed: 2  // 消耗两个参数：--name 和 value
      };
    } catch (error) {
      return {
        error: {
          parameter: camelCaseName,
          message: `Invalid value for parameter --${name}: ${error instanceof Error ? error.message : String(error)}`,
          code: 'INVALID_VALUE',
          value
        }
      };
    }
  }

  /**
   * 将 kebab-case 转换为 camelCase
   */
  private static toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * 解析值到指定类型
   */
  private static parseValue(value: string, paramDef: ParameterDefinition): any {
    switch (paramDef.type) {
      case 'string':
        return value;

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`"${value}" is not a valid number`);
        }
        return num;

      case 'boolean':
        if (value === 'true' || value === '1' || value === 'yes') {
          return true;
        } else if (value === 'false' || value === '0' || value === 'no') {
          return false;
        }
        throw new Error(`"${value}" is not a valid boolean value`);

      case 'choice':
        return value;

      case 'array':
        // 简单的逗号分隔解析
        return value.split(',').map(item => item.trim());

      case 'object':
        try {
          return JSON.parse(value);
        } catch {
          throw new Error(`"${value}" is not valid JSON`);
        }

      default:
        return value;
    }
  }

  /**
   * 应用默认值
   */
  private static applyDefaultValues(
    args: Record<string, any>,
    parameters: ParameterDefinition[]
  ): void {
    for (const paramDef of parameters) {
      if (!(paramDef.name in args) && paramDef.defaultValue !== undefined) {
        args[paramDef.name] = paramDef.defaultValue;
      }
    }
  }

  /**
   * 验证必需参数
   */
  private static validateRequiredParameters(
    args: Record<string, any>,
    parameters: ParameterDefinition[],
    errors: ParseError[]
  ): void {
    for (const paramDef of parameters) {
      if (paramDef.required && !(paramDef.name in args)) {
        errors.push({
          parameter: paramDef.name,
          message: `Required parameter --${paramDef.name} is missing`,
          code: 'REQUIRED_PARAMETER_MISSING'
        });
      }
    }
  }

  /**
   * 验证参数值
   */
  private static validateParameters(
    args: Record<string, any>,
    parameters: ParameterDefinition[],
    errors: ParseError[]
  ): void {
    for (const paramDef of parameters) {
      if (paramDef.name in args) {
        const value = args[paramDef.name];
        this.validateParameter(value, paramDef, errors);
      }
    }
  }

  /**
   * 验证单个参数
   */
  private static validateParameter(
    value: any,
    paramDef: ParameterDefinition,
    errors: ParseError[]
  ): void {
    if (!paramDef.validation) {
      return;
    }

    for (const rule of paramDef.validation) {
      const result = this.applyValidationRule(value, rule);
      if (!result.valid) {
        errors.push({
          parameter: paramDef.name,
          message: result.message || `Validation failed for --${paramDef.name}`,
          code: rule.type.toUpperCase(),
          value
        });
      }
    }
  }

  /**
   * 应用验证规则
   */
  private static applyValidationRule(
    value: any,
    rule: ValidationRule
  ): { valid: boolean; message?: string } {
    switch (rule.type) {
      case 'required':
        return {
          valid: value !== null && value !== undefined && value !== '',
          message: rule.message
        };

      case 'pattern':
        const regex = new RegExp(rule.value);
        return {
          valid: regex.test(String(value)),
          message: rule.message
        };

      case 'min':
        const numValue = Number(value);
        return {
          valid: !isNaN(numValue) && numValue >= rule.value,
          message: rule.message
        };

      case 'max':
        const numValueMax = Number(value);
        return {
          valid: !isNaN(numValueMax) && numValueMax <= rule.value,
          message: rule.message
        };

      case 'minLength':
        return {
          valid: String(value).length >= rule.value,
          message: rule.message
        };

      case 'maxLength':
        return {
          valid: String(value).length <= rule.value,
          message: rule.message
        };

      case 'custom':
        if (rule.custom) {
          const customResult = rule.custom(value);
          if (typeof customResult === 'boolean') {
            return {
              valid: customResult,
              message: !customResult ? rule.message : undefined
            };
          } else if (typeof customResult === 'string') {
            return {
              valid: false,
              message: customResult
            };
          }
        }
        return { valid: true };

      default:
        return { valid: true };
    }
  }

  /**
   * 生成参数帮助文本
   */
  static generateHelp(parameters: ParameterDefinition[]): string {
    let help = 'Parameters:\n\n';

    for (const paramDef of parameters) {
      const required = paramDef.required ? 'Required' : 'Optional';
      const defaultValue = paramDef.defaultValue !== undefined ? ` [default: ${paramDef.defaultValue}]` : '';
      const choices = paramDef.choices ? ` [choices: ${paramDef.choices.join(', ')}]` : '';

      help += `  --${paramDef.name.padEnd(20)} ${paramDef.type.padEnd(12)} ${required}${defaultValue}${choices}\n`;
      help += `    ${paramDef.description}\n`;

      if (paramDef.validation && paramDef.validation.length > 0) {
        help += `    Validation: ${paramDef.validation.map(v => v.type).join(', ')}\n`;
      }

      help += '\n';
    }

    return help;
  }

  /**
   * 检查是否缺少必需参数
   */
  static getMissingRequiredParameters(
    args: Record<string, any>,
    parameters: ParameterDefinition[]
  ): string[] {
    return parameters
      .filter(paramDef => paramDef.required && !(paramDef.name in args))
      .map(paramDef => `--${paramDef.name}`);
  }
}