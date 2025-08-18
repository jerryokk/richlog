# RichLog JavaScript 测试

这个目录包含了 RichLog 项目的 JavaScript 测试代码。

## 📁 文件说明

- `generate-log.js` - 生成测试用的 RichLog 格式日志文件

## 🚀 使用方法

```bash
# 生成测试日志
node generate-log.js

# 或者指定输出文件
node generate-log.js output.log
```

## 📊 生成的日志格式

该脚本会生成包含以下数据类型的测试日志：

- **配置文件** (config) - JSON 格式的配置数据
- **图片数据** (image) - 模拟的图片二进制数据
- **命令输出** (command) - 模拟的命令行输出

## 🔄 与 C++ 测试的集成

生成的测试日志可以同时用于：

1. JavaScript 版本的 RichLog 解析器测试
2. C++ 版本的 RichLog 解析器测试
3. 跨语言功能验证

确保两个版本都能正确解析相同格式的日志数据。
