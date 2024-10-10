/******************************************************************************************
 * Repository: Conhos vscode
 * File name: index.d.ts
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Fri Sep 20 2024 13:22:00 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/

export type ServiceTarget = 'common' | 'custom' | 'admin';

export type ServiceTypeCustom = 'node' | 'rust' | 'python' | 'golang' | 'php';

export type ServiceTypeCommon =
  | 'redis'
  | 'postgres'
  | 'mysql'
  | 'adminer'
  | 'mariadb'
  | 'mongo'
  | 'rabbitmq'
  | 'phpmyadmin'
  | 'pgadmin'
  | 'mongo_express'
  | 'ftp';

export type ServiceTypeCommonPublic =
  | 'adminer'
  | 'phpmyadmin'
  | 'pgadmin'
  | 'mongo_express'
  | 'ftp';

export type ServiceType = ServiceTypeCommon | ServiceTypeCustom;

export type ServiceSize =
  | 'pico'
  | 'nano'
  | 'micro'
  | 'mili'
  | 'santi'
  | 'deci'
  | 'deca'
  | 'hecto'
  | 'kilo';

export type RequiredDependsOn = Partial<Record<ServiceType, { types: ServiceTarget[] }>>;

export type PortType = 'http' | 'ws' | 'chunked' | 'php';

export type GitUntrackedPolicy = 'checkout' | 'push' | 'merge';

export type Domains = Record<string, string>;

////////////////////////////////////// Config //////////////////////////////////////
/**
 * Do not use the same names in different entities
 * It's necessary to check posicion when check errors
 */
export interface PortStatic {
  location: string;
  path: string;
  index?: string;
}

export interface Port {
  port: number;
  type: PortType;
  pathname?: string;
  timeout?: string;
  buffer_size?: string;
  proxy_path?: string;
  static?: PortStatic[];
}

export interface NewDomains {
  serviceName: string;
  domains: Domains;
  serviceType: ServiceType;
  serviceId: string | null;
}

export interface Git {
  url: string;
  branch: string;
  untracked?: GitUntrackedPolicy;
}

export interface Server {
  node_name: string;
  api_key: string;
}

export interface ConfigFile {
  name: string;
  server?: Server;
  services: Record<
    string,
    {
      active: boolean;
      image: ServiceType;
      size: ServiceSize;
      version: string;
      entrypoint?: string[];
      no_restart?: boolean;
      pwd?: string;
      git?: Git;
      exclude?: string[];
      command?: string;
      ports?: Port[];
      volumes?: string[];
      depends_on?: string[];
      domains?: NewDomains['domains'];
      environment?: string[];
    }
  >;
}
////////////////////////////////////////////////////////////////////////////

export type ProxyPaths = Record<string, string>;

export type Volumes = Record<string, string[]>;

export interface DeployData {
  services: {
    type: ServiceType;
    name: string;
    images: string;
    tags: string[];
    hub: string;
  }[];
  sizes: {
    name: string;
    memory: {
      name: string;
      value: number;
    };
    cpus: number;
    storage: string;
    ports: number;
  }[];
  baseValue: number;
  baseCost: number;
}

export type GitType = 'github' | 'gitlab';

export type Status = 'info' | 'warn' | 'error';

export interface UploadFileBody {
  num: number;
  chunk: string | Buffer;
}

export interface ParsedGitRepo {
  user: string;
  project: string;
}

export interface CheckConfigResult {
  msg: string;
  data: string;
  exit: boolean;
  position: {
    lineStart: number;
    lineEnd: number;
    columnStart: number;
    columnEnd: number;
  };
}

export type ConfigFileBackend = Omit<ConfigFile, 'services'> & {
  services: Record<string, ConfigFile['services'][0] & { serviceId: string }>;
};
