"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
// 터미널 컨텍스트 메뉴 커맨드 (현재 활성 터미널에 /agent swap 전송)
const TERMINAL_MENU_COMMANDS = [
    { id: 'runFigma.terminal', agentName: 'figma-component-generator' },
    { id: 'runNotionSpec.terminal', agentName: 'notion-to-spec' },
    { id: 'runJiraSpec.terminal', agentName: 'spec-to-jira' },
    { id: 'runSpec.terminal', agentName: 'spec-executor' },
];
// 기본 제공 명령어 (사이드바 패널 / 상태바 / 커맨드 팔레트)
const BUILTIN_COMMANDS = [
    // Core
    { id: 'startKiro', label: 'Start Kiro Chat', command: 'kiro-cli chat', icon: '⚡', group: 'core' },
    // MCP
    { id: 'mcpList', label: 'MCP Server List', command: 'kiro-cli mcp list', icon: '📡', group: 'mcp' },
    // Workflows
    { id: 'runNotionSpec', label: 'Notion to Spec', command: 'kiro-cli --agent notion-to-spec', icon: '📝', group: 'workflow' },
    { id: 'runJiraSpec', label: 'Spec to Jira', command: 'kiro-cli chat --agent spec-to-jira "시작"', icon: '📋', group: 'workflow' },
    { id: 'runSpec', label: 'Spec Executor', command: 'kiro-cli chat --agent spec-executor "시작"', icon: '🚀', group: 'workflow' },
    // custom
    { id: 'runCodeReview', label: 'Code Review', command: 'kiro-cli chat --no-interactive --trust-all-tools "git diff origin/master...HEAD 의 변경사항을 코드 품질, 타입 안전성, 패턴 일관성 관점에서 리뷰해줘"', icon: '👨‍💻', group: 'etc' },
];
// ─── Terminal 헬퍼 ────────────────────────────────────────────────
function runInTerminal(command, terminalName = 'Kiro', reuseTerminal = true) {
    const existing = vscode.window.terminals.find(t => t.name === terminalName);
    if (reuseTerminal && existing) {
        existing.show(true);
        return;
    }
    const terminal = vscode.window.createTerminal({ name: terminalName });
    terminal.show(true);
    terminal.sendText(command);
}
// ─── 상태바 버튼 ─────────────────────────────────────────────────
function createStatusBarItem() {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    item.text = '$(zap) Kiro';
    item.tooltip = 'Kiro Runner — 클릭해서 명령어 선택';
    item.command = 'kiro.quickPick';
    item.show();
    return item;
}
// ─── Quick Pick (커맨드 팔레트 스타일) ───────────────────────────
async function showQuickPick() {
    const config = vscode.workspace.getConfiguration('kiro');
    const customCmds = config.get('customCommands') ?? [];
    const items = [
        { label: '─── Core ───', kind: vscode.QuickPickItemKind.Separator },
        ...BUILTIN_COMMANDS.filter(c => c.group === 'core').map(c => ({
            label: `${c.icon}  ${c.label}`,
            description: c.command,
            detail: undefined,
        })),
        { label: '─── MCP ───', kind: vscode.QuickPickItemKind.Separator },
        ...BUILTIN_COMMANDS.filter(c => c.group === 'mcp').map(c => ({
            label: `${c.icon}  ${c.label}`,
            description: c.command,
        })),
        { label: '─── Workflows ───', kind: vscode.QuickPickItemKind.Separator },
        ...BUILTIN_COMMANDS.filter(c => c.group === 'workflow').map(c => ({
            label: `${c.icon}  ${c.label}`,
            description: c.command,
        })),
        ...(customCmds.length > 0
            ? [
                { label: '─── Custom ───', kind: vscode.QuickPickItemKind.Separator },
                ...customCmds.map(c => ({ label: `🔧  ${c.label}`, description: c.command })),
            ]
            : []),
        { label: '─────────────', kind: vscode.QuickPickItemKind.Separator },
        { label: '$(add)  Add Custom Command…', description: 'settings.json에 추가' },
    ];
    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Kiro 명령어를 선택하세요',
        matchOnDescription: true,
    });
    if (!selected || selected.kind === vscode.QuickPickItemKind.Separator)
        return;
    if (selected.label.includes('Add Custom Command')) {
        vscode.commands.executeCommand('workbench.action.openSettings', 'kiro.customCommands');
        return;
    }
    if (selected.description) {
        const found = [...BUILTIN_COMMANDS].find(c => c.command === selected.description);
        const terminalName = found ? `Kiro: ${found.label}` : 'Kiro';
        const reuseTerminal = found?.reuseTerminal ?? true;
        runInTerminal(selected.description, terminalName, reuseTerminal);
    }
}
// ─── Webview 사이드바 패널 ────────────────────────────────────────
class KiroViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtml();
        webviewView.webview.onDidReceiveMessage(msg => {
            if (msg.type === 'runCommand') {
                runInTerminal(msg.command, msg.terminalName ?? 'Kiro', msg.reuseTerminal ?? true);
            }
            else if (msg.type === 'runCustom') {
                this._promptCustomCommand();
            }
        });
    }
    async _promptCustomCommand() {
        const input = await vscode.window.showInputBox({
            prompt: '실행할 kiro 명령어를 입력하세요',
            placeHolder: 'kiro-cli ...',
        });
        if (input)
            runInTerminal(input);
    }
    _getHtml() {
        const groups = [
            { title: 'Core', cmds: BUILTIN_COMMANDS.filter(c => c.group === 'core') },
            { title: 'MCP', cmds: BUILTIN_COMMANDS.filter(c => c.group === 'mcp') },
            { title: 'Workflows', cmds: BUILTIN_COMMANDS.filter(c => c.group === 'workflow') },
            { title: 'ETC', cmds: BUILTIN_COMMANDS.filter(c => c.group === 'etc') },
        ];
        const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const sections = groups.map(g => `
      <div class="section">
        <div class="section-title">${g.title}</div>
        ${g.cmds.map(c => `
          <button class="btn" data-cmd="${esc(c.command)}" data-terminal-name="Kiro: ${esc(c.label)}" data-reuse="${c.reuseTerminal ?? true}" title="${esc(c.command)}">
            <span class="icon">${c.icon}</span>
            <span>${c.label}</span>
          </button>
        `).join('')}
      </div>
    `).join('');
        return /* html */ `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    padding: 8px;
  }
  .section { margin-bottom: 14px; }
  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 4px;
    padding: 0 2px;
  }
  .btn {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 6px 10px;
    margin-bottom: 3px;
    background: var(--vscode-button-secondaryBackground, rgba(255,255,255,0.06));
    color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
    transition: background 0.1s, border-color 0.1s;
  }
  .btn:hover {
    background: var(--vscode-list-hoverBackground);
    border-color: var(--vscode-focusBorder, #007fd4);
  }
  .btn:active { opacity: 0.8; }
  .icon { font-size: 14px; width: 18px; text-align: center; }
  .divider { border: none; border-top: 1px solid var(--vscode-panel-border); margin: 4px 0 12px; }
  .custom-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 6px 10px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-family: inherit;
  }
  .custom-btn:hover { background: var(--vscode-button-hoverBackground); }
</style>
</head>
<body>
  ${sections}
  <hr class="divider">
  <button class="custom-btn" id="customBtn">
    <span class="icon">🔧</span>
    <span>Custom Command…</span>
  </button>
<script>
  const vscode = acquireVsCodeApi();

  document.querySelectorAll('.btn[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      vscode.postMessage({
        type: 'runCommand',
        command: btn.dataset.cmd,
        terminalName: btn.dataset.terminalName,
        reuseTerminal: btn.dataset.reuse === 'true',
      });
    });
  });

  document.getElementById('customBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'runCustom' });
  });
</script>
</body>
</html>`;
    }
}
KiroViewProvider.viewType = 'kiroPanel';
// ─── Activate ────────────────────────────────────────────────────
function activate(context) {
    // 사이드바
    const provider = new KiroViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(KiroViewProvider.viewType, provider));
    // 상태바
    context.subscriptions.push(createStatusBarItem());
    // 커맨드 팔레트
    context.subscriptions.push(vscode.commands.registerCommand('kiro.quickPick', showQuickPick));
    // 개별 커맨드 등록
    BUILTIN_COMMANDS.forEach(c => {
        context.subscriptions.push(vscode.commands.registerCommand(`kiro.${c.id}`, () => runInTerminal(c.command, `Kiro: ${c.label}`, c.reuseTerminal ?? false)));
    });
    context.subscriptions.push(vscode.commands.registerCommand('kiro.runCustom', async () => {
        const input = await vscode.window.showInputBox({
            prompt: '실행할 kiro 명령어를 입력하세요',
            placeHolder: 'kiro-cli ...',
        });
        if (input)
            runInTerminal(input);
    }));
    TERMINAL_MENU_COMMANDS.forEach(c => {
        context.subscriptions.push(vscode.commands.registerCommand(`kiro.${c.id}`, () => {
            const terminal = vscode.window.activeTerminal;
            if (terminal) {
                terminal.sendText('\u0015', false);
                terminal.sendText(`/agent swap ${c.agentName}`);
            }
        }));
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map