import { DeployData } from '../interfaces';

export function getMedialplan() {
  return new Promise<DeployData | null>((resolve) => {
    fetch('http://localhost:3001/v1/get-media-plan')
      .then((r) => r.json())
      .then((d) => {
        resolve(d.data);
      })
      .catch((e) => {
        console.error('Failed to get mediaplan', e);
        resolve(null);
      });
  });
}
