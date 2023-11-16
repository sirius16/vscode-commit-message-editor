import * as vscode from 'vscode';
import GitService from '../utils/GitService';

export const semverRegex = '(?<version>(?<major>[0-9]+)\\.(?<minor>[0-9]+)(?:\\.(?<patch>[0-9]+))?(?:-(?<prerelease>[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?(?:\\+(?<build>[0-9A-Za-z-]+))?)' as const;
export const semverGroupsReplace = [/\$?\<?(version|major|minor|patch|prerelease|build)\>?/g, (_match: string, group: string): string => `\$<${group}>`] as const;
// import {TagVersion} from '../frontend/src/global'
export default class VersionGitTagCommand {
  constructor(private _git: GitService) { }

  async run() {
    for (const commit of await this._git.commits) {
      const [title,] = commit.message.split('\n');
      const regexes = vscode.workspace.getConfiguration('commit-message-editor').get<TagVersion>('gitTagVersion', {});
      const tagTemplate = Object.keys(regexes).find(key => new RegExp(regexes[key].body.toString().replace('<version>',semverRegex)).test(title));
      if (!tagTemplate) {
        continue;
      }
      const tag = title.replace(new RegExp(regexes[tagTemplate].body.toString().replace('<version>',semverRegex)), tagTemplate.replace(...semverGroupsReplace)).replace(/\s/g, '-');
      if (commit.refNames?.some(ref => ref.includes(tag))) continue;
      this._git.addVersionGitTag(tag, commit.hash);
      break
      // ('gitTagVersion',)
    }
  }
}
