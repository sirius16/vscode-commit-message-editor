import * as vscode from 'vscode';
import { basename } from 'path';
import { execSync } from 'child_process';
import { findAsync } from './utils';
import { lookup } from 'ps-node';
import ps_tree = require('ps-tree');

export default class SwitchToTerminalByNameCommand {

  async run(): Promise<vscode.Terminal>;
  async run(name: string): Promise<vscode.Terminal>;
  async run({ name }: { name: string; }): Promise<vscode.Terminal>;
  async run(...vargs: [{ name: string; }] | [name: string] | []): Promise<vscode.Terminal> {
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

    const terminal = (await findAsync([...vscode.window.terminals].reverse(), t => t.name === name && new Promise(async resolve => ps_tree(await t.processId, (err, children) => resolve(children.length === 0))) ))?? vscode.window.createTerminal(name);
    // const terminal = [...vscode.window.terminals].reverse().find(async t => t.name === name && !execSync(`pgrep -P ${await t.processId}`)) ?? vscode.window.createTerminal(name);
    terminal.show();
    return terminal;
  }


  async send(text: string): Promise<void>;
  async send(text: string, name: string): Promise<void>;
  async send({ text, name }: { text?: string; name?: string; }): Promise<void>;
  /**
   * Sends a message to the terminal.
   * @param vargs An array of arguments that can include a text message and/or a name for the terminal.
   */
  async send(...vargs: [{ text?: string; name?: string; }] | [text: string] | [text: string, name: string]): Promise<void> {
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
    const terminal = await this.run(name);
    terminal.sendText(text);
    // if (!name) {
    //   // Determine if system is linux, osx, or windows
    //   const platform = ({ darwin: 'osx', win32: 'windows' } as any)[process.platform] ?? 'linux';
    //   // Get the default shell for the system
    //   const shell = vscode.workspace.getConfiguration('terminal.integrated.defaultProfile').get<string>(platform) ?? (platform === 'windows' ? 'PowerShell' : basename(process.env.SHELL ?? 'bash'));
    //   name = shell;
    // }
    // const terminal = [...vscode.window.terminals].reverse().find(t => t.name === name) ?? vscode.window.createTerminal(name);
    // terminal.show();
    // terminal.sendText(text);
  }
}
