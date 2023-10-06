import * as vscode from 'vscode';
import GitService from './utils/GitService';
import EditorController from './commands/EditorController';
import SettingsPageController from './commands/SettingsPageController';
import CopyFromScmInputBoxCommand from './commands/CopyFromScmInputBoxCommand';
import { Command } from './definitions';
import Logger from './utils/Logger';
import { splitLine } from '../frontend/src/utils/splitText';
import { VersionGitTagCommand } from './commands/VersionGitTagCommand';
import { SwitchToTerminalByNameCommand } from './SwitchToTerminalByNameCommand';
export async function activate(context: vscode.ExtensionContext) {
  const logger = new Logger();
  const git = new GitService();

  const editorController = new EditorController(context, git, logger);
  const settingsPageController = new SettingsPageController(context);

  const copyFromScmInputBoxCommand = new CopyFromScmInputBoxCommand(
    git,
    editorController
  );

  const versionGitTagCommand = new VersionGitTagCommand(git)

  const switchToTerminalByNameCommand = new SwitchToTerminalByNameCommand();


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
    ))


  vscode.languages.registerDocumentFormattingEditProvider('git-commit',{
provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      const firstLine = document.lineAt(2);
      let lastLine = document.lineAt(document.lineCount - 1);
      let range = new vscode.Range(firstLine.range.start, lastLine.range.end);

      // Set the last line to any line that starts with "# ------------------------"
      for (let i = 0; i < lastLine.lineNumber; i++) {
          const line = document.lineAt(i);
          const lineText = line.text.trim();
          if (lineText.startsWith("# ------------------------")) {
              lastLine = line;
              break;
          }
      }

      // Format the lines above the last line
      const formattedLines: string[] = [];
      for (let i = firstLine.lineNumber; i <= lastLine.lineNumber; i++) {
          const line = document.lineAt(i);
          const lineText = line.text.trim();
          if (lineText.startsWith("#")) {
              formattedLines.push(line.text);
          } else {
              formattedLines.push(splitLine(line.text));
          }
      }

      return [new vscode.TextEdit(range, (formattedLines.join("\n")))];
    }


  })

  logger.log('Extension has been activated');
}

export function deactivate() {}
