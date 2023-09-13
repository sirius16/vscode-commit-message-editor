import {VscodeInputbox} from '@bendera/vscode-webview-elements/dist/vscode-inputbox';
import { FormView } from '../components/cme-form-view/cme-form-view';


/**
 * Splits a string into chunks of 72 characters, preserving line breaks and punctuation.
 * and replaces the inputbbox contents with the result.
 *
 * @export
 * @param {string} detail The string to split
 * @param {VscodeInputbox} target The vscode inputbox element to split the string for
 */
// function splitTextInInputBox(detail: string, target: VscodeInputbox) {
//   const input: HTMLInputElement = <HTMLInputElement>(
//     target?.shadowRoot?.querySelector?.('div > div.input-wrapper > textarea')
//   );
//   input.dataset.selectionStart = input?.selectionStart?.toString();
//   const previousTokens = detail
//   .substring(0, <number>input.selectionStart)
//   .split(/\s+/g);
//   const scrollHeight = input.scrollHeight;
//   const result = splitText(detail.replaceAll('\n(?!\n)', ' '));
//   target.value = input.value = result
//   if (input.value.length === input.selectionStart) return;

//   const selection =
//     <number>(
//       [...target.value.matchAll(/\S+/g)][previousTokens.length - 1].index
//     ) + previousTokens[previousTokens.length - 1].length;
//   console.log({previousTokens, input, selection, target});
// input.dataset.interval && clearInterval(Number(input.dataset.interval));
//   input.dataset.interval = String(setInterval(() => {
//     input.selectionStart = selection;
//     input.selectionEnd = selection;
//     input.scrollTop = scrollHeight;
//     input.blur();
//     input.focus();
//     clearInterval(Number(input.dataset.interval));
//   }, 10));
// }


/**
 * Splits a string into chunks of 72 characters, preserving line breaks and punctuation.
*
* @export
* @param {string} text The string to split
* @param {number} [charLimit=72] The maximum number of characters per chunk
* @return {string[]} The split string chunks
*/
export default function splitText(text: string, charLimit: number = 72): string[] {
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
    ).replaceAll('\u00B6', ' ')
  )
}

/**
 * Splits a line into chunks of 72 characters, preserving line breaks and punctuation and indentation.
 * @param {string} line The string to split
 * @return {string} the split string chunks, joined by newlines
 */
export function splitLine(line: string): string {
  const indent = line.match(/^\s*/)?.[0] || '';
  const result = splitText(line.replace(indent, ''), 72 - indent.length);
  return result.map((i: string) => indent + i).join('\n');
}


type VscodeInputboxInputEvent = CustomEvent<string> & {target: VscodeInputbox};



/**
 * This function is an event handler for the VscodeInputboxInputEvent. It takes in the event details and target element. If the target element has a data attribute called "name" with a value of "body", it calls the splitTextInInputBox function with the event details and target element as arguments.
 */
export function splitTextEventHandler(this:FormView, {target,detail}: VscodeInputboxInputEvent) {
  if (target.dataset.name === 'body' && detail) {
    // target.dataset.timeout && clearTimeout(Number(target.dataset.timeout));
    // target.dataset.timeout = String(setTimeout(splitTextInInputBox, 0, detail, target));

    // splitTextInInputBox(detail, target);

    // const input: HTMLTextAreaElement = <HTMLTextAreaElement>(
    //        target?.shadowRoot?.querySelector?.('div > div.input-wrapper > textarea')
    //      );
    //      input.blur();
    //      input.focus();

    target.dispatchEvent(new CustomEvent('vsc-change'));
    // @ts-ignore
    this._handleSuccessButtonClick();
    debugger;
    let z=4;
    console.log(z++)

    // document.querySelector("body > cme-editor-page")?.shadowRoot?.querySelector("cme-editor")?.shadowRoot?.querySelector("#t1-p1 > cme-form-view")?.shadowRoot?.querySelector<VscodeButton>("#success-button-form")?.click();
  }
}

