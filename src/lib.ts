/******************************************************************************************
 * Repository: Conhos vscode
 * File name: lib.ts
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Tue Sep 10 2024 16:42:55 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import type {
  CheckConfigResult,
  ConfigFile,
  DeployData,
  Git,
  GitType,
  ParsedGitRepo,
  Port,
  PortStatic,
  Server,
  ServiceSize,
  ServiceType,
  ServiceTypeCommon,
  ServiceTypeCommonPublic,
  ServiceTypeCustom,
  Volumes,
} from '../index';
import log from './utils/log';
import {
  BUFFER_SIZE_MAX,
  COUNT_OF_VOLUMES_MAX,
  DOMAIN_MAX_LENGTH,
  ENVIRONMENT_REQUIRED_COMMON,
  GIT_TYPES,
  GIT_UNTRACKED_POLICY,
  PORT_TYPES,
  PWD_DEFAULT,
  REGEXP_IS_DOMAIN,
  REQUIRED_DEPENDS_ON,
  SERVICE_TYPES,
  SERVICES_COMMON,
  SERVICES_COMMON_PUBLIC,
  SERVICES_CUSTOM,
  VOLUME_LOCAL_POSTFIX_REGEX,
  VOLUME_LOCAL_REGEX,
  VOLUME_REMOTE_PREFIX_REGEX,
  VOLUME_REMOTE_REGEX,
} from './constants';

type ConfigServerDefault<O extends Server> = {
  [K in keyof Required<O>]: {
    required: undefined extends O[K] ? false : true;
    value: Required<O[K]>;
  };
};

function createServerDefault<O extends Server>(
  config: ConfigServerDefault<O>
): ConfigServerDefault<O> {
  return config;
}

type ConfigStaticDefault<O extends PortStatic> = {
  [K in keyof Required<O>]: {
    required: undefined extends O[K] ? false : true;
    value: Required<O[K]>;
  };
};

function createStaticDefault<O extends PortStatic>(
  config: ConfigStaticDefault<O>
): ConfigStaticDefault<O> {
  return config;
}

type ConfigPortsDefault<O extends Port> = {
  [K in keyof Required<O>]: {
    required: undefined extends O[K] ? false : true;
    value: K extends 'static' ? Required<ReturnType<typeof createStaticDefault>> : Required<O[K]>;
  };
};

function createPortsDefault<O extends Port>(config: ConfigPortsDefault<O>): ConfigPortsDefault<O> {
  return config;
}

type ConfigGitDefault<O extends Git> = {
  [K in keyof Required<O>]: {
    required: undefined extends O[K] ? false : true;
    value: Required<O[K]>;
  };
};

function createGitDefault<O extends Git>(config: ConfigGitDefault<O>): ConfigGitDefault<O> {
  return config;
}

type ConfigFileDefault<T extends keyof ConfigFile> = {
  name: T;
  required: undefined extends ConfigFile[T] ? false : true;
  value: T extends 'server' ? Required<ReturnType<typeof createServerDefault>> : ConfigFile[T];
};

type ConfigServiceDefault<O extends ConfigFile['services'][0]> = {
  [K in keyof Required<O>]: {
    required: undefined extends O[K] ? false : true;
    value: K extends 'git'
      ? Required<ReturnType<typeof createGitDefault>>
      : K extends 'ports'
        ? Required<ReturnType<typeof createPortsDefault>>
        : Required<O[K]>;
  };
};

function createServiceDefault<O extends ConfigFile['services'][0]>(
  config: ConfigServiceDefault<O>
): ConfigServiceDefault<O> {
  return config;
}

function createConfigDefaultItem<T extends keyof ConfigFile>(
  config: ConfigFileDefault<T>
): ConfigFileDefault<T> {
  return config;
}

export const CONFIG_DEFAULT = {
  name: createConfigDefaultItem({
    name: 'name',
    required: true,
    value: '',
  }),
  server: createConfigDefaultItem({
    name: 'server',
    required: false,
    value: createServerDefault({
      node_name: {
        required: true,
        value: '',
      },
      api_key: {
        required: true,
        value: '',
      },
    }),
  }),
  services: {
    name: 'services',
    required: true,
    value: createServiceDefault({
      image: {
        required: true,
        value: 'node',
      },
      size: {
        required: true,
        value: 'mili',
      },
      active: {
        required: true,
        value: true,
      },
      no_restart: {
        required: false,
        value: false,
      },
      version: {
        required: true,
        value: 'latest',
      },
      entrypoint: {
        required: false,
        value: [],
      },
      git: {
        required: false,
        value: createGitDefault({
          url: {
            required: true,
            value: '',
          },
          untracked: {
            required: false,
            value: undefined,
          },
          branch: {
            required: true,
            value: '',
          },
        }),
      },
      ports: {
        required: false,
        value: createPortsDefault({
          port: {
            required: true,
            value: 3000,
          },
          type: {
            required: true,
            value: 'http',
          },
          proxy_path: {
            required: false,
            value: '',
          },
          pathname: {
            required: false,
            value: '',
          },
          timeout: {
            required: false,
            value: '',
          },
          buffer_size: {
            required: false,
            value: '',
          },
          static: {
            required: false,
            value: createStaticDefault({
              location: {
                required: true,
                value: '',
              },
              path: {
                required: true,
                value: '',
              },
              index: {
                required: false,
                value: '',
              },
            }),
          },
        }),
      },
      environment: {
        required: false,
        value: [],
      },
      pwd: {
        required: false,
        value: '',
      },
      exclude: {
        required: false,
        value: [],
      },
      depends_on: {
        required: false,
        value: [],
      },
      domains: {
        required: false,
        value: {},
      },
      command: {
        required: false,
        value: '',
      },
      volumes: {
        required: false,
        value: [],
      },
    }),
  },
};

export function computeCostService(
  serviceSize: ServiceSize,
  { sizes, baseCost, baseValue }: Omit<DeployData, 'services' | 'nodePublic'>
) {
  const SHIFT_PRICE_COEFF = 1.3;
  const index = sizes.findIndex((item) => item.name === serviceSize);
  const currValueItem = sizes.find((item) => item.name === serviceSize);
  if (!currValueItem) {
    log('error', 'Failed to get cost of service for', serviceSize);
    return null;
  }

  let coeff = 1;

  coeff -= index / SHIFT_PRICE_COEFF / 10;

  const {
    memory: { value },
  } = currValueItem;
  const month = parseInt((value / (baseValue / (baseCost * 100 * coeff))).toFixed(0), 10);
  const hour = month / 30 / 24;
  const minute = hour / 60;
  return { month, hour, minute };
}

export const isCustomService = (type: ServiceType): ServiceTypeCustom | null => {
  const res = SERVICES_CUSTOM.findIndex((item) => item === type);
  return res === -1 ? null : (type as ServiceTypeCustom);
};

export function isDomain(domain: string) {
  return REGEXP_IS_DOMAIN.test(domain.trim());
}

export const isCommonService = (type: ServiceType): ServiceTypeCommon | null => {
  const _type = type as ServiceTypeCommon;
  if (SERVICES_COMMON.findIndex((item) => item === _type) !== -1) {
    return _type;
  }
  return null;
};

const getEnvironmentValue = (item: string): string | null => {
  let res: string | null = null;
  const nameReg = /^[A-Za-z0-9_]+=/;
  if (nameReg.test(item)) {
    res = item.replace(nameReg, '');
  }
  return res;
};

const getEnvironmentName = (name: string): string | null => {
  let res: string | null = null;
  const nameReg = /^[A-Za-z0-9_]+=/;
  if (nameReg.test(name)) {
    res = name.replace(/=.*/, '');
  }
  return res;
};

