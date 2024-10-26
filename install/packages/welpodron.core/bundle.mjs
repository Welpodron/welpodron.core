import path from "path";
import fs from "fs/promises";
import { globSync } from "glob";
import { fileURLToPath } from "node:url";
import { rollup } from "rollup";
import typescript from "@rollup/plugin-typescript";

(async () => {
  /** @type {import('rollup').RollupBuild | undefined} */
  let bundle;

  try {
    await fs.rm(`./esm`, {
      recursive: true,
      force: true,
    });

    await fs.rm(`./iife`, {
      recursive: true,
      force: true,
    });
  } catch (_) {
    //
  }

  const filesMap = Object.fromEntries(
    globSync("ts/**/*.ts").map((file) => [
      path.relative(
        "ts",
        file.slice(0, file.length - path.extname(file).length)
      ),
      fileURLToPath(new URL(file, import.meta.url)),
    ])
  );

  /** @type {import('rollup').RollupOptions} */
  let inputOptions = {
    input: filesMap,
    plugins: [
      typescript({
        declaration: false,
        declarationDir: undefined,
        removeComments: true,
      }),
    ],
  };

  /** @type {import('rollup').OutputOptions[]} */
  const outputs = [
    {
      format: "esm",
      dir: "esm",
    },
  ];

  try {
    bundle = await rollup(inputOptions);
    await Promise.all(outputs.map((output) => bundle.write(output)));
  } catch (error) {
    console.error(error);
  }

  if (bundle) {
    await bundle.close();
  }

  // IIFE BUILD
  const files = Object.values(filesMap);

  for (let file of files) {
    const inputOptions = {
      input: file,
      plugins: [
        typescript({
          declaration: false,
          declarationDir: undefined,
          removeComments: true,
        }),
      ],
      external: ["../utils", "../animate"],
    };
    try {
      bundle = await rollup(inputOptions);
      await bundle.write({
        format: "iife",
        name: "window.welpodron",
        extend: true,
        file: path.format({
          ...path.parse(file.replace(/ts/, "iife")),
          base: "",
          ext: "js",
        }),
        globals: {
          [path.resolve("./ts/utils/")]: "window.welpodron",
          [path.resolve("./ts/animate/")]: "window.welpodron",
        },
      });
    } catch (error) {
      console.error(error);
    }
    if (bundle) {
      await bundle.close();
    }
  }
})();
