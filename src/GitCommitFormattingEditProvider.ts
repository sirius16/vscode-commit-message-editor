import * as vscode from 'vscode';
import { splitLine } from '../frontend/src/utils/splitText';

export default class GitCommitFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
  constructor() { }
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
}
