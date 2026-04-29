#!/bin/bash
# Kiro Runner VSCode Extension 설치 스크립트
# 생성일: 2026-04-16

set -e

VSIX="build/fe-kiro-runner-0.0.1.vsix"
EXTENSION_ID="rxc.fe-kiro-runner"

echo "📦 Kiro Runner v0.0.1 설치 중..."

# 이전 버전 제거 (있으면)
if code --list-extensions | grep -q "$EXTENSION_ID" 2>/dev/null; then
  echo "  ↩️  이전 버전 제거 중..."
  code --uninstall-extension "$EXTENSION_ID" 2>/dev/null || true
fi

# 설치
code --install-extension "$VSIX"

echo ""
echo "✅ 설치 완료! VSCode를 재시작하면 적용돼요."
echo "   사이드바 Kiro 아이콘 또는 하단 상태바에서 Kiro 버튼을 확인하세요."
