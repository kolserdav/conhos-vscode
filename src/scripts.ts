import { program } from 'commander';
import { getYamlConfig } from './utils/request';
import path from 'path';
import { writeFileSync } from 'fs';
import { SOURCE, YAML_ORIGINAL_URL } from './constants';

const CWD = process.cwd();

program
  .enablePositionalOptions()
  .usage('[options] <command> [options]')
  .name('Conhos vscode scripts')
  .description('Hosting client');

program
  .command('yaml')
  .description('Synchronize YAML default config')
  .action(async (options) => {
    const data = await getYamlConfig();
    if (!data) {
      return;
    }
    data.information_for_contributors = `This file has been converted from ${YAML_ORIGINAL_URL}`;
    data.name = SOURCE;
    const schemaPath = path.resolve(CWD, 'syntaxes/yml.tmLanguage.json');
    writeFileSync(schemaPath, JSON.stringify(data));
  });

program.parse();
