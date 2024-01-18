import esbuild from 'rollup-plugin-esbuild';
import path from 'path';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import fs from 'fs/promises';

(async () => {
  /** @type {import('rollup').RollupBuild | undefined} */
  let bundle;

  try {
    await fs.rm(path.resolve('./install/packages/welpodron.core', 'es'), {
      recursive: true,
      force: true,
    });

    await fs.rm(path.resolve('./install/packages/welpodron.core', 'cjs'), {
      recursive: true,
      force: true,
    });

    await fs.rm(path.resolve('./install/packages/welpodron.core', 'iife'), {
      recursive: true,
      force: true,
    });
  } catch (_) {}

  /** @type {import('rollup').RollupOptions} */
  let inputOptions = {
    input: path.resolve('./install/packages/welpodron.core/ts/index.ts'),
    plugins: [
      nodeResolve({ extensions: ['.ts'] }),
      esbuild({
        sourceMap: true,
        target: 'esnext',
        exclude: ['./types', './es', './cjs'],
      }),
    ],
  };

  /** @type {import('rollup').OutputOptions[]} */
  const outputs = [
    {
      format: 'es',
      entryFileNames: '[name].js',
      dir: path.resolve('./install/packages/welpodron.core', 'es'),
      preserveModules: true,
      sourcemap: true,
    },
    {
      format: 'cjs',
      entryFileNames: '[name].js',
      dir: path.resolve('./install/packages/welpodron.core', 'cjs'),
      preserveModules: true,
      sourcemap: true,
    },
  ];

  try {
    bundle = await rollup(inputOptions);
    await Promise.all(outputs.map((output) => bundle.write(output)));
  } catch (error) {
    // buildFailed = true;
    console.error(error);
  }

  if (bundle) {
    // closes the bundle
    await bundle.close();
  }

  // IIFE BUILD

  /** @type {Set<string>} */
  let files = new Set();
  /**
   *
   * @param {string} dirPath
   * @param {string} ext
   * @returns Promise<void>
   */
  const walk = async (dirPath, ext) =>
    Promise.all(
      await fs.readdir(dirPath, { withFileTypes: true }).then((entries) =>
        entries.map((entry) => {
          const childPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            return walk(childPath, ext);
          }

          if (
            entry.isFile() &&
            entry.name.endsWith(ext) &&
            !entry.name.endsWith('.min' + ext)
          ) {
            const fileName = path.basename(childPath, ext);

            const parts = fileName.split('.');

            const last = parts.pop();

            if (last !== 'min') {
              files.add(childPath);
            }
          }
        })
      )
    );

  await walk('./install/packages/welpodron.core/ts', 'index.ts');

  for (let file of files) {
    const inputOptions = {
      input: file,
      plugins: [
        nodeResolve({ extensions: ['.ts'] }),
        esbuild({
          sourceMap: true,
          target: 'esnext',
          exclude: ['./types', './es', './cjs', './iife'],
        }),
      ],
      external: ['../utils', '../animate'],
    };
    try {
      bundle = await rollup(inputOptions);
      await bundle.write({
        format: 'iife',
        name: 'window.welpodron',
        extend: true,
        file: path.format({
          ...path.parse(file.replace(/ts/, 'iife')),
          base: '',
          ext: 'js',
        }),
        sourcemap: true,
        globals: {
          [path.resolve('./install/packages/welpodron.core/ts/utils/')]:
            // 'window.welpodron.utils',
            'window.welpodron',
          [path.resolve('./install/packages/welpodron.core/ts/animate/')]:
            'window.welpodron',
        },
      });
    } catch (error) {
      // buildFailed = true;
      console.error(error);
    }
    if (bundle) {
      // closes the bundle
      await bundle.close();
    }
  }
})();
