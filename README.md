[![Build Status](https://travis-ci.org/vzamanillo/linter-ruumba.svg?branch=master)](https://travis-ci.org/vzamanillo/linter-ruumba)

# linter-ruumba

This plugin for [Linter](https://github.com/AtomLinter/Linter) provides an
interface to [ruumba](https://github.com/ericqweinstein/ruumba). It will be used with
files that use the Ruby ERB templating system syntax.

## Installation

Linter must be installed in order to use this plugin. It is a hard dependency.
If Linter is not installed, please follow the instructions
[here](https://github.com/AtomLinter/Linter).

### Installing ruumba

Before using this plugin, you must ensure that `ruumba` is installed on your
system. To install `ruumba`, do the following:

1.  Install [ruby](https://www.ruby-lang.org/).

2.  Install [ruumba](https://github.com/ericqweinstein/ruumba) by typing the following
    in a terminal:

    ```ShellSession
    gem install ruumba
    ```

Now you can proceed to install the linter-ruumba plugin.

### Installing the Plugin

```ShellSession
$ apm install linter-ruumba
```

## Settings

You can configure linter-ruumba from its settings panel or by editing
`~/.atom/config.cson` (choose Open Your Config in Atom menu).

### Executable Path

```coffeescript
'linter-ruumba':
  'executablePath': /path/to/your/ruumba/here
```

### Disable when no `.ruumba.yml` config file is present

```coffeescript
'linter-ruumba':
  'disableWhenNoConfigFile': false
```

### Use available CPUs to execute inspection in parallel.

```coffeescript
'linter-ruumba':
  'useParallelExecution': false
```

Run `which ruumba` to find the path (if you're using rbenv run
`rbenv which ruumba`).

If you are working with a Rails project take a look at [How best to use ruumba with rubocop on a Rails project?](https://github.com/ericqweinstein/ruumba/issues/10) for an appropiated configuration.
