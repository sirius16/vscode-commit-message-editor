import * as vscode from 'vscode';
import { basename } from 'path';

export class SwitchToTerminalByNameCommand {

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
    const terminal = vscode.window.terminals.find(t => t.name === name) ?? vscode.window.createTerminal(name);
    terminal.show();
  }

}
