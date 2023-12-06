import * as vscode from 'vscode';
import { GitExtension, API, Repository, APIState, Commit, PublishEvent } from '../@types/git';
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

type RepositoryCommits = {
  [repositoryPath: string]: Commit[];
};

class GitService {
  private isGitAvailable: boolean = false;
  private gitExtension: vscode.Extension<GitExtension> | undefined;
  private api: API | undefined;
  private disposables: vscode.Disposable[] = [];
  private allCommits: RepositoryCommits = {};

  constructor() {
    this.gitExtension = vscode.extensions.getExtension('vscode.git');

    if (!this.gitExtension) {
      return;
    }

    this.isGitAvailable = true;
    this.api = this.gitExtension.exports.getAPI(1);

    if (!this.api) {
      return;
    }

    this.api.onDidOpenRepository((repository: Repository) => {
      this.getAllCommits(repository.rootUri.path);
    }, this);

    this.api.onDidPublish(({ repository, branch }: PublishEvent) => {
      this.getAllCommits(repository.rootUri.path);
    });
    this.api.repositories.forEach((repo: Repository) => {
      this.getAllCommits(repo.rootUri.path);
    });



  }

  get commits() {
    return this.getAllCommits();
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
      vscode.window.activeTextEditor!.selection = new vscode.Selection(lastLine.lineNumber, lastLine.range.end.character, lastLine.lineNumber, lastLine.range.end.character);

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


    return Number(execSync(`${gitPath} -C "${repo.rootUri.path}" rev-list --all --count `).toString().trim());
  }

  public async getAllCommits(repositoryPath: string = ''): Promise<Commit[]> {
    let repo: Repository | undefined;

    if (repositoryPath === '') {
      repo = this.getSelectedRepository();
    } else {
      repo = this.getRepositoryByPath(repositoryPath);
    }

    if (!repo) {
      return [];
    }

    if (this.getNumberOfCommits(repositoryPath) <= (this.allCommits[repo.rootUri.path]??=[]).length) return this.allCommits[repo.rootUri.path]
    const gitPath = this.api?.git.path ?? "git"

    console.log('getAllCommits', repo.rootUri.path);
    return Promise.all(execSync(`${gitPath} -C "${repo.rootUri.path}" rev-list --all`).toString().trim().split('\n').map((commitHash: string, index: number) => [commitHash, -index] as const)
    .filter(([commitHash]) => !this.allCommits[repo!.rootUri.path]?.some(commit => commit.hash === commitHash))
    .map(([commitHash, index]) => repo!.getCommit(commitHash).then(commit => [commit, index] as const)))
    // .map(repo.getCommit.bind(repo)))
    .then(commits => {
      this.allCommits[repo!.rootUri.path] = [...this.allCommits[repo!.rootUri.path].map((commit, index) => [commit, index] as const)??[], ...commits].
      sort(([, indexA], [, indexB]) => Math.abs(indexA) - Math.abs(indexB) || indexA - indexB).
      map(([commit]) => commit);
      console.log('getAllCommits done', repo!.rootUri.path, commits.length)
      return this.allCommits[repo!.rootUri.path];
    });
  }

  public async onlyUnstagedOrStagedChanges(files: vscode.Uri[], repositoryPath?: string): Promise<vscode.Uri[]>;
  public async onlyUnstagedOrStagedChanges(files: string[], repositoryPath?: string): Promise<string[]>;
  public async onlyUnstagedOrStagedChanges<T extends vscode.Uri | string>(files: T[], repositoryPath: string = ''): Promise<T[]> {
    let repo: Repository | undefined;

    if (repositoryPath === '') {
      repo = this.getSelectedRepository();
    } else {
      repo = this.getRepositoryByPath(repositoryPath);
    }

    if (!repo) {
      return [];
    }

    const filteredFiles: T[] = [];

    for (const file of files) {
      if (file instanceof vscode.Uri) {
        filteredFiles.push(file as T);
      } else {
        const foundFiles = await vscode.workspace.findFiles(file.replace(/\/\**$/g, '/**'), '**/node_modules/**');
        filteredFiles.push(...foundFiles.map(foundFile => foundFile.path) as T[]);
      }
    }

    return filteredFiles.filter(file => repo!.state.workingTreeChanges.find(change => change.uri.path === (file instanceof vscode.Uri ? file.path : file)) || repo!.state.indexChanges.find(change => change.uri.path === (file instanceof vscode.Uri ? file.path : file)));
  }

  public async addFilesToStage(files: vscode.Uri[], repositoryPath?: string): Promise<void>;
  public async addFilesToStage(files: string[], repositoryPath?: string): Promise<void>;
  public async addFilesToStage(files: vscode.Uri[] | string[], repositoryPath: string = ''): Promise<void> {

    let repo: Repository | undefined;

    if (repositoryPath === '') {
      repo = this.getSelectedRepository();
    } else {
      repo = this.getRepositoryByPath(repositoryPath);
    }

    if (!repo) {
      return;
    }

    files = files.map(file => file instanceof vscode.Uri ? file.path : file);


    await this.unstageAllChanges(repositoryPath);
    await repo.add(files);

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      if (editor.document.languageId !== 'git-commit') return;
      repo!.inputBox.value = editor.document.getText()

      const editorText = editor.document.getText();


      await vscode.commands.executeCommand('gitlens.generateCommitMessage')

      await new Promise<void>(resolve => {
        const interval = setInterval(() => {
          if (repo!.inputBox.value !== editorText) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      })

      editor.edit(editBuilder => {
        const firstLine = editor.document.lineAt(0);
        const lastLine = editor.document.lineAt(editor.document.lineCount - 1);

        editBuilder.replace(new vscode.Range(firstLine.range.start, lastLine.range.end), repo!.inputBox.value);
      });
      const firstLine = editor.document.lineAt(0);
      const lastLine = editor.document.lineAt(editor.document.lineCount - 1);

      editor.revealRange(new vscode.Range(firstLine.range.start, lastLine.range.end));
      editor.selection = new vscode.Selection(lastLine.lineNumber, lastLine.range.end.character, lastLine.lineNumber, lastLine.range.end.character);

      await vscode.commands.executeCommand('editor.action.formatDocument');

    }



  }

  public async unstageAllChanges(repositoryPath: string = ''): Promise<void> {
    let repo: Repository | undefined;

    if (repositoryPath === '') {
      repo = this.getSelectedRepository();
    } else {
      repo = this.getRepositoryByPath(repositoryPath);
    }

    if (!repo) {
      return;
    }

    await repo.revert([]);
  }

}

export default GitService;
