/******************************************************************************************
 * Repository: Conhos vscode
 * File name: yaml.ts
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Tue Sep 10 2024 16:42:55 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import yaml from 'yaml';
import type { ConfigFile } from '../../index';

export function parse(text: string) {
  let data: ConfigFile | null = null;
  let error: Error | null = null;
  try {
    data = yaml.parse(text);
  } catch (e) {
    error = e as Error;
  }
  return {
    data,
    error,
  };
}
