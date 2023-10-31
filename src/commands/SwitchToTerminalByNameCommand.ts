import * as vscode from 'vscode';
import { basename } from 'path';

export default class SwitchToTerminalByNameCommand {

  run(): void;
  run(name: string): void;
  run({ name }: { name: string; }): void;
  run(...vargs: [{ name: string; }] | [name: string] | []): void {
    let name: string;

    if (vargs.length === 1) {
      if (typeof vargs[0] === 'string') {
        name = vargs[0];
      } else {
        name = vargs[0].name;
      }
    } else name = "";
    if (!name) {
      // Determine if system is linux, osx, or windows
      const platform = ({ darwin: 'osx', win32: 'windows' } as any)[process.platform] ?? 'linux';
      // Get the default shell for the system
      const shell = vscode.workspace.getConfiguration('terminal.integrated.defaultProfile').get<string>(platform) ?? (platform === 'windows' ? 'PowerShell' : basename(process.env.SHELL ?? 'bash'));
      name = shell;
    }
    const terminal = [...vscode.window.terminals].reverse().find(t => t.name === name) ?? vscode.window.createTerminal(name);
    terminal.show();
  }


  send(text: string): void;
  send(text: string, name: string): void;
  send({ text, name }: { text?: string; name?: string; }): void;
  /**
   * Sends a message to the terminal.
   * @param vargs An array of arguments that can include a text message and/or a name for the terminal.
   */
  send(...vargs: [{ text?: string; name?: string; }] | [text: string] | [text: string, name: string]): void {
    let text: string;
    let name: string;

    if (vargs.length === 1) {
      if (typeof vargs[0] === 'string') {
        text = vargs[0];
        name = '';
      } else {
        text = vargs[0].text ?? '';
        name = vargs[0].name ?? '';
      }
    } else if (vargs.length === 2) {
      text = vargs[0];
      name = vargs[1];
    } else {
      // alert
      vscode.window.showInformationMessage('Please provide a text message for the terminal.');
      return;
    }
    if (!name) {
      // Determine if system is linux, osx, or windows
      const platform = ({ darwin: 'osx', win32: 'windows' } as any)[process.platform] ?? 'linux';
      // Get the default shell for the system
      const shell = vscode.workspace.getConfiguration('terminal.integrated.defaultProfile').get<string>(platform) ?? (platform === 'windows' ? 'PowerShell' : basename(process.env.SHELL ?? 'bash'));
      name = shell;
    }
    const terminal = [...vscode.window.terminals].reverse().find(t => t.name === name) ?? vscode.window.createTerminal(name);
    terminal.show();
    terminal.sendText(text);
  }
}
