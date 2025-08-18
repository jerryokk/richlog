#include <gtest/gtest.h>
#include <iostream>

int main(int argc, char** argv) {
    std::cout << "RichLog C++ 测试套件" << std::endl;
    std::cout << "====================" << std::endl;
    
    // 初始化 Google Test
    ::testing::InitGoogleTest(&argc, argv);
    
    // 运行所有测试
    int result = RUN_ALL_TESTS();
    
    if (result == 0) {
        std::cout << "\n✅ 所有测试通过！" << std::endl;
    } else {
        std::cout << "\n❌ 有测试失败！" << std::endl;
    }
    
    return result;
}
