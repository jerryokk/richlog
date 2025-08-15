/**
 * 插件处理器
 * 处理数据与插件之间的通信和数据转换
 */

const { PluginRegistry } = require('../plugins');

class PluginHandler {
  constructor(pluginRegistry = null) {
    // 使用传入的插件注册表实例，如果没有则创建新的
    this.pluginRegistry = pluginRegistry || new PluginRegistry();
  }

  /**
   * 检查是否支持指定的数据类型
   * @param {string} type - 数据类型
   * @returns {boolean} - 是否支持该类型
   */
  isTypeSupported(type) {
    return this.pluginRegistry.isTypeSupported(type);
  }
  
  /**
   * 获取指定类型插件的 URL
   * @param {string} type - 数据类型
   * @returns {string|null} - 插件 URL，不支持则返回 null
   */
  getPluginUrl(type) {
    const pluginInfo = this.pluginRegistry.getPluginInfo(type);
    return pluginInfo ? pluginInfo.path : null;
  }
  
  /**
   * 将十六进制数据转换为适合插件的格式
   * @param {string} type - 数据类型
   * @param {string} hexData - 十六进制数据
   * @returns {Object} - 转换后的数据对象，如果插件不支持则返回错误对象
   */
  convertDataForPlugin(type, hexData) {
    // 首先检查插件是否存在，避免重复检查和警告
    const pluginInfo = this.pluginRegistry.getPluginInfo(type);
    if (!pluginInfo) {
      return { error: `不支持的数据类型: ${type}` };
    }
    
    // 尝试调用特定类型的转换方法
    const converterMethodName = `convert${type.charAt(0).toUpperCase() + type.slice(1)}Data`;
    
    if (typeof this[converterMethodName] === 'function') {
      // 如果存在对应的转换方法，则调用它
      return this[converterMethodName](hexData);
    } else {
      // 使用默认转换：将十六进制转换为字符串
      // 这是通用的数据转换方法，适用于大部分简单文本数据
      return { data: this.hexToString(hexData) };
    }
  }
  
  /**
   * 将十六进制数据转换为配置对象
   * @param {string} hexData - 十六进制数据
   * @returns {Object} - 配置数据对象
   */
  convertConfigData(hexData) {
    const jsonStr = this.hexToString(hexData);
    try {
      const configObj = JSON.parse(jsonStr);
      return { data: configObj };
    } catch (error) {
      console.error('解析配置数据失败:', error);
      return { data: jsonStr, error: '无法解析为 JSON' };
    }
  }
  
  /**
   * 将十六进制数据转换为图片数据
   * @param {string} hexData - 十六进制数据
   * @returns {Object} - 图片数据对象
   */
  convertImageData(hexData) {
    const base64Data = this.hexToBase64(hexData);
    // 检测图片格式并设置适当的 MIME 类型
    // 这里简单地假设是 JPEG，实际应用中可以检测文件头
    const mimeType = 'image/jpeg';
    return {
      data: `data:${mimeType};base64,${base64Data}`
    };
  }
  
  /**
   * 将十六进制数据转换为命令输出
   * @param {string} hexData - 十六进制数据
   * @returns {Object} - 命令输出对象
   */
  convertCommandData(hexData) {
    const text = this.hexToString(hexData);
    return {
      data: text,
      lines: text.split('\n')
    };
  }
  
  /**
   * 将十六进制字符串转换为字符串
   * @param {string} hexString - 十六进制字符串
   * @returns {string} - 解码后的字符串
   */
  hexToString(hexString) {
    let result = '';
    for (let i = 0; i < hexString.length; i += 2) {
      result += String.fromCharCode(parseInt(hexString.substring(i, i + 2), 16));
    }
    return result;
  }
  
  /**
   * 将十六进制字符串转换为 Base64
   * @param {string} hexString - 十六进制字符串
   * @returns {string} - Base64 编码的字符串
   */
  hexToBase64(hexString) {
    // 创建一个字节数组
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i/2] = parseInt(hexString.substring(i, i + 2), 16);
    }
    
    // 现代浏览器中更高效的方式转换为 Base64
    if (typeof TextDecoder !== 'undefined' && typeof btoa !== 'undefined') {
      try {
        return btoa(String.fromCharCode.apply(null, bytes));
      } catch (e) {
        // 如果数组过大，需要分块处理
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }
    } else {
      // 兼容旧浏览器
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }
  
  /**
   * 打开插件子窗口并传递数据
   * @param {string} type - 数据类型
   * @param {Object} data - 要传递的数据
   * @returns {Window|null} - 打开的窗口对象，如果失败则返回 null
   */
  openPluginWindow(type, data) {
    // 如果数据转换阶段已经发现错误，直接返回
    if (data && data.error) {
      return data;
    }
    
    const pluginUrl = this.getPluginUrl(type);
    if (!pluginUrl) {
      // 这种情况理论上不应该发生，因为已经在convertDataForPlugin中检查过了
      console.error(`插件URL获取失败: ${type}`);
      return { error: `插件URL获取失败: ${type}` };
    }
    
    // 不再通过URL传递数据，只传递基本的插件URL
    const url = pluginUrl;
    
    // 打开子窗口
    const width = 800;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const windowFeatures = 
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
    
    // 打开窗口
    const pluginWindow = window.open(url, `plugin_${type}_${Date.now()}`, windowFeatures);
    
    if (!pluginWindow) {
      console.warn('插件窗口可能被浏览器弹窗阻止器拦截，请检查浏览器设置并允许弹窗');
      return { blocked: true };
    }
    
    // 使用 postMessage 传递数据
    let dataSent = false; // 标记数据是否已发送
    
    const sendDataWhenReady = () => {
      // 检查数据是否已发送或窗口是否已关闭
      if (dataSent || pluginWindow.closed) {
        return;
      }
      
      try {
        pluginWindow.postMessage({
          type: 'RICHLOG_PLUGIN_DATA',
          pluginType: type,
          data: data
        }, '*');
        console.log(`已通过 postMessage 发送数据到 ${type} 插件`);
        dataSent = true; // 标记数据已发送
      } catch (error) {
        console.error('发送插件数据失败:', error);
      }
    };
    
    // 监听子窗口的准备就绪消息
    const messageListener = (event) => {
      if (event.source === pluginWindow && event.data.type === 'RICHLOG_PLUGIN_READY') {
        // 子窗口已准备就绪，发送数据
        sendDataWhenReady();
        // 移除监听器
        window.removeEventListener('message', messageListener);
      }
    };
    window.addEventListener('message', messageListener);
    
    // 备用方案：如果2秒后还没收到准备就绪信号，主动发送数据
    setTimeout(() => {
      if (!dataSent) {
        console.log(`${type} 插件未发送准备就绪信号，使用备用发送方式`);
        sendDataWhenReady();
        window.removeEventListener('message', messageListener);
      }
    }, 2000);
    
    return pluginWindow;
  }
}

module.exports = PluginHandler;