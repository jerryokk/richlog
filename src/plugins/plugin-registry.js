/**
 * 插件注册表
 * 管理所有可用的插件
 */

const PluginScanner = require('./plugin-scanner');

class PluginRegistry {
  // 静态加载状态，防止重复加载
  static isLoading = false;
  static loaded = false;
  
  constructor() {
    // 存储已注册插件类型和完整信息
    this.plugins = {};
    
    // 初始化插件系统
    if (!PluginRegistry.loaded && !PluginRegistry.isLoading) {
      this.initPlugins();
    }
  }
  
  /**
   * 异步初始化插件系统
   */
  async initPlugins() {
    // 设置加载状态，防止重复加载
    if (PluginRegistry.isLoading || PluginRegistry.loaded) {
      return;
    }
    
    PluginRegistry.isLoading = true;
    
    try {
      // 直接从配置文件加载插件
      await this.loadPluginsFromConfig();
      
      // 请注意：系统完全依赖插件配置文件
      // 如果没有加载到任何插件，将不会提供任何功能
      if (Object.keys(this.plugins).length === 0) {
        console.warn('未从配置加载到任何插件，系统可能无法正常工作');
      } else {
        console.log('成功从配置文件加载了 ' + Object.keys(this.plugins).length + ' 个插件');
      }
      
      // 标记加载完成
      PluginRegistry.loaded = true;
      
      // 触发插件系统加载完成事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('richlog:plugins-loaded', {
          detail: { loadedPlugins: Object.keys(this.plugins) }
        }));
      }
    } catch (error) {
      console.error('初始化插件系统失败:', error);
    } finally {
      PluginRegistry.isLoading = false;
    }
  }
  
  /**
   * 注册插件
   * @param {string} type - 插件类型
   * @param {Object} pluginInfo - 插件信息对象
   * @param {string} pluginInfo.path - 插件路径
   * @param {string} pluginInfo.name - 插件显示名称
   * @param {string} pluginInfo.description - 插件描述
   * @param {string} [pluginInfo.color] - 插件颜色类名
   * @param {string} [pluginInfo.bgColor] - 插件背景色类名
   * @param {string} [pluginInfo.icon] - 插件图标
   * @returns {boolean} - 注册是否成功
   */
  registerPlugin(type, pluginInfo) {
    if (this.plugins[type]) {
      console.warn(`插件类型 "${type}" 已存在，将被覆盖`);
    }
    
    // 合并默认值和提供的信息
    this.plugins[type] = {
      path: pluginInfo.path || `plugins/${type}/index.html`,
      name: pluginInfo.name || `${type}`,
      title: pluginInfo.title || `${pluginInfo.name || type} 查看器`,
      description: pluginInfo.description || `查看 ${type} 数据`,
      color: pluginInfo.color || 'primary',
      bgColor: pluginInfo.bgColor || 'bg-primary',
      icon: pluginInfo.icon || 'file',
      fileExtensions: pluginInfo.fileExtensions || [],
      mimeTypes: pluginInfo.mimeTypes || []
    };
    
    // 触发插件注册事件
    this.dispatchPluginRegistered(type, this.plugins[type]);
    
    return true;
  }
  
  /**
   * 触发插件注册事件
   * @param {string} type - 插件类型
   * @param {Object} pluginInfo - 插件信息
   */
  dispatchPluginRegistered(type, pluginInfo) {
    // 检查是否在浏览器环境中
    if (typeof window !== 'undefined') {
      // 创建自定义事件
      const event = new CustomEvent('richlog:plugin-registered', {
        detail: { type, pluginInfo }
      });
      
      // 触发事件
      window.dispatchEvent(event);
    } else {
      // Node.js 环境中仅记录日志
      console.log(`插件注册事件: ${type}`);
    }
  }
  
  /**
   * 从配置文件加载插件
   * @returns {Promise<void>}
   */
  async loadPluginsFromConfig() {
    // 检查是否在浏览器环境中
    const isBrowser = typeof window !== 'undefined' && typeof fetch !== 'undefined';
    
    // 使用插件扫描器获取可用插件类型
    const pluginTypes = PluginScanner.getAvailablePluginTypes();
    
    for (const type of pluginTypes) {
      try {
        // 使用插件扫描器获取配置文件路径
        const configPath = PluginScanner.getPluginConfigPath(type);
        
        // 浏览器环境使用 fetch，Node环境跳过
        if (isBrowser) {
          // 获取插件配置
          const response = await fetch(configPath);
          
          if (!response.ok) {
            console.warn(`无法加载插件配置 ${configPath}: ${response.status}`);
            continue;
          }
          
          // 解析配置
          const config = await response.json();
          
          // 确保类型匹配
          if (config.type !== type) {
            console.warn(`插件类型不匹配: 预期 ${type}，实际 ${config.type}`);
            continue;
          }
          
          // 设置路径
          config.path = PluginScanner.getPluginMainPath(type);
          
          // 注册插件
          this.registerPlugin(type, config);
          console.log(`从配置加载了插件: ${config.name}`);
        } else {
          // 在Node环境中跳过配置加载
          console.log(`在Node环境中跳过加载插件配置: ${type}`);
        }
      } catch (error) {
        console.error(`加载插件配置失败 ${type}:`, error);
      }
    }
  }
  
  // 不再提供默认插件
  // 完全依赖插件配置文件加载
  
  // 删除所有默认插件参数相关的方法
  // 完全依赖插件配置文件加载
  
  /**
   * 获取指定类型的插件信息
   * @param {string} type - 插件类型
   * @returns {Object|null} - 插件信息，如果未注册则返回 null
   */
  getPluginInfo(type) {
    return this.plugins[type] || null;
  }
  
  /**
   * 获取插件的完整 URL
   * @param {string} type - 插件类型
   * @returns {string|null} - 插件 URL，如果未注册则返回 null
   */
  getPluginUrl(type) {
    const info = this.getPluginInfo(type);
    if (!info) return null;
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/${info.path}`;
  }
  
  /**
   * 检查是否支持指定的数据类型
   * @param {string} type - 数据类型
   * @returns {boolean} - 是否支持该类型
   */
  isTypeSupported(type) {
    return type in this.plugins;
  }
  
  /**
   * 获取所有注册的插件类型
   * @returns {Array<string>} - 已注册的插件类型数组
   */
  getRegisteredTypes() {
    return Object.keys(this.plugins);
  }
  
  /**
   * 检查插件系统是否已加载完成
   * @returns {boolean} - 是否已加载完成
   */
  isLoaded() {
    return PluginRegistry.loaded;
  }
  
  /**
   * 获取所有插件信息
   * @returns {Object} - 插件类型到插件信息的映射
   */
  getAllPlugins() {
    return { ...this.plugins };
  }
  
  /**
   * 获取所有类型信息，适用于UI显示
   * @returns {Object} - 类型到显示信息的映射
   */
  getAllTypeInfo() {
    const typeInfo = {};
    
    for (const [type, plugin] of Object.entries(this.plugins)) {
      typeInfo[type] = {
        name: plugin.name,
        color: plugin.color,
        bgColor: plugin.bgColor,
        icon: plugin.icon
      };
    }
    
    return typeInfo;
  }
}

module.exports = PluginRegistry;