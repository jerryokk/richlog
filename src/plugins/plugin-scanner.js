/**
 * 插件扫描器
 * 用于扫描和自动发现插件目录
 */

class PluginScanner {
  // 插件类型列表，动态发现和加载
  static PLUGIN_TYPES = [];
  
  // 插件根目录
  static PLUGINS_ROOT = 'plugins';
  
  // 插件源文件根目录
  static SRC_PLUGINS_ROOT = './src/plugins';
  /**
   * 获取所有可用的插件类型
   * @returns {Array<string>} - 插件类型数组
   */
  static getAvailablePluginTypes() {
    // 首次调用时，执行自动发现机制
    if (this.PLUGIN_TYPES.length === 0) {
      this.discoverPlugins();
    }
    return [...this.PLUGIN_TYPES];
  }
  
  /**
   * 发现插件类型
   * 在浏览器环境中，插件类型由构建时注入
   * @returns {void}
   */
  static discoverPlugins() {
    // 检查是否有全局注入的插件类型列表
    if (typeof window !== 'undefined' && window.RICHLOG_PLUGIN_TYPES) {
      this.PLUGIN_TYPES = window.RICHLOG_PLUGIN_TYPES.filter(type => this.isValidPluginType(type));
      console.log('从全局配置加载了插件类型:', this.PLUGIN_TYPES);
      return;
    }
    
    // 回退到默认插件类型
    console.log('使用默认插件类型');
    this.PLUGIN_TYPES = ['config', 'image', 'command'];
    console.log('默认插件类型:', this.PLUGIN_TYPES);
  }
  
  /**
   * 检查插件类型是否有效
   * @param {string} type - 插件类型
   * @returns {boolean} - 是否有效
   */
  static isValidPluginType(type) {
    // 检查类型名称是否为空
    if (!type || typeof type !== 'string') return false;
    
    // 检查类型名称是否合法（只允许字母、数字、下划线和破折号）
    const validTypeRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validTypeRegex.test(type)) return false;
    
    return true;
  }
  
  /**
   * 注册新插件类型
   * @param {string} type - 插件类型
   * @returns {boolean} - 是否注册成功
   */
  static registerPluginType(type) {
    if (!this.isValidPluginType(type)) return false;
    
    if (this.PLUGIN_TYPES.includes(type)) return true; // 已存在
    
    this.PLUGIN_TYPES.push(type);
    return true;
  }

  /**
   * 获取插件配置文件路径
   * @param {string} type - 插件类型
   * @returns {string} - 配置文件路径
   */
  static getPluginConfigPath(type) {
    if (!this.isValidPluginType(type)) {
      console.warn(`无效的插件类型: ${type}`);
      return '';
    }
    return `${this.PLUGINS_ROOT}/${type}/plugin.json`;
  }

  /**
   * 获取插件主文件路径
   * @param {string} type - 插件类型
   * @returns {string} - 主文件路径
   */
  static getPluginMainPath(type) {
    if (!this.isValidPluginType(type)) {
      console.warn(`无效的插件类型: ${type}`);
      return '';
    }
    return `${this.PLUGINS_ROOT}/${type}/index.html`;
  }

  /**
   * 获取插件脚本文件路径
   * @param {string} type - 插件类型
   * @returns {string} - 脚本文件路径
   */
  static getPluginScriptPath(type) {
    if (!this.isValidPluginType(type)) {
      console.warn(`无效的插件类型: ${type}`);
      return '';
    }
    return `${this.SRC_PLUGINS_ROOT}/${type}/script.js`;
  }
  
  /**
   * 获取插件的资源目录
   * @param {string} type - 插件类型
   * @returns {string} - 资源目录路径
   */
  static getPluginResourcePath(type) {
    if (!this.isValidPluginType(type)) {
      console.warn(`无效的插件类型: ${type}`);
      return '';
    }
    return `${this.PLUGINS_ROOT}/${type}/resources`;
  }
}

module.exports = PluginScanner;