export const findEnvironmentValue = (environment: string[], name: string): string | null => {
  let res: string | null = null;
  environment.forEach((item) => {
    const _name = getEnvironmentName(item);
    if (_name === name) {
      res = item.replace(/^[A-Za-z0-9_]+=/, '');
    }
  });
  return res;
};

export const checkRecord = (record: Record<string, string | null>, name: string): boolean => {
  let check = false;
  const keys = Object.keys(record);
  keys.forEach((t) => {
    if (name) {
      if (record[t] === name) {
        check = true;
      }
    }
  });
  return check;
};

export const parseEnvironmentVariable = (
  variable: string
): {
  name: string;
  value: string;
} | null => {
  const name = getEnvironmentName(variable);
  const value = getEnvironmentValue(variable);
  if (!name || !value) {
    return null;
  }
  return {
    name,
    value,
  };
};

export const checkEnvironmentRequired = (name: string): boolean => {
  let check = false;
  Object.keys(ENVIRONMENT_REQUIRED_COMMON).forEach((item) => {
    ENVIRONMENT_REQUIRED_COMMON[item as ServiceTypeCommon].forEach((_item) => {
      if (_item === name) {
        check = true;
      }
    });
  });
  return check;
};

export const isCommonServicePublic = (type: ServiceType): null | ServiceTypeCommonPublic => {
  const index = SERVICES_COMMON_PUBLIC.findIndex((item) => item === type);
  const check = index !== -1;
  if (check) {
    return type as ServiceTypeCommonPublic;
  }
  return null;
};

const PORT_TIMEOUTS = ['ms', 's', 'm', 'h', 'd', 'w', 'M', 'y'];

export const getServiceBySize = (sizes: DeployData['sizes'], size: ServiceSize) =>
  sizes.find(({ name }) => name === size);

const DEFAULT_LOCATION = '/';

function checkVersion({
  services,
  version,
  type,
}: {
  services: DeployData['services'];
  version: string;
  type: ServiceType;
}): boolean {
  const service = services.find(({ type: _type }) => _type === type);
  if (!service) {
    return false;
  }
  const { tags } = service;
  return tags.indexOf(version) !== -1;
}

interface GetServicePosition<
  T extends keyof ConfigFile['services'][0],
  D extends ConfigFile['services'][0][T],
> {
  name: string;
  property: T | null;
  value: D extends Array<infer U> ? Partial<U> : Partial<D> | null;
}

const CHECK_CONFIG_RESULT_DEFAULT: CheckConfigResult['position'] = {
  lineStart: 1,
  lineEnd: 1,
  columnStart: 1,
  columnEnd: 1,
};

function createPropertyRegex(property: string) {
  return new RegExp(`^\\s*${property}:`);
}

function getColumnStart(propertyM: RegExpMatchArray, property: string): number {
  return propertyM[0].length - property.length - 1;
}

function getRootPosition({
  configText,
  field,
}: {
  configText: string;
  field: string;
}): CheckConfigResult['position'] {
  let result = structuredClone(CHECK_CONFIG_RESULT_DEFAULT);
  const lines = configText.split('\n');
  lines.every((line, lineNumber) => {
    const propertyM = line.match(createPropertyRegex(field));
    if (propertyM) {
      const columnStart = getColumnStart(propertyM, field);
      result = {
        lineStart: lineNumber,
        lineEnd: lineNumber,
        columnStart,
        columnEnd: propertyM[0].length,
      };
      return false;
    }
    return true;
  });
  return result;
}

function getServicePosition<
  T extends keyof ConfigFile['services'][0],
  D extends ConfigFile['services'][0][T],
