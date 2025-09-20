/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as cp from 'child_process';
import * as vscode from 'vscode';
import Logger from '../common/logger';
import { ITelemetry } from '../common/telemetry';
import { formatError } from '../common/utils';
import { FolderRepositoryManager } from './folderRepositoryManager';
import { PullRequestModel } from './pullRequestModel';

export const REVIEW_ASSISTANT_CONFIG_NAMESPACE = 'githubPullRequests.reviewAssistant';

export enum ReviewAgentKind {
	Codex = 'codex',
	Claude = 'claude'
}

export interface AutomatedReviewResult {
	provider: ReviewAgentKind;
	stdout: string;
	stderr: string;
	exitCode: number | null;
	durationMs: number;
}

interface ProviderConfiguration {
	command: string;
	args: string[];
}

export class AutomatedReviewService {
	private readonly _channel: vscode.LogOutputChannel;

	constructor(private readonly _telemetry: ITelemetry) {
		this._channel = vscode.window.createOutputChannel('PR Automated Review', { log: true });
	}

	public dispose() {
		this._channel.dispose();
	}

	private getProviderConfiguration(provider: ReviewAgentKind): ProviderConfiguration {
		const config = vscode.workspace.getConfiguration(REVIEW_ASSISTANT_CONFIG_NAMESPACE);
		const key = provider === ReviewAgentKind.Codex ? 'codex' : 'claude';
		const command = config.get<string>(`${key}.command`, provider === ReviewAgentKind.Codex ? 'codex' : 'claude');
		const args = config.get<string[]>(`${key}.args`, provider === ReviewAgentKind.Codex ? ['review', '--format', 'markdown'] : ['code', 'review', '--format', 'markdown']);
		if (!command || command.trim().length === 0) {
			throw new Error(vscode.l10n.t('Command for {0} review agent is not configured. Update {1}.', provider, REVIEW_ASSISTANT_CONFIG_NAMESPACE));
		}
		return { command, args: args ?? [] };
	}

	private createEnvironment(pullRequest: PullRequestModel, folderManager: FolderRepositoryManager): NodeJS.ProcessEnv {
		const env = { ...process.env };
		const remote = pullRequest.githubRepository.remote;
		env.GITHUB_PR_NUMBER = `${pullRequest.number}`;
		env.GITHUB_PR_TITLE = pullRequest.title;
		env.GITHUB_PR_URL = pullRequest.html_url;
		env.GITHUB_PR_AUTHOR = pullRequest.author?.login ?? '';
		env.GITHUB_REPO_OWNER = remote.owner;
		env.GITHUB_REPO_NAME = remote.repositoryName;
		env.GITHUB_PR_HEAD_REF = pullRequest.head?.ref ?? '';
		env.GITHUB_PR_BASE_REF = pullRequest.base?.ref ?? '';
		env.GITHUB_WORKSPACE = folderManager.repository.rootUri.fsPath;
		return env;
	}

	public async run(provider: ReviewAgentKind, pullRequest: PullRequestModel, folderManager: FolderRepositoryManager, token?: vscode.CancellationToken): Promise<AutomatedReviewResult> {
		const configuration = this.getProviderConfiguration(provider);
		const patch = await pullRequest.getPatch();
		if (!patch || patch.trim().length === 0) {
			throw new Error(vscode.l10n.t('Pull request #{0} has no changes to review.', pullRequest.number));
		}

		const env = this.createEnvironment(pullRequest, folderManager);
		const start = Date.now();
		return await new Promise<AutomatedReviewResult>((resolve, reject) => {
			const child = cp.spawn(configuration.command, configuration.args, {
				cwd: folderManager.repository.rootUri.fsPath,
				env,
				shell: process.platform === 'win32'
			});

			let stdout = '';
			let stderr = '';
			let cancelled = false;

			const cancellationListener = token?.onCancellationRequested(() => {
				if (!child.killed) {
					cancelled = true;
					child.kill();
				}
			});

			child.stdout?.on('data', data => {
				stdout += data.toString();
			});

			child.stderr?.on('data', data => {
				stderr += data.toString();
			});

			child.on('error', err => {
				Logger.error(`Automated review failed to spawn ${configuration.command}: ${err}`, 'AutomatedReviewService');
				cancellationListener?.dispose();
				reject(new Error(vscode.l10n.t('Failed to execute {0}: {1}', configuration.command, formatError(err))));
			});

			child.on('exit', (code) => {
				cancellationListener?.dispose();
				const duration = Date.now() - start;
				this._telemetry.sendTelemetryEvent('pr.automatedReview', { provider, cancelled: cancelled ? 'true' : 'false' }, { duration });
				if (cancelled) {
					reject(new vscode.CancellationError());
					return;
				}
				if (code !== 0) {
					const message = vscode.l10n.t('{0} exited with code {1}. {2}', configuration.command, code ?? -1, stderr.trim() || stdout.trim());
					Logger.error(message, 'AutomatedReviewService');
					reject(new Error(message));
					return;
				}

				this._channel.info(`[${new Date().toISOString()}] ${provider} review for pull request #${pullRequest.number}`);
				if (stderr.trim().length > 0) {
					this._channel.warn(stderr.trim());
				}
				if (stdout.trim().length > 0) {
					this._channel.info(stdout.trim());
				}
				this._channel.show(true);
				const result: AutomatedReviewResult = {
					provider,
					stdout,
					stderr,
					exitCode: code ?? -1,
					durationMs: duration
				};
				resolve(result);
			});

			child.stdin?.write(patch);
			child.stdin?.end();
		});
	}
}
