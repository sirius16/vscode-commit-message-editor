interface CommitMessageFormatterOptions {
  blankLineAfterSubject?: boolean;
  subjectLength?: number;
  lineLength?: number;
}

class CommitMessageFormatter {
  private _blankLineAfterSubject: boolean;
  private _subjectLength: number;
  private _lineLength: number;

  constructor({
    blankLineAfterSubject = false,
    subjectLength = 50,
    lineLength = 72,
  }: CommitMessageFormatterOptions) {
    this._blankLineAfterSubject = blankLineAfterSubject;
    this._subjectLength = subjectLength;
    this._lineLength = lineLength;
  }

  format(message: string): string {
    let pos = 0;
    let nextBreakPoint = this._subjectLength;
    const lines: string[] = [];

    while (pos < message.length) {
      lines.push(message.substring(pos, nextBreakPoint));

      if (pos === 0 && this._blankLineAfterSubject) {
        lines.push('');
      }

      pos = nextBreakPoint;
      nextBreakPoint = Math.min(
        nextBreakPoint + this._lineLength,
        message.length
      );
    }

    return lines.join('\n');
  }
}

export default CommitMessageFormatter;
