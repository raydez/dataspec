/**
 * TableParser - 表定义 Markdown 解析器
 */

import { TableDefinition, FieldDefinition } from '../schemas/table.schema.js';

export class TableParser {
  /**
   * 解析表定义 Markdown 文件
   */
  parse(content: string): TableDefinition {
    return {
      metadata: this.extractMetadata(content),
      name: this.extractTableName(content),
      displayName: this.extractValue(content, '中文名'),
      description: this.extractDescription(content),
      owner: this.extractValue(content, '负责人'),
      updateFrequency: this.extractUpdateFrequency(content),
      fields: this.extractFields(content),
      partitionKeys: this.extractPartitionKeys(content),
      indexes: this.extractIndexes(content),
      dataSources: this.extractDataSources(content),
      consumers: this.extractConsumers(content),
      qualityRules: this.extractQualityRules(content),
    };
  }

  /**
   * 提取元数据
   */
  private extractMetadata(_content: string): { format: 'dataspec-table'; version: string } {
    // 查找标记区域（未来可用于版本检测）
    return {
      format: 'dataspec-table',
      version: '1.0',
    };
  }

  /**
   * 提取表名
   */
  private extractTableName(content: string): string {
    // 从标题提取：# 表定义：dw.sales_daily
    const match = content.match(/^#\s+表定义[：:]\s*([a-z_]+\.[a-z_]+)/m);
    if (!match) {
      throw new Error('未找到表名');
    }
    return match[1].trim();
  }

  /**
   * 提取描述
   */
  private extractDescription(content: string): string {
    // 在基本信息后面查找描述段落
    const descMatch = content.match(/##\s*表描述[\s\S]*?\n\n([\s\S]*?)(?=\n##|\n---|\n```|$)/);
    if (descMatch) {
      return descMatch[1].trim();
    }
    
    // 如果没有专门的描述章节，从基本信息中提取
    const basicMatch = content.match(/##\s*基本信息[\s\S]*?-\s*\*\*描述[：:]\*\*\s*(.+)/);
    if (basicMatch) {
      return basicMatch[1].trim();
    }
    
    return '';
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
    // 移除 [请填写] 等占位符
    value = value.replace(/\[请填写\]/g, '').trim();
    
    return value;
  }

  /**
   * 提取更新频率
   */
  private extractUpdateFrequency(content: string): 'realtime' | 'hourly' | 'daily' | 'weekly' {
    const value = this.extractValue(content, '更新频率').toLowerCase();
    
    if (value.includes('realtime') || value.includes('实时')) return 'realtime';
    if (value.includes('hourly') || value.includes('小时')) return 'hourly';
    if (value.includes('weekly') || value.includes('周')) return 'weekly';
    
    return 'daily'; // 默认
  }

  /**
   * 提取字段定义
   */
  private extractFields(content: string): FieldDefinition[] {
    // 查找字段定义表格
    const tableMatch = content.match(/##\s*字段定义[\s\S]*?\n(\|[\s\S]*?)(?=\n##|\n---|\n>|\n\n[^|])/);
    if (!tableMatch) {
      return [];
    }

    const tableContent = tableMatch[1];
    const lines = tableContent.split('\n').filter(line => line.trim());
    
    // 跳过表头和分隔线
    const dataLines = lines.slice(2).filter(line => !line.includes('---'));
    
    const fields: FieldDefinition[] = [];
    
    for (const line of dataLines) {
      const cols = line.split('|').map(c => c.trim()).filter(Boolean);
      
      if (cols.length < 3) {
        continue;
      }

      fields.push({
        name: cols[0] || '',
        type: cols[1] || 'STRING',
        description: cols[2] || '',
        nullable: cols[3] !== '是',
        example: cols[4] || undefined,
      });
    }
    
    return fields;
  }

  /**
   * 提取分区字段
   */
  private extractPartitionKeys(content: string): string[] | undefined {
    const match = content.match(/##\s*分区字段[\s\S]*?-\s*\*\*分区键[：:]\*\*\s*(.+)/);
    if (!match) {
      return undefined;
    }
    
    const keys = match[1].trim().split(/[,，、]/).map(k => k.trim()).filter(Boolean);
    return keys.length > 0 ? keys : undefined;
  }

  /**
   * 提取索引
   */
  private extractIndexes(content: string): string[] | undefined {
    const match = content.match(/##\s*索引[\s\S]*?-\s*(.+)/);
    if (!match) {
      return undefined;
    }
    
    const indexes = match[1].trim().split(/[,，、]/).map(i => i.trim()).filter(Boolean);
    return indexes.length > 0 ? indexes : undefined;
  }

  /**
   * 提取数据来源
   */
  private extractDataSources(content: string): string[] {
    const value = this.extractValue(content, '数据来源');
    if (!value) {
      return [];
    }
    
    // 分割多个数据源
    const sources = value.split(/[,，、\n]/)
      .map(s => s.trim())
      .filter(s => s && !s.includes('[请填写]'));
    
    return sources.length > 0 ? sources : ['未指定'];
  }

  /**
   * 提取下游消费
   */
  private extractConsumers(content: string): string[] | undefined {
    const match = content.match(/##\s*下游消费[\s\S]*?(?:\n-\s*(.+))+/);
    if (!match) {
      return undefined;
    }
    
    const consumers = match[0]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(Boolean);
    
    return consumers.length > 0 ? consumers : undefined;
  }

  /**
   * 提取数据质量规则
   */
  private extractQualityRules(content: string): string[] | undefined {
    const match = content.match(/##\s*数据质量规则[\s\S]*?(?:\n-\s*(.+))+/);
    if (!match) {
      return undefined;
    }
    
    const rules = match[0]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line && !line.includes('[请填写]'));
    
    return rules.length > 0 ? rules : undefined;
  }
}
