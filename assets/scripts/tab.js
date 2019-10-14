const elMessageBox = document.getElementById('message-box');
const elEditForm = document.getElementById('edit-form');
const elSuccessButton = document.getElementById('success-button');
const elCancelButton = document.getElementById('cancel-button');
const elRecentCommitsWrapper = document.getElementById('recent-commits-wrapper');
const elRecentCommitsList = document.getElementById('recent-commits-wrapper__commits-list');

function transformCommitList(commits) {
  const icons = {
    leaf: 'git-commit',
  };

  data = [];

  commits.forEach((item) => {
    const { message } = item;

    data.push({
      icons,
      label: message,
    });
  });

  return data;
}

window.addEventListener('message', event => {
  const { data } = event;

  switch (data.command) {
    case 'copyFromSCMInputBox':
      elMessageBox.innerHTML = data.payload.inputBoxValue;
      break;
    case 'recentCommitMessages':
      elRecentCommitsWrapper.classList.remove('is-loading');
      elRecentCommitsList.data = transformCommitList(data.payload.commits);
      break;
  }
});

(function() {
  const vscode = acquireVsCodeApi();

  const closeTab = () => {
    vscode.postMessage({
      command: 'closeTab',
    });
  };

  elSuccessButton.addEventListener('click', event => {
    event.stopPropagation();
    event.preventDefault();

    vscode.postMessage({
      command: 'copyFromExtensionMessageBox',
      payload: elMessageBox.value,
    });

    closeTab();
  });

  elCancelButton.addEventListener('click', event => {
    event.stopPropagation();
    event.preventDefault();

    closeTab();
  });

  elRecentCommitsList.addEventListener('vsc-select', (event) => {
    elMessageBox.value = event.detail.value;
  });
})();
