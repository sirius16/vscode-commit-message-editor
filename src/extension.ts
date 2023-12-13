import * as vscode from 'vscode';
import GitService from './utils/GitService';
import EditorController from './commands/EditorController';
import SettingsPageController from './commands/SettingsPageController';
import CopyFromScmInputBoxCommand from './commands/CopyFromScmInputBoxCommand';
import { Command } from './definitions';
import Logger from './utils/Logger';
import VersionGitTagCommand from './commands/VersionGitTagCommand';
import SwitchToTerminalByNameCommand from './commands/SwitchToTerminalByNameCommand';
import GitTagVersionCompletionProvider from './commands/GitTagVersionCompletionProvider';
import GitCommitFormattingEditProvider from './commands/GitCommitFormattingEditProvider';


export async function activate(context: vscode.ExtensionContext) {
  const logger = new Logger();
  Object.assign(module.exports, { log: logger.log.bind(logger), logObject: logger.logObject.bind(logger) });

  const git = new GitService();

  const editorController = new EditorController(context, git, logger);
  const settingsPageController = new SettingsPageController(context);

  const copyFromScmInputBoxCommand = new CopyFromScmInputBoxCommand(
    git,
    editorController
  );

  const versionGitTagCommand = new VersionGitTagCommand(git)

  const switchToTerminalByNameCommand = new SwitchToTerminalByNameCommand();
  const gitTagVersionCompletionProvider = new GitTagVersionCompletionProvider(git);
  const gitCommitFormattingEditProvider = new GitCommitFormattingEditProvider();



  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.OpenEditor,
      editorController.openInTheMainView,
      editorController
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.OpenSettings,
      settingsPageController.run,
      settingsPageController
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.CopyFromScmInputBox,
      copyFromScmInputBoxCommand.run,
      copyFromScmInputBoxCommand
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.AddVersionGitTag,
      versionGitTagCommand.run,
      versionGitTagCommand
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.SwitchToTerminalByName,
      switchToTerminalByNameCommand.run,
      switchToTerminalByNameCommand
    ));

  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.WriteToTerminalByName,
      switchToTerminalByNameCommand.send,
      switchToTerminalByNameCommand
    ));

  context.subscriptions.push(
    vscode.commands.registerCommand(
      Command.AddTagSnippet,
      gitTagVersionCompletionProvider.addTagSnippet,
      gitTagVersionCompletionProvider
    ));




  vscode.languages.registerDocumentFormattingEditProvider('git-commit',gitCommitFormattingEditProvider)

  vscode.languages.registerCompletionItemProvider('git-commit', gitTagVersionCompletionProvider, 'v');

  logger.log('Extension has been activated');
}

export function log(message: string) {}

export function logObject(obj: any, label = '') {}


export function deactivate() {}
