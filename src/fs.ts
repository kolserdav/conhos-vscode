export default async function getFs(): Promise<typeof import('fs')> {
  return new Promise((resolve) => {
    import(/* webpackIgnore: true */ 'fs').then((d) => {
      resolve(d.default);
    });
  });
}
