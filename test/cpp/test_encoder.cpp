#include <gtest/gtest.h>
#include "richlog.hpp"
#include <string>
#include <vector>
#include <regex>

using namespace richlog;

class EncoderTest : public ::testing::Test {
protected:
    RichLogEncoder encoder;
};

TEST_F(EncoderTest, Encode_SingleChunk_ReturnsOneBlock) {
    std::string testData = "Hello, World!";
    std::vector<uint8_t> data(testData.begin(), testData.end());
    
    auto blocks = encoder.encode("test", data, 1024);
    
    EXPECT_EQ(blocks.size(), 1);
    EXPECT_EQ(blocks[0].type, "test");
    EXPECT_EQ(blocks[0].index, 1);
    EXPECT_EQ(blocks[0].total, 1);
    EXPECT_EQ(blocks[0].data, data);
}

TEST_F(EncoderTest, Encode_MultipleChunks_ReturnsCorrectBlocks) {
    std::string testData = "This is a longer test string that will be split into multiple chunks";
    std::vector<uint8_t> data(testData.begin(), testData.end());
    
    auto blocks = encoder.encode("test", data, 20); // 20 bytes per chunk
    
    EXPECT_EQ(blocks.size(), 4); // 64 bytes / 20 = 4 chunks
    
    // 检查所有块都有相同的 UUID 和类型
    std::string firstUuid = blocks[0].uuid;
    for (const auto& block : blocks) {
        EXPECT_EQ(block.uuid, firstUuid);
        EXPECT_EQ(block.type, "test");
    }
    
    // 检查索引和总数
    for (size_t i = 0; i < blocks.size(); ++i) {
        EXPECT_EQ(blocks[i].index, static_cast<uint32_t>(i + 1));
        EXPECT_EQ(blocks[i].total, static_cast<uint32_t>(blocks.size()));
    }
}

TEST_F(EncoderTest, Encode_EmptyData_ReturnsEmptyBlocks) {
    std::vector<uint8_t> emptyData;
    
    auto blocks = encoder.encode("test", emptyData);
    
    EXPECT_EQ(blocks.size(), 1);
    EXPECT_EQ(blocks[0].data.size(), 0);
}

TEST_F(EncoderTest, Encode_ExactChunkSize_ReturnsCorrectBlocks) {
    std::string testData = "12345678901234567890"; // 20 characters
    std::vector<uint8_t> data(testData.begin(), testData.end());
    
    auto blocks = encoder.encode("test", data, 20);
    
    EXPECT_EQ(blocks.size(), 1);
    EXPECT_EQ(blocks[0].data.size(), 20);
}

TEST_F(EncoderTest, Encode_DifferentTypes_ReturnsCorrectType) {
    std::string testData = "test data";
    std::vector<uint8_t> data(testData.begin(), testData.end());
    
    auto configBlocks = encoder.encode("config", data);
    auto imageBlocks = encoder.encode("image", data);
    auto commandBlocks = encoder.encode("command", data);
    
    EXPECT_EQ(configBlocks[0].type, "config");
    EXPECT_EQ(imageBlocks[0].type, "image");
    EXPECT_EQ(commandBlocks[0].type, "command");
}

TEST_F(EncoderTest, GenerateUUID_ReturnsValidFormat) {
    std::string uuid1 = encoder.generateUUID();
    std::string uuid2 = encoder.generateUUID();
    
    // UUID 应该是 8 个字符的十六进制字符串
    EXPECT_EQ(uuid1.length(), 8);
    EXPECT_EQ(uuid2.length(), 8);
    
    // 两个 UUID 应该不同
    EXPECT_NE(uuid1, uuid2);
    
    // 检查是否为有效的十六进制字符串
    std::regex hexPattern("^[0-9a-f]{8}$");
    EXPECT_TRUE(std::regex_match(uuid1, hexPattern));
    EXPECT_TRUE(std::regex_match(uuid2, hexPattern));
}

TEST_F(EncoderTest, Encode_DataReconstruction_IsCorrect) {
    std::string originalData = "This is the original test data that should be reconstructed correctly";
    std::vector<uint8_t> data(originalData.begin(), originalData.end());
    
    auto blocks = encoder.encode("test", data, 15); // 15 bytes per chunk
    
    // 重建数据
    std::vector<uint8_t> reconstructed;
    for (const auto& block : blocks) {
        reconstructed.insert(reconstructed.end(), block.data.begin(), block.data.end());
    }
    
    EXPECT_EQ(reconstructed, data);
    
    std::string reconstructedString(reconstructed.begin(), reconstructed.end());
    EXPECT_EQ(reconstructedString, originalData);
}
