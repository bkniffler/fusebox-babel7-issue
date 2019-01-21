import { FuseBox, Sparky, WebIndexPlugin } from 'fuse-box';
import { Babel7Plugin } from 'fuse-box/plugins/js-transpilers/Babel7Plugin';
import { resolve } from 'path';
import { readFileSync } from 'fs';
const babelRC = JSON.parse(
  readFileSync(resolve(__dirname, '.babelrc'), { encoding: 'utf8' })
);

const DEV_PORT = 4445;
const OUTPUT_DIR = '.out';

// are we running in production mode?
const isProduction = process.env.NODE_ENV === 'production';

// copy the renderer's html file into the right place
Sparky.task('copy-html', () => {
  return Sparky.src('src/index.html').dest(`${OUTPUT_DIR}/$name`);
});

// the default task
Sparky.task('default', ['copy-html'], () => {
  // setup the producer with common settings
  const fuse = FuseBox.init({
    homeDir: 'src',
    output: `${OUTPUT_DIR}/$name.js`,
    target: 'browser@es5',
    log: isProduction,
    cache: !isProduction,
    sourceMaps: true,
    tsConfig: 'tsconfig.json'
    // useJsNext: true
  });

  // start the hot reload server
  if (!isProduction) {
    fuse.dev({ port: DEV_PORT });
  }

  // bundle the electron renderer code
  const bundle = fuse
    .bundle('app')
    .alias('react-native', 'react-native-web')
    .instructions('> index.tsx')
    .plugin(
      WebIndexPlugin({
        template: 'src/index.html'
      })
    )
    .plugin(Babel7Plugin(babelRC));
  // and watch & hot reload unless we're bundling for production
  if (!isProduction) {
    bundle.watch();
    bundle.hmr();
  }

  // when we are finished bundling...
  return fuse.run();
});
