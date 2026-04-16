#!/usr/bin/env node
/**
 * release.js
 * yarn run build 후 자동으로 호출됨
 * - dist/ 폴더에 .vsix 복사
 * - CHANGELOG 업데이트 안내
 * - 설치 스크립트 재생성
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = pkg.version;
const vsixName = `${pkg.name}-${version}.vsix`;
const vsixPath = path.join(process.cwd(), 'build', vsixName);

// ── 1. dist 폴더 준비 ──────────────────────────────────────────
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

if (!fs.existsSync(vsixPath)) {
  console.error(`❌ ${vsixName} 파일을 찾을 수 없어요. yarn run build 를 먼저 실행하세요.`);
  process.exit(1);
}

fs.copyFileSync(vsixPath, path.join(distDir, vsixName));
console.log(`✅ dist/${vsixName} 복사 완료`);

// ── 2. install.sh 재생성 ───────────────────────────────────────
const installSh = `#!/bin/bash
# Kiro Runner VSCode Extension 설치 스크립트
# 생성일: ${new Date().toISOString().slice(0, 10)}

set -e

VSIX="dist/${vsixName}"
EXTENSION_ID="${pkg.publisher || 'kiro'}.${pkg.name}"

echo "📦 Kiro Runner v${version} 설치 중..."

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
`;

fs.writeFileSync('install.sh', installSh, { mode: 0o755 });
console.log('✅ install.sh 재생성 완료');

// ── 3. README 버전 뱃지 업데이트 ──────────────────────────────
const readmePath = 'README.md';
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  // 버전 뱃지가 있으면 교체, 없으면 맨 위에 추가
  const badge = `![version](https://img.shields.io/badge/version-${version}-blue)`;
  if (readme.includes('img.shields.io/badge/version')) {
    readme = readme.replace(/!\[version\].*\)/, badge);
  } else {
    readme = `${badge}\n\n${readme}`;
  }
  fs.writeFileSync(readmePath, readme);
  console.log('✅ README 버전 뱃지 업데이트 완료');
}

// ── 4. 요약 출력 ──────────────────────────────────────────────
console.log('');
console.log('─'.repeat(50));
console.log(`🚀 Kiro Runner v${version} 빌드 완료`);
console.log('');
console.log('배포 방법:');
console.log(`  1) dist/${vsixName} 파일을 팀에 공유`);
console.log('  2) 또는 git push 후 팀원이 아래 실행:');
console.log('     git pull && ./install.sh');
console.log('─'.repeat(50));
