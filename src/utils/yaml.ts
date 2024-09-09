import yaml from 'yaml';
import { ConfigFile } from '../interfaces';

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
