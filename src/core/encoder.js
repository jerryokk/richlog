/**
 * RichLog 编码器
 * 将数据编码为 RICHLOG 格式
 */

// 使用兼容浏览器的方式生成随机值
const getRandomValues = () => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // 浏览器环境
    return crypto.getRandomValues(new Uint8Array(4));
  } else if (typeof require !== 'undefined') {
    // Node.js 环境
    try {
      const nodeCrypto = require('crypto');
      return nodeCrypto.randomBytes(4);
    } catch (e) {
      // 如果 require 失败
      console.warn('无法加载 crypto 模块');
    }
  }
  
  // 降级方法
  const arr = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
};

class RichLogEncoder {
  /**
   * 生成唯一的 UUID
   * @returns {string} - 8 个字符的唯一标识符
   */
  static generateUUID() {
    const randomBytes = getRandomValues();
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * 将字符串转换为十六进制表示
   * @param {string} str - 要转换的字符串
   * @returns {string} - 十六进制字符串
   */
  static stringToHex(str) {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const hexValue = charCode.toString(16);
      hex += hexValue.padStart(2, '0');
    }
    return hex;
  }
  
  /**
   * 将二进制数据转换为十六进制表示
   * @param {Buffer|Uint8Array} data - 二进制数据
   * @returns {string} - 十六进制字符串
   */
  static binaryToHex(data) {
    if (data instanceof Buffer) {
      return data.toString('hex');
    } else if (data instanceof Uint8Array) {
      return Array.from(data)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      throw new Error('数据必须是 Buffer 或 Uint8Array 类型');
    }
  }
  
  /**
   * 将 Base64 字符串转换为十六进制表示
   * @param {string} base64 - Base64 编码的字符串
   * @returns {string} - 十六进制字符串
   */
  static base64ToHex(base64) {
    const binary = atob(base64);
    return Array.from(binary)
      .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * 将数据编码为 RICHLOG 格式的日志行数组
   * @param {string} type - 数据类型
   * @param {string|Buffer|Uint8Array} data - 要编码的数据
   * @param {Object} options - 编码选项
   * @param {number} options.chunkSize - 每个片段的最大十六进制字符数，默认为 1000
   * @param {string} options.uuid - 指定 UUID，如果未提供则自动生成
   * @returns {Array<string>} - RICHLOG 格式的日志行数组
   */
  static encodeData(type, data, options = {}) {
    const chunkSize = options.chunkSize || 1000;
    const uuid = options.uuid || this.generateUUID();
    
    // 将数据转换为十六进制
    let hexData;
    if (typeof data === 'string') {
      hexData = this.stringToHex(data);
    } else if (data instanceof Buffer || data instanceof Uint8Array) {
      hexData = this.binaryToHex(data);
    } else {
      throw new Error('数据必须是字符串、Buffer 或 Uint8Array 类型');
    }
    
    // 分割十六进制数据为多个片段
    const chunks = [];
    for (let i = 0; i < hexData.length; i += chunkSize) {
      chunks.push(hexData.substring(i, i + chunkSize));
    }
    
    // 生成 RICHLOG 格式的日志行
    const totalChunks = chunks.length;
    return chunks.map((chunk, index) => {
      const chunkIndex = index + 1;
      return `RICHLOG:${type},${uuid},${chunkIndex},${totalChunks},${chunk}`;
    });
  }
  
  /**
   * 将 JSON 对象编码为 RICHLOG 配置格式的日志行数组
   * @param {Object} configObject - JSON 配置对象
   * @param {Object} options - 编码选项
   * @returns {Array<string>} - RICHLOG 格式的日志行数组
   */
  static encodeConfig(configObject, options = {}) {
    const jsonString = JSON.stringify(configObject);
    return this.encodeData('config', jsonString, options);
  }
  
  /**
   * 将图片数据编码为 RICHLOG 图片格式的日志行数组
   * @param {Buffer|Uint8Array} imageData - 图片二进制数据
   * @param {Object} options - 编码选项
   * @returns {Array<string>} - RICHLOG 格式的日志行数组
   */
  static encodeImage(imageData, options = {}) {
    return this.encodeData('image', imageData, options);
  }
  
  /**
   * 将命令输出编码为 RICHLOG 命令格式的日志行数组
   * @param {string} commandOutput - 命令输出文本
   * @param {Object} options - 编码选项
   * @returns {Array<string>} - RICHLOG 格式的日志行数组
   */
  static encodeCommand(commandOutput, options = {}) {
    return this.encodeData('command', commandOutput, options);
  }
}

module.exports = RichLogEncoder;