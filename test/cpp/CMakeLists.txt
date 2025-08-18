cmake_minimum_required(VERSION 3.16)
project(RichLogCppTest)

# 设置 C++ 标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 查找必要的包
find_package(GTest REQUIRED)

# 添加可执行文件
add_executable(richlog_test
    main.cpp
    test_parser.cpp
    test_encoder.cpp
    test_decoder.cpp
)

# 链接 GTest 库
target_link_libraries(richlog_test GTest::gtest GTest::gtest_main)

# 包含头文件目录
target_include_directories(richlog_test PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../src
)

# 启用测试
enable_testing()
add_test(NAME RichLogTests COMMAND richlog_test)

# 设置编译选项
if(MSVC)
    target_compile_options(richlog_test PRIVATE /W4)
else()
    target_compile_options(richlog_test PRIVATE -Wall -Wextra -Wpedantic)
endif()
