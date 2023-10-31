import * as vscode from 'vscode';
import { semverGroupsReplace, semverRegex } from './commands/VersionGitTagCommand';
import GitService from './utils/GitService';
import { Command } from './definitions';

const semverRegexp = new RegExp(semverRegex);

export default class GitTagVersionCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private _git: GitService) { }
    async provideCompletionItems(_document: vscode.TextDocument, _position: vscode.Position, _token: vscode.CancellationToken, _context: vscode.CompletionContext) {
        const config = vscode.workspace.getConfiguration('commit-message-editor');
        const gitTagVersion = config.get<TagVersion>('gitTagVersion',{});

        const completionItems = (await Promise.all(Object.keys(gitTagVersion).map(async key => {
            const snippet = gitTagVersion[key];
            const files = this._git.onlyUnstagedOrStagedChanges(snippet.files);
            if (!files.length || files[0] !== snippet.files[0]) {
              return;
            }

            const completionItem = new vscode.CompletionItem(snippet.prefix, vscode.CompletionItemKind.Method);
            // search files in workspace for the version number
            console.log(await vscode.workspace.findFiles("**","**/node_modules/**"));
            console.log(snippet.files.join(','),await vscode.workspace.findFiles(snippet.files.join(','),"**/node_modules/**"));
            const {groups: {version=''} = {}} = await vscode.workspace.findFiles(files[0], '**/node_modules/**')
            .then(async ([file]) => {
              const doc = await vscode.workspace.openTextDocument(file);
              const match = doc.getText().match(semverRegexp);
              if (match) {
                return match as semverRegexMatchGroup
              }
            }) ?? {};

            if (!version) {
              return;
            }

        completionItem.command = {
            title: "Commit Message Editor: Add Tag Snippet",
            command: Command.AddTagSnippet,
            arguments: [key]
        };

            completionItem.insertText = new vscode.SnippetString(version.replace(semverRegexp,snippet.body.toString().replace(...semverGroupsReplace)));
              // '<version>','$version')));
            completionItem.documentation = new vscode.MarkdownString(snippet.description ?? '');


            return completionItem;
        }))).filter(completionItem => completionItem) as vscode.CompletionItem[];

        return completionItems;
    }

    addTagSnippet(key: string) {
      const config = vscode.workspace.getConfiguration('commit-message-editor');
      const gitTagVersion = config.get<TagVersion>('gitTagVersion',{});
      const snippet = gitTagVersion[key];

      vscode.workspace.findFiles(this._git.onlyUnstagedOrStagedChanges(snippet.files).join(","), '**/node_modules/**').then(this._git.addFilesToStage.bind(this._git));
      // git add snippet.files
      // this._git.addFilesToStage(snippet.files);

    }
}

