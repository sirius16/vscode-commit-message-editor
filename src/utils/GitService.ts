import * as vscode from 'vscode';
import { GitExtension, API, Repository, APIState } from '../@types/git';
import { execSync } from 'node:child_process';

export type RepositoryChangeCallback = (repositoryInfo: {
  numberOfRepositories: number;
  selectedRepositoryPath: string;
  availableRepositories: string[];
}) => void;

export interface RepositoryInfo {
  numberOfRepositories: number;
  selectedRepositoryPath: string;
  availableRepositories: string[];
}

class GitService {
  private isGitAvailable: boolean = false;
  private gitExtension: vscode.Extension<GitExtension> | undefined;
  private api: API | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.gitExtension = vscode.extensions.getExtension('vscode.git');

    if (!this.gitExtension) {
      return;
    }

    this.isGitAvailable = true;
    this.api = this.gitExtension.exports.getAPI(1);
  }

  private getSelectedRepository(): Repository | undefined {
    const selected = this.api?.repositories.find(
      (repo: Repository) => repo.ui.selected
    );

    if (selected) {
      return selected;
    }

    return this.api?.repositories[0];
  }

  private getRepositoryByPath(path: string): Repository | undefined {
    const repository = this.api?.repositories.find(
      (r: Repository) => r.rootUri.path === path
    );

    if (repository) {
      return repository;
    }
  }

  public onRepositoryDidChange(handler: RepositoryChangeCallback) {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];

    this.api?.repositories.forEach((repo) => {
      this.disposables.push(
        repo.ui.onDidChange(() => {
          if (repo.ui.selected) {
            handler({
              numberOfRepositories: this.getNumberOfRepositories(),
              selectedRepositoryPath: repo.rootUri.path,
              availableRepositories: this.getAvailableRepositoryPaths(),
            });
          }
        }, this)
      );
    });
  }

  public getNumberOfRepositories() {
    return this.api?.repositories.length || 0;
  }

  public getAvailableRepositoryPaths(): string[] {
    if (!this.api?.repositories) {
      return [];
    }

    return this.api?.repositories.map((r) => r.rootUri.path);
  }

  public getSelectedRepositoryPath() {
    const repo = this.getSelectedRepository();

    return repo?.rootUri.path;
  }

  public isAvailable(): boolean {
    return this.isGitAvailable;
  }

  public getSCMInputBoxMessage(): string {
    const repo = this.getSelectedRepository();

    if (repo) {
      return repo.inputBox.value;
    }

    return '';
  }

  public setSCMInputBoxMessage(message: string, repositoryPath = ''): void {
    let repo: Repository | undefined;

    if (repositoryPath !== '') {
      repo = this.getRepositoryByPath(repositoryPath);
    }

    if (!repo) {
      repo = this.getSelectedRepository();
    }

    if (repo) {
      repo.inputBox.value = message;
      vscode.commands.executeCommand('gitCommitMessageEditor.editor.command.openEditor');
      this.showCOMMIT_EDITMSG(repositoryPath);
      // this.setCOMMIT_EDITMSG(message, repositoryPath);

    }
  }

  public getBranchName(repositoryPath = ''): string {
    let repo: Repository | undefined;

    if (repositoryPath !== '') {
      repo = this.getRepositoryByPath(repositoryPath);
    }

    if (!repo) {
      repo = this.getSelectedRepository();
    }

    if (repo) {
      return repo.state.HEAD?.name || '';
    } else {
      return '';
    }
  }


  public showCOMMIT_EDITMSG(repositoryPath = ''): void {

    const listener = vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor)
        return;
      if (editor.document.uri.path === 'commit-editmsg:' + repositoryPath + '/COMMIT_EDITMSG')
      return;
      listener.dispose();
      const doc = editor.document;
      const firstLine = doc.lineAt(1);
      const lastLine = doc.lineAt(doc.lineCount - 1);
      // this.logger.logObject({firstLine, lastLine,selection:new vscode.Selection(firstLine.range.start, lastLine.range.end)  })
      vscode.window.activeTextEditor?.revealRange(new vscode.Range(firstLine.range.start, lastLine.range.end));
      (vscode.window.activeTextEditor as vscode.TextEditor).selection = new vscode.Selection(lastLine.lineNumber, lastLine.range.end.character, lastLine.lineNumber, lastLine.range.end.character);

      // this.logger.logObject(new vscode.Selection(firstLine.range.start, lastLine.range.end));
    });

  }



  public async getRepositoryRecentCommitMessages(
    repository: Repository,
    limit: number = 32
  ) {
    let log;

    try {
      log = await repository.log({ maxEntries: limit });
    } catch {
      return [];
    }

    if (!log) {
      return [];
    }

    return log;
  }

  public async getRecentCommitMessages(
    limit: number = 32,
    repositoryPath: string = ''
  ) {
    let repo: Repository | undefined;

    if (repositoryPath === '') {
      repo = this.getSelectedRepository();
    } else {
      repo = this.getRepositoryByPath(repositoryPath);
    }

    if (!repo) {
      return [];
    }

    return this.getRepositoryRecentCommitMessages(repo, limit);
  }

  public async getRecentCommitMessagesByPath(path: string, limit = 32) {
    const repo = this.getRepositoryByPath(path);

    if (!repo) {
      return [];
    }

    return this.getRepositoryRecentCommitMessages(repo, limit);
  }

  public addVersionGitTag(tagName: string, commitHash: string) {
    const repo = this.getSelectedRepository();

    if (!repo) {
      return;
    }

    // get path of git command on system
    const gitPath = this.api?.git.path ?? "git"


    // Use vscode built in terminal to create a tag at specific commit

    const terminal = vscode.window.terminals.find(t => t.name === 'Git Tag') ?? vscode.window.createTerminal('Git Tag');
    terminal.show();
    terminal.sendText(`${gitPath} -C "${repo.rootUri.path}" tag '${tagName}' ${commitHash} && ${gitPath} -C "${repo.rootUri.path}" push origin '${tagName}'`);
  }

  public getNumberOfCommits(repositoryPath: string = ''): number {
    let repo: Repository | undefined;

    if (repositoryPath === '') {
      repo = this.getSelectedRepository();
    } else {
      repo = this.getRepositoryByPath(repositoryPath);
    }

    if (!repo) {
      return 0;
    }

    const gitPath = this.api?.git.path ?? "git"


    return Number(execSync(`${gitPath} -C "${repo.rootUri.path}" rev-list --count HEAD`).toString().trim());
  }

}

export default GitService;
