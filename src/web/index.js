/**
 * RichLog Web 界面主入口
 */

const { RichLogParser, PluginHandler } = require('../core');
const { PluginRegistry } = require('../plugins');

// 导入样式
import './styles.css';

// 插件注册表实例
const pluginRegistry = new PluginRegistry();

// 支持的数据类型信息存储
let SUPPORTED_TYPES = {};

// 初始化全局变量
let parser = new RichLogParser();
let pluginHandler = new PluginHandler(pluginRegistry); // 传入全局插件注册表实例
let logLines = [];
let filteredLines = [];
let richLogEntries = {};
let searchTerm = '';

// DOM 元素
let logContainer;
let searchInput;
let statsTotal;
// 统计变量现在动态生成
let pasteModal;

// 初始化动态UI元素
function initDynamicUI() {
  // 初始化统计信息
  const statsContainer = document.getElementById('stats-types-container');
  if (statsContainer) {
    statsContainer.innerHTML = '';
    Object.entries(SUPPORTED_TYPES).forEach(([type, info]) => {
      statsContainer.innerHTML += `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          ${info.name}
          <span id="stats-${type}" class="badge ${info.bgColor}">0</span>
        </li>
      `;
    });
  }
}

// 更新示例提示文本
function updateSampleHint() {
  const sampleHint = document.getElementById('sample-data-hint');
  if (sampleHint) {
    const typeNames = Object.values(SUPPORTED_TYPES)
      .map(info => `[${info.name}]`)
      .join('、');
    sampleHint.textContent = `查看日志中的${typeNames}链接可查看富媒体内容`;
  }
}

// 从插件注册表同步类型信息
function syncTypeInfo() {
  // 获取插件注册表中的所有类型信息
  SUPPORTED_TYPES = pluginRegistry.getAllTypeInfo();
  
  // 如果没有类型（可能尚未加载完成），使用空对象
  if (Object.keys(SUPPORTED_TYPES).length === 0) {
    SUPPORTED_TYPES = {};
    console.warn('没有找到任何插件类型信息');
  }
  
  console.log('同步了类型信息:', SUPPORTED_TYPES);
  
  // 更新UI
  if (document.readyState === 'complete') {
    initDynamicUI();
    updateSampleHint();
    generatePluginTypeStyles();
  }
}

// 初始化函数
function init() {
  // 获取 DOM 元素引用
  logContainer = document.getElementById('log-container');
  searchInput = document.getElementById('search-input');
  statsTotal = document.getElementById('stats-total');

  // 初始化粘贴模态框
  pasteModal = new bootstrap.Modal(document.getElementById('paste-modal'));
  
  // 添加插件注册事件监听器
  window.addEventListener('richlog:plugin-registered', event => {
    console.log('检测到插件注册:', event.detail);
    syncTypeInfo();
  });
  
  // 等待插件加载完成后再同步类型信息
  // 如果插件已经加载完成，立即同步；否则等待插件加载完成事件
  if (pluginRegistry.isLoaded()) {
    syncTypeInfo();
    initDynamicUI();
    updateSampleHint();
  } else {
    // 监听插件系统加载完成事件
    window.addEventListener('richlog:plugins-loaded', () => {
      console.log('插件系统加载完成，开始同步类型信息');
      syncTypeInfo();
      initDynamicUI();
      updateSampleHint();
    });
  }
  
  // 添加事件监听器
  document.getElementById('paste-log-btn').addEventListener('click', () => pasteModal.show());
  document.getElementById('paste-confirm-btn').addEventListener('click', handlePasteLog);
  // 为初始的log-file-input添加事件监听器（如果存在）
  const initialFileInput = document.getElementById('log-file-input');
  if (initialFileInput) {
    initialFileInput.addEventListener('change', handleFileInput);
  }
  document.getElementById('search-btn').addEventListener('click', handleSearch);
  document.getElementById('clear-search-btn').addEventListener('click', clearSearch);
  document.getElementById('load-log-btn').addEventListener('click', () => {
    let fileInput = document.getElementById('log-file-input');
    if (!fileInput) {
      // 如果文件输入元素不存在，动态创建一个隐藏的
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'log-file-input-temp';
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', handleFileInput);
      document.body.appendChild(fileInput);
    }
    fileInput.click();
  });
  document.getElementById('clear-log-btn').addEventListener('click', clearLog);
  
  // 使用事件委托为富日志链接添加点击事件（避免重复绑定）
  logContainer.addEventListener('click', (event) => {
    const link = event.target.closest('.richlog-link');
    if (link) {
      const type = link.getAttribute('data-type');
      const uuid = link.getAttribute('data-uuid');
      if (type && uuid) {
        openRichLogData(type, uuid);
      }
    }
  });
  
  // 搜索框回车键
  searchInput.addEventListener('keyup', event => {
    if (event.key === 'Enter') handleSearch();
  });
}

