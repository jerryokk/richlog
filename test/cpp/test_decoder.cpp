#include <gtest/gtest.h>
#include "richlog.hpp"
#include <string>
#include <vector>

using namespace richlog;

class DecoderTest : public ::testing::Test {
protected:
    RichLogDecoder decoder;
};

TEST_F(DecoderTest, ValidateBlocks_ValidBlocks_ReturnsTrue) {
    std::vector<RichLogBlock> blocks;
    
    // 创建有效的块
    blocks.push_back(RichLogBlock("test", "abc123", 1, 3));
    blocks.push_back(RichLogBlock("test", "abc123", 2, 3));
    blocks.push_back(RichLogBlock("test", "abc123", 3, 3));
    
    EXPECT_TRUE(decoder.validateBlocks(blocks));
}

TEST_F(DecoderTest, ValidateBlocks_EmptyBlocks_ReturnsFalse) {
    std::vector<RichLogBlock> emptyBlocks;
    
    EXPECT_FALSE(decoder.validateBlocks(emptyBlocks));
}

TEST_F(DecoderTest, ValidateBlocks_DifferentUUIDs_ReturnsFalse) {
    std::vector<RichLogBlock> blocks;
    
    blocks.push_back(RichLogBlock("test", "abc123", 1, 2));
    blocks.push_back(RichLogBlock("test", "def456", 2, 2)); // 不同的 UUID
    
    EXPECT_FALSE(decoder.validateBlocks(blocks));
}

TEST_F(DecoderTest, ValidateBlocks_DifferentTypes_ReturnsFalse) {
    std::vector<RichLogBlock> blocks;
    
    blocks.push_back(RichLogBlock("config", "abc123", 1, 2));
    blocks.push_back(RichLogBlock("image", "abc123", 2, 2)); // 不同的类型
    
    EXPECT_FALSE(decoder.validateBlocks(blocks));
}

TEST_F(DecoderTest, ValidateBlocks_NonSequentialIndices_ReturnsFalse) {
    std::vector<RichLogBlock> blocks;
    
    blocks.push_back(RichLogBlock("test", "abc123", 1, 3));
    blocks.push_back(RichLogBlock("test", "abc123", 3, 3)); // 缺少索引 2
    
    EXPECT_FALSE(decoder.validateBlocks(blocks));
}

TEST_F(DecoderTest, ValidateBlocks_IndexNotStartingFromOne_ReturnsFalse) {
    std::vector<RichLogBlock> blocks;
    
    blocks.push_back(RichLogBlock("test", "abc123", 2, 2)); // 索引从 2 开始
    blocks.push_back(RichLogBlock("test", "abc123", 3, 2));
    
    EXPECT_FALSE(decoder.validateBlocks(blocks));
}

TEST_F(DecoderTest, ValidateBlocks_MismatchedTotal_ReturnsFalse) {
    std::vector<RichLogBlock> blocks;
    
    blocks.push_back(RichLogBlock("test", "abc123", 1, 3)); // 总数为 3
    blocks.push_back(RichLogBlock("test", "abc123", 2, 3));
    blocks.push_back(RichLogBlock("test", "abc123", 3, 2)); // 但这里总数为 2
    
    EXPECT_FALSE(decoder.validateBlocks(blocks));
}

TEST_F(DecoderTest, Decode_ValidBlocks_ReturnsCorrectData) {
    std::vector<RichLogBlock> blocks;
    
    // 创建测试数据
    std::string testData = "Hello, World!";
    std::vector<uint8_t> data(testData.begin(), testData.end());
    
    // 分成两个块
    blocks.push_back(RichLogBlock("test", "abc123", 1, 2));
    blocks[0].data.assign(data.begin(), data.begin() + 7); // "Hello, "
    
    blocks.push_back(RichLogBlock("test", "abc123", 2, 2));
    blocks[1].data.assign(data.begin() + 7, data.end()); // "World!"
    
    auto decoded = decoder.decode(blocks);
    
    EXPECT_EQ(decoded, data);
    
    std::string decodedString(decoded.begin(), decoded.end());
    EXPECT_EQ(decodedString, testData);
}

TEST_F(DecoderTest, Decode_BlocksOutOfOrder_ReturnsCorrectData) {
    std::vector<RichLogBlock> blocks;
    
    std::string testData = "ABC123";
    std::vector<uint8_t> data(testData.begin(), testData.end());
    
    // 故意打乱顺序
    blocks.push_back(RichLogBlock("test", "abc123", 3, 3));
    blocks[0].data.assign(data.begin() + 4, data.end()); // "23"
    
    blocks.push_back(RichLogBlock("test", "abc123", 1, 3));
    blocks[1].data.assign(data.begin(), data.begin() + 2); // "AB"
    
    blocks.push_back(RichLogBlock("test", "abc123", 2, 3));
    blocks[2].data.assign(data.begin() + 2, data.begin() + 4); // "C1"
    
    auto decoded = decoder.decode(blocks);
    
    EXPECT_EQ(decoded, data);
    
    std::string decodedString(decoded.begin(), decoded.end());
    EXPECT_EQ(decodedString, testData);
}

TEST_F(DecoderTest, Decode_InvalidBlocks_ReturnsEmpty) {
    std::vector<RichLogBlock> invalidBlocks;
    
    invalidBlocks.push_back(RichLogBlock("test", "abc123", 1, 2));
    invalidBlocks.push_back(RichLogBlock("test", "def456", 2, 2)); // 不同的 UUID
    
    auto decoded = decoder.decode(invalidBlocks);
    
    EXPECT_TRUE(decoded.empty());
}

TEST_F(DecoderTest, Decode_SingleBlock_ReturnsCorrectData) {
    std::vector<RichLogBlock> blocks;
    
    std::string testData = "Single block test";
    std::vector<uint8_t> data(testData.begin(), testData.end());
    
    blocks.push_back(RichLogBlock("test", "abc123", 1, 1));
    blocks[0].data = data;
    
    auto decoded = decoder.decode(blocks);
    
    EXPECT_EQ(decoded, data);
}

TEST_F(DecoderTest, Decode_LargeData_HandlesCorrectly) {
    // 创建较大的测试数据
    std::vector<uint8_t> largeData;
    for (int i = 0; i < 1000; ++i) {
        largeData.push_back(static_cast<uint8_t>(i % 256));
    }
    
    std::vector<RichLogBlock> blocks;
    
    // 分成 10 个块，每个 100 字节
    for (int i = 0; i < 10; ++i) {
        RichLogBlock block("test", "large123", i + 1, 10);
        size_t start = i * 100;
        size_t end = std::min(start + 100, largeData.size());
        block.data.assign(largeData.begin() + start, largeData.begin() + end);
        blocks.push_back(block);
    }
    
    auto decoded = decoder.decode(blocks);
    
    EXPECT_EQ(decoded, largeData);
}
