![version](https://img.shields.io/badge/version-0.0.1-blue)

# Kiro Runner

VSCode에서 kiro-cli / MCP 명령어를 버튼 하나로 실행하는 익스텐션.

## 기능

### 3가지 트리거 방식

| 방식 | 위치 |
|---|---|
| **사이드바 패널** | 왼쪽 Activity Bar → ⚡ 아이콘 |
| **상태바 버튼** | 하단 상태바 `⚡ Kiro` 클릭 |
| **커맨드 팔레트** | `Cmd+Shift+P` → `Kiro:` 검색 |

### 기본 제공 명령어

**Core**
- ⚡ `kiro-cli chat` — Start Kiro Chat

**MCP**
- 📡 `kiro-cli mcp list` — MCP Server List

**Workflows**
- 📝 `kiro-cli --agent notion-to-spec` — Notion to Spec
- 📋 `kiro-cli chat --agent spec-to-jira` — Spec to Jira
- 🚀 `kiro-cli chat --agent spec-executor` — Spec Executor

**ETC**
- 👨‍💻 Code Review — `git diff origin/master...HEAD` 기반 코드 리뷰

## 커스텀 명령어 추가

`settings.json`에서 추가 가능:

```json
"kiro.customCommands": [
  { "label": "PR Review", "command": "kiro run pr-review" },
  { "label": "Deploy Staging", "command": "kiro deploy staging" }
]
```

## 사이드바 패널 아이템 추가

`src/extension.ts`의 `BUILTIN_COMMANDS` 배열에 항목을 추가하면 사이드바 패널, 상태바 Quick Pick, 커맨드 팔레트에 동시 반영됩니다.

```ts
const BUILTIN_COMMANDS: KiroCommand[] = [
  // ... 기존 명령어 ...

  // 새 아이템 추가 예시
  { id: 'runMyTask',  label: 'My Task',  command: 'kiro-cli chat --agent my-agent',  icon: '🎯',  group: 'workflow' },
];
```

| 필드 | 설명 |
|---|---|
| `id` | 고유 식별자 (`kiro.{id}`로 커맨드 등록됨) |
| `label` | 버튼에 표시되는 이름 |
| `command` | 터미널에서 실행할 명령어 |
| `icon` | 이모지 아이콘 |
| `group` | 섹션 분류: `core` · `mcp` · `workflow` · `etc` |
| `reuseTerminal` | (선택) `true`면 기존 터미널 재사용, 기본값 `true` |

## package.json contributes와 extension.ts의 관계

```
package.json                          extension.ts
─────────────                         ─────────────
contributes.commands ──────────────── BUILTIN_COMMANDS / TERMINAL_MENU_COMMANDS
  (VSCode에 커맨드 등록)                (실행 로직 바인딩)

contributes.menus ─────────────────── TERMINAL_MENU_COMMANDS
  (터미널 우클릭 서브메뉴 노출)          (activeTerminal에 /agent swap 전송)

contributes.views / viewsContainers ─ KiroViewProvider
  (사이드바 패널 선언)                   (Webview HTML 렌더링 + 메시지 핸들링)

contributes.configuration ─────────── showQuickPick()
  (kiro.customCommands 스키마)          (settings에서 읽어 Quick Pick에 표시)

contributes.keybindings ───────────── kiro.quickPick 커맨드
  (Cmd+Alt+K 단축키)                    (showQuickPick 함수 호출)
```

새 명령어를 추가할 때는 양쪽 모두 수정이 필요합니다:

1. `package.json` → `contributes.commands`에 커맨드 등록 (팔레트/메뉴 노출용)
2. `extension.ts` → `BUILTIN_COMMANDS`에 항목 추가 (실행 로직 + 사이드바/Quick Pick 반영)

> `BUILTIN_COMMANDS`의 `id`가 `kiro.{id}` 형태로 `registerCommand`에 등록되므로, `package.json`의 `command` 값과 일치해야 합니다.

## package.json contributes 구조

### 커맨드 팔레트 명령어

`Cmd+Shift+P`에서 `Kiro:`로 검색 가능한 명령어:

| 커맨드 | 타이틀 |
|---|---|
| `kiro.startKiro` | Kiro: Start Kiro Chat |
| `kiro.mcpList` | Kiro: MCP Server List |
| `kiro.runFigma` | Kiro: Figma Component Generator |
| `kiro.runJira` | Kiro: Plan to Jira |
| `kiro.runNotion` | Kiro: Notion to Plan |
| `kiro.runPlan` | Kiro: Plan Executor |
| `kiro.runCustom` | Kiro: Run Custom Command |
| `kiro.runCodeReview` | Kiro: Run Code Review |

### 터미널 컨텍스트 메뉴

터미널 우클릭 → `⚡ Kiro` 서브메뉴에서 실행 가능:

| 커맨드 | 타이틀 |
|---|---|
| `kiro.runNotionSpec.terminal` | 📝 Notion to Spec |
| `kiro.runJiraSpec.terminal` | 📋 Spec to Jira |
| `kiro.runSpec.terminal` | 🚀 Spec Executor |
| `kiro.runFigma.terminal` | 🎨 Figma Component Generator |

### 키바인딩

| 단축키 | 커맨드 |
|---|---|
| `Cmd+Alt+K` (Mac) / `Ctrl+Alt+K` (Win/Linux) | `kiro.quickPick` — Quick Pick 열기 |

### 사이드바

Activity Bar에 `Kiro` 아이콘이 추가되며, 클릭 시 `kiroPanel` Webview가 표시됩니다.

### 설정 (Configuration)

| 설정 키 | 타입 | 설명 |
|---|---|---|
| `kiro.customCommands` | `array` | 패널에 표시할 커스텀 명령어 목록 (`{ label, command }`) |

## 개발 & 배포

### 로컬 테스트
```bash
yarn install
# VSCode에서 F5 → Extension Development Host 창으로 테스트
```

### 빌드 (.vsix 생성)
```bash
yarn run build
# → kiro-runner-x.x.x.vsix + build/ 폴더 생성
```

### 팀 배포
```bash
# 릴리즈 담당자 (한 명만 실행)
yarn run release
git add build/ install.sh README.md
git commit -m "chore: release v0.0.1"
git push

# 팀원 (각자 실행)
git pull && ./install.sh
```

### 버전 올리기
`package.json`의 `version` 수정 후 `yarn run release` 재실행
