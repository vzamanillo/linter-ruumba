'use babel';

import * as path from 'path';
import {
  // eslint-disable-next-line no-unused-vars
  it, fit, wait, beforeEach, afterEach,
} from 'jasmine-fix';

const { lint } = require('../lib/init.js').provideLinter();

const badFile = path.join(__dirname, 'fixtures', 'bad.html.erb');
const goodFile = path.join(__dirname, 'fixtures', 'good.html.erb');

describe('The ruumba provider for Linter', () => {
  beforeEach(async () => {
    atom.workspace.destroyActivePaneItem();

    const activationPromise = atom.packages.activatePackage('linter-ruumba');

    await atom.packages.activatePackage('language-ruby');
    await atom.workspace.open(goodFile);

    atom.packages.triggerDeferredActivationHooks();
    await activationPromise;
  });

  it('should be in the packages list', () => {
    expect(atom.packages.isPackageLoaded('linter-ruumba')).toBe(true);
  });

  it('should be an active package', () => {
    expect(atom.packages.isPackageActive('linter-ruumba')).toBe(true);
  });

  it('checks a file with syntax error and reports the correct message', async () => {
    const excerpt = 'Style/MethodCallWithoutArgsParentheses: Do not use parentheses for method calls with no arguments.';
    const editor = await atom.workspace.open(badFile);
    const messages = await lint(editor);

    expect(messages.length).toBe(1);
    expect(messages[0].severity).toBe('info');
    expect(messages[0].excerpt).toBe(excerpt);
    expect(messages[0].location.file).toBe(badFile);
    expect(messages[0].location.position).toEqual([[2, 6], [2, 8]]);
  });

  it('finds nothing wrong with a valid file', async () => {
    const editor = await atom.workspace.open(goodFile);
    const messages = await lint(editor);
    expect(messages.length).toBe(0);
  });
});
