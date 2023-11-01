import * as vscode from 'vscode';
import { semverGroupsReplace, semverRegex } from './VersionGitTagCommand';
import GitService from '../utils/GitService';
import { Command } from '../definitions';

const semverRegexp = new RegExp(semverRegex);

export default class GitTagVersionCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private _git: GitService) { }
    async provideCompletionItems(_document: vscode.TextDocument, _position: vscode.Position, _token: vscode.CancellationToken, _context: vscode.CompletionContext) {
        const config = vscode.workspace.getConfiguration('commit-message-editor');
        const gitTagVersion = config.get<TagVersion>('gitTagVersion',{});

        const completionItems = (await Promise.all(Object.keys(gitTagVersion).map(async key => {
            const snippet = gitTagVersion[key];
            const files = (await this._git.onlyUnstagedOrStagedChanges(snippet.files));
            if (!files.length || files[0] !== (await vscode.workspace.findFiles(snippet.files[0]))[0].path) {
              return;
            }

            const completionItem = new vscode.CompletionItem(snippet.prefix, vscode.CompletionItemKind.Method);
            // search files in workspace for the version number
            console.log(`{${snippet.files.join(', ')}}`,await vscode.workspace.findFiles(`{${ snippet.files.join(', ') }}`,"**/node_modules/**"),files);
            const doc = await vscode.workspace.openTextDocument(files[0]);
            const match = doc.getText().match(semverRegexp);
            const version = (<semverRegexMatchGroup>match)?.groups?.version;
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

    async addTagSnippet(key: string) {
      const config = vscode.workspace.getConfiguration('commit-message-editor');
      const gitTagVersion = config.get<TagVersion>('gitTagVersion',{});
      const snippet = gitTagVersion[key];

      this._git.addFilesToStage(await this._git.onlyUnstagedOrStagedChanges(snippet.files))
      // git add snippet.files
      // this._git.addFilesToStage(snippet.files);

    }
}

