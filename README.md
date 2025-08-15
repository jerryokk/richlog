# RichLog - 富媒体日志查看器

RichLog 是一个现代化的日志增强工具，专门用于在标准文本日志中嵌入和解析富媒体内容。当应用程序需要在日志中记录图片、配置文件、命令输出等复杂数据时，RichLog 将这些数据编码后嵌入日志，并提供直观的 Web 界面进行查看和分析。

## ✨ 特性

- 🔍 **智能解析**：自动识别和重组日志中的 RICHLOG 格式数据
- 🖼️ **多媒体支持**：支持图片、配置文件、命令输出等多种数据类型
- 🔌 **插件架构**：可扩展的插件系统，支持自定义数据类型
- 🌐 **Web 界面**：现代化的响应式 Web 界面
- 🔎 **搜索过滤**：支持关键词搜索和类型筛选
- 📱 **移动友好**：响应式设计，支持移动设备

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/jerryokk/richlog.git
cd richlog

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:9000` 查看应用。

### 构建生产版本

```bash
# 构建生产版本
npm run build

# 构建输出在 dist/ 目录
```

## 📊 数据格式

RichLog 使用特定的格式在日志中嵌入富媒体数据：

```
[时间戳] RICHLOG:type,uuid,index,total,hexdata
```

**参数说明：**
- `type`: 数据类型（config、image、command 等）
- `uuid`: 唯一标识符，用于关联分片数据
- `index`: 当前分片索引（从 1 开始）
- `total`: 总分片数量
- `hexdata`: 十六进制编码的数据

**示例：**
```
[2023-08-15 10:00:01.236] RICHLOG:config,c9a3a0ad,1,1,7b22736572766572223a7b...
[2023-08-15 10:15:30.533] RICHLOG:image,e5f6g7h8,1,2,FFD8FFE000104A4649...
[2023-08-15 10:15:30.533] RICHLOG:image,e5f6g7h8,2,2,FFD8FFE000104A4649...
[2023-08-15 11:00:00.755] RICHLOG:command,m3n4o5p6,1,1,46696c6573797374656d...
```

## 🔌 插件系统

RichLog 采用模块化的插件架构，支持自动发现和加载插件。

### 内置插件

| 插件类型 | 描述 | 功能 |
|---------|------|------|
| **config** | 配置文件查看器 | JSON/XML 格式化显示，语法高亮，搜索 |
| **image** | 图片查看器 | 图片显示，缩放，旋转，下载 |
| **command** | 命令输出查看器 | 命令行输出格式化，搜索，复制 |

### 插件结构

```
src/plugins/
├── config/
│   ├── plugin.json          # 插件配置
│   ├── index.html           # 插件界面
│   └── script.js            # 插件逻辑
├── image/
│   ├── plugin.json
│   ├── index.html
│   └── script.js
└── command/
    ├── plugin.json
    ├── index.html
    └── script.js
```

### 创建自定义插件

1. 在 `src/plugins/` 下创建新目录，如 `sensor/`
2. 创建必需文件：

**plugin.json**
```json
{
  "type": "sensor",
  "name": "传感器数据",
  "description": "查看传感器数据",
  "color": "warning",
  "mainColor": "#ffc107",
  "bgColor": "bg-warning",
  "icon": "activity",
  "version": "1.0.0"
}
```

**index.html**
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>传感器数据查看器</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div id="sensor-container">
        <!-- 插件内容 -->
    </div>
</body>
</html>
```

**script.js**
```javascript
const PluginBase = require('../plugin-base');

class SensorPlugin extends PluginBase {
    displayData(data) {
        // 实现数据显示逻辑
        document.getElementById('sensor-container').innerHTML = 
            `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
}

new SensorPlugin();
```

3. 重新构建项目，插件将自动被发现和加载

## 🛠️ 开发

### 项目结构

```
richlog/
├── src/
│   ├── core/                # 核心解析引擎
│   │   ├── index.js
│   │   ├── richlog-encoder.js
│   │   ├── richlog-parser.js
│   │   └── plugin-handler.js
│   ├── plugins/             # 插件系统
│   │   ├── index.js
│   │   ├── plugin-base.js
│   │   ├── plugin-registry.js
│   │   ├── plugin-scanner.js
│   │   └── */               # 各种插件
│   └── web/                 # Web 界面
│       ├── index.js
│       ├── index.html
│       └── styles.css
├── test/                    # 测试文件
│   ├── generate-log.js      # 日志生成器
│   └── sample.log           # 示例日志
├── dist/                    # 构建输出
├── webpack.config.js        # Webpack 配置
└── package.json
```

### 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 生产构建
npm run build

# 生成测试日志
cd test && node generate-log.js
```

### 技术栈

- **前端框架**: 原生 JavaScript + Bootstrap 5
- **构建工具**: Webpack 5
- **开发服务器**: webpack-dev-server
- **样式**: CSS + Bootstrap
- **通信**: postMessage API（插件间通信）

## 📝 使用示例

### 生成测试数据

```bash
cd test
node generate-log.js
```

这会生成包含各种富媒体数据的示例日志文件。

### 在应用中使用

1. 启动 RichLog Web 界面
2. 点击"加载日志"按钮，选择日志文件
3. 或者点击"粘贴日志"按钮，直接粘贴日志内容
4. 点击富媒体链接查看详细内容

### 界面功能

- **搜索**: 在搜索框中输入关键词过滤日志
- **类型筛选**: 点击侧边栏的数据类型进行筛选
- **富媒体查看**: 点击 `📎 [类型] 查看内容` 链接打开详细视图
- **插件交互**: 在插件窗口中进行缩放、旋转、搜索等操作

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔄 版本历史

### v1.0.0
- ✅ 核心日志解析功能
- ✅ 插件系统架构
- ✅ Web 界面和用户交互
- ✅ 配置文件、图片、命令输出插件
- ✅ 自动插件发现机制
- ✅ postMessage 通信系统
- ✅ 响应式界面设计
