(async () => {
  const fs = require('fs/promises');
  const path = require('path');
  const rollup = require('rollup');
  const typescript = require('@rollup/plugin-typescript');

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

  await walk('./install/js', 'index.ts');

  /**
   * @param {string[]} files
   * @returns Promise<void>
   */
  const es6Build = async (files) => {
    let buildFailed = false;

    /** @type {import('rollup').RollupBuild | undefined} */
    let bundle;

    /** @type {import('rollup').RollupOptions} */
    const inputOptions = {
      input: [...files],
      plugins: [typescript()],
    };

    /** @type {import('rollup').OutputOptions} */
    const outputOptions = {
      format: 'es',
      dir: 'install',
      preserveModules: true,
      preserveModulesRoot: 'install',
    };

    /**
     * @param {import('rollup').RollupBuild} bundle
     * @returns void
     */
    const generateOutput = async (bundle) => {
      // const { output } = await bundle.generate(outputOptions);
      const { output } = await bundle.write(outputOptions);

      for (const chunkOrAsset of output) {
        if (chunkOrAsset.type === 'asset') {
          // console.log('Asset', chunkOrAsset);
        } else {
          // console.log('Chunk', chunkOrAsset.modules);
        }
      }
    };

    try {
      bundle = await rollup.rollup(inputOptions);

      // console.log(bundle.watchFiles);
      await generateOutput(bundle);
    } catch (error) {
      buildFailed = true;
      console.error(error);
    }

    if (bundle) {
      // closes the bundle
      await bundle.close();
    }
  };

  await es6Build([...files]);

  //! SHITTY SOLUTION AHEAD CRINGE WARNING
  const getNameByFile = (file) => {
    if (path.dirname(file).endsWith('utils')) {
      return 'window.welpodron.utils';
    }

    return 'window.welpodron';
  };

  /**
   * @param {string[]} files
   * @returns Promise<void>
   */
  const iifeBuild = async (files) => {
    for (let file of files) {
      let buildFailed = false;
      /** @type {import('rollup').RollupBuild | undefined} */
      let bundle;
      /** @type {import('rollup').RollupOptions} */
      const inputOptions = {
        input: file,
        plugins: [typescript()],
        external: ['../utils', '../animate'],
      };
      const outputOptions = {
        format: 'iife',
        name: getNameByFile(file),
        extend: true,
        file: path.format({ ...path.parse(file), base: '', ext: 'iife.js' }),
        globals: {
          [path.resolve('./install/js/welpodron.core/v2/utils/')]:
            'window.welpodron.utils',
          [path.resolve('./install/js/welpodron.core/v2/animate/')]:
            'window.welpodron',
        },
      };
      /**
       * @param {import('rollup').RollupBuild} bundle
       * @returns void
       */
      const generateOutput = async (bundle) => {
        // const { output } = await bundle.generate(outputOptions);
        const { output } = await bundle.write(outputOptions);
        for (const chunkOrAsset of output) {
          if (chunkOrAsset.type === 'asset') {
            // console.log('Asset', chunkOrAsset);
          } else {
            // console.log('Chunk', chunkOrAsset.dynamicImports);
          }
        }
      };
      try {
        bundle = await rollup.rollup(inputOptions);
        // console.log(bundle.watchFiles);
        await generateOutput(bundle);
      } catch (error) {
        buildFailed = true;
        console.error(error);
      }
      if (bundle) {
        // closes the bundle
        await bundle.close();
      }
    }
  };

  await iifeBuild([...files]);
})();