// 处理粘贴日志
function handlePasteLog() {
  const textarea = document.getElementById('paste-textarea');
  const logContent = textarea.value.trim();
  
  if (logContent) {
    parseLogContent(logContent);
    pasteModal.hide();
    textarea.value = '';
  }
}

// 处理文件输入
function handleFileInput(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = e => {
    parseLogContent(e.target.result);
  };
  reader.readAsText(file);
  
  // 清除文件输入，以便可以选择同一个文件
  event.target.value = '';
}

// 解析日志内容
function parseLogContent(content) {
  // 清除现有数据
  logLines = [];
  richLogEntries = {};
  parser = new RichLogParser();
  
  // 按行分割
  const lines = content.split(/\r?\n/);
  
  // 解析每一行
  lines.forEach(line => {
    if (line.trim()) {
      processLogLine(line);
    }
  });
  
  // 更新显示
  updateStats();
  applyFilters();
}

// 处理单行日志
function processLogLine(line) {
  // 保存原始日志行
  logLines.push(line);
  
  // 检查是否是 RICHLOG 格式
  const parsedData = parser.parseLine(line);
  
  if (parsedData) {
    // 尝试添加并重组
    const completedItem = parser.addLogLine(line);
    
    // 如果已完成重组，添加到富媒体项目
    if (completedItem) {
      richLogEntries[completedItem.uuid] = {
        type: completedItem.type,
        uuid: completedItem.uuid,
        hexData: completedItem.hexData
      };
      
      // 在下一行添加引用行
      const referenceText = `[${completedItem.type}] (共 ${parsedData.totalChunks} 个片段)`;
      const referenceLine = line.replace(/RICHLOG:.+/, referenceText);
      logLines.push(referenceLine);
    }
  }
}

// 将日志行渲染为 HTML
function renderLogLine(line, index) {
  // 尝试提取时间戳和内容
  const timestampMatch = line.match(/^\[(.*?)\]/);
  
  let timestamp = '';
  let content = line;
  
  if (timestampMatch) {
    timestamp = timestampMatch[0];
    content = line.substring(timestampMatch[0].length).trim();
  }
  
  // 检查是否是 RICHLOG 格式
  if (content.startsWith('RICHLOG:')) {
    // 不显示原始的 RICHLOG 行
    return '';
  }
  
  // 检查是否是完成项引用行
  for (const uuid in richLogEntries) {
    const entry = richLogEntries[uuid];
    
    // 构造可能的引用格式
    const referenceRegex = new RegExp(`\\[${entry.type}\\].*?\\(共\\s+\\d+\\s+个片段\\)`);
    
    if (referenceRegex.test(content)) {
      // 将引用行替换为可点击链接
      const linkHtml = createRichLogLink(entry.type, uuid);
      content = content.replace(referenceRegex, linkHtml);
    }
  }
  
  // 搜索高亮
  if (searchTerm && content.includes(searchTerm)) {
    const escapedSearchTerm = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    content = content.replace(regex, '<span class="match-highlight">$1</span>');
  }
  
  // 组装日志行 HTML
  return `
    <div class="log-entry" data-index="${index}">
      <span class="log-timestamp">${timestamp}</span>
      <span class="log-content">${content}</span>
    </div>
  `;
}

