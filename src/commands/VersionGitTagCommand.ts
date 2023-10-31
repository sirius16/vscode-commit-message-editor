import * as vscode from 'vscode';
import GitService from '../utils/GitService';
export default class VersionGitTagCommand {
  constructor(private _git: GitService) { }

  async run() {
    const numCommits = this._git.getNumberOfCommits();
    debugger
    const commits = await this._git.getRecentCommitMessages(numCommits);
    for (const commit of commits) {
      const [title,] = commit.message.split('\n');
      const regexes = vscode.workspace.getConfiguration('commit-message-editor').get<TagVersionRegexes>('gitTagVersionRegexes', {});
      const tagTemplate = Object.keys(regexes).find(key => new RegExp(regexes[key]).test(title));
      if (!tagTemplate) {
        continue;
      }
      const tag = title.replace(new RegExp(regexes[tagTemplate]), tagTemplate).replace(/\s/g, '-');
      if (commit.refNames?.some(ref => ref.includes(tag))) continue;
      this._git.addVersionGitTag(tag, commit.hash);
      break
      // ('gitTagVersionRegexes',)
    }
  }
}
