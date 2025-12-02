/**
 * 项目资源发现工具
 * 用于查找和列举表定义、指标定义等
 */

import path from 'path';
import { promises as fs } from 'fs';
import { FileSystemUtils } from './file-system.js';

export interface DiscoveryOptions {
  baseDir?: string;
  pattern?: RegExp;
}

export class ItemDiscovery {
  /**
   * 发现所有表定义
   */
  static async discoverTables(options: DiscoveryOptions = {}): Promise<string[]> {
    const baseDir = options.baseDir || 'dataspec/tables';
    
    if (!await FileSystemUtils.directoryExists(baseDir)) {
      return [];
    }
    
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const tables = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => path.basename(entry.name, '.md'));
    
    return tables;
  }

  /**
   * 发现所有指标定义
   */
  static async discoverMetrics(options: DiscoveryOptions = {}): Promise<string[]> {
    const baseDir = options.baseDir || 'dataspec/metrics';
    
    if (!await FileSystemUtils.directoryExists(baseDir)) {
      return [];
    }
    
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const metrics = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => path.basename(entry.name, '.md'));
    
    return metrics;
  }

  /**
   * 发现所有稽核规则
   */
  static async discoverChecks(options: DiscoveryOptions = {}): Promise<string[]> {
    const baseDir = options.baseDir || 'dataspec/checks';
    
    if (!await FileSystemUtils.directoryExists(baseDir)) {
      return [];
    }
    
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const checks = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.check.md'))
      .map(entry => path.basename(entry.name, '.check.md'));
    
    return checks;
  }

  /**
   * 获取表定义文件路径
   */
  static getTablePath(tableName: string): string {
    return path.join('dataspec/tables', `${tableName}.md`);
  }

  /**
   * 获取指标定义文件路径
   */
  static getMetricPath(metricName: string): string {
    return path.join('dataspec/metrics', `${metricName}.md`);
  }

  /**
   * 获取稽核规则文件路径
   */
  static getCheckPath(tableName: string): string {
    return path.join('dataspec/checks', `${tableName}.check.md`);
  }
}
