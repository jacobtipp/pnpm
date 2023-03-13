const path = require('path');
const execa = require('execa');

module.exports = async (npmrc, {tarballDir, pkgRoot}, {cwd, env, stdout, stderr, nextRelease: {version}, logger}) => {
  const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;

  logger.log("CWD is %s", cwd)
  logger.log("pkgRoot is %s", pkgRoot)

  const versionResult = execa(
    'pnpm',
    ['version', version, '--userconfig', npmrc, '--no-git-tag-version', '--allow-same-version'],
    {
      cwd: basePath,
      env,
      preferLocal: true,
    }
  );
  versionResult.stdout.pipe(stdout, {end: false});
  versionResult.stderr.pipe(stderr, {end: false});

  await versionResult;

  if (tarballDir) {
    logger.log('Packing bundle to %s', basePath) 
    const packResult = execa('pnpm', ['pack'], {cwd: basePath, env, preferLocal: true});
    packResult.stdout.pipe(stdout, {end: false});
    packResult.stderr.pipe(stderr, {end: false});

    const tarball = (await packResult).stdout.split('\n').pop()
    const tarballSource = path.resolve(cwd, tarball);
    const tarballDestination = path.resolve(cwd, tarballDir.trim(), tarball);

    // Only move the tarball if we need to
    // Fixes: https://github.com/semantic-release/npm/issues/169
    if (tarballSource !== tarballDestination) {
      await move(tarballSource, tarballDestination);
    }
    logger.log('Tarball: %s', tarball)

    return tarball
  }
};
