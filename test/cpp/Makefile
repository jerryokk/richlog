# RichLog C++ 测试 Makefile

# 编译器设置
CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -pedantic -g

# 目录设置
SRC_DIR = src
INCLUDE_DIR = include
BUILD_DIR = build
TEST_DIR = .

# 源文件
SOURCES = $(SRC_DIR)/richlog.cpp
TEST_SOURCES = $(TEST_DIR)/test_parser.cpp $(TEST_DIR)/test_encoder.cpp $(TEST_DIR)/test_decoder.cpp $(TEST_DIR)/main.cpp
LOG_GENERATOR_SOURCES = $(TEST_DIR)/generate_log.cpp

# 目标文件
OBJECTS = $(SOURCES:$(SRC_DIR)/%.cpp=$(BUILD_DIR)/%.o)
TEST_OBJECTS = $(TEST_SOURCES:$(TEST_DIR)/%.cpp=$(BUILD_DIR)/%.o)
LOG_GENERATOR_OBJECTS = $(LOG_GENERATOR_SOURCES:$(TEST_DIR)/%.cpp=$(BUILD_DIR)/%.o)

# 可执行文件
TEST_EXECUTABLE = $(BUILD_DIR)/richlog_test
LOG_GENERATOR_EXECUTABLE = $(BUILD_DIR)/generate_log

# 默认目标
all: $(TEST_EXECUTABLE) $(LOG_GENERATOR_EXECUTABLE)

# 创建构建目录
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# 编译源文件
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.cpp | $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) -I$(INCLUDE_DIR) -c $< -o $@

# 编译测试文件
$(BUILD_DIR)/%.o: $(TEST_DIR)/%.cpp | $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) -I$(INCLUDE_DIR) -c $< -o $@

# 链接测试可执行文件
$(TEST_EXECUTABLE): $(OBJECTS) $(TEST_OBJECTS)
	$(CXX) $(OBJECTS) $(TEST_OBJECTS) -o $@ -lgtest -lgtest_main -lpthread

# 链接日志生成器可执行文件
$(LOG_GENERATOR_EXECUTABLE): $(OBJECTS) $(LOG_GENERATOR_OBJECTS)
	$(CXX) $(OBJECTS) $(LOG_GENERATOR_OBJECTS) -o $@

# 运行测试
test: $(TEST_EXECUTABLE)
	./$(TEST_EXECUTABLE)

# 生成测试日志
generate-log: $(LOG_GENERATOR_EXECUTABLE)
	./$(LOG_GENERATOR_EXECUTABLE)

# 清理构建文件
clean:
	rm -rf build

# 安装依赖（Ubuntu/Debian）
install-deps:
	sudo apt-get update
	sudo apt-get install -y build-essential cmake libgtest-dev

# 安装依赖（CentOS/RHEL）
install-deps-centos:
	sudo yum groupinstall -y "Development Tools"
	sudo yum install -y cmake gtest-devel

# 显示帮助信息
help:
	@echo "RichLog C++ 测试 Makefile"
	@echo "========================"
	@echo "可用目标："
	@echo "  all              - 构建测试程序和日志生成器"
	@echo "  test             - 运行测试"
	@echo "  generate-log     - 生成测试日志文件 (test_richlog.log)"
	@echo "  clean            - 清理构建文件"
	@echo "  install-deps     - 安装依赖（Ubuntu/Debian）"
	@echo "  help             - 显示此帮助信息"

.PHONY: all test generate-log clean install-deps install-deps-centos help
