import {VscodeInputbox} from '@bendera/vscode-webview-elements/dist/vscode-inputbox';

/**
 * Splits a string into chunks of 72 characters, preserving line breaks and punctuation.
 * and replaces the inputbbox contents with the result.
 *
 * @export
 * @param {string} detail The string to split
 * @param {VscodeInputbox} target The vscode inputbox element to split the string for
 */
function splitTextInInputBox(detail: string, target: VscodeInputbox) {
  const input: HTMLInputElement = <HTMLInputElement>(
    target?.shadowRoot?.querySelector?.('div > div.input-wrapper > textarea')
  );
  const previousTokens = detail
    .substring(0, <number>input.selectionStart)
    .split(/\s+/g);
  const scrollHeight = input.scrollHeight;
  const result = splitText(detail);

  target.value = result

  const selection =
    <number>(
      [...target.value.matchAll(/\S+/g)][previousTokens.length - 1].index
    ) + previousTokens[previousTokens.length - 1].length;
  console.log({previousTokens, input, selection, target});
  setTimeout(() => {
    if (input.scrollHeight > scrollHeight) {
      input.setSelectionRange(selection, selection);
      // input.scrollBy(0, scrollHeight - input.scrollHeight)
      input.blur();
      input.focus();
    }
  }, 100);
}


/**
 * Splits a string into chunks of 72 characters, preserving line breaks and punctuation.
*
* @export
* @param {string} text The string to split
* @return {string[]} The split string chunks
*/
export default function splitText(text: string): string {
  const charLimit = 72;
  const punctation = true;
  const commas = true;
  const regex = new RegExp(`(.{0,${charLimit}}(?: |$)|^\\S+$)[\\r\\n]*`, 'gm');
  const matches = text
  .replace(/([`"])(?:[^\n](?!\1))+[^\n]\1/g, (x: string) => x.replaceAll(' ', '\u00B6')
  )
  .replaceAll('\u2026', '$&\r')
  .replace(/[.!?] */g, '$&' + '\r'.repeat(+!punctation))
  .replace(/[,] */g, '$&' + '\r'.repeat(+(!punctation && !commas)))
  .match(regex) as RegExpMatchArray;
  const splitTextTrim = (string: string): string => string.charAt(string.length - 1) === '\r'
  ? string.substring(0, string.length - 1)
  : string;
  const result = matches.reduce((acc: string[], match: string) => {
    const last = acc.length - 1;
    const newMatch = splitTextTrim(match);
    const { length } = newMatch;
    if (last >= 0 &&
        acc[last].length + length <= charLimit &&
        acc[last][acc[last].length - 1] !== '\n') {
          acc[last] += newMatch;
        } else {
          acc.push(newMatch);
        }
        return acc;
    }, []);
    return result.map((i: string) =>
    i.replace(/[ \n\r]+$/, (x: any) =>
      [...x]
        .filter((x) => x == '\n')
        .join('')
        .substring(1)
    )
  )
  .join('\n')
  .replaceAll('\u00B6', ' ');;
}
type VscodeInputboxInputEvent = CustomEvent<string> & {target: VscodeInputbox};


/**
 * This function is an event handler for the VscodeInputboxInputEvent. It takes in the event details and target element. If the target element has a data attribute called "name" with a value of "body", it calls the splitTextInInputBox function with the event details and target element as arguments.
 */
export function splitTextEventHandler({detail,target}: VscodeInputboxInputEvent) {
  if (target.dataset.name === 'body') {
    target.dataset.timeout && clearTimeout(Number(target.dataset.timeout));
    target.dataset.timeout = String(setTimeout(splitTextInInputBox, 5000, detail, target));
  }
}

