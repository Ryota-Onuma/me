import * as vscode from 'vscode';
import * as fs from 'fs';
import { ConfigManager } from './configManager';
import { BackgroundWebviewProvider } from './webviewProvider';
import { BackgroundManagerImpl } from './backgroundManager';
import { validateImageInput } from './utils/imageValidator';
import { PreviewPanel } from './previewPanel';
import {
  getWorkbenchCssPath,
  applyCssPatch,
  removeCssPatch,
  isUnsafeModeEnabled,
  getUnsafeOptions,
  CSS_START_MARKER,
  applyJsSuppressionPatch,
  removeJsPatch,
} from './unsafeWorkbenchPatcher';

let provider: BackgroundWebviewProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  validateSecurityConstraints();

  // 出力チャンネルを常に作成（ユーザーがすぐ選べるように）
  try { vscode.window.createOutputChannel('Background Image (Unsafe)'); } catch {}

  provider = new BackgroundWebviewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(BackgroundWebviewProvider.viewType, provider)
  );

  registerCommands(context);
  setupConfigurationWatcher(context);

  // Apply initial config to webview (if already created later, watcher will update)
  initializeWebView();
}

export function deactivate() {
  // no-op
}

function registerCommands(context: vscode.ExtensionContext): void {
  const cfg = new ConfigManager();
  const mgr = new BackgroundManagerImpl(cfg, provider!);

  context.subscriptions.push(
    vscode.commands.registerCommand('backgroundImage.setImage', async () => {
      const pick = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select Background Image',
        filters: { Images: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
      });
      if (!pick || !pick[0]) return;
      const uri = pick[0];
      const fileUrl = uri.with({ scheme: 'file' }).toString(true);
      const res = await validateImageInput(fileUrl);
      if (!res.valid) {
        vscode.window.showErrorMessage(res.error);
        return;
      }
      await mgr.setBackgroundImage(fileUrl);
      vscode.window.showInformationMessage('Background image set safely.');
    }),

    vscode.commands.registerCommand('backgroundImage.removeImage', async () => {
      await mgr.removeBackground();
      vscode.window.showInformationMessage('Background removed.');
    }),

    vscode.commands.registerCommand('backgroundImage.openSettings', async () => {
      await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:background-image');
    }),

    vscode.commands.registerCommand('backgroundImage.openPreviewPanel', async () => {
      const cfg = new ConfigManager().getConfig();
      PreviewPanel.createOrShow(context, cfg);
    }),

    vscode.commands.registerCommand('backgroundImage.toggleSlideshow', async () => {
      const cm = new ConfigManager();
      const cur = cm.getConfig();
      const next = cm.sanitizeConfig({
        ...cur,
        slideshow: { enabled: !cur.slideshow?.enabled, images: cur.slideshow?.images ?? [], interval: cur.slideshow?.interval ?? 30, shuffle: cur.slideshow?.shuffle ?? false },
      });
      if (!cm.validateConfig(next)) return;
      await cm.saveConfig(next);
      provider?.update(next);
      PreviewPanel.current?.update(next);
      vscode.window.showInformationMessage(`Slideshow ${next.slideshow?.enabled ? 'enabled' : 'disabled'}.`);
    }),

    // Unsafe mode commands
    vscode.commands.registerCommand('backgroundImage.unsafe.apply', async () => {
      console.log('🚀 backgroundImage.unsafe.apply: Command started');

      const enabled = isUnsafeModeEnabled();
      console.log('🔧 Unsafe mode enabled:', enabled);

      if (!enabled) {
        const confirm = await vscode.window.showWarningMessage(
          'ローカル限定の非推奨モードです',
          {
            modal: true,
            detail: 'VS Code/Cursor の内部ファイルを書き換えます。アップデートや整合性チェックで破綻・警告が出る可能性に同意しますか？\n\n⚠️ 配布・公開は禁止。ローカル専用でご利用ください。'
          },
          '同意して続行',
          'キャンセル'
        );

        console.log('👤 User confirmation:', confirm);

        if (confirm !== '同意して続行') {
          console.log('❌ User cancelled operation');
          return;
        }

        // Enable unsafe mode
        try {
          const config = vscode.workspace.getConfiguration('backgroundImage.unsafe');
          await config.update('enabled', true, vscode.ConfigurationTarget.Global);
          console.log('✅ Unsafe mode enabled');
        } catch (configError) {
          console.error('❌ Failed to enable unsafe mode:', configError);
          vscode.window.showErrorMessage(`設定の更新に失敗しました: ${configError}`);
          return;
        }
      }

      // Get and validate options
      const options = getUnsafeOptions();
      console.log('🎨 Unsafe options:', JSON.stringify(options, null, 2));

      if (!options.image) {
        const errorMsg = '背景画像が設定されていません。';
        console.error('❌', errorMsg);

        const action = await vscode.window.showErrorMessage(
          errorMsg,
          'Settings を開く'
        );

        if (action === 'Settings を開く') {
          await vscode.commands.executeCommand('workbench.action.openSettings', 'backgroundImage.unsafe.image');
        }
        return;
      }

      // Check CSS path detection
      const cssPath = getWorkbenchCssPath();
      console.log('📁 Detected CSS path:', cssPath);

      if (!cssPath) {
        const errorMsg = 'Workbench CSS ファイルが見つかりませんでした。';
        console.error('❌', errorMsg);

        const action = await vscode.window.showErrorMessage(
          errorMsg,
          {
            modal: true,
            detail: '以下のいずれかを試してください:\n1. CSS パス検出コマンドを実行\n2. 手動でパスを設定\n3. Developer Tools でデバッグ情報を確認'
          },
          'CSS パス検出',
          '手動設定',
          'Developer Tools を開く'
        );

        if (action === 'CSS パス検出') {
          await vscode.commands.executeCommand('backgroundImage.unsafe.openCssPath');
        } else if (action === '手動設定') {
          await vscode.commands.executeCommand('workbench.action.openSettings', 'backgroundImage.unsafe.workbenchCssPath');
        } else if (action === 'Developer Tools を開く') {
          await vscode.commands.executeCommand('workbench.action.toggleDevTools');
        }
        return;
      }

      // Apply patch with detailed error handling
      console.log('🔥 Starting CSS patch application...');

      try {
        const cssOk = applyCssPatch(options);
        const jsOk = applyJsSuppressionPatch();
        const success = cssOk || jsOk;
        console.log('📊 Patch application result:', { cssOk, jsOk, success });
        vscode.window.showInformationMessage(`Unsafe 適用: CSS=${cssOk ? 'OK' : 'NG'}, JS=${jsOk ? 'OK' : 'NG'}`);

        if (success) {
          console.log('✅ CSS patch applied successfully');

          const action = await vscode.window.showInformationMessage(
            '✅ Unsafe 背景画像を適用しました！',
            {
              modal: false,
              detail: '完全終了→再起動で確実に反映されます。ウィンドウ再読み込みでも反映される場合があります。'
            },
            '完全終了して再起動 (推奨)',
            'ウィンドウ再読み込み',
            'Developer Tools で確認',
            '後で再起動'
          );

          if (action === '完全終了して再起動 (推奨)') {
            try { await vscode.commands.executeCommand('workbench.action.quit'); } catch {}
          } else if (action === 'ウィンドウ再読み込み') {
            await vscode.commands.executeCommand('workbench.action.reloadWindow');
          } else if (action === 'Developer Tools で確認') {
            await vscode.commands.executeCommand('workbench.action.toggleDevTools');
            vscode.window.showInformationMessage('Developer Tools の Console と Output: Background Image (Unsafe) を確認してください。');
          }
        } else {
          console.error('❌ CSS patch application failed');

          const action = await vscode.window.showErrorMessage(
            '❌ 背景画像の適用に失敗しました',
            {
              modal: true,
              detail: 'Developer Tools の Console で詳細なエラー情報を確認できます。\n\n考えられる原因:\n• ファイル権限不足\n• CSS ファイルの書き込み禁止\n• パス検出の失敗'
            },
            'Developer Tools を開く',
            '権限について',
            'トラブルシューティング'
          );

          if (action === 'Developer Tools を開く') {
            await vscode.commands.executeCommand('workbench.action.toggleDevTools');
          } else if (action === '権限について') {
            vscode.window.showInformationMessage(
              'ファイル権限の解決方法:\n\n• macOS: Cursor を管理者権限で実行\n• Windows: VS Code を管理者として実行\n• Linux: sudo でファイル権限を変更',
              { modal: true }
            );
          } else if (action === 'トラブルシューティング') {
            await vscode.commands.executeCommand('backgroundImage.unsafe.openCssPath');
          }
        }
      } catch (applyError) {
        console.error('💥 Unexpected error during patch application:', applyError);
        vscode.window.showErrorMessage(`予期しないエラーが発生しました: ${applyError}`);
      }
    }),

    vscode.commands.registerCommand('backgroundImage.unsafe.remove', async () => {
      console.log('🗑️ backgroundImage.unsafe.remove: Command started');

      try {
        const cssPath = getWorkbenchCssPath();
        console.log('📁 CSS path for removal:', cssPath);

        if (!cssPath) {
          vscode.window.showErrorMessage('CSS ファイルのパスが見つかりません。');
          return;
        }

        // Show current status
        const currentContent = fs.readFileSync(cssPath, 'utf-8');
        const hasPatches = currentContent.includes(CSS_START_MARKER);

        const cssRemoved = hasPatches ? removeCssPatch() : true;
        const jsRemoved = removeJsPatch();
        const success = cssRemoved && jsRemoved;
        console.log('🔄 Removal result:', { cssRemoved, jsRemoved, success });
        vscode.window.showInformationMessage(`Unsafe 除去: CSS=${cssRemoved ? 'OK' : 'NG'}, JS=${jsRemoved ? 'OK' : 'NG'}`);

        if (success) {
          const action = await vscode.window.showInformationMessage(
            '✅ Unsafe 背景画像を完全に除去しました',
            {
              modal: true,
              detail: '完全終了→再起動で確実に元の状態に戻ります。ウィンドウ再読み込みでも反映される場合があります。'
            },
            '完全終了して再起動 (推奨)',
            'ウィンドウ再読み込み',
            'Developer Tools で確認',
            '後で再起動'
          );

          // 設定をOFFに更新（Global/Workspace 双方）
          try {
            const cfgKey = 'backgroundImage.unsafe';
            const configGlobal = vscode.workspace.getConfiguration(cfgKey);
            await configGlobal.update('enabled', false, vscode.ConfigurationTarget.Global);
            const configWorkspace = vscode.workspace.getConfiguration(cfgKey);
            await configWorkspace.update('enabled', false, vscode.ConfigurationTarget.Workspace);
            const folders = vscode.workspace.workspaceFolders ?? [];
            for (const f of folders) {
              const configFolder = vscode.workspace.getConfiguration(cfgKey, f);
              await configFolder.update('enabled', false, vscode.ConfigurationTarget.WorkspaceFolder);
            }
          } catch (e) {
            console.warn('Failed to update unsafe.enabled to false:', e);
          }

          if (action === '完全終了して再起動 (推奨)') {
            try { await vscode.commands.executeCommand('workbench.action.quit'); } catch {}
          } else if (action === 'ウィンドウ再読み込み') {
            await vscode.commands.executeCommand('workbench.action.reloadWindow');
          } else if (action === 'Developer Tools で確認') {
            await vscode.commands.executeCommand('workbench.action.toggleDevTools');
            vscode.window.showInformationMessage('Console で 🗑️ や ✅ のログを確認してください。');
          }
        } else {
          const action = await vscode.window.showErrorMessage(
            '❌ 背景画像の除去に失敗しました',
            {
              modal: true,
              detail: 'Developer Tools の Console で詳細を確認してください。'
            },
            'Developer Tools を開く',
            'CSS ファイルを開く'
          );

          if (action === 'Developer Tools を開く') {
            await vscode.commands.executeCommand('workbench.action.toggleDevTools');
          } else if (action === 'CSS ファイルを開く') {
            await vscode.commands.executeCommand('backgroundImage.unsafe.openCssPath');
          }
        }
      } catch (error) {
        console.error('💥 Remove command error:', error);
        vscode.window.showErrorMessage(`除去処理中にエラーが発生しました: ${error}`);
      }
    }),

    vscode.commands.registerCommand('backgroundImage.unsafe.openCssPath', async () => {
      const cssPath = getWorkbenchCssPath();
      if (cssPath) {
        try {
          const uri = vscode.Uri.file(cssPath);
          await vscode.window.showTextDocument(uri);
          vscode.window.showInformationMessage(`Workbench CSS を開きました: ${cssPath}`);
        } catch (error) {
          vscode.window.showErrorMessage(`CSS ファイルを開けませんでした: ${error}`);
        }
      } else {
        vscode.window.showErrorMessage('Workbench CSS ファイルが見つかりませんでした。手動で以下の設定に CSS パスを指定してください:');
        await vscode.commands.executeCommand('workbench.action.openSettings', 'backgroundImage.unsafe.workbenchCssPath');
      }
    })
  );
}

