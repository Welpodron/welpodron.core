(async () => {
  const fs = require("fs/promises");
  const path = require("path");

  const UglifyJS = require("uglify-js");

  const files = new Set();

  const walk = async (dirPath) =>
    Promise.all(
      await fs.readdir(dirPath, { withFileTypes: true }).then((entries) =>
        entries.map((entry) => {
          const childPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            return walk(childPath);
          }

          if (
            entry.isFile() &&
            entry.name.endsWith(".js") &&
            !entry.name.endsWith(".min.js")
          ) {
            const fileName = path.basename(childPath, ".js");

            const parts = fileName.split(".");

            const last = parts.pop();

            if (last !== "min") {
              files.add(childPath);
            }
          }
        })
      )
    );

  await walk("./install/js");

  const minifyFile = async (file) => {
    // Получить директорую файла
    const dir = path.dirname(file);
    // Получить имя файла без расширения
    const fileName = path.basename(file, ".js");

    const content = await fs.readFile(file, "utf8");

    const result = UglifyJS.minify(
      {
        [`${fileName}.js`]: content,
      },
      {
        warnings: true,
        sourceMap: {
          filename: `${fileName}.min.js`,
          url: `${fileName}.min.js.map`,
        },
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
      "utf8"
    );

    // Сохранить source map
    await fs.writeFile(
      path.join(dir, `${fileName}.min.js.map`),
      result.map,
      "utf8"
    );
  };

  const promises = [];

  for (let file of files) {
    promises.push(minifyFile(file));
  }

  await Promise.all(promises);
})();
