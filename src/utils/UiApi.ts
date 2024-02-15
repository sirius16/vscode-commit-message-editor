import * as vscode from 'vscode';
import { Commit } from '../@types/git';
import createPostMessage from './createPostMessage';
import Logger from './Logger';

export default class UiApi {
  constructor(private _webView: vscode.Webview, private _logger: Logger) {}

  sendSCMInputBoxValue(message: string) {
    this._webView.postMessage(
      createPostMessage('copyFromSCMInputBox', message)
    );
  }

  sendGitBranchName(branchName: string) {
    branchName = branchName.replace('.', '_');
    // get the task name from settings
    const taskName = vscode.workspace.getConfiguration('commit-message-editor.gitBranchTaskNames').get<string>(branchName, '<No Task Name>');
    this._logger.logObject(vscode.workspace.getConfiguration('commit-message-editor.gitBranchTaskNames'));
    this._logger.log('Sending branch name to webview: ' + branchName);

    this._webView.postMessage(
      createPostMessage("receiveGitTaskName", taskName)
    );
  }

  sendRepositoryInfo(info: {
    numberOfRepositories: number;
    selectedRepositoryPath: string | undefined;
    availableRepositories: string[];
  }) {
    this._webView.postMessage(createPostMessage('repositoryInfo', info));
  }

  sendConfig(config: vscode.WorkspaceConfiguration) {
    this._webView.postMessage(createPostMessage('receiveConfig', config));
  }

  sendRecentCommits(commits: Commit[]) {
    this._webView.postMessage(
      createPostMessage('recentCommitMessages', commits)
    );
  }

  sendAmendPerformed() {
    this._webView.postMessage(createPostMessage('amendPerformed'));
  }

  sendStatusMessage(message: string, type: 'error' | 'success' = 'success') {
    this._webView.postMessage(
      createPostMessage('statusMessage', {
        statusMessage: message,
        statusMessageType: type,
      })
    );
  }
}
