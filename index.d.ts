import type { CacheItem } from 'cache-changed';

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
  | 'mongo_express';

export type ServiceTypeCommonPublic = 'adminer' | 'phpmyadmin' | 'pgadmin' | 'mongo_express';

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

export type PortType = 'http' | 'ws' | 'chunked' | 'php';

export type GitUntrackedPolicy = 'checkout' | 'push' | 'merge';

export type Domains = Record<string, string>;

export interface Port {
  port: number;
  type: PortType;
  location?: string;
  timeout?: string;
  buffer_size?: string;
  proxy_path?: string;
  static?: {
    location: string;
    path: string;
    index?: string;
  }[];
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

export interface ConfigFile {
  name: string;
  server?: {
    node_name: string;
    api_key: string;
  };
  services: Record<
    string,
    {
      active: boolean;
      image: ServiceType;
      size: ServiceSize;
      version: string;
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

export interface WSMessageDataCli {
  any: any;
  setSocketCli: {
    connId: string;
    deployData: DeployData;
  };
  setSocketServer: {
    version: string;
  };
  loginCli: string;
  loginServer: string;
  checkTokenCli: {
    checked: boolean;
    skipSetProject: boolean;
    errMess?: string;
  };
  checkTokenServer: {
    skipSetProject: boolean;
  };
  message: {
    msg: string | number;
    end: boolean;
  };
  prepareDeployServer: {
    projectDeleted: boolean;
    config: ConfigFile;
    volumes: Volumes;
    interractive: boolean;
  };
  deployPrepareVolumeUploadCli: {
    url: string;
    serviceName: string;
  };
  prepareDeployCli: {
    exclude: string[] | undefined;
    pwd: string;
    service: string;
    cache: CacheItem[];
    active: boolean;
    git?: Git;
  };
  deployGitServer: {
    git: Git;
    pwd: string;
    service: string;
    last: boolean;
    active: boolean;
  };
  deployGitCli: {
    service: string;
    last: boolean;
  };
  deployEndServer: {
    service: string;
    skip: boolean;
    last: boolean;
    latest: boolean;
    file: string;
    num: number;
  };
  deployDeleteFilesServer: {
    service: string;
    files: string[];
    cwd: string;
    last: boolean;
    pwd: string;
  };
  deployDeleteFilesCli: {
    service: string;
    files: string[];
    cwd: string;
    last: boolean;
    url: string;
    pwd: string;
  };
  getDeployData: {
    nodeName?: string;
  };
  deployData: DeployData;
  getLogsServer: {
    watch: boolean;
    timestamps: boolean;
    project: string;
    serviceName: string;
    since: string | undefined;
    until: string | undefined;
    tail: number | undefined;
    clear: boolean;
    config: ConfigFile | null;
  };
  getLogsCli: {
    url: string;
  } & WSMessageDataCli['getLogsServer'];
  logs: {
    last: boolean;
    text: string;
    num: number;
  };
  remove: {
    project: string;
  };
  acceptDeleteCli: {
    containerName: string;
    serviceName: string;
    serviceType: ServiceTypeCommon;
  };
  acceptDeleteServer: {
    containerName: string;
    accept: boolean;
  };
  ipServer: {
    project: string;
  };
  ipCli: {
    ip: string;
  };
}

interface CheckConfigResult {
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

export interface WSMessageCli<T extends keyof WSMessageDataCli> {
  status: Status;
  type: T;
  packageName: string;
  message: string;
  userId: string;
  data: WSMessageDataCli[T];
  token: string | null;
  connId: string;
}

export type ConfigFileBackend = Omit<ConfigFile, 'services'> & {
  services: Record<string, ConfigFile['services'][0] & { serviceId: string }>;
};
