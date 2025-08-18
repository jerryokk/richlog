# RichLog C++ 测试

这个目录包含了 RichLog 项目的 C++ 测试代码，用于验证核心功能的正确性。

## 📁 目录结构

```
test/cpp/
├── include/           # 头文件
│   └── richlog.hpp   # RichLog 核心接口定义
├── src/              # 实现文件
│   └── richlog.cpp   # RichLog 核心功能实现
├── test_parser.cpp   # 解析器测试
├── test_encoder.cpp  # 编码器测试
├── test_decoder.cpp  # 解码器测试
├── generate_log.cpp  # 日志生成器
├── main.cpp          # 主程序入口
├── CMakeLists.txt    # CMake 构建配置
├── Makefile          # Make 构建配置
├── build_and_test.sh # 便捷构建脚本
└── README.md         # 本文档
```

## 🚀 快速开始

### 环境要求

- C++17 兼容的编译器（GCC 7+, Clang 5+, MSVC 2017+）
- CMake 3.16+ 或 Make
- Google Test 库

### 安装依赖

#### Ubuntu/Debian
```bash
make install-deps
```

#### CentOS/RHEL
```bash
make install-deps-centos
```

#### macOS
```bash
brew install cmake googletest
```

### 构建和测试

#### 使用自动化脚本（推荐）
```bash
# 运行完整的构建和测试流程
./build_and_test.sh
```

#### 使用 Makefile
```bash
# 构建测试程序和日志生成器
make all

# 运行测试
make test

# 生成测试日志文件
make generate-log

# 生成指定名称的日志文件
make generate-log-mycustom

# 清理构建文件
make clean

# 查看帮助
make help
```

#### 使用 CMake
```bash
# 创建构建目录
mkdir build && cd build

# 配置项目
cmake ..

# 构建项目
make

# 运行测试
ctest --verbose
```

## 🧪 测试覆盖

### 解析器测试 (test_parser.cpp)
- 验证 RichLog 格式识别
- 测试日志行解析
- 验证十六进制数据转换
- 测试各种数据类型（config、image、command）

### 编码器测试 (test_encoder.cpp)
- 测试数据编码功能
- 验证分块逻辑
- 测试 UUID 生成
- 验证数据重建完整性

### 解码器测试 (test_decoder.cpp)
- 测试数据块验证
- 验证数据解码功能
- 测试乱序块处理
- 验证大数据集处理

## 📝 日志生成器

### 功能特性
- **自动时间戳生成** - 使用当前系统时间
- **多种数据类型** - 支持 config、image、command 等
- **真实数据模拟** - 生成有意义的测试数据
- **灵活配置** - 可自定义输出文件名和日志条目数

### 使用方法
```bash
# 生成测试日志文件 (test_richlog.log)
make generate-log

# 直接运行日志生成器
./build/generate_log
```

### 生成的日志内容
- **配置文件数据** - JSON 格式的服务器配置
- **图片数据** - 模拟的 PNG 图片头和数据
- **命令输出** - 模拟的磁盘使用情况输出
- **普通日志消息** - INFO、DEBUG、WARN 级别的日志

### 日志格式示例
```
[2025-08-18 15:02:09.765] INFO: Database connection established
[2025-08-18 15:02:09.765] RICHLOG:config,5f35c0af,1,1,7b0a202022736572766572223a...
[2025-08-18 15:02:09.765] DEBUG: Request processed in 45ms
[2025-08-18 15:02:09.765] RICHLOG:image,ad3acbe4,1,1,89504e470d0a1a0a...
[2025-08-18 15:02:09.765] WARN: Memory usage: 45%
[2025-08-18 15:02:09.765] RICHLOG:command,8b31b4cf,1,1,46696c6573797374656d...
```

## 🔧 核心功能

### RichLogBlock 结构
```cpp
struct RichLogBlock {
    std::string type;           // 数据类型
    std::string uuid;           // 唯一标识符
    uint32_t index;             // 当前分片索引
    uint32_t total;             // 总分片数量
    std::vector<uint8_t> data;  // 二进制数据
};
```

### 主要接口
- **Parser**: 解析日志行，提取 RichLog 数据
- **Encoder**: 将原始数据编码为 RichLog 格式
- **Decoder**: 解码 RichLog 数据块，重建原始数据

## 📊 测试数据格式

测试使用与 JavaScript 版本相同的 RichLog 格式：

```
[时间戳] RICHLOG:type,uuid,index,total,hexdata
```

示例：
```
[2023-08-15 10:00:01.236] RICHLOG:config,c9a3a0ad,1,1,7b22736572766572223a7b
[2023-08-15 10:15:30.533] RICHLOG:image,e5f6g7h8,1,2,FFD8FFE000104A4649
```

## 🐛 故障排除

### 编译错误
- 确保使用 C++17 标准
- 检查 Google Test 库是否正确安装
- 验证编译器版本兼容性

### 链接错误
- 确保链接了正确的库（-lgtest -lgtest_main -lpthread）
- 检查库文件路径

### 运行时错误
- 验证测试数据格式
- 检查文件权限
- 查看详细的错误输出

## 🔄 与 JavaScript 版本的集成

C++ 测试版本与 JavaScript 版本共享相同的数据格式和接口设计，确保：

- 数据格式兼容性
- 接口一致性
- 测试覆盖完整性
- 跨平台验证

### 交叉验证
生成的测试日志可以同时用于：
1. C++ 版本的 RichLog 解析器测试
2. JavaScript 版本的 RichLog 解析器测试
3. 跨语言功能验证

## 📝 贡献指南

1. 添加新测试时，遵循现有的命名约定
2. 确保测试覆盖边界情况
3. 保持测试代码的可读性和可维护性
4. 更新相关文档
5. 添加新的日志生成器功能时，保持数据格式的一致性

## 📄 许可证

本项目采用 MIT 许可证，详见项目根目录的 LICENSE 文件。
