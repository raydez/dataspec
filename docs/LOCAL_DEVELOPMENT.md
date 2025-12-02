# DataSpec 本地开发与安装指南

**版本：** 0.1.0  
**更新时间：** 2025-11-25

---

## 📖 目录

1. [环境要求](#环境要求)
2. [获取源码](#获取源码)
3. [本地编译](#本地编译)
4. [本地安装](#本地安装)
5. [验证安装](#验证安装)
6. [开发模式](#开发模式)
7. [故障排查](#故障排查)

---

## 环境要求

### 必需软件

| 软件 | 版本要求 | 检查命令 |
|------|---------|---------|
| **Node.js** | >= 20.19.0 | `node --version` |
| **pnpm** | >= 8.0.0 | `pnpm --version` |
| **Git** | 任意版本 | `git --version` |

### 安装 Node.js

**macOS (使用 Homebrew):**
```bash
brew install node@20
```

**Linux (使用 nvm):**
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js
nvm install 20
nvm use 20
```

**Windows:**
- 下载安装包：https://nodejs.org/
- 选择 LTS 版本 (20.x)

### 安装 pnpm

```bash
npm install -g pnpm
```

验证安装：
```bash
pnpm --version
# 应该显示 8.x.x 或更高
```

---

## 获取源码

### 克隆完整仓库

```bash
# 如果 DataSpec 未来成为独立仓库
git clone https://github.com/raydez/dataspec.git
cd dataspec
```

---

## 本地编译

### 步骤 1: 安装依赖

```bash
cd dataspec

# 安装所有依赖
pnpm install
```

**预期输出：**
```
Packages: +XXX
Progress: resolved XXX, downloaded XXX, added XXX
Done in XXs
```

### 步骤 2: 编译 TypeScript

```bash
pnpm build
```

**预期输出：**
```
> @dpxing/dataspec@0.1.0 build /path/to/dataspec
> tsc

✓ TypeScript 编译成功
```

编译后的文件将在 `dist/` 目录中：

```
dataspec/
├── dist/          # 编译输出目录
│   ├── cli/
│   ├── commands/
│   ├── core/
│   └── utils/
└── src/           # 源代码
```

### 步骤 3: 验证编译结果

```bash
# 检查 dist 目录
ls -la dist/

# 应该看到以下目录和文件
# cli/
# commands/
# core/
# utils/
```

---

## 本地安装

### 方法 1: 全局链接（推荐用于开发）

使用 `pnpm link` 将本地版本链接到全局：

```bash
# 在 dataspec 目录中执行
pnpm link --global
```

**预期输出：**
```
+ @dpxing/dataspec 0.1.0
```

### 方法 2: 全局安装（从本地包）

```bash
# 在 dataspec 目录中执行
pnpm pack
# 这会生成一个 .tgz 文件，例如：dpxing-dataspec-0.1.0.tgz

# 全局安装这个包
npm install -g ./dpxing-dataspec-0.1.0.tgz
```

### 方法 3: 本地项目安装

如果只想在某个项目中使用：

```bash
# 在你的项目目录中
cd /path/to/your-project

# 安装本地 dataspec
npm install /path/to/dataspec
```

---

## 验证安装

### 检查版本

```bash
dataspec --version
```

**预期输出：**
```
0.1.0
```

### 检查帮助信息

```bash
dataspec --help
```

**预期输出：**
```
Usage: dataspec [options] [command]

AI-native tool for data development teams

Options:
  -V, --version       output the version number
  -h, --help          display help for command

Commands:
  init [options]      Initialize DataSpec in current directory
  table               Manage table definitions
  metric              Manage metric definitions
  generate            Generate SQL and config files
  validate [options]  Validate all data definitions
  help [command]      display help for command
```

### 测试基本功能

```bash
# 创建测试目录
mkdir ~/dataspec-test
cd ~/dataspec-test

# 初始化项目
dataspec init --project-name "测试项目"

# 检查生成的文件
ls -la dataspec/
```

**应该看到：**
```
dataspec/
├── AGENTS.md
├── README.md
├── dataspec.config.json
├── tables/
├── metrics/
└── templates/
```

---

## 开发模式

### 实时编译（Watch 模式）

在开发时，可以使用 watch 模式自动编译：

```bash
# 在 dataspec 目录中
pnpm build -- --watch
```

或者使用 TypeScript 的 watch 模式：

```bash
npx tsc --watch
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试（watch 模式）
pnpm test -- --watch

# 运行特定测试文件
pnpm test test/unit/sql-generator.test.ts
```

### 代码检查

```bash
# 如果配置了 ESLint
pnpm lint

# 自动修复
pnpm lint -- --fix
```

### 使用本地版本测试

在链接后，可以在任何目录直接使用：

```bash
# 在任意目录
dataspec init
dataspec table create test.table
dataspec validate
```

### 调试模式

使用 Node.js 调试器：

```bash
# 在 dataspec 目录中
node --inspect-brk bin/dataspec.js init
```

然后在 Chrome 中打开 `chrome://inspect` 进行调试。

---

## 更新本地安装

### 重新编译

当修改源码后：

```bash
cd dataspec

# 重新编译
pnpm build

# 如果使用了 pnpm link，更改会自动生效
# 如果使用了全局安装，需要重新安装
```

### 更新链接

如果链接出现问题：

```bash
# 取消链接
pnpm unlink --global

# 重新链接
pnpm link --global
```

---

## 故障排查

### 问题 1: `command not found: dataspec`

**原因：** 全局链接或安装不成功

**解决方案：**
```bash
# 检查全局 bin 目录
npm config get prefix

# 确保该目录在 PATH 中
echo $PATH

# 重新链接
cd dataspec
pnpm unlink --global
pnpm link --global
```

### 问题 2: 编译错误

**原因：** 依赖未安装或 TypeScript 版本不匹配

**解决方案：**
```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 重新编译
pnpm build
```

### 问题 3: 运行时找不到模块

**原因：** 编译输出目录不正确

**解决方案：**
```bash
# 检查 dist 目录
ls -la dist/

# 如果 dist 目录为空，重新编译
pnpm build

# 检查 package.json 中的 main 字段
cat package.json | grep '"main"'
# 应该是 "main": "dist/index.js"
```

### 问题 4: 权限错误

**原因：** 没有权限访问全局目录

**解决方案：**

macOS/Linux:
```bash
# 使用 sudo
sudo pnpm link --global

# 或配置 npm 全局目录为用户目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

Windows:
```bash
# 以管理员身份运行 PowerShell
# 然后执行安装命令
```

### 问题 5: Node 版本不兼容

**原因：** Node.js 版本过低

**解决方案：**
```bash
# 检查版本
node --version

# 如果版本 < 20，升级 Node.js
# macOS
brew upgrade node

# Linux (使用 nvm)
nvm install 20
nvm use 20

# Windows
# 从 https://nodejs.org/ 下载最新版本
```

### 问题 6: 测试失败

**原因：** 测试环境问题

**解决方案：**
```bash
# 清理测试目录
rm -rf test/fixtures/e2e-test

# 重新运行测试
pnpm test

# 运行特定测试
pnpm test test/unit/sql-generator.test.ts
```

---

## 完整安装流程示例

### 场景 1: 首次安装（开发模式）

```bash
# 1. 进入 dataspec 目录
cd /path/to/dataspec

# 2. 检查 Node.js 版本
node --version
# 应该显示 v20.x.x 或更高

# 3. 安装 pnpm（如果未安装）
npm install -g pnpm

# 4. 安装依赖
pnpm install

# 5. 编译
pnpm build

# 6. 全局链接
pnpm link --global

# 7. 验证
dataspec --version

# 8. 测试
mkdir ~/dataspec-test && cd ~/dataspec-test
dataspec init --project-name "测试"
dataspec table create test.table
dataspec validate

# 9. 清理测试
cd ~ && rm -rf ~/dataspec-test
```

### 场景 2: 打包分发

```bash
# 1. 进入 dataspec 目录
cd /path/to/dataspec

# 2. 清理并重新构建
rm -rf node_modules dist
pnpm install
pnpm build

# 3. 运行测试
pnpm test

# 4. 打包
pnpm pack
# 生成 dpxing-dataspec-0.1.0.tgz

# 5. 分发
# 将 .tgz 文件复制到目标机器

# 6. 在目标机器上安装
npm install -g dpxing-dataspec-0.1.0.tgz

# 7. 验证
dataspec --version
```

### 场景 3: 团队成员安装

```bash
# 1. 克隆仓库（如果是独立仓库）
git clone https://github.com/raydez/dataspec.git
cd dataspec

# 2. 安装和编译
pnpm install
pnpm build

# 3. 链接到全局
pnpm link --global

# 4. 开始使用
dataspec --help
```

---

## 卸载

### 取消全局链接

```bash
cd dataspec
pnpm unlink --global
```

### 卸载全局安装

```bash
npm uninstall -g @dpxing/dataspec
```

### 验证卸载

```bash
dataspec --version
# 应该显示 command not found
```

---

## 常见开发任务

### 添加新命令

1. 在 `src/commands/` 中创建新文件
2. 在 `src/cli/index.ts` 中注册命令
3. 重新编译：`pnpm build`
4. 测试新命令

### 修改现有功能

1. 修改 `src/` 中的相应文件
2. 运行测试：`pnpm test`
3. 重新编译：`pnpm build`
4. 测试修改

### 添加新依赖

```bash
# 生产依赖
pnpm add <package-name>

# 开发依赖
pnpm add -D <package-name>

# 重新编译
pnpm build
```

---

## 性能优化建议

### 编译优化

使用增量编译：
```bash
# tsconfig.json 中启用
{
  "compilerOptions": {
    "incremental": true
  }
}
```

### 安装优化

使用 pnpm 而不是 npm：
- 更快的安装速度
- 节省磁盘空间
- 更严格的依赖管理

---

## 下一步

安装完成后，建议：

1. ✅ 阅读 [用户手册](./USER_GUIDE.md)
4. ✅ 尝试示例项目

---

## 获取帮助

如果遇到问题：

- 📖 查看 [故障排查](#故障排查) 部分
- 🐛 提交 GitHub Issue
- 💬 查看项目文档
- 📧 联系支持团队
