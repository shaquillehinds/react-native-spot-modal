#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = '@shaquillehinds/react-native-spot-modal';
const SLUG = 'react-native-spot-modal';
const SOURCE = path.join(__dirname, '..', 'rules', 'AGENT_RULES.md');

const TARGETS = {
  agents: 'AGENTS.md',
  cursor: path.join('.cursor', 'rules', SLUG + '.mdc'),
  claude: path.join('.claude', 'rules', SLUG + '.md'),
  codex: path.join('.codex', 'rules', SLUG + '.md'),
  copilot: path.join('.github', 'instructions', SLUG + '.instructions.md'),
  windsurf: path.join('.windsurf', 'rules', SLUG + '.md'),
};

const HELP = `
  rnsm-rules — install the ${PACKAGE_NAME} agent rules

  Usage
    npx rnsm-rules [target|path] [--force] [--print]

  Targets
    (none)     ./AGENTS.md
    agents     ./AGENTS.md
    cursor     ./.cursor/rules/${SLUG}.mdc          (alwaysApply)
    claude     ./.claude/rules/${SLUG}.md
    codex      ./.codex/rules/${SLUG}.md
    copilot    ./.github/instructions/${SLUG}.instructions.md
    windsurf   ./.windsurf/rules/${SLUG}.md
    <path>     any path ending in .md or .mdc

  Options
    --force    overwrite an existing file
    --print    write nothing, print the rules to stdout
    --help     show this message

  Examples
    npx rnsm-rules
    npx rnsm-rules cursor
    npx rnsm-rules docs/ai/spot-modal.md --force
`;

function frontmatterFor(target) {
  if (target === 'cursor') {
    return [
      '---',
      `description: How to use ${PACKAGE_NAME} correctly`,
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '',
    ].join('\n');
  }
  if (target === 'copilot') {
    return ['---', "applyTo: '**/*.tsx,**/*.ts'", '---', '', ''].join('\n');
  }
  if (target === 'windsurf') {
    return ['---', 'trigger: always_on', '---', '', ''].join('\n');
  }
  return '';
}

function resolveTarget(arg) {
  if (!arg) return { target: 'agents', relPath: TARGETS.agents };
  if (Object.prototype.hasOwnProperty.call(TARGETS, arg)) {
    return { target: arg, relPath: TARGETS[arg] };
  }
  if (/\.mdx?$|\.mdc$/.test(arg)) {
    return { target: 'custom', relPath: arg };
  }
  return null;
}

function main() {
  const argv = process.argv.slice(2);
  const force = argv.includes('--force') || argv.includes('-f');
  const print = argv.includes('--print');
  const help = argv.includes('--help') || argv.includes('-h');
  const positional = argv.filter((a) => !a.startsWith('-'))[0];

  if (help) {
    process.stdout.write(HELP);
    return;
  }

  let rules;
  try {
    rules = fs.readFileSync(SOURCE, 'utf8');
  } catch (err) {
    console.error(
      `rnsm-rules: could not read the rules file at ${SOURCE}\n` +
        `Is ${PACKAGE_NAME} installed?`
    );
    process.exitCode = 1;
    return;
  }

  if (print) {
    process.stdout.write(rules);
    return;
  }

  const resolved = resolveTarget(positional);
  if (!resolved) {
    console.error(
      `rnsm-rules: unknown target "${positional}".\n` +
        `Expected one of: ${Object.keys(TARGETS).join(', ')} — or a path ending in .md / .mdc.\n` +
        `Run "npx rnsm-rules --help" for usage.`
    );
    process.exitCode = 1;
    return;
  }

  const { target, relPath } = resolved;
  const outPath = path.resolve(process.cwd(), relPath);

  if (fs.existsSync(outPath) && !force) {
    console.error(
      `rnsm-rules: ${relPath} already exists. Re-run with --force to overwrite.`
    );
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, frontmatterFor(target) + rules, 'utf8');

  console.log(`rnsm-rules: wrote ${relPath}`);
  if (target === 'agents') {
    console.log(
      'Tip: if you already have an AGENTS.md, use a custom path instead and ' +
        'link to it, e.g. npx rnsm-rules docs/ai/spot-modal.md'
    );
  }
}

main();
