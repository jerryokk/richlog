#!/bin/bash

# RichLog C++ 测试构建和运行脚本

echo "🚀 RichLog C++ 测试构建和运行脚本"
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "Makefile" ]; then
    echo "❌ 错误：请在 test/cpp 目录中运行此脚本"
    exit 1
fi

# 检查依赖
echo "📋 检查依赖..."
if ! command -v g++ &> /dev/null; then
    echo "❌ 错误：未找到 g++ 编译器"
    echo "请安装 build-essential 包："
    echo "  Ubuntu/Debian: sudo apt-get install build-essential"
    echo "  CentOS/RHEL: sudo yum groupinstall 'Development Tools'"
    exit 1
fi

# 检查 Google Test 库
if ! pkg-config --exists gtest; then
    echo "⚠️  警告：未找到 Google Test 库"
    echo "请安装 libgtest-dev 包："
    echo "  Ubuntu/Debian: sudo apt-get install libgtest-dev"
    echo "  CentOS/RHEL: sudo yum install gtest-devel"
    echo ""
    echo "或者使用 make install-deps 命令"
fi

echo "✅ 依赖检查完成"

# 清理之前的构建
echo "🧹 清理之前的构建..."
make clean

# 构建项目
echo "🔨 构建项目..."
if make all; then
    echo "✅ 构建成功！"
else
    echo "❌ 构建失败！"
    exit 1
fi

# 运行测试
echo "🧪 运行测试..."
if make test; then
    echo ""
    echo "🎉 所有测试通过！"
    echo ""
    echo "📁 构建文件位置："
    echo "   - 测试程序：build/richlog_test"
    echo "   - 日志生成器：build/generate_log"
    echo ""
    echo "🚀 可以直接运行："
    echo "   - 测试：./build/richlog_test"
    echo "   - 生成日志：./build/generate_log"
else
    echo "❌ 测试失败！"
    exit 1
fi

# 询问是否生成测试日志
echo ""
read -p "🤔 是否生成测试日志文件？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 生成测试日志..."
    if make generate-log; then
        echo "✅ 日志文件生成成功！"
        echo "📁 日志文件：test_richlog.log"
        echo ""
        echo "💡 查看日志的命令："
        echo "   cat test_richlog.log"
        echo "   grep RICHLOG test_richlog.log"
        echo "   tail -f test_richlog.log"
    else
        echo "❌ 日志生成失败！"
    fi
fi

echo ""
echo "✨ 脚本执行完成！"
echo ""
echo "📚 可用的 make 目标："
echo "   make test              - 运行测试"
echo "   make generate-log      - 生成测试日志文件"
echo "   make help              - 查看所有可用目标"
