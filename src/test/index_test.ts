import test from 'node:test';
import assert from 'node:assert';

import {htmlModules} from '../index.js';
import {rollup, type Plugin} from 'rollup';
import virtualMod, {type RollupVirtualOptions} from '@rollup/plugin-virtual';

const virtual: (modules: RollupVirtualOptions) => Plugin = virtualMod as any;

test('Transforms HTML files imported with the correct attribute', async () => {
  const bundle = await rollup({
    input: 'index.js',
    plugins: [
      htmlModules(),
      virtual({
        'index.js': `
          import myDocument from './my-doc.html' with {type: 'html'};
          console.log(myDocument);
        `,
        'my-doc.html': `
          <!doctype html>
          <html>
            <head>
              <title>My Document</title>
            </head>
            <body>
              <h1>My Document</h1>
            </body>
          </html>
        `,
      }),
    ],
  });
  const {output} = await bundle.generate({
    format: 'es',
    exports: 'named',
  });

  assert(output[0].code.includes('new DOMParser()'));
  assert(output[0].code.includes('<title>My Document</title>'));
  // TODO: more robust test
  assert(!output[0].code.includes(`{ type: 'html' }`));
});

test('Fails on HTML files imported without attributes', async () => {
  assert.rejects(async () => {
    await rollup({
      input: 'index.js',
      plugins: [
        htmlModules(),
        virtual({
          'index.js': `
          import myDocument from './my-doc.html';
          console.log(myDocument);
        `,
          'my-doc.html': `
          <!doctype html>
          <html>
            <head>
              <title>My Document</title>
            </head>
            <body>
              <h1>My Document</h1>
            </body>
          </html>
        `,
        }),
      ],
    });
  });
});

test('Leaves type attribute on external imports', async () => {
  const bundle = await rollup({
    input: 'index.js',
    external(id) {
      return id.endsWith('.html');
    },
    plugins: [
      htmlModules(),
      virtual({
        'index.js': `
          import myDocument from './my-doc.html' with {type: 'html'};
          console.log(myDocument);
        `,
        'my-doc.html': `
          <!doctype html>
          <html>
            <head>
              <title>My Document</title>
            </head>
            <body>
              <h1>My Document</h1>
            </body>
          </html>
        `,
      }),
    ],
  });
  const {output} = await bundle.generate({
    format: 'es',
    exports: 'named',
  });

  assert(!output[0].code.includes('new DOMParser()'));
  assert(!output[0].code.includes('<title>My Document</title>'));
  assert(output[0].code.includes(`{ type: 'html' }`));
});
