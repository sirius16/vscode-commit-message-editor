import { TokenValueDTO } from './../components/cme-form-view/types';
interface CommitMessage {
  task: string;
  type: string;
  scope: string;
  description: string;
  body: string;
}

export default function parseCommitMessage(message: string): TokenValueDTO {
  // const taskRegex = /^.+-\s+/;
  // const typeRegex = /^\w+\((\w+)\)\:\s+/;
  // const scopeRegex = /^\((\w+)\)\s+/;
  // const descriptionRegex = /^\s*(\w.*)/;
  // const bodyRegex = /^\s*\n\n([\s\S]*?)(\n\n|$)/;
  // const breakingChangeRegex = /^\s*BREAKING CHANGE: (.*)/;
  // const footerRegex = /^\s*\n\n([\s\S]*?)$/;

  // const taskMatch = message.match(taskRegex);
  // const typeMatch = message.match(typeRegex);
  // const scopeMatch = message.match(scopeRegex);
  // const descriptionMatch = message.match(descriptionRegex);
  // const bodyMatch = message.match(bodyRegex);
  // const breakingChangeMatch = message.match(breakingChangeRegex);
  // const footerMatch = message.match(footerRegex);

  const {task, type, scope, description, body} = message.match(/(?:^(?<task>^.+-\s+)?(?<type>\w+)?(?:\((?<scope>[^)]+)\))?:(?: ?(?<description>[^\n\r]+)?)?)?\n*(?<body>[\s\S]+)?/)?.groups as unknown as CommitMessage;
  console.log({task, type, scope, description, body})
  return {
    task: task? task.trim() : '',
    type: type? type : '',
    scope: scope? scope : '',
    description: description? description.trim() : '',
    body: body? body.trim() : '',
  };
}

// export default function commitMessageToTokens(message: string): Token[] {
//   Object.entries(parseCommitMessage(message)).map(([key, value]): Token => {
//     if (value) {
//       return {
//         type
//         value,
//       };
//     }
//     return [];
//   })
// }
