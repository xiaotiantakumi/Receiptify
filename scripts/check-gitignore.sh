#!/bin/bash

# .gitignore Check Script
# このスクリプトは、gitignoreが正しく動作しているかをチェックします

echo "🔍 .gitignore Configuration Check"
echo "=================================="
echo ""

# 色付きの出力関数
print_success() {
    echo "✅ $1"
}

print_warning() {
    echo "⚠️  $1"
}

print_error() {
    echo "❌ $1"
}

print_info() {
    echo "ℹ️  $1"
}

# チェック関数
check_ignored() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        if git check-ignore "$file" > /dev/null 2>&1; then
            print_success "$description: $file (ignored)"
        else
            print_error "$description: $file (NOT ignored - should be ignored!)"
            return 1
        fi
    else
        print_info "$description: $file (file not found)"
    fi
    return 0
}

# チェック対象ファイル
echo "1. Node.js & Dependencies"
echo "-------------------------"
check_ignored "node_modules" "Node modules"
check_ignored "package-lock.json.bak" "Package lock backup"
echo ""

echo "2. Build & Distribution"
echo "----------------------"
check_ignored "out" "Next.js output"
check_ignored ".next" "Next.js build cache"
check_ignored "api/dist" "API build output"
check_ignored "functions-blob/dist" "Functions build output"
echo ""

echo "3. Environment & Secrets"
echo "------------------------"
check_ignored ".env" "Environment file"
check_ignored ".env.local" "Local environment file"
check_ignored "api/local.settings.json" "API local settings"
check_ignored "functions-blob/local.settings.json" "Functions local settings"
echo ""

echo "4. Azure & Cloud Services"
echo "-------------------------"
check_ignored "azurite-data" "Azurite data directory"
check_ignored "test/azurite" "Azurite test directory"
check_ignored ".swa" "Static Web Apps cache"
echo ""

echo "5. Development & IDE"
echo "-------------------"
check_ignored ".vscode/settings.json" "VS Code user settings"
check_ignored ".idea" "IntelliJ IDEA directory"
echo ""

echo "6. System Files"
echo "---------------"
check_ignored ".DS_Store" "macOS metadata"
check_ignored "Thumbs.db" "Windows thumbnails"
echo ""

echo "7. Logs & Temporary"
echo "-------------------"
check_ignored "*.log" "Log files"
check_ignored "tmp" "Temporary directory"
echo ""

# コミットすべきでないファイルがステージングされていないかチェック
echo "8. Staging Area Security Check"
echo "-------------------------------"

# 危険なファイルパターン
dangerous_patterns=(
    "*.env*"
    "*local.settings.json"
    "*.key"
    "*.pem"
    "*secrets*"
    "*password*"
    "*token*"
)

has_dangerous_files=false
for pattern in "${dangerous_patterns[@]}"; do
    if git diff --cached --name-only | grep -i "$pattern" > /dev/null 2>&1; then
        print_error "Dangerous file pattern '$pattern' found in staging area!"
        has_dangerous_files=true
    fi
done

if [ "$has_dangerous_files" = false ]; then
    print_success "No dangerous files in staging area"
fi

echo ""

# 大きなファイルがコミットされようとしていないかチェック
echo "9. Large File Check"
echo "-------------------"
large_files=$(git diff --cached --name-only | xargs ls -la 2>/dev/null | awk '$5 > 1048576 {print $9 " (" $5 " bytes)"}')

if [ -n "$large_files" ]; then
    print_warning "Large files (>1MB) found in staging area:"
    echo "$large_files"
else
    print_success "No large files in staging area"
fi

echo ""

# Gitのステータス概要
echo "10. Git Status Summary"
echo "---------------------"
untracked_count=$(git status --porcelain | grep "^??" | wc -l)
modified_count=$(git status --porcelain | grep "^ M" | wc -l)
staged_count=$(git status --porcelain | grep "^M " | wc -l)

print_info "Untracked files: $untracked_count"
print_info "Modified files: $modified_count"
print_info "Staged files: $staged_count"

# 未追跡ファイルのうち、除外すべきものがあるかチェック
echo ""
echo "11. Untracked Files Analysis"
echo "----------------------------"
untracked_files=$(git status --porcelain | grep "^??" | cut -c4-)

if [ -n "$untracked_files" ]; then
    echo "Untracked files found:"
    echo "$untracked_files" | while read file; do
        if [[ "$file" =~ \.(log|tmp|cache|js)$ ]] || [[ "$file" =~ (node_modules|dist|build|\.env|azurite|test/debug) ]]; then
            print_warning "  $file (should probably be ignored)"
        else
            print_info "  $file"
        fi
    done
else
    print_success "No untracked files"
fi

echo ""
echo "=================================="
echo "🎯 .gitignore check completed!"
echo ""
echo "💡 Tips:"
echo "  - Review any WARNING items above"
echo "  - Never commit files containing secrets"
echo "  - Keep build artifacts out of git"
echo "  - Use 'git add -f' only when absolutely necessary"