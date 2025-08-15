/**
 * RichLog 配置查看器插件
 */

const { PluginBase } = require('../index');
import './style.css';

class ConfigPlugin extends PluginBase {
  constructor() {
    super();
    this.configContainer = null;
    this.expandAllBtn = null;
    this.collapseAllBtn = null;
    this.downloadBtn = null;
    this.copyBtn = null;
    this.rawConfigData = null;
  }
  
  /**
   * 初始化插件
   */
  init() {
    // 获取容器元素
    this.configContainer = document.getElementById('config-container');
    this.expandAllBtn = document.getElementById('expand-all-btn');
    this.collapseAllBtn = document.getElementById('collapse-all-btn');
    this.downloadBtn = document.getElementById('download-btn');
    this.copyBtn = document.getElementById('copy-btn');
    
    // 初始化插件
    super.initialize(this.configContainer);
    
    // 添加按钮事件监听器
    this.expandAllBtn.addEventListener('click', () => this.expandAll());
    this.collapseAllBtn.addEventListener('click', () => this.collapseAll());
    this.downloadBtn.addEventListener('click', () => this.downloadConfig());
    this.copyBtn.addEventListener('click', () => this.copyToClipboard());
    
    // 加载数据
    this.loadData();
  }
  
  /**
   * 设置窗口标题
   */
  setWindowTitle() {
    document.title = 'RichLog 配置查看器';
  }
  
  /**
   * 渲染配置内容
   */
  renderContent() {
    if (!this.data || !this.data.data) {
      this.showError('无效的配置数据');
      return;
    }
    
    try {
      // 保存原始配置数据
      this.rawConfigData = this.data.data;
      
      // 检查数据类型
      let configData;
      if (typeof this.rawConfigData === 'string') {
        // 尝试将字符串解析为 JSON
        try {
          configData = JSON.parse(this.rawConfigData);
        } catch (error) {
          // 如果不是 JSON，直接显示文本
          this.renderTextConfig(this.rawConfigData);
          return;
        }
      } else {
        // 已经是对象，直接使用
        configData = this.rawConfigData;
      }
      
      // 渲染 JSON 配置
      this.renderJsonConfig(configData);
      
    } catch (error) {
      console.error('渲染配置数据失败:', error);
      this.showError(`渲染配置失败: ${error.message}`);
    }
  }
  
  /**
   * 渲染文本配置
   * @param {string} text - 配置文本
   */
  renderTextConfig(text) {
    this.configContainer.innerHTML = `
      <pre>${text}</pre>
    `;
  }
  
  /**
   * 渲染 JSON 配置
   * @param {Object} json - 配置对象
   */
  renderJsonConfig(json) {
    // 创建可折叠的 JSON 树
    const jsonHtml = this.createCollapsibleJson(json);
    
    // 设置内容
    this.configContainer.innerHTML = `
      <pre id="json-content">${jsonHtml}</pre>
    `;
    
    // 添加折叠切换事件
    document.querySelectorAll('.collapse-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const content = e.target.nextElementSibling;
        if (content && content.classList.contains('collapsible-content')) {
          if (content.style.display === 'none') {
            content.style.display = 'block';
            e.target.textContent = e.target.textContent.replace('▶', '▼');
          } else {
            content.style.display = 'none';
            e.target.textContent = e.target.textContent.replace('▼', '▶');
          }
        }
      });
    });
  }
  
  /**
   * 创建可折叠的 JSON 表示
   * @param {Object} obj - JSON 对象
   * @param {number} level - 当前嵌套级别
   * @returns {string} - HTML 表示
   */
  createCollapsibleJson(obj, level = 0) {
    if (obj === null) {
      return '<span class="json-null">null</span>';
    }
    
    if (typeof obj !== 'object') {
      if (typeof obj === 'string') {
        return `<span class="json-string">"${this.escapeHtml(obj)}"</span>`;
      } else if (typeof obj === 'number') {
        return `<span class="json-number">${obj}</span>`;
      } else if (typeof obj === 'boolean') {
        return `<span class="json-boolean">${obj}</span>`;
      } else {
        return `<span>${this.escapeHtml(String(obj))}</span>`;
      }
    }
    
    const isArray = Array.isArray(obj);
    const isEmpty = Object.keys(obj).length === 0;
    
    if (isEmpty) {
      return isArray ? '[]' : '{}';
    }
    
    const indent = '  '.repeat(level);
    const childIndent = '  '.repeat(level + 1);
    const collapsed = level > 0; // 嵌套级别大于 0 的默认折叠
    
    let html = isArray ? '[' : '{';
    
    if (!isEmpty) {
      html += `<span class="collapse-toggle">${collapsed ? '▶' : '▼'}</span>`;
      html += `<div class="collapsible-content" style="display: ${collapsed ? 'none' : 'block'}">`;
      
      let first = true;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (!first) html += ',';
          html += '\n' + childIndent;
          
          if (!isArray) {
            html += `<span class="json-key">"${this.escapeHtml(key)}"</span>: `;
          }
          
          html += this.createCollapsibleJson(obj[key], level + 1);
          first = false;
        }
      }
      
      html += '\n' + indent + `</div>`;
    }
    
    html += isArray ? ']' : '}';
    return html;
  }
  
  /**
   * HTML 转义
   * @param {string} text - 要转义的文本
   * @returns {string} - 转义后的文本
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
  
  /**
   * 展开所有折叠项
   */
  expandAll() {
    document.querySelectorAll('.collapsible-content').forEach(content => {
      content.style.display = 'block';
    });
    
    document.querySelectorAll('.collapse-toggle').forEach(toggle => {
      toggle.textContent = toggle.textContent.replace('▶', '▼');
    });
  }
  
  /**
   * 折叠所有项
   */
  collapseAll() {
    document.querySelectorAll('.collapsible-content').forEach(content => {
      if (content.parentElement.id !== 'json-content') { // 保持顶层展开
        content.style.display = 'none';
      }
    });
    
    document.querySelectorAll('.collapse-toggle').forEach(toggle => {
      if (toggle.parentElement.id !== 'json-content') { // 保持顶层展开
        toggle.textContent = toggle.textContent.replace('▼', '▶');
      }
    });
  }
  
  /**
   * 下载配置
   */
  downloadConfig() {
    if (!this.rawConfigData) return;
    
    try {
      let content;
      let filename;
      
      if (typeof this.rawConfigData === 'string') {
        content = this.rawConfigData;
        filename = 'config.txt';
      } else {
        content = JSON.stringify(this.rawConfigData, null, 2);
        filename = 'config.json';
      }
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('下载配置失败:', error);
      alert('下载配置失败');
    }
  }
  
  /**
   * 复制到剪贴板
   */
  copyToClipboard() {
    if (!this.rawConfigData) return;
    
    try {
      let content;
      
      if (typeof this.rawConfigData === 'string') {
        content = this.rawConfigData;
      } else {
        content = JSON.stringify(this.rawConfigData, null, 2);
      }
      
      navigator.clipboard.writeText(content)
        .then(() => {
          // 显示复制成功提示
          this.copyBtn.innerHTML = '<i class="bi bi-check"></i> 已复制';
          setTimeout(() => {
            this.copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> 复制';
          }, 2000);
        })
        .catch(err => {
          console.error('复制失败:', err);
          alert('复制到剪贴板失败');
        });
        
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
      alert('复制到剪贴板失败');
    }
  }
}

// 页面加载时初始化插件
document.addEventListener('DOMContentLoaded', () => {
  const plugin = new ConfigPlugin();
  plugin.init();
});