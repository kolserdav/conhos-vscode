import { Status } from '../../types.';
import { SOURCE } from '../constants';

export default function log(status: Status, message: string, ...args: any) {
  console[status](`[${SOURCE}]`, status, message, ...args);
}
