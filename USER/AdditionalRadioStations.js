// =============================================================================
//  Name: Additional Radio Stations
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: Adds additional radio stations to the Pip-Boy 3000 mkV. Specifically,
//               Appalachia Radio, Diamond City Radio, and Radio New Vegas.
//  Version: 1.1.0
// =============================================================================

const fs = require('fs');
const COLOR_GREEN = '#0F0';
const COLOR_WHITE = '#FFF';
const HEIGHT = g.getHeight();
const WIDTH = g.getWidth();
const CENTER = WIDTH / 2;
let cache = { enabled: false };
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

function buildAndSaveClipCache() {
  console.log('Enter Buildfunc:');
  let folders = ['KPSS', 'APPALACHIA', 'DIAMOND_CITY', 'NEW_VEGAS'];
  let types = Object.values(CLIP_TYPE);
  let cache = {};
  folders.forEach((folder) => {
    let folderCache = {};
    console.log('Enter Buildfunc:');
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
  console.log('Cache built:');
  process.memory();
  fs.writeFile(
    'USER/AdditionalRadioStations/clipCache.json',
    JSON.stringify(cache),
  );
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
    '[ ' + (cache.enabled ? 'X' : ' ') + ' ] Build Clip Cache',
    CENTER,
    HEIGHT * 0.3,
  );

  g.drawString(
    '[ ' + (build_dir.enabled ? 'X' : ' ') + ' ] Build Directories from JSON',
    CENTER,
    HEIGHT * 0.6,
  );

  g.drawString('Press radio wheel to create directories', CENTER, HEIGHT - 80);
  g.drawString('Press wheel in to build cache.', CENTER, HEIGHT - 60);
  g.drawString('Press torch to exit.', CENTER, HEIGHT - 35);
}

function toggleCache(dir) {
  cache.enabled = !cache.enabled;
  buildAndSaveClipCache();
  draw();
}

Pip.on('knob2', function (dir) {
  build_dir.enabled = !build_dir.enabled;
  loadAndCreateRadioStations();
  draw();
});

function handleTorch() {
  E.reboot();
}

draw();

Pip.on('knob1', function (dir) {
  if (knob1Cooldown) return;

  knob1Cooldown = true;
  setTimeout(() => {
    knob1Cooldown = false;
  }, 300); // cooldown period in milliseconds
  buildAndSaveClipCache();
  cache.enabled = !cache.enabled;
  draw();
});
Pip.on('torch', handleTorch);

// todo: only load at boottime when this app has run
