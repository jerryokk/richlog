#ifndef RICHLOG_HPP
#define RICHLOG_HPP

#include <string>
#include <vector>
#include <memory>
#include <cstdint>

namespace richlog {

/**
 * @brief RichLog 数据块结构
 */
struct RichLogBlock {
    std::string type;           // 数据类型
    std::string uuid;           // 唯一标识符
    uint32_t index;             // 当前分片索引
    uint32_t total;             // 总分片数量
    std::vector<uint8_t> data;  // 二进制数据
    
    RichLogBlock() : index(0), total(0) {}
    RichLogBlock(const std::string& t, const std::string& u, uint32_t i, uint32_t tot)
        : type(t), uuid(u), index(i), total(tot) {}
};

/**
 * @brief RichLog 解析器接口
 */
class Parser {
public:
    virtual ~Parser() = default;
    
    /**
     * @brief 从日志行解析 RichLog 数据
     * @param logLine 日志行
     * @return 解析结果，如果不是 RichLog 格式则返回 nullptr
     */
    virtual std::unique_ptr<RichLogBlock> parse(const std::string& logLine) = 0;
    
    /**
     * @brief 检查日志行是否为 RichLog 格式
     * @param logLine 日志行
     * @return 是否为 RichLog 格式
     */
    virtual bool isRichLogFormat(const std::string& logLine) = 0;
};

/**
 * @brief RichLog 编码器接口
 */
class Encoder {
public:
    virtual ~Encoder() = default;
    
    /**
     * @brief 编码数据为 RichLog 格式
     * @param type 数据类型
     * @param data 原始数据
     * @param maxChunkSize 最大分片大小
     * @return 编码后的数据块列表
     */
    virtual std::vector<RichLogBlock> encode(
        const std::string& type,
        const std::vector<uint8_t>& data,
        size_t maxChunkSize = 1024
    ) = 0;
    
    /**
     * @brief 生成 UUID
     * @return UUID 字符串
     */
    virtual std::string generateUUID() = 0;
};

/**
 * @brief RichLog 解码器接口
 */
class Decoder {
public:
    virtual ~Decoder() = default;
    
    /**
     * @brief 解码 RichLog 数据块
     * @param blocks 数据块列表
     * @return 解码后的原始数据
     */
    virtual std::vector<uint8_t> decode(const std::vector<RichLogBlock>& blocks) = 0;
    
    /**
     * @brief 验证数据块完整性
     * @param blocks 数据块列表
     * @return 是否完整
     */
    virtual bool validateBlocks(const std::vector<RichLogBlock>& blocks) = 0;
};

/**
 * @brief 具体实现类
 */
class RichLogParser : public Parser {
public:
    std::unique_ptr<RichLogBlock> parse(const std::string& logLine) override;
    bool isRichLogFormat(const std::string& logLine) override;
};

class RichLogEncoder : public Encoder {
public:
    std::vector<RichLogBlock> encode(
        const std::string& type,
        const std::vector<uint8_t>& data,
        size_t maxChunkSize = 1024
    ) override;
    std::string generateUUID() override;
};

class RichLogDecoder : public Decoder {
public:
    std::vector<uint8_t> decode(const std::vector<RichLogBlock>& blocks) override;
    bool validateBlocks(const std::vector<RichLogBlock>& blocks) override;
};

} // namespace richlog

#endif // RICHLOG_HPP
