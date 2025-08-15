/**
 * RichLog 图片查看器插件
 */

// 插件数据和DOM元素
let imageData = null;
let imageContainer = null;
let downloadBtn = null;
let copyBtn = null;
let rotateLeftBtn = null;
let rotateRightBtn = null;
let resetViewBtn = null;
let zoomInBtn = null;
let zoomOutBtn = null;
let zoomSlider = null;
let imageInfo = null;
let currentImg = null;

// 图片状态
let currentRotation = 0;
let currentZoom = 100;

/**
 * 初始化插件
 */
function init() {
  // 获取容器元素
  imageContainer = document.getElementById('image-container');
  downloadBtn = document.getElementById('download-btn');
  copyBtn = document.getElementById('copy-btn');
  rotateLeftBtn = document.getElementById('rotate-left-btn');
  rotateRightBtn = document.getElementById('rotate-right-btn');
  resetViewBtn = document.getElementById('reset-view-btn');
  zoomInBtn = document.getElementById('zoom-in-btn');
  zoomOutBtn = document.getElementById('zoom-out-btn');
  zoomSlider = document.getElementById('zoom-slider');
  imageInfo = document.getElementById('image-info');
  
  // 添加事件监听器
  setupEventListeners();
  
  // 加载数据（通过 postMessage）
  loadData();
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 工具栏按钮事件
  if (downloadBtn) downloadBtn.addEventListener('click', downloadImage);
  if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);
  if (rotateLeftBtn) rotateLeftBtn.addEventListener('click', () => rotateImage(-90));
  if (rotateRightBtn) rotateRightBtn.addEventListener('click', () => rotateImage(90));
  if (resetViewBtn) resetViewBtn.addEventListener('click', resetView);
  
  // 缩放控制事件
  if (zoomInBtn) zoomInBtn.addEventListener('click', () => zoomImage(currentZoom + 25));
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => zoomImage(currentZoom - 25));
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (e) => zoomImage(parseInt(e.target.value)));
    zoomSlider.addEventListener('change', (e) => zoomImage(parseInt(e.target.value)));
  }
}

/**
 * 设置消息监听器，接收来自父窗口的数据
 */
function setupMessageListener() {
  window.addEventListener('message', (event) => {
    // 验证消息来源和类型
    if (event.data && event.data.type === 'RICHLOG_PLUGIN_DATA') {
      console.log('图片插件接收到数据:', event.data);
      
      // 存储数据
      imageData = event.data.data;
      
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
  imageContainer.innerHTML = `
    <div class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
      <p class="mt-2">正在加载图片...</p>
    </div>
  `;
}

/**
 * 渲染图片内容
 */
function renderContent() {
  if (!imageData || !imageData.data) {
    showError('无效的图片数据');
    return;
  }
  
  try {
    // 获取图片数据（应该是 base64 格式）
    const imageDataUrl = imageData.data;
    
    // 清空容器
    imageContainer.innerHTML = '';
    
    // 创建图片元素
    const img = document.createElement('img');
    img.src = imageDataUrl;
    img.className = 'img-fluid';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.cursor = 'grab';
    img.alt = '富日志图片';
    
    // 存储当前图片元素的引用
    currentImg = img;
    
    // 添加错误处理
    img.onerror = () => {
      showError('图片加载失败');
    };
    
    // 添加加载完成处理
    img.onload = () => {
      console.log('图片加载完成');
      updateImageInfo();
      applyImageTransform();
    };
    
    // 创建图片容器
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'text-center p-3';
    imgWrapper.appendChild(img);
    
    // 添加到容器
    imageContainer.appendChild(imgWrapper);
    
    // 初始化图片信息
    updateImageInfo();
    
  } catch (error) {
    console.error('渲染图片失败:', error);
    showError('渲染失败: ' + error.message);
  }
}

/**
 * 获取图片类型
 */
function getImageType(dataUrl) {
  if (dataUrl.startsWith('data:image/jpeg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/gif')) return 'GIF';
  if (dataUrl.startsWith('data:image/webp')) return 'WebP';
  if (dataUrl.startsWith('data:image/svg')) return 'SVG';
  return '未知';
}

/**
 * 下载图片
 */
function downloadImage() {
  if (!imageData || !imageData.data) return;
  
  try {
    const link = document.createElement('a');
    link.href = imageData.data;
    link.download = `richlog_image_${Date.now()}.${getImageExtension(imageData.data)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载图片失败:', error);
    alert('下载图片失败');
  }
}

/**
 * 获取图片文件扩展名
 */
function getImageExtension(dataUrl) {
  if (dataUrl.startsWith('data:image/jpeg')) return 'jpg';
  if (dataUrl.startsWith('data:image/png')) return 'png';
  if (dataUrl.startsWith('data:image/gif')) return 'gif';
  if (dataUrl.startsWith('data:image/webp')) return 'webp';
  if (dataUrl.startsWith('data:image/svg')) return 'svg';
  return 'img';
}

/**
 * 复制图片到剪贴板
 */
function copyToClipboard() {
  if (!imageData || !imageData.data) return;
  
  try {
    // 对于图片，我们复制 data URL
    navigator.clipboard.writeText(imageData.data)
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
  } catch (error) {
    console.error('复制图片失败:', error);
    alert('复制图片失败');
  }
}

/**
 * 旋转图片
 */
function rotateImage(degrees) {
  currentRotation += degrees;
  applyImageTransform();
}

/**
 * 缩放图片
 */
function zoomImage(zoomLevel) {
  currentZoom = Math.max(10, Math.min(300, zoomLevel));
  if (zoomSlider) zoomSlider.value = currentZoom;
  applyImageTransform();
  updateImageInfo();
}

/**
 * 重置视图
 */
function resetView() {
  currentRotation = 0;
  currentZoom = 100;
  if (zoomSlider) zoomSlider.value = currentZoom;
  applyImageTransform();
  updateImageInfo();
}

/**
 * 应用图片变换
 */
function applyImageTransform() {
  if (!currentImg) return;
  
  const scale = currentZoom / 100;
  currentImg.style.transform = `rotate(${currentRotation}deg) scale(${scale})`;
}

/**
 * 更新图片信息
 */
function updateImageInfo() {
  if (!imageInfo || !imageData) return;
  
  imageInfo.innerHTML = `
    <div><strong>类型:</strong> ${getImageType(imageData.data)}</div>
    <div><strong>大小:</strong> ${Math.round(imageData.data.length / 1024)} KB</div>
    <div><strong>缩放:</strong> ${currentZoom}%</div>
    <div><strong>旋转:</strong> ${currentRotation}°</div>
  `;
}

/**
 * 显示错误信息
 */
function showError(message) {
  imageContainer.innerHTML = `
    <div class="error-container">
      <div class="alert alert-danger">
        <strong>错误：</strong> ${message}
      </div>
    </div>
  `;
}

// 页面加载时初始化插件
document.addEventListener('DOMContentLoaded', () => {
  init();
});