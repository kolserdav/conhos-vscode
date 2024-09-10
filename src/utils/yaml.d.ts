/******************************************************************************************
 * Repository: Conhos vscode
 * File name: yaml.d.ts
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Tue Sep 10 2024 16:42:55 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
export declare function parse(text: string): {
    data: any;
    error: Error | null;
};
