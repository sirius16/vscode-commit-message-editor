import * as vscode from 'vscode';
import { semverGroupsReplace, semverRegex } from './VersionGitTagCommand';
import GitService from '../utils/GitService';
import { Command } from '../definitions';
import { basename } from 'path';
import Logger from '../utils/Logger';


const semverRegexp = new RegExp(semverRegex);
type VersionParts<T extends string | number | undefined = string | number | undefined> = [major: T] | [major: T, minor: T] | [major: T, minor: T, patch: T];
export default class GitTagVersionCompletionProvider implements vscode.CompletionItemProvider {
constructor(private _git: GitService, private _logger: Logger) { }
    async provideCompletionItems(_document: vscode.TextDocument, _position: vscode.Position, _token: vscode.CancellationToken, _context: vscode.CompletionContext) {
        const config = vscode.workspace.getConfiguration('commit-message-editor');
        const gitTagVersion = config.get<TagVersion>('gitTagVersion',{});

        const completionItems = (await Promise.all(Object.keys(gitTagVersion).map(async key => {
            const snippet = gitTagVersion[key];
            const files = (await this._git.onlyUnstagedOrStagedChanges(snippet.files));
            if ((files.length < 2 && snippet.files.length > 1) || files[0] !== (await vscode.workspace.findFiles(snippet.files[0]))[0].path) return;

            const completionItem = new vscode.CompletionItem(snippet.prefix, vscode.CompletionItemKind.Method);
            // search files in workspace for the version number
            this._logger.logObject([`{${snippet.files.join(', ')}}`,await vscode.workspace.findFiles(`{${ snippet.files.join(', ') }}`,"**/node_modules/**"),files])
            console.log(`{${snippet.files.join(', ')}}`,await vscode.workspace.findFiles(`{${ snippet.files.join(', ') }}`,"**/node_modules/**"),files);
            const doc = await vscode.workspace.openTextDocument(files[0]);
            const match = doc.getText().match(semverRegexp) as semverRegexMatchGroup | null;
            const version = match?.groups?.version;
            const [highestExistingVersion,...highestExistingVersionParts] = await this.getHighestExistingVersion(key);
            if (!version) {
              return;
            }
            const {major,minor,patch} = match?.groups;
            const version_1 = GitTagVersionCompletionProvider.compareVersions([major,minor,patch],highestExistingVersionParts) > 0 ? highestExistingVersion : version;



        completionItem.command = {
            title: "Commit Message Editor: Add Tag Snippet",
            command: Command.AddTagSnippet,
            arguments: version_1 === version ? [key] : [key,version_1]
        };

            completionItem.insertText = new vscode.SnippetString(version_1.replace(semverRegexp,snippet.body.toString().replace(...semverGroupsReplace)));
              // '<version>','$version')));
            completionItem.documentation = new vscode.MarkdownString(snippet.description ?? '');


            return completionItem;
        }))).filter(completionItem => completionItem) as vscode.CompletionItem[];

        return completionItems;
    }

    async addTagSnippet(key: string, version?: string) {
      const config = vscode.workspace.getConfiguration('commit-message-editor');
      const gitTagVersion = config.get<TagVersion>('gitTagVersion',{});
      const snippet = gitTagVersion[key];
      const files = (await this._git.onlyUnstagedOrStagedChanges(snippet.files));
      if (version) {
        await this._git.unstageAllChanges();
        await new Promise<number>(resolve => {
          let i = 0;
          const workspaceEdit = new vscode.WorkspaceEdit();
          const files_1 = files.filter(file => basename(file) === basename(snippet.files[0]));
          // edit version number in all files
          Promise.all(files_1
            .map(async file => {
          // vscode.workspace.findFiles(`{${snippet.files}}`,"**/node_modules/**").then(async files_1 => Promise.all(files_1.filter(file => files.includes(file.path))
            // .map(async file => {
            const doc = await vscode.workspace.openTextDocument(file);
            const newVersion = doc.getText().replace(semverRegexp, version);
            workspaceEdit.replace(doc.uri, new vscode.Range(0, 0, doc.lineCount, 0), newVersion);
          }))
          .then(() => vscode.workspace.applyEdit(workspaceEdit))
          vscode.workspace.onDidSaveTextDocument(() => {
            this._logger.logObject(['saved %d files out of %d (%s)',i,files_1.length,Intl.NumberFormat('en-US',{style: 'percent',maximumFractionDigits: 2}).format(i / files_1.length)])
            console.log('saved %d files out of %d (%s)',++i,files_1.length,Intl.NumberFormat('en-US',{style: 'percent',maximumFractionDigits: 2}).format(i / files_1.length));
            if (i === files_1.length) resolve(i);
          });

        }).then(console.log,console.error);
      }

      this._git.addFilesToStage(files)
    }
    async getHighestExistingVersion(key: string) {
      const config = vscode.workspace.getConfiguration('commit-message-editor');
      const gitTagVersion = config.get<TagVersion>('gitTagVersion',{});
      const snippet = gitTagVersion[key];



      const body = new RegExp(snippet.body.toString().replace('<version>',semverRegex));




      const [highestVersion,...parts] = (await this._git.commits)
      .filter(commit => body.test(commit.message.split('\n')[0])).map(commit => {
        const [title,] = commit.message.split('\n');
        const match = title.match(semverRegexp);

        return ["version", "major", "minor", "patch"].map((key, index) => match?.groups?.[key]).filter(part => part) as [version: string, ...VersionParts<string>]
      }).sort(([, ...a], [, ...b]) => GitTagVersionCompletionProvider.compareVersions(a, b))[0] ?? [];

      if (!highestVersion) return ["0.0.0","0","0","0"] as [version: string, ...VersionParts<string>]

      const parts_1 = highestVersion.split('.').map(Number);
      parts_1[parts_1.length - 1]++;
      parts[parts.length - 1] = (Number(parts[parts.length - 1]) + 1).toString();
      const highestVersion_1 = parts_1.join('.');


     return [highestVersion_1,...parts] as [version: string, ...VersionParts<string>]
    }
    /**
     * Compares two versions represented as arrays of major, minor, and patch numbers.
     * Reverse order, so that the highest version is first.
     * @example
     * compareVersions([1,2,3],[1,2,4]) // 1.2.3 < 1.2.4 so 1
     * compareVersions([1,2,3],[1,2,3]) // 1.2.3 == 1.2.3 so 0
     * compareVersions([1,2,3],[1,2,2]) // 1.2.3 > 1.2.2 so -1
     * compareVersions([1,2,3],[1,2]) // 1.2.3 > 1.2 => 1.2.3 > 1.2.0 so -1
     * @param {[major, minor, patch]} a - The first version to compare.
     * @param {[major, minor, patch]} b - The second version to compare.
     * @returns {-1 | 0 | 1} - Returns -1 if a > b, 0 if a == b, and 1 if a < b.
     */
    static compareVersions(a: VersionParts, b: VersionParts): -1 | 0 | 1 {

      const [aMajor,aMinor,aPatch] = Object.assign([0,0,0],a).map(part => +(part as number) || 0);
      const [bMajor,bMinor,bPatch] = Object.assign([0,0,0],b).map(part => +(part as number) || 0);
      return (Math.sign(bMajor - aMajor) || Math.sign(bMinor - aMinor) || Math.sign(bPatch - aPatch)) as -1 | 0 | 1;
    }

  }
