#include "richlog.hpp"
#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <chrono>
#include <random>
#include <vector>
#include <string>

using namespace richlog;

class LogGenerator {
private:
    RichLogEncoder encoder;
    std::mt19937 rng;
    
public:
    LogGenerator() : rng(std::random_device{}()) {}
    
    // 生成时间戳
    std::string generateTimestamp() {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
            now.time_since_epoch()) % 1000;
        
        std::stringstream ss;
        ss << std::put_time(std::localtime(&time_t), "[%Y-%m-%d %H:%M:%S.");
        ss << std::setfill('0') << std::setw(3) << ms.count() << "]";
        return ss.str();
    }
    
    // 生成配置文件数据
    std::vector<uint8_t> generateConfigData() {
        std::string config = R"({
  "server": {
    "host": "localhost",
    "port": 8080,
    "timeout": 30000
  },
  "database": {
    "host": "db.example.com",
    "port": 5432,
    "name": "richlog_db",
    "pool_size": 10
  },
  "logging": {
    "level": "info",
    "file": "/var/log/richlog.log",
    "max_size": "100MB"
  }
})";
        return std::vector<uint8_t>(config.begin(), config.end());
    }
    
    // 生成图片数据（模拟）
    std::vector<uint8_t> generateImageData() {
        // 创建一个简单的纯色图片，参考 JavaScript 版本生成标准 BMP 格式
        const int width = 200;
        const int height = 100;
        
        // 创建 BMP 文件头
        const int fileSize = 54 + width * height * 3;
        std::vector<uint8_t> imageData;
        
        // BMP 文件头 (54 字节)
        // 魔数 "BM"
        imageData.push_back(0x42); // 'B'
        imageData.push_back(0x4D); // 'M'
        
        // 文件大小 (4 字节，小端序)
        imageData.push_back(static_cast<uint8_t>(fileSize & 0xFF));
        imageData.push_back(static_cast<uint8_t>((fileSize >> 8) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((fileSize >> 16) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((fileSize >> 24) & 0xFF));
        
        // 保留字段 (4 字节)
        for (int i = 0; i < 4; ++i) {
            imageData.push_back(0x00);
        }
        
        // 像素数据偏移 (4 字节)
        imageData.push_back(0x36); // 54
        imageData.push_back(0x00);
        imageData.push_back(0x00);
        imageData.push_back(0x00);
        
        // DIB 头 (40 字节)
        // DIB 头大小 (4 字节)
        imageData.push_back(0x28); // 40
        imageData.push_back(0x00);
        imageData.push_back(0x00);
        imageData.push_back(0x00);
        
        // 宽度 (4 字节，小端序)
        imageData.push_back(static_cast<uint8_t>(width & 0xFF));
        imageData.push_back(static_cast<uint8_t>((width >> 8) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((width >> 16) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((width >> 24) & 0xFF));
        
        // 高度 (4 字节，小端序)
        imageData.push_back(static_cast<uint8_t>(height & 0xFF));
        imageData.push_back(static_cast<uint8_t>((height >> 8) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((height >> 16) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((height >> 24) & 0xFF));
        
        // 颜色平面数 (2 字节)
        imageData.push_back(0x01);
        imageData.push_back(0x00);
        
        // 每像素位数 (2 字节)
        imageData.push_back(0x18); // 24 位
        imageData.push_back(0x00);
        
        // 压缩方法 (4 字节)
        for (int i = 0; i < 4; ++i) {
            imageData.push_back(0x00);
        }
        
        // 图像大小 (4 字节)
        const int imageSize = width * height * 3;
        imageData.push_back(static_cast<uint8_t>(imageSize & 0xFF));
        imageData.push_back(static_cast<uint8_t>((imageSize >> 8) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((imageSize >> 16) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((imageSize >> 24) & 0xFF));
        
        // 水平分辨率 (4 字节)
        const int hResolution = 2835;
        imageData.push_back(static_cast<uint8_t>(hResolution & 0xFF));
        imageData.push_back(static_cast<uint8_t>((hResolution >> 8) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((hResolution >> 16) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((hResolution >> 24) & 0xFF));
        
        // 垂直分辨率 (4 字节)
        imageData.push_back(static_cast<uint8_t>(hResolution & 0xFF));
        imageData.push_back(static_cast<uint8_t>((hResolution >> 8) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((hResolution >> 16) & 0xFF));
        imageData.push_back(static_cast<uint8_t>((hResolution >> 24) & 0xFF));
        
        // 调色板颜色数 (4 字节)
        for (int i = 0; i < 4; ++i) {
            imageData.push_back(0x00);
        }
        
        // 重要颜色数 (4 字节)
        for (int i = 0; i < 4; ++i) {
            imageData.push_back(0x00);
        }
        
        // 像素数据 (BMP 格式，从下到上，从左到右)
        std::uniform_int_distribution<uint8_t> dist(0, 255);
        for (int y = height - 1; y >= 0; --y) { // BMP 从下到上
            for (int x = 0; x < width; ++x) {
                // 创建渐变色，参考 JavaScript 版本
                uint8_t blue = static_cast<uint8_t>(255 * x / width);   // 蓝色渐变
                uint8_t green = static_cast<uint8_t>(255 * y / height); // 绿色渐变
                uint8_t red = 128; // 红色固定
                
                // BMP 格式：BGR (蓝绿红)
                imageData.push_back(blue);   // 蓝色
                imageData.push_back(green);  // 绿色
                imageData.push_back(red);    // 红色
            }
        }
        
        return imageData;
    }
    
    // 生成命令输出数据
    std::vector<uint8_t> generateCommandData() {
        std::string command = R"(Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/sda1       52428800  12345678  40083122  24% /
tmpfs            8388608        0   8388608   0% /dev/shm
/dev/sdb1      104857600 56789012  48068588  55% /home
/dev/sdc1      209715200 12345678 197369522   6% /data

Total: 367001600 blocks used, 285521232 blocks available)";
        return std::vector<uint8_t>(command.begin(), command.end());
    }
    
    // 生成随机日志消息
    std::string generateRandomMessage() {
        std::vector<std::string> messages = {
            "User login successful",
            "Database connection established",
            "Cache miss, fetching from database",
            "Request processed in 45ms",
            "Memory usage: 45%",
            "CPU load: 0.8",
            "Network packet received",
            "File uploaded successfully",
            "API rate limit exceeded",
            "Backup completed"
        };
        
        std::uniform_int_distribution<size_t> dist(0, messages.size() - 1);
        return messages[dist(rng)];
    }
    
    // 生成 RichLog 日志行
    std::string generateRichLogLine(const std::string& type, 
                                   const std::vector<uint8_t>& data,
                                   size_t maxChunkSize = 1024) {
        auto blocks = encoder.encode(type, data, maxChunkSize);
        std::stringstream ss;
        
        for (const auto& block : blocks) {
            ss << generateTimestamp() << " RICHLOG:" 
               << block.type << "," 
               << block.uuid << "," 
               << block.index << "," 
               << block.total << ",";
            
            // 将二进制数据转换为十六进制字符串
            for (uint8_t byte : block.data) {
                ss << std::hex << std::setfill('0') << std::setw(2) 
                   << static_cast<int>(byte);
            }
            ss << std::dec << "\n";
        }
        
        return ss.str();
    }
    
    // 生成完整的日志文件
    void generateLogFile(const std::string& filename, int numEntries = 50) {
        std::ofstream file(filename);
        if (!file.is_open()) {
            std::cerr << "❌ 无法创建文件: " << filename << std::endl;
            return;
        }
        
        std::cout << "🚀 开始生成 RichLog 测试日志文件..." << std::endl;
        
        // 添加一些普通的日志消息
        for (int i = 0; i < numEntries / 3; ++i) {
            file << generateTimestamp() << " INFO: " << generateRandomMessage() << "\n";
        }
        
        // 添加配置文件数据
        std::cout << "📝 生成配置文件数据..." << std::endl;
        auto configData = generateConfigData();
        file << generateRichLogLine("config", configData);
        
        // 添加一些普通日志
        for (int i = 0; i < numEntries / 6; ++i) {
            file << generateTimestamp() << " DEBUG: " << generateRandomMessage() << "\n";
        }
        
        // 添加图片数据
        std::cout << "🖼️  生成图片数据..." << std::endl;
        auto imageData = generateImageData();
        file << generateRichLogLine("image", imageData, 512); // 较小的分块大小
        
        // 添加更多普通日志
        for (int i = 0; i < numEntries / 6; ++i) {
            file << generateTimestamp() << " WARN: " << generateRandomMessage() << "\n";
        }
        
        // 添加命令输出数据
        std::cout << "💻 生成命令输出数据..." << std::endl;
        auto commandData = generateCommandData();
        file << generateRichLogLine("command", commandData);
        
        // 添加剩余的普通日志
        for (int i = 0; i < numEntries / 6; ++i) {
            file << generateTimestamp() << " INFO: " << generateRandomMessage() << "\n";
        }
        
        file.close();
        
        std::cout << "✅ 日志文件生成完成: " << filename << std::endl;
        std::cout << "📊 包含以下 RichLog 数据类型:" << std::endl;
        std::cout << "   - config: 配置文件" << std::endl;
        std::cout << "   - image: 图片数据" << std::endl;
        std::cout << "   - command: 命令输出" << std::endl;
        std::cout << "   - 普通日志消息" << std::endl;
    }
};

int main() {
    std::cout << "🚀 RichLog C++ 日志生成器" << std::endl;
    std::cout << "=========================" << std::endl;
    
    std::string filename = "test_richlog.log";
    int numEntries = 50;
    
    std::cout << "📁 输出文件: " << filename << std::endl;
    std::cout << "📊 日志条目数: " << numEntries << std::endl;
    std::cout << std::endl;
    
    LogGenerator generator;
    generator.generateLogFile(filename, numEntries);
    
    std::cout << std::endl;
    std::cout << "💡 提示: 可以使用以下命令查看生成的日志:" << std::endl;
    std::cout << "   cat " << filename << std::endl;
    std::cout << "   tail -f " << filename << std::endl;
    std::cout << "   grep RICHLOG " << filename << std::endl;
    
    return 0;
}
