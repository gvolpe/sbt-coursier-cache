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

// this is ugly af but YOLO, it's js anyway
async function makeHash() {
  fs.readFile('build.sbt', 'utf8', function(e1, c1) {
    fs.readFile('project/plugins.sbt', 'utf8', function(e2, c2) {
      fs.readFile('project/build.properties', 'utf8', function(e3, c3) {
        fs.readFile('project/Dependencies.scala', 'utf8', function(e4, c4) {
          if (!e1 && !e2 && !e3 && !e4) {
            return shasum(c1 || c2 || c3 || c4);
          } else if (!e1 && !e2 && !e3) {
            return shasum(c1 || c2 || c3);
          } else {
            core.setFailed(e1.toString() + e2.toString() + e3.toString());
          }
        });
      });
    });
  });
}

async function validateCache(key) {
  if (!key) {
    core.info("Cache not found");
    return;
  }
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

  validateCache(cacheKey);

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

  validateCache(cacheKey);

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
