#include "richlog.hpp"
#include <regex>
#include <sstream>
#include <iomanip>
#include <random>
#include <algorithm>

namespace richlog {

// RichLogParser 实现
std::unique_ptr<RichLogBlock> RichLogParser::parse(const std::string& logLine) {
    if (!isRichLogFormat(logLine)) {
        return nullptr;
    }
    
    // 匹配 RICHLOG:type,uuid,index,total,hexdata 格式
    std::regex pattern(R"(RICHLOG:([^,]+),([^,]+),(\d+),(\d+),([0-9a-fA-F]+))");
    std::smatch matches;
    
    if (std::regex_search(logLine, matches, pattern)) {
        auto block = std::make_unique<RichLogBlock>();
        block->type = matches[1].str();
        block->uuid = matches[2].str();
        block->index = std::stoul(matches[3].str());
        block->total = std::stoul(matches[4].str());
        
        // 解析十六进制数据
        std::string hexData = matches[5].str();
        for (size_t i = 0; i < hexData.length(); i += 2) {
            if (i + 1 < hexData.length()) {
                std::string byteString = hexData.substr(i, 2);
                uint8_t byte = static_cast<uint8_t>(std::stoul(byteString, nullptr, 16));
                block->data.push_back(byte);
            }
        }
        
        return block;
    }
    
    return nullptr;
}

bool RichLogParser::isRichLogFormat(const std::string& logLine) {
    return logLine.find("RICHLOG:") != std::string::npos;
}

// RichLogEncoder 实现
std::vector<RichLogBlock> RichLogEncoder::encode(
    const std::string& type,
    const std::vector<uint8_t>& data,
    size_t maxChunkSize) {
    
    std::vector<RichLogBlock> blocks;
    std::string uuid = generateUUID();
    
    size_t totalChunks = (data.size() + maxChunkSize - 1) / maxChunkSize;
    
    // 确保至少有一个块，即使数据为空
    if (totalChunks == 0) {
        totalChunks = 1;
    }
    
    for (size_t i = 0; i < totalChunks; ++i) {
        size_t start = i * maxChunkSize;
        size_t end = std::min(start + maxChunkSize, data.size());
        
        RichLogBlock block;
        block.type = type;
        block.uuid = uuid;
        block.index = static_cast<uint32_t>(i + 1);
        block.total = static_cast<uint32_t>(totalChunks);
        block.data.assign(data.begin() + start, data.begin() + end);
        
        blocks.push_back(block);
    }
    
    return blocks;
}

std::string RichLogEncoder::generateUUID() {
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<> dis(0, 15);
    
    const char* hexChars = "0123456789abcdef";
    std::string uuid;
    uuid.reserve(8);
    
    for (int i = 0; i < 8; ++i) {
        uuid += hexChars[dis(gen)];
    }
    
    return uuid;
}

// RichLogDecoder 实现
std::vector<uint8_t> RichLogDecoder::decode(const std::vector<RichLogBlock>& blocks) {
    if (!validateBlocks(blocks)) {
        return {};
    }
    
    // 按索引排序
    auto sortedBlocks = blocks;
    std::sort(sortedBlocks.begin(), sortedBlocks.end(), 
              [](const RichLogBlock& a, const RichLogBlock& b) {
                  return a.index < b.index;
              });
    
    std::vector<uint8_t> result;
    for (const auto& block : sortedBlocks) {
        result.insert(result.end(), block.data.begin(), block.data.end());
    }
    
    return result;
}

bool RichLogDecoder::validateBlocks(const std::vector<RichLogBlock>& blocks) {
    if (blocks.empty()) {
        return false;
    }
    
    // 检查所有块是否属于同一个 UUID 和类型
    const auto& firstBlock = blocks[0];
    for (const auto& block : blocks) {
        if (block.uuid != firstBlock.uuid || block.type != firstBlock.type) {
            return false;
        }
    }
    
    // 检查索引是否连续且从 1 开始
    std::vector<uint32_t> indices;
    for (const auto& block : blocks) {
        indices.push_back(block.index);
    }
    
    std::sort(indices.begin(), indices.end());
    for (size_t i = 0; i < indices.size(); ++i) {
        if (indices[i] != static_cast<uint32_t>(i + 1)) {
            return false;
        }
    }
    
    // 检查总数是否一致
    for (const auto& block : blocks) {
        if (block.total != static_cast<uint32_t>(blocks.size())) {
            return false;
        }
    }
    
    return true;
}

} // namespace richlog
