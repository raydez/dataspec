/**
 * MetricParser - 指标定义 Markdown 解析器
 */

import { MetricDefinition } from '../schemas/metric.schema.js';

export class MetricParser {
  /**
   * 解析指标定义 Markdown 文件
   */
  parse(content: string): MetricDefinition {
    return {
      metadata: this.extractMetadata(content),
      name: this.extractMetricName(content),
      category: this.extractValue(content, '指标分类'),
      businessDefinition: this.extractBusinessDefinition(content),
      owner: this.extractValue(content, '业务口径负责人') || this.extractValue(content, '负责人'),
      formula: this.extractFormula(content),
      sqlLogic: this.extractSQLLogic(content),
      dataSource: this.extractValue(content, '主表') || this.extractValue(content, '数据来源'),
      dimensions: this.extractDimensions(content),
      relatedMetrics: this.extractRelatedMetrics(content),
      changeHistory: this.extractChangeHistory(content),
    };
  }

  /**
   * 提取元数据
   */
  private extractMetadata(_content: string): { format: 'dataspec-metric'; version: string } {
    return {
      format: 'dataspec-metric',
      version: '1.0',
    };
  }

  /**
   * 提取指标名称
   */
  private extractMetricName(content: string): string {
    const match = content.match(/^#\s+指标定义[：:]\s*(.+)/m);
    if (!match) {
      throw new Error('未找到指标名称');
    }
    return match[1].trim();
  }

  /**
   * 提取基本信息中的值
   */
  private extractValue(content: string, key: string): string {
    const pattern = new RegExp(`-\\s*\\*\\*${key}[：:]\\*\\*\\s*(.+)`, 'm');
    const match = content.match(pattern);
    if (!match) {
      return '';
    }
    
    let value = match[1].trim();
    value = value.replace(/\[请填写\]/g, '').trim();
    
    return value;
  }

  /**
   * 提取业务定义
   */
  private extractBusinessDefinition(content: string): string {
    const match = content.match(/##\s*业务定义[\s\S]*?\n\n([\s\S]*?)(?=\n##|\n---|\n```|$)/);
    if (!match) {
      return '';
    }
    return match[1].trim();
  }

  /**
   * 提取计算公式
   */
  private extractFormula(content: string): string {
    // 查找业务口径代码块
    const formulaMatch = content.match(/###\s*业务口径[\s\S]*?```[^\n]*\n([\s\S]*?)```/);
    if (formulaMatch) {
      return formulaMatch[1].trim();
    }
    
    // 查找计算公式代码块
    const codeMatch = content.match(/##\s*计算公式[\s\S]*?```[^\n]*\n([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    
    return '';
  }

  /**
   * 提取 SQL 逻辑
   */
  private extractSQLLogic(content: string): string | undefined {
    // 查找 SQL 逻辑代码块
    const match = content.match(/###\s*SQL\s*逻辑[\s\S]*?```sql\n([\s\S]*?)```/);
    if (!match) {
      // 尝试查找技术实现代码块
      const techMatch = content.match(/##\s*技术实现[\s\S]*?```sql\n([\s\S]*?)```/);
      if (techMatch) {
        return techMatch[1].trim();
      }
      return undefined;
    }
    return match[1].trim();
  }

  /**
   * 提取维度
   */
  private extractDimensions(content: string): string[] {
    const match = content.match(/##\s*维度[\s\S]*?(?:\n-\s*(.+))+/);
    if (!match) {
      return [];
    }
    
    const dimensions = match[0]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(Boolean);
    
    return dimensions;
  }

  /**
   * 提取相关指标
   */
  private extractRelatedMetrics(content: string): string[] | undefined {
    const match = content.match(/##\s*相关指标[\s\S]*?(?:\n-\s*(.+))+/);
    if (!match) {
      return undefined;
    }
    
    const metrics = match[0]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => {
        // 提取 Markdown 链接中的指标名
        const linkMatch = line.match(/\[(.+?)\]/);
        if (linkMatch) {
          return linkMatch[1];
        }
        return line.replace(/^-\s*/, '').trim();
      })
      .filter(Boolean);
    
    return metrics.length > 0 ? metrics : undefined;
  }

  /**
   * 提取变更历史
   */
  private extractChangeHistory(content: string): Array<{ date: string; description: string }> | undefined {
    const match = content.match(/##\s*变更历史[\s\S]*?(?:\n-\s*(.+))+/);
    if (!match) {
      return undefined;
    }
    
    const history = match[0]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => {
        const text = line.replace(/^-\s*/, '').trim();
        // 解析格式：YYYY-MM-DD: 描述
        const parts = text.split(/[：:]/);
        if (parts.length >= 2) {
          return {
            date: parts[0].trim(),
            description: parts.slice(1).join(':').trim(),
          };
        }
        return null;
      })
      .filter((item): item is { date: string; description: string } => item !== null);
    
    return history.length > 0 ? history : undefined;
  }
}