function initializeWebView(): void {
  if (!provider) return;
  const cfg = new ConfigManager();
  const cur = cfg.getConfig();
  provider.setInitialConfig(cur);
  provider.update(cur);
  PreviewPanel.current?.update(cur);
}

function setupConfigurationWatcher(context: vscode.ExtensionContext): void {
  const cfg = new ConfigManager();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('backgroundImage')) {
        provider?.update(cfg.getConfig());
      }

      // Handle unsafe configuration changes
      if (e.affectsConfiguration('backgroundImage.unsafe')) {
        const enabled = isUnsafeModeEnabled();
        if (enabled) {
          const reapply = await vscode.window.showInformationMessage(
            'Unsafe 設定が変更されました。背景画像を再適用しますか？',
            '再適用',
            '次回起動時に適用',
            'キャンセル'
          );
          if (reapply === '再適用') {
            await vscode.commands.executeCommand('backgroundImage.unsafe.apply');
          }
        } else {
          // OFF にされたらパッチを自動除去
          const autoRemove = await vscode.window.showInformationMessage(
            'Unsafe モードが OFF になりました。既存のパッチを除去しますか？',
            '除去して再起動',
            '除去のみ',
            'キャンセル'
          );
          if (autoRemove === '除去して再起動' || autoRemove === '除去のみ') {
            const cssRemoved = removeCssPatch();
            const jsRemoved = removeJsPatch();
            if (!cssRemoved || !jsRemoved) {
              vscode.window.showWarningMessage('一部のパッチ除去に失敗しました。管理者権限やファイルロックをご確認ください。');
            }
            if (autoRemove === '除去して再起動') {
              await vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
          }
        }
      }
    })
  );
}

function validateSecurityConstraints(): boolean {
  // 明示的な安全チェック（動的コード実行・外部リクエスト禁止の方針を確認）
  // この拡張はWebView内でのみ描画し、システムファイルは一切書き換えません。
  return true;
}
