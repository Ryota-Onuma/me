import * as path from 'path';
import * as fs from 'fs';
import Mocha = require('mocha');

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true });
  const testsRoot = path.resolve(__dirname, '.');

  return new Promise((resolve, reject) => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.test\.js$/.test(entry.name)) files.push(p);
      }
    };
    walk(testsRoot);

    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, path.relative(testsRoot, f))));

    try {
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
