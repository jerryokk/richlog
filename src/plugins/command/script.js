/**
 * RichLog 命令输出查看器插件
 */

// 插件数据和DOM元素
let commandData = null;
let commandContainer = null;
let commandOutputElement = null;
let searchInput = null;
let searchStats = null;
let downloadBtn = null;
let copyBtn = null;
let lineNumbersBtn = null;
let wrapBtn = null;

// 搜索状态
let searchResults = [];
let currentResultIndex = -1;
let showLineNumbers = true;
let wrapText = true;

/**
 * 初始化插件
 */
function init() {
  // 获取容器元素
  commandContainer = document.getElementById('command-container');
  searchInput = document.getElementById('search-input');
  searchStats = document.getElementById('search-stats');
  downloadBtn = document.getElementById('download-btn');
  copyBtn = document.getElementById('copy-btn');
  lineNumbersBtn = document.getElementById('line-numbers-btn');
  wrapBtn = document.getElementById('wrap-btn');
  
  // 添加事件监听器
  setupEventListeners();
  
  // 加载数据（通过 postMessage）
  loadData();
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 搜索事件
  if (searchInput) {
    searchInput.addEventListener('input', performSearch);
  }
  
  const searchPrevBtn = document.getElementById('search-prev-btn');
  const searchNextBtn = document.getElementById('search-next-btn');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  
  if (searchPrevBtn) searchPrevBtn.addEventListener('click', () => navigateSearch(-1));
  if (searchNextBtn) searchNextBtn.addEventListener('click', () => navigateSearch(1));
  if (clearSearchBtn) clearSearchBtn.addEventListener('click', clearSearch);
  
  // 工具栏按钮事件
  if (lineNumbersBtn) lineNumbersBtn.addEventListener('click', toggleLineNumbers);
  if (wrapBtn) wrapBtn.addEventListener('click', toggleTextWrap);
  if (downloadBtn) downloadBtn.addEventListener('click', downloadOutput);
  if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);
  
  // 键盘快捷键
  document.addEventListener('keydown', (event) => {
    if (event.key === 'F3' || (event.ctrlKey && event.key === 'g')) {
      event.preventDefault();
      navigateSearch(event.shiftKey ? -1 : 1);
    } else if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      if (searchInput) searchInput.focus();
    }
  });
}

/**
 * 设置消息监听器，接收来自父窗口的数据
 */