>({
  configText,
  config,
  service,
}: {
  configText: string;
  config: ConfigFile;
  service: GetServicePosition<T, D>;
}): CheckConfigResult['position'] {
  let result = structuredClone(CHECK_CONFIG_RESULT_DEFAULT);
  const { services } = config;
  const { name, property, value } = service;
  const lines = configText.split('\n');

  let serviceIndex = 0;
  let propertyIndex = 0;
  (Object.keys(services) || []).every((item, index) => {
    if (item === name) {
      lines.every((line, lineNumber) => {
        const propertyM = line.match(createPropertyRegex(name));
        if (propertyM) {
          const columnStart = getColumnStart(propertyM, name);
          result = {
            lineStart: lineNumber,
            lineEnd: lineNumber,
            columnStart,
            columnEnd: propertyM[0].length,
          };
          return false;
        }
        return true;
      });

      // Set serviceIndex and prooertyIndex
      Object.keys(services[item]).every((_value) => {
        if (property === _value) {
          serviceIndex = index;
          if (
            // @ts-ignore
            typeof services[item][_value] === 'object' &&
            typeof value === 'object' &&
            value !== null
          ) {
            Object.keys(services[item][_value as keyof ConfigFile['services'][0]] || {}).forEach(
              (propField: any, _index) => {
                if (Number.isNaN(parseInt(propField, 10))) {
                  if (
                    // @ts-ignore
                    value[propField] !== undefined
                  ) {
                    propertyIndex = serviceIndex;
                  }
                } else {
                  console.log(2, propField);
                  if (
                    // @ts-ignore
                    services[item][_value as keyof ConfigFile['services'][0]][propField] !==
                    undefined
                  ) {
                    propertyIndex = _index + serviceIndex;
                  }
                }
              }
            );
          } else {
            if (_value === property) {
              propertyIndex = serviceIndex;
            }
          }

          return false;
        }
        return true;
      });
      return false;
    }
    return true;
  });

  const valueLines: CheckConfigResult['position'][] = [];
  const propLines: CheckConfigResult['position'][] = [];

  lines.forEach((line, lineNumber) => {
    if (property) {
      const propertyM = line.match(createPropertyRegex(property));
      if (propertyM) {
        if (value === null) {
          const columnStart = getColumnStart(propertyM, property);
          valueLines.push({
            lineStart: lineNumber,
            lineEnd: lineNumber,
            columnStart,
            columnEnd: propertyM[0].length,
          });
        } else {
          if (typeof services[name][property] === 'object') {
            Object.keys(services[name][property]).forEach((propField) => {
              if (Array.isArray(services[name][property])) {
                services[name][property].forEach((obj) => {
                  if (typeof obj === 'object') {
                    Object.keys(obj).forEach((subField) => {
                      // @ts-ignore
                      if (value[subField] !== undefined) {
                        // Again by lines
                        lines.forEach((_line, _lineNumber) => {
                          const propertyM = _line.match(createPropertyRegex(subField));
                          if (propertyM) {
                            const columnStart = getColumnStart(propertyM, subField);
                            propLines.push({
                              lineStart: _lineNumber,
                              lineEnd: _lineNumber,
                              columnStart,
                              columnEnd: propertyM[0].length,
                            });
                          }
                        });
                      }
                    });
                  } else {
                    // log('warn', 'Unexpected case 593', obj);
                  }
                });
              } else if (typeof services[name][property] === 'object') {
                Object.keys(services[name][property]).forEach((subField) => {
                  if (propField === subField) {
                    lines.forEach((_line, _lineNumber) => {
                      // @ts-ignore
                      if (value[propField] !== undefined) {
                        const propertyM = _line.match(createPropertyRegex(propField));
                        if (propertyM) {
                          const columnStart = getColumnStart(propertyM, propField);
                          propLines.push({
                            lineStart: _lineNumber,
                            lineEnd: _lineNumber,
                            columnStart,
                            columnEnd: propertyM[0].length,
                          });
                        }
                      }
                    });
                  }
                });
              } else {
                log('warn', 'Unexpected case 617', property);
              }
            });
          } else {
            lines.forEach((_line, _lineNumber) => {
              const propertyM = _line.match(createPropertyRegex(property));
              if (propertyM) {
                const columnStart = getColumnStart(propertyM, property);
                propLines.push({
                  lineStart: _lineNumber,
                  lineEnd: _lineNumber,
                  columnStart,
                  columnEnd: propertyM[0].length,
                });
              }
            });
          }
        }
      }
    } else {
      const propertyM = line.match(createPropertyRegex(name));
      if (propertyM) {
        const columnStart = getColumnStart(propertyM, name);
        valueLines.push({
          lineStart: lineNumber,
          lineEnd: lineNumber,
          columnStart,
          columnEnd: propertyM[0].length,
        });
      }
    }
  });

  return (
    getArrayValue(propLines, propertyIndex) || getArrayValue(valueLines, serviceIndex) || result
  );
}

function getArrayValue(arr: any[], index: number) {
  if (index === 0) {
    return arr[0];
  }
  if (arr[index] !== undefined) {
    return arr[index];
  }
  return getArrayValue(arr, index - 1);
}

export function getPosition<
  T extends keyof ConfigFile,
  K extends keyof ConfigFile['services'][0],
  D extends ConfigFile['services'][0][K],
>({
  configText,
  config,
  field,
  service,
}: {
  configText: string;
  config: ConfigFile;
  field: T | null;
  service: T extends 'services' ? GetServicePosition<K, D> : null;
}): CheckConfigResult['position'] {
  let result = structuredClone(CHECK_CONFIG_RESULT_DEFAULT);

  switch (field) {
    case 'services':
      result = getServicePosition({
        configText,
        service: service as GetServicePosition<K, D>,
        config,
      });
      break;
    default:
      if (field) {
        result = getRootPosition({ configText, field });
      }
  }

  return result;
}

