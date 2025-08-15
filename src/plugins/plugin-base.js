/**
 * 插件基类
 * 所有插件应继承此类以保持一致的接口
 */

class PluginBase {
  constructor() {
    this.data = null;
    this.initialized = false;
    this.containerElement = null;
  }
  
  /**
   * 初始化插件
   * @param {HTMLElement} containerElement - 插件容器元素
   */
  initialize(containerElement) {
    this.containerElement = containerElement;
    this.initialized = true;
    this.initEventListeners();
  }
  

  
  /**
   * 设置消息监听器，接收来自父窗口的数据
   */
  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // 验证消息来源和类型
      if (event.data && event.data.type === 'RICHLOG_PLUGIN_DATA') {
        console.log('插件接收到数据:', event.data);
        
        // 存储数据
        this.data = event.data.data;
        
        // 渲染内容
        this.renderContent();
      }
    });
    
    // 向父窗口发送准备就绪信号
    if (window.opener) {
      try {
        window.opener.postMessage({
          type: 'RICHLOG_PLUGIN_READY'
        }, '*');
        console.log('已发送插件准备就绪信号');
      } catch (error) {
        console.error('发送准备就绪信号失败:', error);
      }
    }
  }

  /**
   * 加载数据（通过 postMessage）
   */
  loadData() {
    // 设置消息监听器
    this.setupMessageListener();
    
    // 显示加载状态
    this.showLoading();
  }

  /**
   * 显示加载状态
   */
  showLoading() {
    if (this.container) {
      this.container.innerHTML = `
        <div class="loading-container">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">加载中...</span>
          </div>
          <p class="mt-2">正在加载数据...</p>
        </div>
      `;
    }
  }
  
  /**
   * 接收主窗口发送的消息数据
   * @param {MessageEvent} event - 消息事件
   */
  receiveMessage(event) {
    // 验证源，确保消息来自预期的窗口
    // 实际应用中应设置为允许的来源
    const allowedOrigin = window.location.origin;
    
    if (event.origin !== allowedOrigin) {
      console.warn(`忽略来自未知来源的消息: ${event.origin}`);
      return;
    }
    
    try {
      const message = event.data;
      
      // 检查消息格式
      if (message && message.type === 'richlog_data') {
        this.data = message.data;
        this.renderContent();
      }
    } catch (error) {
      console.error('处理消息数据失败:', error);
      this.showError('数据格式无效');
    }
  }
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 监听来自主窗口的消息
    window.addEventListener('message', this.receiveMessage.bind(this));
    
    // 设置窗口标题
    this.setWindowTitle();
  }
  
  /**
   * 设置窗口标题
   */
  setWindowTitle() {
    // 插件可覆盖此方法以设置更具体的标题
    document.title = 'RichLog 插件查看器';
  }
  
  /**
   * 渲染插件内容
   * 插件必须实现此方法
   */
  renderContent() {
    throw new Error('子类必须实现 renderContent 方法');
  }
  
  /**
   * 显示错误消息
   * @param {string} message - 错误消息
   */
  showError(message) {
    if (!this.containerElement) {
      console.error('容器元素未初始化');
      return;
    }
    
    this.containerElement.innerHTML = `
      <div class="error-container">
        <div class="alert alert-danger">
          <h5>错误</h5>
          <p>${message}</p>
        </div>
      </div>
    `;
  }
  
  /**
   * 显示加载中状态
   */
  showLoading() {
    if (!this.containerElement) {
      console.error('容器元素未初始化');
      return;
    }
    
    this.containerElement.innerHTML = `
      <div class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
        <p class="mt-2">正在加载数据...</p>
      </div>
    `;
  }
}

module.exports = PluginBase;