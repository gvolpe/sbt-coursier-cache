const core   = require("@actions/core");
const exec   = require("@actions/exec");
const shasum = require("shasum");
const cache  = require("@actions/cache");
const fs     = require("fs");

async function uname() {
  let output = "";
  const options = {};
  options.listeners = {
    stdout: data => {
      output += data.toString();
    },
  };
  await exec.exec("uname", [], options);

  return output.trim();
}

async function makeHash() {
  const c1 = fs.readFileSync('build.sbt');
  const c2 = fs.readFileSync('project/plugins.sbt');
  const c3 = fs.readFileSync('project/build.properties');
  const c4 = fs.readFileSync('project/Dependencies.scala');
  return shasum(c1 || c2 || c3 || c4);
}

async function sbtRestore(os, hash) {
  const cachePath = "~/.sbt";
  core.saveState("SBT_CACHE_PATH", cachePath);

  const primaryKey = `${os}-sbt-${hash}`;
  const restoreKey = "sbt";

  core.saveState("SBT_CACHE_KEY", primaryKey);
  core.info(`Cache keys: ${[primaryKey, restoreKey].join(", ")}`);

  const cacheKey = await cache.restoreCache([cachePath], primaryKey, [
    restoreKey,
  ]);

  if (!cacheKey) {
    core.info("Cache not found");
    return;
  }

  core.saveState("SBT_CACHE_RESULT", cacheKey);
  const isExactKeyMatch = primaryKey === cacheKey;
  core.setOutput("cache-hit", isExactKeyMatch.toString());

  core.info(`Cache restored from key: ${cacheKey}`);
}

async function coursierRestore(os, hash) {
  const cachePath = "~/.cache/coursier";
  core.saveState("CS_CACHE_PATH", cachePath);

  const primaryKey = `${os}-coursier-${hash}`;
  const restoreKey = "coursier";

  core.saveState("CS_CACHE_KEY", primaryKey);
  core.info(`Cache keys: ${[primaryKey, restoreKey].join(", ")}`);

  const cacheKey = await cache.restoreCache([cachePath], primaryKey, [
    restoreKey,
  ]);

  if (!cacheKey) {
    core.info("Cache not found");
    return;
  }

  core.saveState("CS_CACHE_RESULT", cacheKey);
  const isExactKeyMatch = primaryKey === cacheKey;
  core.setOutput("cache-hit", isExactKeyMatch.toString());

  core.info(`Cache restored from key: ${cacheKey}`);
}

async function run() {
  const os   = await uname();
  const hash = makeHash();
  coursierRestore(os, hash);
  sbtRestore(os, hash);
}

run().catch(err => {
  core.setFailed(err.toString());
});
