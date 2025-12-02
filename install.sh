#!/bin/bash

# DataSpec 本地安装脚本
# 版本: 0.1.0
# 用途: 自动编译和安装 DataSpec 到本地环境

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 Node.js 版本
check_node_version() {
    if ! command_exists node; then
        print_error "Node.js 未安装"
        print_info "请访问 https://nodejs.org/ 下载安装 Node.js 20.x"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js 版本过低 (当前: $(node --version))"
        print_info "需要 Node.js >= 20.19.0"
        exit 1
    fi

    print_success "Node.js 版本: $(node --version)"
}

# 检查 pnpm
check_pnpm() {
    if ! command_exists pnpm; then
        print_warning "pnpm 未安装，正在安装..."
        npm install -g pnpm
        print_success "pnpm 已安装"
    else
        print_success "pnpm 版本: $(pnpm --version)"
    fi
}

# 清理旧的构建
clean_build() {
    print_info "清理旧的构建..."
    if [ -d "dist" ]; then
        rm -rf dist
        print_success "已清理 dist 目录"
    fi
}

# 安装依赖
install_dependencies() {
    print_info "安装依赖..."
    pnpm install
    print_success "依赖安装完成"
}

# 编译 TypeScript
build_project() {
    print_info "编译 TypeScript..."
    pnpm build
    print_success "编译完成"
}

# 运行测试
run_tests() {
    print_info "运行测试..."
    if pnpm test; then
        print_success "所有测试通过"
        return 0
    else
        print_warning "部分测试失败，但继续安装"
        return 1
    fi
}

# 全局链接
link_global() {
    print_info "链接到全局..."

    # 取消旧的链接（如果存在）
    pnpm unlink --global 2>/dev/null || true
    npm unlink -g 2>/dev/null || true

    # 检查 pnpm 全局环境
    if pnpm root -g >/dev/null 2>&1 && [ -n "$(pnpm root -g 2>/dev/null)" ]; then
        print_info "尝试 pnpm 全局链接..."
        if pnpm link --global 2>/dev/null; then
            print_success "使用 pnpm 全局链接完成"
            return 0
        fi
        print_warning "pnpm 全局链接失败"
    else
        print_warning "pnpm 全局环境未正确配置"
    fi

    # 直接使用 npm link 作为可靠的备选方案
    print_info "使用 npm link 全局安装..."
    if npm link; then
        print_success "使用 npm link 完成安装"
        return 0
    else
        print_error "全局链接失败，请手动执行："
        echo "  cd $(pwd)"
        echo "  npm link"
        echo ""
        echo "或者检查 npm 全局配置："
        echo "  npm config get prefix"
        echo "  npm config set prefix '~/.npm-global'"
        echo "  export PATH=\$HOME/.npm-global/bin:\$PATH"
        exit 1
    fi
}

# 验证安装
verify_installation() {
    print_info "验证安装..."
    
    if ! command_exists dataspec; then
        print_error "dataspec 命令未找到"
        print_info "可能需要重新加载终端或检查 PATH 设置"
        exit 1
    fi
    
    VERSION=$(dataspec --version)
    print_success "DataSpec 版本: $VERSION"
}

# 创建测试项目
create_test_project() {
    print_info "创建测试项目..."
    
    TEST_DIR="/tmp/dataspec-test-$$"
    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR"
    
    # 初始化项目
    dataspec init --project-name "测试项目" > /dev/null 2>&1
    
    if [ -d "dataspec" ]; then
        print_success "测试项目创建成功"
        rm -rf "$TEST_DIR"
    else
        print_error "测试项目创建失败"
        exit 1
    fi
}

# 显示使用说明
show_usage() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}🎉 DataSpec 安装成功！${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${BLUE}快速开始：${NC}"
    echo ""
    echo "  # 查看帮助"
    echo "  $ dataspec --help"
    echo ""
    echo "  # 初始化项目"
    echo "  $ dataspec init --project-name \"我的项目\""
    echo ""
    echo "  # 创建表定义"
    echo "  $ dataspec table create dw.sales_daily"
    echo ""
    echo "  # 验证定义"
    echo "  $ dataspec validate"
    echo ""
    echo "  # 生成 SQL"
    echo "  $ dataspec generate ddl dw.sales_daily"
    echo ""
    echo -e "${BLUE}文档：${NC}"
    echo "  • 用户手册: docs/USER_GUIDE.md"
    echo "  • 最佳实践: docs/BEST_PRACTICES.md"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 主函数
main() {
    print_header "DataSpec 本地安装脚本 v0.1.0"
    
    # 检查环境
    print_header "1/7 检查环境"
    check_node_version
    check_pnpm
    
    # 清理构建
    print_header "2/7 清理旧构建"
    clean_build
    
    # 安装依赖
    print_header "3/7 安装依赖"
    install_dependencies
    
    # 编译项目
    print_header "4/7 编译项目"
    build_project
    
    # 运行测试（可选）
    print_header "5/7 运行测试"
    run_tests || true
    
    # 全局链接
    print_header "6/7 全局链接"
    link_global
    
    # 验证安装
    print_header "7/7 验证安装"
    verify_installation
    create_test_project
    
    # 显示使用说明
    show_usage
}

# 运行主函数
main "$@"