// 创建富日志链接
function createRichLogLink(type, uuid) {
  const typeText = getTypeDisplayName(type);
  const typeClass = `type-${type}`;
  return `<span class="richlog-link ${typeClass}" data-type="${type}" data-uuid="${uuid}">
    📎 [${typeText}] 查看内容
  </span>`;
}

// 获取类型显示名称
function getTypeDisplayName(type) {
  return SUPPORTED_TYPES[type]?.name || type;
}

// 打开富日志数据
function openRichLogData(type, uuid) {
  const entry = richLogEntries[uuid];
  if (!entry) {
    console.error(`找不到 UUID ${uuid} 的数据`);
    return;
  }
  
  // 转换数据格式
  const data = pluginHandler.convertDataForPlugin(type, entry.hexData);
  
  // 检查数据转换是否成功
  if (data && data.error) {
    // 不支持的数据类型错误
    showToast('error', '不支持的数据类型', `系统中没有安装 "${type}" 类型的插件。请联系管理员添加相应的插件支持。`);
    return { error: data.error };
  }
  
  // 调试信息：检查要传递的数据
  // console.log('准备传递给插件的数据:', { type, data, hexData: entry.hexData.substring(0, 100) + '...' });
  
  // 打开插件窗口
  const result = pluginHandler.openPluginWindow(type, data);
  
  // 处理窗口打开的错误情况
  if (result && result.error) {
    // 插件窗口打开失败
    showToast('error', '插件窗口打开失败', result.error);
    return { error: result.error };
  } else if (result && result.blocked) {
    // 窗口被浏览器阻止
    showToast('warning', '插件窗口被阻止', '插件窗口可能被浏览器阻止。请点击地址栏的弹窗图标并允许弹窗，然后重试。');
    return { blocked: true };
  }
}

// 存储当前显示的toast，避免重复
const activeToasts = new Map();

// 显示提示消息
function showToast(type, title, message) {
  // 生成唯一的toast ID（基于类型和标题）
  const toastId = `${type}-${title}`;
  
  // 如果已经有相同的toast在显示，直接返回
  if (activeToasts.has(toastId)) {
    return;
  }
  
  const toast = document.createElement('div');
  const alertClass = type === 'error' ? 'alert-danger' : type === 'warning' ? 'alert-warning' : 'alert-info';
  
  toast.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
  toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
  toast.innerHTML = `
    <strong>${title}：</strong> ${message}
    <button type="button" class="btn-close" aria-label="Close"></button>
  `;
  document.body.appendChild(toast);
  
  // 记录这个toast
  activeToasts.set(toastId, toast);
  
  // 移除提示的函数
  const removeToast = () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
    // 从活动toast记录中移除
    activeToasts.delete(toastId);
  };
  
  // 手动添加关闭按钮事件
  const closeBtn = toast.querySelector('.btn-close');
  
  // 8秒后自动移除提示（错误消息显示更长时间）
  const timeout = type === 'error' ? 8000 : 5000;
  const autoRemoveTimer = setTimeout(removeToast, timeout);
  
  // 点击关闭按钮时立即移除并清除定时器
  closeBtn.addEventListener('click', () => {
    clearTimeout(autoRemoveTimer);
    removeToast();
  });
}

// 应用搜索过滤
function applyFilters() {
  // 筛选行
  filteredLines = [...logLines];
  
  // 应用搜索条件
  if (searchTerm) {
    filteredLines = filteredLines.filter(line => line.includes(searchTerm));
  }
  
  // 更新显示
  renderLogLines();
}

// 已移除全选筛选器逻辑

// 处理搜索
function handleSearch() {
  searchTerm = searchInput.value.trim();
  applyFilters();
}

