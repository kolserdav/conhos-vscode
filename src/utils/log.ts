import { Status } from '../interfaces';

export default function log(status: Status, message: string, ...args: any) {
  console[status](status, message, ...args);
}
