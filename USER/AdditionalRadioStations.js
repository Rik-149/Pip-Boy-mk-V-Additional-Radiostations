// =============================================================================
//  Name: Additional Radio Stations
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: Adds additional radio stations to the Pip-Boy 3000 mkV. Specifically,
//               Appalachia Radio, Diamond City Radio, and Radio New Vegas.
//               This app allows you to create directories for these stations and build a clip cache.
//               Original menu layout created by @CodyTolene
//  Version: 1.0.0
// =============================================================================

const fs = require('fs');
const COLOR_GREEN = '#0F0';
const COLOR_WHITE = '#FFF';
const HEIGHT = g.getHeight();
const WIDTH = g.getWidth();
const CENTER = WIDTH / 2;
let caching = { enabled: false };
let build_dir = { enabled: false };
let knob1Cooldown = false;

function loadAndCreateRadioStations(filePath, baseDir) {
  let radioStations = {
    list: [],
    byFolder: {},
    byType: {},
  };
  filePath = filePath || 'USER/AdditionalRadioStations/radioStations.json';
  baseDir = baseDir || 'USER/AdditionalRadioStations';
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const stations = JSON.parse(data);
    radioStations.list = stations;
    radioStations.byFolder = {};
    radioStations.byType = {};
    stations.forEach(function (station) {
      radioStations.byFolder[station.folder] = station;
      if (!radioStations.byType[station.type]) {
        radioStations.byType[station.type] = [];
      }
      radioStations.byType[station.type].push(station);
    });
    stations.forEach(function (station) {
      const stationPath = baseDir + '/' + station.folder;

      try {
        fs.mkdirSync(stationPath);
      } catch (e) {
        if (e.code === 'EEXIST') {
          console.log('Folder already exists:', stationPath);
        } else {
          console.error(e.message);
        }
      }
    });
  } catch (err) {
    console.error('Error loadAndCreateRadioStations():', err.message);
  }
}

function serializeCache(cache) {
  let lines = [];
  for (const station in cache) {
    const sections = cache[station];
    if (Object.keys(sections).length === 0) {
      // Empty station
      lines.push(`[${station}]`, '');
      continue;
    }
    for (const section in sections) {
      lines.push(`[${station}.${section}]`);
      const files = sections[section];
      if (files.length === 0) {
        lines.push('');
      } else {
        for (const file of files) {
          lines.push(file);
        }
      }
      lines.push(''); // blank line between sections
    }
  }
  return lines.join('\n');
}

function buildAndSaveClipCache() {
  console.log('Enter Buildfunction');
  let folders = ['KPSS', 'APPALACHIA', 'DIAMOND_CITY', 'NEW_VEGAS'];
  let types = Object.values(CLIP_TYPE);
  let cache = {};
  folders.forEach((folder) => {
    let folderCache = {};
    console.log('loading folder:', folder);
    try {
      process.memory();
      let allFiles = fs
        .readdirSync('USER/AdditionalRadioStations/' + folder)
        .sort();
      types.forEach((type) => {
        folderCache[type] = allFiles
          .filter(
            (f) =>
              f.startsWith(type) &&
              f.toUpperCase().endsWith('WAV') &&
              !f.startsWith('.'),
          )
          .map((f) => `USER/AdditionalRadioStations/${folder}/${f}`);
      });
    } catch (e) {
      folderCache = {};
    }
    cache[folder] = folderCache;
  });
  process.memory();
  const content = serializeCache(cache);
  fs.writeFileSync('USER/AdditionalRadioStations/clipCache.txt', content);
  console.log('Cache built');
}

function draw() {
  g.clear();

  g.setFontMonofonto28();
  g.setColor(COLOR_GREEN);
  g.drawString('Additional Radio Stations', CENTER, 30);

  g.setFontMonofonto18();
  g.setColor(COLOR_WHITE);
  g.drawString('Options Menu', CENTER, 55);
  g.drawString(
    '[ ' + (build_dir.enabled ? 'X' : ' ') + ' ] Build Directories from JSON',
    CENTER,
    HEIGHT * 0.3,
  );
  g.drawString(
    '[ ' + (caching.enabled ? 'X' : ' ') + ' ] Build Clip Cache',
    CENTER,
    HEIGHT * 0.4,
  );
  g.drawString('1. Scroll right wheel to create directories.', CENTER, HEIGHT - 120);
  g.drawString('2. Upload .WAV files.', CENTER, HEIGHT - 95);
  g.drawString('3. Press torch to build cache.', CENTER, HEIGHT - 70);
}

Pip.on('knob2', function (dir) {
  build_dir.enabled = !build_dir.enabled;
  loadAndCreateRadioStations();
  draw();
});

function handleTorch() {
  buildAndSaveClipCache();
  caching.enabled = !caching.enabled;
  draw();
}

draw();

Pip.on('knob1', function (dir) {
  console.log('knob1 pressed');
});
Pip.on('torch', handleTorch);

