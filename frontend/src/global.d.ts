import {RootState} from './store/store';

declare global {
  interface Commit {
    readonly hash: string;
    readonly message: string;
    readonly parents: string[];
    readonly authorDate: string;
    readonly authorName: string;
    readonly authorEmail?: string | undefined;
    commitDate: string;
  }

  type PostMessageCommand =
    | 'requestConfig'
    | 'closeTab'
    | 'requestRecentCommits'
    | 'confirmAmend'
    | 'copyFromExtensionMessageBox'
    | 'importConfig'
    | 'exportConfig'
    | 'loadCurrentConfig'
    | 'getGitBranchName'
    | 'saveToSettings'
    | 'openConfigurationPage'
    | 'copyToExtensionMessageBox';

  interface PostMessageDO {
    command: PostMessageCommand;
    payload?: unknown;
  }

  type MessageEventCommand =
    | 'amendPerformed'
    | 'copyFromSCMInputBox'
    | 'recentCommitMessages'
    | 'receiveConfig'
    | 'repositoryInfo'
    | 'receiveImportedConfig'
    | 'receiveGitTaskName'
    | 'statusMessage'
    | 'loadCurrentConfig';

  interface ReceivedMessageDO {
    command: MessageEventCommand;
    payload?: unknown;
  }

  interface VSCodeAPI {
    postMessage: (message: PostMessageDO) => void;
    getState: () => RootState;
    setState: (state: RootState) => void;
  }

  type TokenType = 'text' | 'boolean' | 'enum';

  interface EnumTokenOption {
    label: string;
    value?: string;
    description?: string;
  }

  interface Token {
    label: string;
    name: string;
    type: TokenType;
    value?: string;
    options?: EnumTokenOption[];
    description?: string;
    multiline?: boolean;
    monospace?: boolean;
    combobox?: boolean;
    filter?: string;
    lines?: number;
    maxLines?: number;
    maxLength?: number;
    maxLineLength?: number;
    multiple?: boolean;
    separator?: string;
    prefix?: string;
    suffix?: string;
  }

  type DefaultViewConfig = 'text' | 'form';
  type VisibleViewsConfig = 'text' | 'form' | 'both';
  type BranchTaskNames = {[branchName: string]: string;}
  type TagVersion = {[tagName: string]: {prefix: string, body: string | RegExp, description?: string, files: string[];}};

  interface ExtensionConfig {
    confirmAmend: boolean;
    dynamicTemplate: string[];
    staticTemplate: string[];
    tokens: Token[];
    reduceEmptyLines: boolean;
    view: {
      defaultView: DefaultViewConfig;
      visibleViews: VisibleViewsConfig;
      showRecentCommits: boolean;
      saveAndClose: boolean;
      fullWidth: boolean;
      useMonospaceEditor: boolean;
      tabSize: number;
      useTabs: boolean;
      rulers: number[];
      visibleLines: number;
    };
    gitBranchTaskNames: BranchTaskNames;
    gitTagVersion: TagVersion;
  }

  type ShareableConfig = Pick<
    ExtensionConfig,
    'dynamicTemplate' | 'staticTemplate' | 'tokens'
  >;

  interface RepositoryInfo {
    numberOfRepositories: number;
    selectedRepositoryPath: string;
    availableRepositories: string[];
  }

  function acquireVsCodeApi(): VSCodeAPI;

  type semverRegexMatchGroup = RegExpExecArray & {groups: {
    version: string;
    major: string;
    minor: string;
    patch: string;
    prerelease: string;
    build: string;
  }, index: number, input: string, length: number,[index: number]: string}
}

