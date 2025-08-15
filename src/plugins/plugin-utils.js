/**
 * 插件工具类
 * 提供插件通用的工具函数
 */

class PluginUtils {
  /**
   * 格式化 JSON 显示
   * @param {Object} json - JSON 对象
   * @param {number} indent - 缩进空格数，默认 2
   * @returns {string} - 格式化的 JSON 字符串
   */
  static formatJson(json, indent = 2) {
    try {
      return JSON.stringify(json, null, indent);
    } catch (error) {
      console.error('JSON 格式化失败:', error);
      return String(json);
    }
  }
  
  /**
   * 语法高亮 JSON
   * @param {string} jsonString - JSON 字符串
   * @returns {string} - 添加高亮 HTML 的 JSON 字符串
   */
  static highlightJson(jsonString) {
    // 简单替换规则，实际应用中可以使用专业库如 highlight.js
    return jsonString
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      });
  }
  
  /**
   * 将十六进制字符串转换为 UTF-8 字符串
   * @param {string} hexString - 十六进制字符串
   * @returns {string} - UTF-8 字符串
   */
  static hexToUtf8(hexString) {
    let result = '';
    for (let i = 0; i < hexString.length; i += 2) {
      result += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
    }
    return result;
  }
  
  /**
   * 将十六进制字符串转换为 Base64
   * @param {string} hexString - 十六进制字符串
   * @returns {string} - Base64 编码的字符串
   */
  static hexToBase64(hexString) {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i/2] = parseInt(hexString.substr(i, 2), 16);
    }
    
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  /**
   * 检测十六进制数据的 MIME 类型
   * @param {string} hexString - 十六进制字符串
   * @returns {string|null} - MIME 类型，如果无法检测则返回 null
   */
  static detectMimeType(hexString) {
    // 检查常见的文件头
    const signatures = {
      'ffd8ffe0': 'image/jpeg',
      'ffd8ffe1': 'image/jpeg',
      '89504e47': 'image/png',
      '47494638': 'image/gif',
      '25504446': 'application/pdf',
      '504b0304': 'application/zip'
    };
    
    // 获取文件头
    const header = hexString.substring(0, 8).toLowerCase();
    
    // 检查是否匹配已知签名
    for (const [signature, mimeType] of Object.entries(signatures)) {
      if (header.startsWith(signature)) {
        return mimeType;
      }
    }
    
    // 尝试检测文本类型
    try {
      const firstChars = PluginUtils.hexToUtf8(hexString.substring(0, 20));
      
      if (firstChars.startsWith('{') || firstChars.startsWith('[')) {
        return 'application/json';
      }
      
      if (firstChars.startsWith('<?xml') || firstChars.startsWith('<html')) {
        return 'text/xml';
      }
    } catch (e) {
      // 忽略错误，继续尝试其他检测方法
    }
    
    // 默认为二进制数据
    return 'application/octet-stream';
  }
  
  /**
   * 创建下载链接
   * @param {string} data - 数据 URL 或 Blob URL
   * @param {string} filename - 下载文件名
   * @returns {HTMLAnchorElement} - 下载链接元素
   */
  static createDownloadLink(data, filename) {
    const link = document.createElement('a');
    link.href = data;
    link.download = filename;
    link.classList.add('btn', 'btn-sm', 'btn-outline-secondary');
    link.innerHTML = '<i class="bi bi-download"></i> 下载';
    return link;
  }
  
  /**
   * 格式化字节大小
   * @param {number} bytes - 字节数
   * @param {number} decimals - 小数位数，默认 2
   * @returns {string} - 格式化的大小字符串
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  /**
   * 安全移除 HTML 标签
   * @param {string} html - 包含 HTML 的字符串
   * @returns {string} - 移除 HTML 标签后的纯文本
   */
  static stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  
  /**
   * 生成随机 ID
   * @param {string} prefix - ID 前缀
   * @returns {string} - 随机 ID
   */
  static generateId(prefix = 'el') {
    return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

module.exports = PluginUtils;