function setupMessageListener() {
  window.addEventListener('message', (event) => {
    // 验证消息来源和类型
    if (event.data && event.data.type === 'RICHLOG_PLUGIN_DATA') {
      console.log('命令插件接收到数据:', event.data);
      
      // 存储数据
      commandData = event.data.data;
      
      // 渲染内容
      renderContent();
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
 * 加载数据（现在通过 postMessage 接收）
 */
function loadData() {
  // 设置消息监听器
  setupMessageListener();
  
  // 显示加载状态
  commandContainer.innerHTML = `
    <div class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
      <p class="mt-2">正在加载命令输出...</p>
    </div>
  `;
}

/**
 * 渲染命令输出内容
 */
function renderContent() {
  if (!commandData || !commandData.data) {
    showError('无效的命令输出数据');
    return;
  }
  
  try {
    // 获取命令输出文本
    const commandText = commandData.data;
    
    // 清空容器
    commandContainer.innerHTML = '';
    
    // 创建输出元素
    commandOutputElement = document.createElement('pre');
    commandOutputElement.className = 'command-output';
    
    // 渲染带行号的命令输出
    renderCommandOutput(commandText);
    
    // 添加到容器
    commandContainer.appendChild(commandOutputElement);
    
    // 设置初始按钮状态
    updateButtonStates();
    
  } catch (error) {
    console.error('渲染命令输出失败:', error);
    showError('渲染失败: ' + error.message);
  }
}

/**
 * 显示错误信息
 */
function showError(message) {
  commandContainer.innerHTML = `
    <div class="error-container">
      <div class="alert alert-danger">
        <strong>错误：</strong> ${message}
      </div>
    </div>
  `;
}

/**
 * 渲染带行号的命令输出
 */
function renderCommandOutput(text) {
  if (!text) {
    commandOutputElement.textContent = '(空输出)';
    return;
  }
  
  // 分割为行
  const lines = text.split('\n');
  
  // 创建输出 HTML
  let html = '';
  lines.forEach((line, index) => {
    // 转义 HTML 字符
    const escapedLine = escapeHtml(line);
    
    // 添加行号
    if (showLineNumbers) {
      const lineNumber = index + 1;
      html += `<span class="line-numbers">${lineNumber}</span>`;
    }
    
    // 添加行内容
    html += `<span class="line-content">${escapedLine || ' '}</span>\n`;
  });
  
  // 设置 HTML 内容
  commandOutputElement.innerHTML = html;
  
  // 设置换行样式
  commandOutputElement.style.whiteSpace = wrapText ? 'pre-wrap' : 'pre';
}

/**
 * 更新按钮状态
 */
function updateButtonStates() {
  if (lineNumbersBtn) {
    if (showLineNumbers) {
      lineNumbersBtn.classList.add('active');
    } else {
      lineNumbersBtn.classList.remove('active');
    }
  }
  
  if (wrapBtn) {
    if (wrapText) {
      wrapBtn.classList.add('active');
    } else {
      wrapBtn.classList.remove('active');
    }
  }
}

/**
 * 执行搜索
 */
function performSearch() {
  const searchText = searchInput.value.trim();
  
  // 清除之前的高亮
  clearHighlights();
  
  if (!searchText) {
    searchResults = [];
    currentResultIndex = -1;
    updateSearchStats();
    return;
  }
  
  // 查找所有匹配项
  searchResults = [];
  const lineElements = commandOutputElement.querySelectorAll('.line-content');
  
  lineElements.forEach((lineElement, lineIndex) => {
    const lineText = lineElement.textContent;
    let startIndex = 0;
    let index;
    
    // 查找行中的所有匹配
    while ((index = lineText.toLowerCase().indexOf(searchText.toLowerCase(), startIndex)) !== -1) {
      searchResults.push({
        lineElement,
        lineIndex,
        startIndex: index,
        endIndex: index + searchText.length
      });
      startIndex = index + 1;
    }
  });
  
  // 高亮匹配项
  highlightResults();
  
  // 导航到第一个结果
  if (searchResults.length > 0) {
    currentResultIndex = 0;
    navigateToCurrentResult();
  }
  
  // 更新搜索统计
  updateSearchStats();
}

/**
 * 高亮所有搜索结果
 */
function highlightResults() {
  searchResults.forEach((result, index) => {
    const { lineElement, startIndex, endIndex } = result;
    const text = lineElement.textContent;
    
    // 创建高亮片段
    const beforeText = text.substring(0, startIndex);
    const matchText = text.substring(startIndex, endIndex);
    const afterText = text.substring(endIndex);
    
    // 替换为带高亮的 HTML
    lineElement.innerHTML = 
      escapeHtml(beforeText) +
      `<span class="highlight" data-index="${index}">${escapeHtml(matchText)}</span>` +
      escapeHtml(afterText);
  });
}

/**
 * 清除所有高亮
 */
function clearHighlights() {
  if (!commandOutputElement) return;
  const lineElements = commandOutputElement.querySelectorAll('.line-content');
  lineElements.forEach(element => {
    const text = element.textContent;
    element.innerHTML = escapeHtml(text);
  });
}

/**
 * 导航搜索结果
 */
function navigateSearch(direction) {
  if (searchResults.length === 0) return;
  
  // 更新结果索引
  currentResultIndex = 
    (currentResultIndex + direction + searchResults.length) % searchResults.length;
  
  // 导航到当前结果
  navigateToCurrentResult();
  
  // 更新搜索统计
  updateSearchStats();
}

/**
 * 导航到当前结果
 */
function navigateToCurrentResult() {
  if (currentResultIndex < 0 || currentResultIndex >= searchResults.length) return;
  
  // 获取当前高亮元素
  const highlightElements = commandOutputElement.querySelectorAll('.highlight');
  const currentElement = highlightElements[currentResultIndex];
  
  if (currentElement) {
    // 添加当前样式
    highlightElements.forEach(el => el.style.backgroundColor = 'rgba(255, 193, 7, 0.3)');
    currentElement.style.backgroundColor = 'rgba(220, 53, 69, 0.7)';
    
    // 滚动到视图
    currentElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}

/**
 * 更新搜索统计信息
 */
function updateSearchStats() {
  if (!searchStats) return;
  
  if (searchResults.length === 0) {
    if (searchInput && searchInput.value.trim()) {
      searchStats.textContent = '无匹配结果';
    } else {
      searchStats.textContent = '未搜索';
    }
  } else {
    searchStats.textContent = 
      `${currentResultIndex + 1} / ${searchResults.length} 个匹配项`;
  }
}

/**
 * 清除搜索
 */
function clearSearch() {
  if (searchInput) searchInput.value = '';
  clearHighlights();
  searchResults = [];
  currentResultIndex = -1;
  updateSearchStats();
}

/**
 * 切换行号显示
 */
function toggleLineNumbers() {
  showLineNumbers = !showLineNumbers;
  
  // 重新渲染输出
  if (commandData && commandData.data) {
    renderCommandOutput(commandData.data);
    
    // 重新应用搜索高亮
    if (searchResults.length > 0) {
      highlightResults();
      navigateToCurrentResult();
    }
  }
  
  // 更新按钮状态
  updateButtonStates();
}

/**
 * 切换文本换行
 */
function toggleTextWrap() {
  wrapText = !wrapText;
  
  // 更新换行样式
  if (commandOutputElement) {
    commandOutputElement.style.whiteSpace = wrapText ? 'pre-wrap' : 'pre';
  }
  
  // 更新按钮状态
  updateButtonStates();
}

/**
 * 下载命令输出
 */
function downloadOutput() {
  if (!commandData || !commandData.data) return;
  
  const blob = new Blob([commandData.data], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `command_output_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 复制到剪贴板
 */
function copyToClipboard() {
  if (!commandData || !commandData.data) return;
  
  navigator.clipboard.writeText(commandData.data)
    .then(() => {
      // 显示复制成功提示
      if (copyBtn) {
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="bi bi-check"></i> 已复制';
        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
        }, 2000);
      }
    })
    .catch(err => {
      console.error('复制失败:', err);
      alert('复制到剪贴板失败');
    });
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// 页面加载时初始化插件
document.addEventListener('DOMContentLoaded', () => {
  init();
});