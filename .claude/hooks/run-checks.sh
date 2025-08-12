#!/bin/bash

# プロジェクトのルートディレクトリに移動
cd "$CLAUDE_PROJECT_DIR" || exit 1

echo "✅ Running post-work checks for Receiptify project..." >&2

# 1. ビルドを実行
echo "Running 'make build'..." >&2
BUILD_OUTPUT=$(make build 2>&1)
BUILD_EXIT_CODE=$?

# 2. Lintを実行
echo "Running 'make lint'..." >&2
LINT_OUTPUT=$(make lint 2>&1)
LINT_EXIT_CODE=$?

# 3. テストを実行
echo "Running 'make test'..." >&2
TEST_OUTPUT=$(make test 2>&1)
TEST_EXIT_CODE=$?

# 
# ▼▼▼▼▼ エラーを集約してClaudeにフィードバックするロジック（変更なし） ▼▼▼▼▼
#

ERROR_MESSAGES=""
SUCCESS=true

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    ERROR_MESSAGES+="Build failed:\n\`\`\`\n$BUILD_OUTPUT\n\`\`\`\n\n"
    SUCCESS=false
fi

if [ $LINT_EXIT_CODE -ne 0 ]; then
    ERROR_MESSAGES+="Linting failed:\n\`\`\`\n$LINT_OUTPUT\n\`\`\`\n\n"
    SUCCESS=false
fi

if [ $TEST_EXIT_CODE -ne 0 ]; then
    ERROR_MESSAGES+="Tests failed:\n\`\`\`\n$TEST_OUTPUT\n\`\`\`\n\n"
    SUCCESS=false
fi

if [ "$SUCCESS" = true ]; then
    echo "🎉 All checks passed successfully!"
    exit 0
else
    REASON="The following checks failed after my work. Please analyze the errors and fix them:\n\n$ERROR_MESSAGES"
    JSON_REASON=$(echo "$REASON" | python3 -c 'import json, sys; print(json.dumps(sys.stdin.read()))')

    cat <<EOF
{
  "decision": "block",
  "reason": $JSON_REASON
}
EOF
    exit 0
fi