#!/bin/bash

# 获取当前文件夹名字
REPO_NAME=$(basename "$PWD")
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔮 正在检查代码语法...${NC}"
npm run build || { echo -e "${RED}❌ Build 失败，请先让 Cursor 修复语法错误！${NC}"; exit 1; }

# 1. 确保 Git 已初始化
if [ ! -d ".git" ]; then
    echo "🐣 初始化本地 Git 仓库..."
    git init
fi

# 2. 询问存档备注
echo -e "${BLUE}📝 本次存档想记下什么？(直接回车将使用默认备注)${NC}"
read -p "> " USER_MSG
if [ -z "$USER_MSG" ]; then
    USER_MSG="🌙 深夜深海意志更新: $(date +'%Y-%m-%d %H:%M')"
fi

# 3. 本地提交
git add .
# 避免如果没有文件更改时 commit 报错，加个判断
git commit -m "$USER_MSG" || echo "🧊 没有检测到文件更改，跳过提交。"

# 4. GitHub 远程同步
if ! gh repo view "$REPO_NAME" >/dev/null 2>&1; then
    echo -e "${BLUE}🚀 正在 GitHub 创建新仓库: $REPO_NAME ...${NC}"
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
else
    echo -e "${BLUE}🔄 正在同步代码至 GitHub...${NC}"
    # 确保分支名为 main
    git branch -M main
    git push -u origin main
fi

# 5. Vercel 发布
echo -e "${BLUE}🚀 正在通过 Vercel 极速发布预览...${NC}"
vercel --prod --yes

echo -e "${GREEN}✅ 存档与发布全部完成！${NC}"
echo -e "${GREEN}🐙 古神对你的部署表示满意...${NC}"