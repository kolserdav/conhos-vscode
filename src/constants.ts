/******************************************************************************************
 * Repository: Conhos vscode
 * File name: constants.ts
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Tue Sep 10 2024 16:42:55 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import type {
  GitType,
  GitUntrackedPolicy,
  Port,
  PortType,
  RequiredDependsOn,
  ServiceType,
  ServiceTypeCommon,
  ServiceTypeCommonPublic,
  ServiceTypeCustom,
} from '../index';

export const PROTOCOL_CLI = 'cli';
export const PORT_MAX = 65535;
export const DOMAIN_MAX_LENGTH = 77;

export const VOLUME_LOCAL_REGEX = /^[/a-zA-Z0-9.\-_]+:/;
export const VOLUME_LOCAL_POSTFIX_REGEX = /:$/;
export const VOLUME_REMOTE_REGEX = /:[/a-zA-Z0-9.\-_]+$/;
export const VOLUME_REMOTE_PREFIX_REGEX = /^:/;
export const VOLUME_UPLOAD_MAX_SIZE = 100000;

export const ERROR_LOG_PREFIX = 'error:';

export const BUFFER_SIZE_MAX = 512;

export const PWD_DEFAULT = './';

export const COUNT_OF_VOLUMES_MAX = 10;

export const ENVIRONMENT_SWITCH = {
  redis: {
    password: 'REDIS_PASSWORD',
  },
  mysql: {
    rootPassword: 'MYSQL_ROOT_PASSWORD',
  },
  mariadb: {
    rootPassword: 'MARIADB_ROOT_PASSWORD',
  },
};

export const ENVIRONMENT_REQUIRED_COMMON: Record<ServiceTypeCommon, string[]> = {
  redis: [ENVIRONMENT_SWITCH.redis.password],
  postgres: ['POSTGRES_PASSWORD', 'POSTGRES_USER', 'POSTGRES_DB'],
  adminer: [],
  mysql: [ENVIRONMENT_SWITCH.mysql.rootPassword, 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'],
  mariadb: [
    ENVIRONMENT_SWITCH.mariadb.rootPassword,
    'MARIADB_USER',
    'MARIADB_PASSWORD',
    'MARIADB_DATABASE',
  ],
  mongo: ['MONGO_INITDB_ROOT_USERNAME', 'MONGO_INITDB_ROOT_PASSWORD'],
  rabbitmq: ['RABBITMQ_DEFAULT_PASS', 'RABBITMQ_DEFAULT_USER'],
  phpmyadmin: [],
  pgadmin: ['PGADMIN_DEFAULT_PASSWORD', 'PGADMIN_DEFAULT_EMAIL'],
  mongo_express: [
    'ME_CONFIG_BASICAUTH_USERNAME',
    'ME_CONFIG_BASICAUTH_PASSWORD',
    'ME_CONFIG_MONGODB_AUTH_USERNAME',
    'ME_CONFIG_MONGODB_AUTH_PASSWORD',
  ],
  ftp: ['FTP_USER_NAME', 'FTP_USER_PASS'],
};

export const SERVICES_CUSTOM: ServiceTypeCustom[] = ['node', 'rust', 'python', 'golang', 'php'];

export const SERVICES_COMMON: ServiceTypeCommon[] = [
  'redis',
  'postgres',
  'mysql',
  'mariadb',
  'mongo',
  'rabbitmq',
  'adminer',
  'phpmyadmin',
  'pgadmin',
  'mongo_express',
  'ftp',
];

export const SERVICES_COMMON_PUBLIC: ServiceTypeCommonPublic[] = [
  'adminer',
  'phpmyadmin',
  'pgadmin',
  'mongo_express',
  'ftp',
];

export const REQUIRED_DEPENDS_ON: RequiredDependsOn = {
  ftp: {
    types: ['common', 'custom', 'admin'],
  },
};

export const SERVICE_TYPES: ServiceType[] = (SERVICES_COMMON as any[]).concat(SERVICES_CUSTOM);

export const GIT_UNTRACKED_POLICY: Record<GitUntrackedPolicy, GitUntrackedPolicy> = {
  merge: 'merge',
  checkout: 'checkout',
  push: 'push',
};

export const GIT_TYPES: GitType[] = ['github', 'gitlab'];

const DEFAULT_WS_ADDRESS = 'wss://ws.conhos.ru';
export const WEBSOCKET_ADDRESS = process.env.WEBSOCKET_ADDRESS || DEFAULT_WS_ADDRESS;

export const HEADER_CONN_ID = 'conn-id';
export const HEADER_TARBALL = 'tar';
export const UPLOAD_CHUNK_DELIMITER = '<[rn]>';
export const UPLOADED_FILE_MESSAGE = `${UPLOAD_CHUNK_DELIMITER}Uploaded`;
export const LOG_END_MESSAGE = '';
export const UPLOAD_REQUEST_TIMEOUT = 1000 * 60 * 20 * 100;
export const LOGS_REQUEST_TIMEOUT = 1000 * 60 * 20 * 100;
export const REGEXP_IS_DOMAIN = /[a-zA-Z0-9\\-]+\.[a-zA-Z0-9]+$/;

export const PORT_DEFAULT: Port = {
  port: 3000,
  type: 'proxy',
};

const _PORT_TYPES: Record<PortType, PortType> = {
  proxy: 'proxy',
  php: 'php',
};

export const PORT_TYPES: PortType[] = Object.keys(_PORT_TYPES) as PortType[];

export const SOURCE = 'conhos';

export const YAML_ORIGINAL_URL_RAW =
  'https://raw.githubusercontent.com/redhat-developer/vscode-yaml/main/syntaxes/yaml.tmLanguage.json';

export const YAML_ORIGINAL_URL =
  'https://github.com/redhat-developer/vscode-yaml/blob/main/syntaxes/yaml.tmLanguage.json';