function checkLocation(
  {
    location,
    service,
    config,
    configText,
  }: { location: string; service: string; config: ConfigFile; configText: string },
  name = 'Location'
): CheckConfigResult[] {
  const res: CheckConfigResult[] = [];
  const allowedRegexp = /^[\\//0-9A-Za-z\\-_/]+$/;
  if (!allowedRegexp.test(location)) {
    res.push({
      msg: `${name} "${location}" of service "${service}" has unallowed symbols`,
      data: `Allowed regexp ${allowedRegexp}`,
      exit: true,
      position: getPosition({
        service: {
          name: service,
          property: 'ports',
          value: { pathname: location },
        },
        config,
        configText,
        field: 'services',
      }),
    });
  }
  const startRegexp = /^\/[a-zA-Z0-9]*/;
  if (!startRegexp.test(location)) {
    res.push({
      msg: `${name} "${location}" of service "${service}" have wrong start`,
      data: `It must starts with "/", Allowed start regexp ${startRegexp}`,
      exit: true,
      position: getPosition({
        service: {
          name: service,
          property: 'ports',
          value: { pathname: location },
        },
        config,
        configText,
        field: 'services',
      }),
    });
  }
  if (/\/{2,}/.test(location)) {
    res.push({
      msg: `${name} "${location}" of service "${service}" have two or more slushes together`,
      data: 'Do not use two and more slushes together in location',
      exit: true,
      position: getPosition({
        service: {
          name: service,
          property: 'ports',
          value: { pathname: location },
        },
        config,
        configText,
        field: 'services',
      }),
    });
  }
  return res;
}

function checkRequiredParams({
  config,
  configText,
}: {
  config: ConfigFile;
  configText: string;
}): CheckConfigResult[] {
  const res: CheckConfigResult[] = [];
  const configKeys = Object.keys(config);

  // Loop by default
  Object.keys(CONFIG_DEFAULT).forEach((configDefaultKey) => {
    const entityDefault = CONFIG_DEFAULT[configDefaultKey as keyof typeof CONFIG_DEFAULT];
    if (configKeys.indexOf(configDefaultKey) === -1 && entityDefault.required) {
      res.push({
        msg: `Required parameter "${configDefaultKey}" is missing`,
        data: '',
        exit: true,
        position: getPosition({
          config,
          configText,
          field: null,
          service: null,
        }),
      });
      return;
    }

    const { services } = config;

    switch (configDefaultKey) {
      case 'services':
        // Loop by service default
        Object.keys(CONFIG_DEFAULT.services.value).forEach((serviceDefaultKey) => {
          const v = parseInt(serviceDefaultKey, 10);
          if (!Number.isNaN(v)) {
            return;
          }
          Object.keys(services).forEach((serviceKey) => {
            const service = services[serviceKey];
            let serviceFieldIsExist = false;

            Object.keys(service).forEach((servicePropKey) => {
              if (serviceDefaultKey === servicePropKey) {
                serviceFieldIsExist = true;
              }
            });

            if (
              !serviceFieldIsExist &&
              CONFIG_DEFAULT.services.value[
                serviceDefaultKey as keyof typeof CONFIG_DEFAULT.services.value
              ].required
            ) {
              res.push({
                msg: `Required parameter "${serviceDefaultKey}" is missing in service "${serviceKey}"`,
                data: '',
                exit: true,
                position: getPosition({
                  config,
                  configText,
                  field: 'services',
                  service: {
                    name: serviceKey,
                    property: null,
                    value: null,
                  },
                }),
              });
              return;
            }
          });
        });

        // Loop by services
        Object.keys(services).forEach((serviceKey) => {
          const service = services[serviceKey];
          Object.keys(service).forEach((servicePropKey) => {
            if (
              CONFIG_DEFAULT.services.value[
                servicePropKey as keyof typeof CONFIG_DEFAULT.services.value
              ] === undefined
            ) {
              res.push({
                msg: `Parameter "${servicePropKey}" has no any effects in service "${serviceKey}"`,
                data: '',
                exit: false,
                position: getPosition({
                  config,
                  configText,
                  field: 'services',
                  service: {
                    name: serviceKey,
                    property: servicePropKey as keyof ConfigFile['services'][0],
                    value: null,
                  },
                }),
              });
            }
          });
        });
        break;
    }
  });

  // Loop by config
  configKeys.forEach((configKey) => {
    const isExists = CONFIG_DEFAULT[configKey as keyof typeof CONFIG_DEFAULT] !== undefined;
    if (!isExists) {
      res.push({
        msg: `Parameter "${configKey}" has no any effects`,
        data: '',
        exit: false,
        position: getPosition({
          config,
          configText,
          field: configKey as keyof ConfigFile,
          service: null,
        }),
      });
    }
  });

  return res;
}

export async function checkConfig<S extends boolean>(
  { config, configText }: { config: ConfigFile; configText: string },
  { deployData }: { deployData: DeployData }
): Promise<CheckConfigResult[]> {
  const { services, server } = config;
  let res: CheckConfigResult[] = [];

  if (!deployData) {
    res.push({
      msg: 'Something went wrong',
      data: "Deploy data didn't receive from server",
      exit: true,
      position: getPosition({
        config,
        configText,
        field: null,
        service: null,
      }),
    });
    return res;
  }

  res = checkRequiredParams({ config, configText });
  const isExit = res.findIndex((err) => err.exit) !== -1;
  if (res.length !== 0 && isExit) {
    return res;
  }

  const serviceKeys = Object.keys(services);

  // Check services lenght
  if (serviceKeys.length === 0) {
    res.push({
      msg: 'Services list can not be empty',
      data: 'Add at least one service',
      exit: true,
      position: getPosition({
        config,
        configText,
        field: 'services',
        service: {
          name: '',
          property: null,
          value: null,
        },
      }),
    });
    return res;
  }

  for (let i = 0; serviceKeys[i]; i++) {
    const item = serviceKeys[i];
    const {
      domains,
      ports,
      image,
      environment,
      version,
      command,
      depends_on,
      active,
      pwd,
      size,
      volumes,
      git,
    } = services[item];

    // Check required depends on
    if (REQUIRED_DEPENDS_ON[image] && !depends_on) {
      res.push({
        msg: `Property 'depends_on' is required for service "${item}"`,
        data: "Add 'depends_on' property with other service name",
        exit: true,
        position: getPosition({
          config,
          configText,
          field: 'services',
          service: {
            name: item,
            property: null,
            value: null,
          },
        }),
      });
      return res;
    }

    // Check volumes
    if (volumes && active) {
      if (volumes.length > COUNT_OF_VOLUMES_MAX) {
        res.push({
          msg: `Service "${item}" has too much volumes: "${volumes.length}"`,
          data: `Maximum count of volumes is ${COUNT_OF_VOLUMES_MAX}`,
          exit: true,
          position: getPosition({
            config,
            configText,
            field: 'services',
            service: {
              name: item,
              property: 'volumes',
              value: null,
            },
          }),
        });
      }
      const volNames: string[] = [];
      for (let _i = 0; volumes[_i]; _i++) {
        const _item = volumes[_i];
        const localM = _item.match(VOLUME_LOCAL_REGEX);
        if (!localM) {
          res.push({
            msg: `Service "${item}" has wrong volume "${_item}". Local part of volume must satisfy regex:`,
            data: `${VOLUME_LOCAL_REGEX}`,
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'volumes',
                value: _item,
              },
            }),
          });
          continue;
        }
        const localPath = localM[0].replace(VOLUME_LOCAL_POSTFIX_REGEX, '');
        const filename = basename(localPath);
        if (volNames.indexOf(filename) !== -1) {
          res.push({
            msg: `Service "${item}" has two or more volumes with the same file name.`,
            data: filename,
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'volumes',
                value: filename,
              },
            }),
          });
        } else {
          volNames.push(filename);
        }
        const remote = _item.match(VOLUME_REMOTE_REGEX);
        if (!remote) {
          res.push({
            msg: `Service "${item}" has wrong volume "${_item}". Remote part of volume must satisfy regex:`,
            data: `${VOLUME_REMOTE_REGEX}`,
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'volumes',
                value: _item,
              },
            }),
          });
          continue;
        }
        const remotePath = remote[0].replace(VOLUME_REMOTE_PREFIX_REGEX, '');
        if (!isAbsolute(remotePath)) {
          res.push({
            msg: `Service "${item}" has wrong volume "${_item}". Remote part of volume is not absolute`,
            data: remotePath,
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'volumes',
                value: _item,
              },
            }),
          });
        }
      }
    }

    // Check service name
    if (/%/.test(item)) {
      res.push({
        msg: "Service name contains the not allowed symbol: '%'",
        data: `"${item}"`,
        exit: true,
        position: getPosition({
          config,
          configText,
          field: 'services',
          service: {
            name: item,
            property: null,
            value: null,
          },
        }),
      });
    }

    // Check service image
    if (SERVICE_TYPES.indexOf(image) === -1) {
      res.push({
        msg: `Service image "${image}" is not allowed in service ${item}`,
        data: `Allowed service images: [${SERVICE_TYPES.join('|')}]`,
        exit: true,
        position: getPosition({
          config,
          configText,
          field: 'services',
          service: {
            name: item,
            property: 'image',
            value: image,
          },
        }),
      });
    }

    const _public = ports && ports.length > 0;

    // Check service public
    if (_public) {
      if (isCommonService(image) && !isCommonServicePublic(image)) {
        res.push({
          msg: `Service "${item}" can not have public ports`,
          data: `Only services can have public ports: [${(SERVICES_CUSTOM as any[])
            .concat(SERVICES_COMMON_PUBLIC)
            .join('|')}]`,
          exit: true,
          position: getPosition({
            config,
            configText,
            field: 'services',
            service: {
              name: item,
              property: 'active',
              value: null,
            },
          }),
        });
      }
    }

    if (!version) {
      // Check service version
      res.push({
        msg: `Version doesn't exists in service "${item}"`,
        data: 'Try to add the field version to the config file',
        exit: true,
        position: getPosition({
          config,
          configText,
          field: 'services',
          service: {
            name: item,
            property: null,
            value: null,
          },
        }),
      });
      return res;
    }

    // Check service active
    if (typeof active !== 'boolean') {
      res.push({
        msg: `Property 'active' must be of type 'boolean' in service "${item}"`,
        data: '',
        exit: true,
        position: getPosition({
          config,
          configText,
          field: 'services',
          service: {
            name: item,
            property: 'active',
            value: null,
          },
        }),
      });
      return res;
    }

    const { sizes, services: _s } = deployData;

    // Check size
    let checkSize = false;
    sizes.forEach((_item) => {
      if (_item.name === size) {
        checkSize = true;
      }
    });
    if (!checkSize) {
      res.push({
        msg: `Size '${size}' doesn't allowed in service "${item}"`,
        data: `Allowed sizes: ${sizes.map(({ name }) => name).join('|')}`,
        exit: true,
        position: getPosition({
          config,
          configText,
          field: 'services',
          service: {
            name: item,
            property: 'size',
            value: size,
          },
        }),
      });
    }

    // Check version
    if (!checkVersion({ services: _s, type: image, version }) && version !== 'latest') {
      res.push({
        msg: `Version "${version}" of service "${item}" is no longer supported`,
        data: `See allowed versions: ${_s.find((_item) => _item.type === image)?.hub}tags`,
        exit: false,
        position: getPosition({
          config,
          configText,
          field: 'services',
          service: {
            name: item,
            property: 'version',
            value: version,
          },
        }),
      });
    }

    // Check custom services
    if (isCustomService(image)) {
      // Check pwd
      if (!pwd) {
        res.push({
          msg: `Required parameter 'pwd' is missing in service "${item}"`,
          data: `"${item}"`,
          exit: true,
          position: getPosition({
            config,
            configText,
            field: 'services',
            service: {
              name: item,
              property: 'pwd',
              value: null,
            },
          }),
        });
        return res;
      }
      if (isAbsolute(pwd)) {
        res.push({
          msg: `Parameter 'pwd' must be relative in service "${item}"`,
          data: pwd,
          exit: true,
          position: getPosition({
            config,
            configText,
            field: 'services',
            service: {
              name: item,
              property: 'pwd',
              value: pwd,
            },
          }),
        });
        return res;
      }
      if (!/[a-zA-Z0-9_-]+/.test(pwd) && pwd !== PWD_DEFAULT) {
        res.push({
          msg: `Default parameter 'pwd' must be '${PWD_DEFAULT}' in service "${item}"`,
          data: pwd,
          exit: true,
          position: getPosition({
            config,
            configText,
            field: 'services',
            service: {
              name: item,
              property: 'pwd',
              value: pwd,
            },
          }),
        });
      }

      // Check git
      if (git) {
        const { url, branch, untracked } = git;
        if (!url) {
          res.push({
            msg: `Missing required parameter 'git.url' in service "${item}"`,
            data: url,
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'git',
                value: null,
              },
            }),
          });
          return res;
        }
        if (!branch) {
          res.push({
            msg: `Missing required parameter 'git.branch' in service "${item}"`,
            data: url,
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'git',
                value: null,
              },
            }),
          });
          return res;
        }
        const gitType = checkGitType(url);
        if (!gitType) {
          res.push({
            msg: `Wrong parameter 'git.url' in service "${item}"`,
            data: `Only urls which related to ${GIT_TYPES.join('|')} are supported`,
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'git',
                value: {
                  url,
                },
              },
            }),
          });
          return res;
        }
        const parsed = parseGitUrl(url);
        if (!parsed) {
          res.push({
            msg: `Failed to parse parameter 'git.url' in service "${item}"`,
            data: 'Url must contain user and repository for example: https://github.com/user/repository.git',
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'git',
                value: {
                  url,
                },
              },
            }),
          });
        }
        if (untracked) {
          if (!GIT_UNTRACKED_POLICY[untracked]) {
            res.push({
              msg: `Failed parameter 'git.untracked' in service "${item}"`,
              data: `Allowed values [${Object.keys(GIT_UNTRACKED_POLICY).join('|')}]`,
              exit: true,
              position: getPosition({
                config,
                configText,
                field: 'services',
                service: {
                  name: item,
                  property: 'git',
                  value: {
                    untracked,
                  },
                },
              }),
            });
          }
        }
      }

      // Check ports
      if (!Array.isArray(ports)) {
        res.push({
          msg: `Ports must be array in service "${item}"`,
          data: '',
          exit: true,
          position: getPosition({
            config,
            configText,
            field: 'services',
            service: {
              name: item,
              property: 'ports',
              value: null,
            },
          }),
        });
        return res;
      }
      const portsLength = (ports || []).length;
      const service = getServiceBySize(sizes, size);
      if (service) {
        if (portsLength > service.ports) {
          res.push({
            msg: `Maximum port length for service "${item}" with size "${size}" is ${service.ports}`,
            data: `Decrease count of ports at least to "${service.ports}" or set up a bigger service size`,
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'ports',
                value: null,
              },
            }),
          });
        }
      }

      (ports || []).forEach(
        ({ port, type: _type, pathname, timeout, buffer_size, static: _static, proxy_path }) => {
          // Check timeout
          if (timeout) {
            if (_type !== 'chunked' && _type !== 'ws') {
              res.push({
                msg: `Timeout for port "${port}" of service "${item}" doesn't have any effect`,
                data: `Timeout property doesn't allow for port type "${_type}"`,
                exit: false,
                position: getPosition({
                  config,
                  configText,
                  field: 'services',
                  service: {
                    name: item,
                    property: 'ports',
                    value: {
                      timeout,
                    },
                  },
                }),
              });
            } else {
              const timeoutStr = timeout.toString();
              if (!/^[0-9]+[a-zA-Z]{1,2}$/.test(timeoutStr)) {
                res.push({
                  msg: `Timeout for port "${port}" of service "${item}" must be a string`,
                  data: `For example "30s", received "${timeout}"`,
                  exit: true,
                  position: getPosition({
                    config,
                    configText,
                    field: 'services',
                    service: {
                      name: item,
                      property: 'ports',
                      value: {
                        port,
                      },
                    },
                  }),
                });
              } else {
                const postfix = timeoutStr.match(/[a-zA-Z]{1,2}$/);
                if (postfix) {
                  if (PORT_TIMEOUTS.indexOf(postfix[0]) === -1) {
                    res.push({
                      msg: `Timeout for port "${port}" of service "${item}" has wrong postfix`,
                      data: `Allowed postfixes ${PORT_TIMEOUTS.join('|')}, received "${
                        postfix[0]
                      }"`,
                      exit: true,
                      position: getPosition({
                        config,
                        configText,
                        field: 'services',
                        service: {
                          name: item,
                          property: 'ports',
                          value: {
                            port,
                          },
                        },
                      }),
                    });
                  }
                }
              }
            }
          }
          // Check buffer_size
          if (buffer_size) {
            if (_type !== 'chunked') {
              res.push({
                msg: `Buffer size for port "${port}" of service "${item}" doesn't have any effect`,
                data: `Buffer size property doesn't allow for port type "${_type}"`,
                exit: false,
                position: getPosition({
                  config,
                  configText,
                  field: 'services',
                  service: {
                    name: item,
                    property: 'ports',
                    value: {
                      buffer_size,
                    },
                  },
                }),
              });
            } else {
              const bufferStr = buffer_size.toString();
              if (!/^[0-9]+k$/.test(bufferStr)) {
                res.push({
                  msg: `Buffer size for port "${port}" of service "${item}" must be a string`,
                  data: `For example "10k", received "${buffer_size}"`,
                  exit: true,
                  position: getPosition({
                    config,
                    configText,
                    field: 'services',
                    service: {
                      name: item,
                      property: 'ports',
                      value: {
                        buffer_size,
                      },
                    },
                  }),
                });
              } else {
                const prefix = bufferStr.match(/^[0-9]+/);
                if (prefix) {
                  const num = parseInt(prefix[0], 10);
                  if (num > BUFFER_SIZE_MAX) {
                    res.push({
                      msg: `Buffer size for port "${port}" of service "${item}" is not allowed`,
                      data: `Maximmum allowed buffer size is "${BUFFER_SIZE_MAX}k", received "${num}k"`,
                      exit: true,
                      position: getPosition({
                        config,
                        configText,
                        field: 'services',
                        service: {
                          name: item,
                          property: 'ports',
                          value: {
                            buffer_size,
                          },
                        },
                      }),
                    });
                  }
                }
              }
            }
          }
          // Check port
          if (!port) {
            res.push({
              msg: `Port "${port}" of service "${item}" is missing`,
              data: '',
              exit: true,
              position: getPosition({
                config,
                configText,
                field: 'services',
                service: {
                  name: item,
                  property: 'ports',
                  value: {
                    port: 0,
                  },
                },
              }),
            });
            return res;
          }
          if (Number.isNaN(parseInt(port.toString(), 10)) || /\./.test(port.toString())) {
            res.push({
              msg: `Port "${port}" of service "${item}" must be an integer`,
              data: '',
              exit: true,
              position: getPosition({
                config,
                configText,
                field: 'services',
                service: {
                  name: item,
                  property: 'ports',
                  value: {
                    port,
                  },
                },
              }),
            });
          }
          // Check location
          if (pathname) {
            res = res.concat(
              checkLocation({ location: pathname, configText, config, service: item })
            );
          }
          // Check proxy_path
          if (proxy_path) {
            res = res.concat(
              checkLocation(
                { location: proxy_path, service: item, config, configText },
                'Proxy path'
              )
            );
            if (_type === 'php') {
              res.push({
                msg: 'Property "proxy_path" doesn\'t have any effect for port type "php"',
                data: item,
                exit: false,
                position: getPosition({
                  config,
                  configText,
                  field: 'services',
                  service: {
                    name: item,
                    property: 'ports',
                    value: {
                      proxy_path,
                    },
                  },
                }),
              });
            }
          }
          // Check port type
          if (PORT_TYPES.indexOf(_type) === -1) {
            res.push({
              msg: `Port type "${_type}" of service "${item}" is not allowed`,
              data: `Allowed port types: [${PORT_TYPES.join('|')}]`,
              exit: true,
              position: getPosition({
                config,
                configText,
                field: 'services',
                service: {
                  name: item,
                  property: 'ports',
                  value: {
                    type: _type,
                  },
                },
              }),
            });
          }
          // Check port static
          if (_static) {
            _static.forEach(({ path, location: _location, index }) => {
              if (!_location) {
                res.push({
                  msg: `Field "static.location" is required for port ${port}`,
                  data: item,
                  exit: true,
                  position: getPosition({
                    config,
                    configText,
                    field: 'services',
                    service: {
                      name: item,
                      property: 'ports',
                      value: {
                        static: [],
                      },
                    },
                  }),
                });
              }
              if (!path) {
                res.push({
                  msg: `Field "static.path" is required for port '${port}' in service "${item}"`,
                  data: item,
                  exit: true,
                  position: getPosition({
                    config,
                    configText,
                    field: 'services',
                    service: {
                      name: item,
                      property: 'ports',
                      value: {
                        static: [],
                      },
                    },
                  }),
                });
              }
              if (index) {
                const indexReg = /[a-zA-Z0-9\\.\-_]/;
                if (!indexReg.test(index)) {
                  res.push({
                    msg: `Field "static.index" for port ${port} in service "${item}" contains not allowed symbols`,
                    data: `Allowed regexp ${indexReg}`,
                    exit: true,
                    position: getPosition({
                      config,
                      configText,
                      field: 'services',
                      service: {
                        name: item,
                        property: 'ports',
                        value: {
                          static: [],
                        },
                      },
                    }),
                  });
                }
              }
              const loc = pathname || DEFAULT_LOCATION;
              if (loc === _location) {
                res.push({
                  msg: 'Fields "location" and "static.location" can not be the same',
                  data: `Check port "${port}" of service "${item}"`,
                  exit: true,
                  position: getPosition({
                    config,
                    configText,
                    field: 'services',
                    service: {
                      name: item,
                      property: 'ports',
                      value: {
                        static: [],
                      },
                    },
                  }),
                });
              }
              // Check location
              res.concat(checkLocation({ location: _location, config, configText, service: item }));
            });
          }
        }
      );

      // Check domains
      if (domains) {
        Object.keys(domains).forEach((_item) => {
          const domain = domains[_item];
          if (domain.length > DOMAIN_MAX_LENGTH) {
            res.push({
              msg: `Maximum allowed domain length is ${DOMAIN_MAX_LENGTH}. Passed domain is too long: ${domain.length}`,
              data: domain,
              exit: true,
              position: getPosition({
                config,
                configText,
                field: 'services',
                service: {
                  name: item,
                  property: 'domains',
                  value: null,
                },
              }),
            });
          }
        });
      }

      // Check environment format
      (environment || []).forEach((_item) => {
        const variable = parseEnvironmentVariable(_item);
        if (!variable) {
          res.push({
            msg: `Environment variable ${_item} has wrong format`,
            data: `Try use NAME=value instead of ${_item}`,
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'environment',
                value: _item,
              },
            }),
          });
        }
      });

      // Check depends on
      if (active) {
        (depends_on || []).forEach((_item) => {
          if (!(services[_item] || {}).active) {
            res.push({
              msg: `Service "${item}" depends on of missing service "${_item}"`,
              data: `Try remove 'depends_on' item "${_item}" from service "${item}", or set service "${_item}" active`,
              exit: true,
              position: getPosition({
                config,
                configText,
                field: 'services',
                service: {
                  name: item,
                  property: 'depends_on',
                  value: _item,
                },
              }),
            });
          }
        });
      }

      // Check environment exclude
      (environment || []).forEach((_item) => {
        const variable = parseEnvironmentVariable(_item);
        if (!variable) {
          return;
        }
        const { name } = variable;
        if (!name) {
          res.push({
            msg: `Environment variable '${_item}' has wrong format in service "${item}"`,
            data: 'Try use NAME=value instead',
            exit: true,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'environment',
                value: _item,
              },
            }),
          });
        }
      });
    }

    // Check common services
    if (isCommonService(image)) {
      // Check ports
      if (ports) {
        res.push({
          msg: `Field "ports" is not allowed for service "${item}"`,
          data: `Ports is only allowed for services [${SERVICES_CUSTOM.join('|')}]`,
          exit: true,
          position: getPosition({
            config,
            configText,
            field: 'services',
            service: {
              name: item,
              property: 'ports',
              value: null,
            },
          }),
        });
      }

      // Check command
      if (command) {
        res.push({
          msg: `Field "command" is not allowed for service "${item}"`,
          data: `Command is only allowed for services [${SERVICES_CUSTOM.join('|')}]`,
          exit: true,
          position: getPosition({
            config,
            configText,
            field: 'services',
            service: {
              name: item,
              property: 'command',
              value: null,
            },
          }),
        });
      }

      if (active) {
        // Check depends on
        let checkDeps = false;
        serviceKeys.forEach((_item) => {
          const { image: _type, depends_on: _depends_on } = services[_item];
          if (isCustomService(_type)) {
            if (!_depends_on) {
              return true;
            }

            if (_depends_on.indexOf(item) !== -1) {
              checkDeps = true;
              return false;
            }
          }
          return true;
        });
        if (
          !checkDeps &&
          !_public &&
          SERVICES_COMMON_PUBLIC.indexOf(image as ServiceTypeCommonPublic) === -1
        ) {
          res.push({
            msg: `You have ${image} service with name "${item}", but none custom service depends on it`,
            data: `Add "depends_on" field with item "${item}" to any custom service`,
            exit: false,
            position: getPosition({
              config,
              configText,
              field: 'services',
              service: {
                name: item,
                property: 'image',
                value: null,
              },
            }),
          });
        }

        const commonVaribles = ENVIRONMENT_REQUIRED_COMMON[image as ServiceTypeCommon];

        commonVaribles.forEach((_item) => {
          const check = (environment || []).find((__item) => {
            const variable = parseEnvironmentVariable(__item);
            if (!variable) {
              return false;
            }
            const { name } = variable;
            if (name === _item) {
              return true;
            }
            return false;
          });
          if (!check) {
            res.push({
              msg: `Required environment variable for service "${item}" is missing:`,
              data: _item,
              exit: true,
              position: getPosition({
                config,
                configText,
                field: 'services',
                service: {
                  name: item,
                  property: 'environment',
                  value: null,
                },
              }),
            });
          }
        });

        // Check depends on
        (environment || []).forEach((_item) => {
          const variable = parseEnvironmentVariable(_item);
          if (!variable) {
            return;
          }
          const { name, value } = variable;

          const index = commonVaribles.indexOf(name);
          if (index !== -1) {
            serviceKeys.forEach((__item) => {
              const {
                image: _type,
                environment: _environment,
                depends_on: _depends_on,
              } = services[__item];

              if (!_depends_on) {
                return;
              }
              if (_depends_on.indexOf(item) === -1) {
                return;
              }

              if (isCustomService(_type)) {
                if (_environment) {
                  let check = false;
                  let _envVal: string | null = null;
                  _environment.forEach((___item) => {
                    const _envName = getEnvironmentName(___item);
                    if (_envName && _envName === name) {
                      check = true;
                      _envVal = getEnvironmentValue(___item);
                    }
                  });
                  if (value !== _envVal && check) {
                    res.push({
                      msg: `Service "${item}" provided ${name}, but in a service ${__item} dependent on it this variable value is not the same`,
                      data: `Your service ${__item} will not be able to connect to service ${item}`,
                      exit: false,
                      position: getPosition({
                        config,
                        configText,
                        field: 'services',
                        service: {
                          name: item,
                          property: 'environment',
                          value: name,
                        },
                      }),
                    });
                  }
                }
              }
            });
          }
        });
      }
    }
  }
  return res.sort((a, b) => {
    if (!a.exit && b.exit) {
      return -1;
    }
    return 1;
  });
}

