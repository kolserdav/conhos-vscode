/******************************************************************************************
 * Repository: Conhos vscode
 * File name: request.d.ts
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Tue Sep 10 2024 16:42:55 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
export declare function getMedialplan(): Promise<any>;
export declare function getYamlConfig(): Promise<Record<string, string> | null>;
