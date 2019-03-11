'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';

let helpers;
let path;

const loadDeps = () => {
  if (!helpers) {
    helpers = require('atom-linter');
  }
  if (!path) {
    path = require('path');
  }
};

const forwardRuumbaToLinter = ({ message, location, severity }, file, editor) => {
  let position;
  if (location) {
    const { line, column, length } = location;
    position = [[line - 1, column - 1], [line - 1, (column + length) - 1]];
  } else {
    position = helpers.generateRange(editor, 0);
  }

  const severityMapping = {
    refactor: 'info',
    convention: 'info',
    warning: 'warning',
    error: 'error',
    fatal: 'error',
  };

  const linterMessage = {
    excerpt: message,
    severity: severityMapping[severity] || 'error',
    location: {
      file,
      position,
    },
  };
  return linterMessage;
};

const parseFromStd = (stdout, stderr) => {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    // continue regardless of error
  }
  if (typeof parsed !== 'object') { throw new Error(stderr || stdout); }
  return parsed;
};

module.exports = {
  activate() {
    this.idleCallbacks = new Set();
    let depsCallbackID;
    const installLinterRuumbaDeps = () => {
      this.idleCallbacks.delete(depsCallbackID);
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('linter-ruumba');
      }
      loadDeps();
    };
    depsCallbackID = window.requestIdleCallback(installLinterRuumbaDeps);
    this.idleCallbacks.add(depsCallbackID);

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      atom.config.observe(
        'linter-ruumba.executablePath',
        (value) => { this.executablePath = value; },
      ),
      atom.config.observe(
        'linter-ruumba.disableWhenNoConfigFile',
        (value) => { this.disableWhenNoConfigFile = value; },
      ),
      atom.config.observe(
        'linter-ruumba.useParallelExecution',
        (value) => { this.useParallelExecution = value; },
      ),
    );
  },

  deactivate() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    this.idleCallbacks.clear();
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'ruumba',
      grammarScopes: ['text.html.erb', 'text.html.ruby'],
      scope: 'file',
      lintsOnChange: false,
      lint: async (editor) => {
        if (!atom.workspace.isTextEditor(editor)) {
          // If we somehow get fed an invalid TextEditor just immediately return
          return null;
        }

        loadDeps();

        const filePath = editor.getPath();
        if (!filePath) {
          return null;
        }

        const configFile = await helpers.findCachedAsync(filePath, '.ruumba.yml');
        if (this.disableWhenNoConfigFile === true) {
          if (configFile === null) {
            return [];
          }
        }

        const args = [];

        args.push('--format', 'json');
        args.push('--stdin', filePath);

        if (configFile) {
          args.push('--config', configFile);
        }

        if (this.useParallelExecution) {
          args.push('--parallel');
        }

        const stdin = editor.getText();
        const cwd = path.dirname(filePath);

        const execOptions = {
          cwd,
          stdin,
          stream: 'both',
          timeout: 10000,
          uniqueKey: `linter-ruumba::${filePath}`,
        };

        let output;
        try {
          output = await helpers.exec(this.executablePath, args, execOptions);
        } catch (e) {
          if (e.message === 'Process execution timed out') {
            atom.notifications.addInfo('linter-ruumba: `ruumba` timed out', {
              description: 'A timeout occured while executing `ruumba`, it could be due to lower resources '
                           + 'or a temporary overload.',
            });
          } else {
            atom.notifications.addError('linter-ruumba: Unexpected error', { description: e.message });
          }
          return null;
        }

        if (editor.getText() !== stdin) {
          // Editor contents have changed, tell Linter not to update
          return null;
        }

        // Process was canceled by newer process
        if (output === null) { return null; }

        const { files } = parseFromStd(output.stdout, output.stderr);
        const offenses = files && files[0] && files[0].offenses;
        return (offenses || []).map(offense => forwardRuumbaToLinter(offense, filePath, editor));
      },
    };
  },
};