export function checkGitType(url: string): GitType | null {
  let res: GitType | null = null;
  if (/https:\/\/github.com/.test(url)) {
    res = 'github';
  }
  if (/https:\/\/gitlab.com/.test(url)) {
    res = 'gitlab';
  }
  return res;
}

export function cleanGitPostfix(url: string) {
  return url.replace(/\.git$/, '');
}

export function parseGitUrl(url: string): ParsedGitRepo | null {
  const res: ParsedGitRepo | null = null;
  let _url = cleanGitPostfix(url);

  const lastPathReg = /\/[a-zA-Z0-9_-]+$/;
  const repoM = _url.match(lastPathReg);
  if (!repoM) {
    return res;
  }
  _url = _url.replace(lastPathReg, '');
  const userM = _url.match(lastPathReg);
  if (!userM) {
    return res;
  }

  return {
    user: userM[0].replace(/^\//, ''),
    project: repoM[0].replace(/^\//, ''),
  };
}

export function clearRelPath(url: string) {
  return url.replace(/^\.\//, '');
}

export async function changeConfigFileVolumes(
  { config }: { config: ConfigFile },
  volumes: Volumes
): Promise<{ config: ConfigFile; error: string | null }> {
  const _config = structuredClone(config);
  const { services, name } = config;

  if (!name) {
    return {
      config,
      error: 'Project name is missing in config',
    };
  }

  if (!services) {
    return {
      config,
      error: 'Field services is missing in config',
    };
  }

  const serviceKeys = Object.keys(services);
  let error: string | null = null;

  for (let i = 0; serviceKeys[i]; i++) {
    if (error) {
      break;
    }
    const serviceKey = serviceKeys[i];
    const { volumes: sVolumes } = services[serviceKey];

    if (sVolumes) {
      _config.services[serviceKey].volumes = volumes[serviceKey];
    }
  }

  return { config: _config, error: null };
}

function basename(filePath: string) {
  return filePath.split(/[/\\]/).pop() || filePath;
}

function isAbsolute(filePath: string) {
  if (filePath.startsWith('/')) {
    return true;
  }

  const windowsAbsolutePathPattern = /^[a-zA-Z]:\\/;
  if (windowsAbsolutePathPattern.test(filePath)) {
    return true;
  }

  return filePath.startsWith('http://') || filePath.startsWith('https://');
}
