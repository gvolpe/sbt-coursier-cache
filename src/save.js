const core  = require("@actions/core");
const cache = require("@actions/cache");

async function run() {
  const sbtCacheKey   = core.getState("SBT_CACHE_RESULT");
  const sbtPrimaryKey = core.getState("SBT_CACHE_KEY");
  const sbtCachePath  = core.getState("SBT_CACHE_PATH");
  save(sbtCacheKey, sbtPrimaryKey, sbtCachePath);

  const csCacheKey   = core.getState("CS_CACHE_RESULT");
  const csPrimaryKey = core.getState("CS_CACHE_KEY");
  const csCachePath  = core.getState("CS_CACHE_PATH");
  save(csCacheKey, csPrimaryKey, csCachePath);
}

async function save(cacheKey, primaryKey, cachePath) {
  if (cacheKey === primaryKey) {
    core.info(
      `Cache hit occurred on the primary key ${primaryKey}, not saving cache.`
    );
    return;
  }

  try {
    await cache.saveCache([cachePath], primaryKey);
  } catch (error) {
    if (error.name === cache.ValidationError.name) {
      throw error;
    } else if (error.name === cache.ReserveCacheError.name) {
      core.info(error.message);
    } else {
      core.info(`[warning] ${error.message}`);
    }
  }
}

run().catch(err => {
  core.setFailed(err.toString());
});
