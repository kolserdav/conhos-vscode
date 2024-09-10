/******************************************************************************************
 * Repository: Conhos vscode
 * File name: request.ts
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Tue Sep 10 2024 16:42:55 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import { DeployData } from '../..';
import { YAML_ORIGINAL_URL_RAW } from '../constants';
import log from './log';

export function getMedialplan() {
  return new Promise<DeployData | null>((resolve) => {
    fetch('http://localhost:3001/v1/get-media-plan')
      .then((r) => r.json())
      .then((d) => {
        resolve(d.data);
      })
      .catch((e) => {
        log('error', 'Failed to get mediaplan', e);
        resolve(null);
      });
  });
}

export function getYamlConfig() {
  return new Promise<Record<string, string> | null>((resolve) => {
    fetch(YAML_ORIGINAL_URL_RAW)
      .then((r) => r.json())
      .then((d) => {
        resolve(d);
      })
      .catch((e) => {
        log('error', 'Failed to get yaml', e);
        resolve(null);
      });
  });
}
