(async () => {
  const fs = require('fs/promises');
  const path = require('path');
  const UglifyJS = require('uglify-js');
  const csso = require('csso');

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

  await walk('./install/js', '.js');

  /**
   * @param {string} file
   * @returns Promise<void>
   */
  const minifyJSFile = async (file) => {
    // Получить директорую файла
    const dir = path.dirname(file);
    // Получить имя файла без расширения
    const fileName = path.basename(file, '.js');

    const content = await fs.readFile(file, 'utf8');

    const sourceMapOptions = {
      filename: `${fileName}.min.js`,
      url: `${fileName}.min.js.map`,
    };

    try {
      const tsSourceMap = await fs.readFile(
        path.join(dir, `${fileName}.js.map`),
        'utf8'
      );

      if (tsSourceMap) {
        sourceMapOptions.content = tsSourceMap;
      }
    } catch (error) {}

    const result = UglifyJS.minify(
      {
        [`${fileName}.js`]: content,
      },
      {
        warnings: true,
        sourceMap: sourceMapOptions,
      }
    );

    if (result.error) {
      console.log(result.error);
      return;
    }

    if (result.warnings) {
      console.log({
        file,
        warnings: result.warnings,
      });
    }

    // Сохранить минифицированный файл
    await fs.writeFile(
      path.join(dir, `${fileName}.min.js`),
      result.code,
      'utf8'
    );

    // Сохранить source map
    await fs.writeFile(
      path.join(dir, `${fileName}.min.js.map`),
      result.map,
      'utf8'
    );
  };

  /** @type {Promise<void>[]} */
  let promises = [];

  for (let file of files) {
    promises.push(minifyJSFile(file));
  }

  await Promise.all(promises);

  files = new Set();

  await walk('./install/css', '.css');

  /**
   * @param {string} file
   * @returns Promise<void>
   */
  const minifyCSSFile = async (file) => {
    // Получить директорую файла
    const dir = path.dirname(file);
    // Получить имя файла без расширения
    const fileName = path.basename(file, '.css');

    const content = await fs.readFile(file, 'utf8');

    const result = csso.minify(content, {
      sourceMap: true,
      filename: fileName + '.css',
      comments: false,
    });

    // Сохранить минифицированный файл
    await fs.writeFile(
      path.join(dir, `${fileName}.min.css`),
      result.css + `/*# sourceMappingURL=${fileName + '.min.css.map'} */`,
      'utf8'
    );

    // Сохранить source map
    await fs.writeFile(
      path.join(dir, `${fileName}.min.css.map`),
      result.map.toString(),
      'utf8'
    );
  };

  promises = [];

  for (let file of files) {
    promises.push(minifyCSSFile(file));
  }

  await Promise.all(promises);
})();
