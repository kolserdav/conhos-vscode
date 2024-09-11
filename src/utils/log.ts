/******************************************************************************************
 * Repository: Conhos vscode
 * File name: log.ts
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Tue Sep 10 2024 16:42:55 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import type { Status } from '../../index';
import { SOURCE } from '../constants';

export default function log(status: Status, message: string, ...args: any) {
  console[status](`[${SOURCE}]`, status, message, ...args);
}