// 清除搜索
function clearSearch() {
  searchInput.value = '';
  searchTerm = '';
  applyFilters();
}

// 清除日志
function clearLog() {
  logLines = [];
  filteredLines = [];
  richLogEntries = {};
  parser = new RichLogParser();
  
  // 更新显示
  updateStats();
  // 不调用renderLogLines()，因为它会显示"没有匹配的日志行"
  
  // 显示初始消息
  showInitialMessage();
}

// 显示初始消息界面
function showInitialMessage() {
  logContainer.innerHTML = `
    <div class="text-center p-5 text-muted">
      <p>请加载日志文件或粘贴日志内容</p>
      <div class="mb-3">
        <button id="paste-log-btn" class="btn btn-outline-primary">粘贴日志</button>
      </div>
      <div class="mb-3">
        <label for="log-file-input" class="form-label">选择日志文件</label>
        <input class="form-control" type="file" id="log-file-input">
      </div>
    </div>
  `;
  
  // 重新添加事件监听器
  document.getElementById('paste-log-btn').addEventListener('click', () => pasteModal.show());
  const fileInput = document.getElementById('log-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileInput);
  }
}

// 渲染所有筛选后的日志行
function renderLogLines() {
  if (filteredLines.length === 0) {
    // 区分"完全没有日志"和"搜索无结果"
    if (logLines.length === 0) {
      // 完全没有日志，显示初始界面（但这种情况应该由clearLog处理）
      showInitialMessage();
    } else {
      // 有日志但搜索无结果
      logContainer.innerHTML = '<div class="text-center p-5 text-muted">没有匹配的日志行</div>';
    }
    return;
  }
  
  // 渲染所有日志行
  const html = filteredLines.map((line, index) => renderLogLine(line, index)).join('');
  logContainer.innerHTML = html;
  
  // 不需要重复绑定事件，使用事件委托在容器上处理
}

/**
 * 生成插件类型的CSS样式
 */
function generatePluginTypeStyles() {
  const styleEl = document.getElementById('dynamic-type-styles') || document.createElement('style');
  if (!styleEl.id) {
    styleEl.id = 'dynamic-type-styles';
    document.head.appendChild(styleEl);
  }
  
  let cssRules = '';
  
  // 添加每个插件类型的样式
  Object.entries(SUPPORTED_TYPES).forEach(([type, info]) => {
    // 获取颜色
    let mainColor;
    
    // 优先使用配置文件中指定的mainColor
    if (info.mainColor) {
      mainColor = info.mainColor;
    } 
    // 如果没有mainColor，则使用预定义的Bootstrap颜色
    else if (info.color) {
      switch(info.color) {
        case 'success': mainColor = '#198754'; break;
        case 'danger': mainColor = '#dc3545'; break;
        case 'info': mainColor = '#0dcaf0'; break;
        case 'warning': mainColor = '#fd7e14'; break;
        case 'primary': mainColor = '#0d6efd'; break;
        case 'secondary': mainColor = '#6c757d'; break;
        case 'purple': mainColor = '#6f42c1'; break;
        case 'teal': mainColor = '#20c997'; break;
        default: mainColor = '#6c757d'; // 默认为灰色
      }
    } else {
      mainColor = '#6c757d'; // 默认为灰色
    }
    
    cssRules += `
.richlog-link.type-${type} { border-left: 3px solid ${mainColor}; }
.type-${type} { color: ${mainColor}; }
    `;
  });
  
  // 设置样式内容
  styleEl.textContent = cssRules;
  
  console.log('生成了插件类型样式');
}

// 更新统计信息
function updateStats() {
  statsTotal.textContent = logLines.length;
  
  // 动态计算和更新各类型数量
  Object.keys(SUPPORTED_TYPES).forEach(type => {
    const count = Object.values(richLogEntries).filter(entry => entry.type === type).length;
    const statsElement = document.getElementById(`stats-${type}`);
    if (statsElement) {
      statsElement.textContent = count;
    }
  });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);