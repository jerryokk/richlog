#include <gtest/gtest.h>
#include "richlog.hpp"
#include <string>

using namespace richlog;

class ParserTest : public ::testing::Test {
protected:
    RichLogParser parser;
};

TEST_F(ParserTest, IsRichLogFormat_ValidFormat_ReturnsTrue) {
    std::string validLog = "[2023-08-15 10:00:01.236] RICHLOG:config,c9a3a0ad,1,1,7b22736572766572223a7b";
    EXPECT_TRUE(parser.isRichLogFormat(validLog));
}

TEST_F(ParserTest, IsRichLogFormat_InvalidFormat_ReturnsFalse) {
    std::string invalidLog = "[2023-08-15 10:00:01.236] INFO: This is a normal log message";
    EXPECT_FALSE(parser.isRichLogFormat(invalidLog));
}

TEST_F(ParserTest, Parse_ValidRichLog_ReturnsCorrectBlock) {
    std::string validLog = "[2023-08-15 10:00:01.236] RICHLOG:config,c9a3a0ad,1,1,7b22736572766572223a7b";
    
    auto block = parser.parse(validLog);
    ASSERT_NE(block, nullptr);
    
    EXPECT_EQ(block->type, "config");
    EXPECT_EQ(block->uuid, "c9a3a0ad");
    EXPECT_EQ(block->index, 1);
    EXPECT_EQ(block->total, 1);
    EXPECT_FALSE(block->data.empty());
}

TEST_F(ParserTest, Parse_InvalidRichLog_ReturnsNullptr) {
    std::string invalidLog = "[2023-08-15 10:00:01.236] INFO: This is a normal log message";
    
    auto block = parser.parse(invalidLog);
    EXPECT_EQ(block, nullptr);
}

TEST_F(ParserTest, Parse_MalformedRichLog_ReturnsNullptr) {
    std::string malformedLog = "[2023-08-15 10:00:01.236] RICHLOG:config,c9a3a0ad,1,1";
    
    auto block = parser.parse(malformedLog);
    EXPECT_EQ(block, nullptr);
}

TEST_F(ParserTest, Parse_ImageData_ReturnsCorrectBlock) {
    std::string imageLog = "[2023-08-15 10:15:30.533] RICHLOG:image,e5f6g7h8,1,2,FFD8FFE000104A4649";
    
    auto block = parser.parse(imageLog);
    ASSERT_NE(block, nullptr);
    
    EXPECT_EQ(block->type, "image");
    EXPECT_EQ(block->uuid, "e5f6g7h8");
    EXPECT_EQ(block->index, 1);
    EXPECT_EQ(block->total, 2);
    EXPECT_FALSE(block->data.empty());
}

TEST_F(ParserTest, Parse_CommandData_ReturnsCorrectBlock) {
    std::string commandLog = "[2023-08-15 11:00:00.755] RICHLOG:command,m3n4o5p6,1,1,46696c6573797374656d";
    
    auto block = parser.parse(commandLog);
    ASSERT_NE(block, nullptr);
    
    EXPECT_EQ(block->type, "command");
    EXPECT_EQ(block->uuid, "m3n4o5p6");
    EXPECT_EQ(block->index, 1);
    EXPECT_EQ(block->total, 1);
    EXPECT_FALSE(block->data.empty());
}

TEST_F(ParserTest, Parse_HexData_ConvertsCorrectly) {
    std::string hexLog = "[2023-08-15 10:00:01.236] RICHLOG:test,abc123,1,1,48656C6C6F"; // "Hello" in hex
    
    auto block = parser.parse(hexLog);
    ASSERT_NE(block, nullptr);
    
    std::string expected = "Hello";
    std::string actual(block->data.begin(), block->data.end());
    EXPECT_EQ(actual, expected);
}
