// =============================================================================
//  Name: Additional Radio Stations
//  License: CC-BY-NC-4.0
//  Description: Adds additional radio stations to the Pip-Boy 3000 mkV. Specifically,
//               Appalachia Radio, Diamond City Radio, and Radio New Vegas.
//  Version: 1.1.0
// =============================================================================

const DEBUG = false;
fs = require('fs');

function debug() {
  if (!DEBUG) return;
  print.apply(null, arguments);
}

function getCachedClipList(folder, type) {
  if (!cachedRadioClips[folder]) cachedRadioClips[folder] = {};
  if (!cachedRadioClips[folder][type]) {
    try {
      let path = `USER/AdditionalRadioStations/${folder}`;
      let allFiles = require('fs').readdirSync(path).sort();
      cachedRadioClips[folder][type] = allFiles.filter(
        (f) =>
          f.startsWith(type) &&
          f.toUpperCase().endsWith('WAV') &&
          !f.startsWith('.'),
      );
    } catch (e) {
      cachedRadioClips[folder][type] = []; // fallback to empty list
    }
  }
  return cachedRadioClips[folder][type];
}

let radioPlayClipCustom = (a, station, b) => (
  a == undefined && (a = CLIP_TYPE.MUSIC),
  new Promise((e, f) => {
    var c = null;
    let d = () => {
      Pip.removeListener('streamStopped', d),
        (Pip.radioClipPlaying = !1),
        c && rd.setVol(c),
        e(1);
    };
    if (Pip.radioClipPlaying)
      Pip.removeListener('streamStopped', d),
        Pip.videoStop(),
        (Pip.radioClipPlaying = !1),
        c && rd.setVol(c),
        e(0);
    if (!Pip.radioClipPlaying) {
      (c = rd.getVol()),
        rd.setVol(2),
        a == CLIP_TYPE.ANY &&
          (a = [CLIP_TYPE.MUSIC, CLIP_TYPE.VOICE, CLIP_TYPE.SFX][
            Math.floor(Math.random() * 2.999)
          ]);
      let clips;
      if (!Pip.radioKPSS){
          clips = getCachedClipList(station, a);
      }
      else {
          clips = fs.readdirSync("RADIO").sort().filter(b => b.startsWith(a) && b.toUpperCase().endsWith("WAV") && !b.startsWith(".")).map((b) => `RADIO/${b}`);
      }
      clips.length || f('No radio clips found');
      let g = getRandomExcluding(clips.length, Pip.lastClipIndex);
      b && console.log(`Playing radio clip type ${a}: ${clips[g]}`),
        console.log(clips[g]),
        Pip.audioStart(clips[g]),
        Pip.on('streamStopped', d),
        (Pip.radioClipPlaying = !0),
        (Pip.lastClipIndex = g);
    }
  })
);

try {
  cachedRadioClips = JSON.parse(
    require('fs').readFileSync('USER/AdditionalRadioStations/clipCache.json'),
  );
} catch (e) {
  // buildAndSaveClipCache();
}

(function initAdditionalRadiostations() {
  try {
    if (
      typeof MODEINFO !== 'undefined' &&
      typeof MODE !== 'undefined' &&
      MODEINFO[MODE.RADIO]
    ) {
      const radioTab = MODEINFO[MODE.RADIO];
      // remove the default function if present
      if (radioTab.fn) {
        delete radioTab.fn;
      }
      radioTab.fn = function () {
        debug('[radioTab.fn] Custom radio logic triggered');
        bC.clear(1);
        bC.setColor(3)
          .setFontMonofonto16()
          .drawString('Custom Radio Active', 40, 40);
        bC.flip();
        rd._options || rd.setupI2C(), bC.clear(1);
        let f = 0;
        let cachedRadioClips = {};
        let a = Graphics.createArrayBuffer(120, 120, 2, {
          msb: !0,
        });
        E.getAddressOf(a, 0) == 0 &&
          ((a = undefined),
          E.defrag(),
          (a = Graphics.createArrayBuffer(120, 120, 2, {
            msb: !0,
          })));
        let c = new Uint16Array(60);
        for (let l = 0; l < 60; l += 2) c[l] = l * 2;

        function j() {
          for (let a = 0; a < 40; a++) {
            let c = 2,
              b = 1;
            a % 5 == 0 && ((c = 3), (b = 2)),
              bC.setColor(c),
              bC.drawLine(245 + a * 3, 143 - b, 245 + a * 3, 143),
              bC.drawLine(367 - b, 22 + a * 3, 367, 22 + a * 3);
          }
          bC.setColor(3)
            .drawLine(245, 144, 367, 144)
            .drawLine(368, 144, 368, 22)
            .flip();
        }

        function k() {
          if ((a.clearRect(0, 0, 119, 119), Pip.radioClipPlaying))
            Pip.getAudioWaveform(c, 20, 100);
          else if (Pip.radioOn)
            for (let a = 1; a < 60; a += 2)
              c[a] = E.clip(
                60 + (analogRead(RADIO_AUDIO) - 0.263) * 600,
                0,
                119,
              );
          else {
            let a = f;
            for (let b = 1; b < 60; b += 2)
              c[b] = 60 + Math.sin(a) * 45 * Math.sin((a += 0.6) * 0.13);
          }
          a.drawPolyAA(c),
            (f += 0.3),
            Pip.blitImage(a, 285, 85, {
              noScanEffect: !0,
            });
        }
        E.showMenu({
          '': {
            x2: 240,
            predraw: function () {
              bC.drawImage(a, 245, 20), rd.drawFreq(bC);
            },
          },
          'FM Radio': {
            value: rd.isOn(),
            format: (a) => (a ? 'On' : 'Off'),
            onchange: (a) => {
              a
                ? ((Pip.radioKPSS = !1),
                  rd.enable(!0),
                  Pip.audioStart('UI/RADIO_ON.wav'))
                : (rd.enable(!1),
                  rd.drawFreq(),
                  Pip.audioStart('UI/RADIO_OFF.wav'));
            },
          },
          'FM Volume': {
            value: rd.getVol(),
            min: 0,
            max: 15,
            step: 1,
            onchange: (a) => {
              rd.setVol(a);
            },
          },
          'KPSS Radio': {
            value: !!Pip.radioKPSS,
            format: (a) => (a ? 'On' : 'Off'),
            onchange: (a) => {
              (Pip.radioKPSS = a),
                a
                  ? radioPlayClipCustom(CLIP_TYPE.ANY, 'KPSS')
                  : Pip.audioStart('UI/RADIO_OFF.wav');
            },
          },
          'Appalachia Radio': {
            value: !!Pip.radioAPPA,
            format: (a) => (a ? 'On' : 'Off'),
            onchange: (a) => {
              (Pip.radioAPPA = a),
                a
                  ? radioPlayClipCustom(CLIP_TYPE.ANY, 'APPALACHIA')
                  : Pip.audioStart('UI/RADIO_OFF.wav');
            },
          },
          'Diamond City Radio': {
            value: !!Pip.radioDIAM,
            format: (a) => (a ? 'On' : 'Off'),
            onchange: (a) => {
              (Pip.radioDIAM = a),
                a
                  ? radioPlayClipCustom(CLIP_TYPE.ANY, 'DIAMOND_CITY')
                  : Pip.audioStart('UI/RADIO_OFF.wav');
            },
          },
          'Radio New Vegas': {
            value: !!Pip.radioVEGA,
            format: (a) => (a ? 'On' : 'Off'),
            onchange: (a) => {
              (Pip.radioVEGA = a),
                a
                  ? radioPlayClipCustom(CLIP_TYPE.ANY, 'NEW_VEGAS')
                  : Pip.audioStart('UI/RADIO_OFF.wav');
            },
          },
        });
        let g = Pip.removeSubmenu;
        j();
        let h = setInterval(() => {
          Pip.radioKPSS && !Pip.streamPlaying()
            ? radioPlayClipCustom(CLIP_TYPE.ANY, 'KPSS')
            : k();
          Pip.radioAPPA && !Pip.streamPlaying()
            ? radioPlayClipCustom(CLIP_TYPE.ANY, 'APPALACHIA')
            : k();
          Pip.radioDIAM && !Pip.streamPlaying()
            ? radioPlayClipCustom(CLIP_TYPE.ANY, 'DIAMOND_CITY')
            : k();
          Pip.radioVEGA && !Pip.streamPlaying()
            ? radioPlayClipCustom(CLIP_TYPE.ANY, 'NEW_VEGAS')
            : k();
        }, 50);
        (rd.rdsTimer = setInterval(() => {
          readRDSData();
        }, 100)),
          rd.isOn() && (rd.getChannelInfo(), rd.drawFreq());
        let b = null;
        let e = 0;
        let d = null;

        function i(a) {
          if (
            Pip.radioKPSS ||
            Pip.radioAPPA ||
            Pip.radioDIAM ||
            Pip.radioVEGA
          ) {
            if (Pip.radioKPSS) radioPlayClipCustom(CLIP_TYPE.MUSIC, 'KPSS');
            if (Pip.radioAPPA)
              radioPlayClipCustom(CLIP_TYPE.MUSIC, 'APPALACHIA');
            if (Pip.radioDIAM)
              radioPlayClipCustom(CLIP_TYPE.MUSIC, 'DIAMOND_CITY');
            if (Pip.radioVEGA)
              radioPlayClipCustom(CLIP_TYPE.MUSIC, 'NEW_VEGAS');
            return;
          }
          if (!d && a == e) {
            rd.freq = rd.freq + e * 0.1;
            rd.freq < rd.start / 100 && (rd.freq = rd.end / 100);
            rd.freq > rd.end / 100 && (rd.freq = rd.start / 100);
            rd.drawFreq();
            b && clearTimeout(b);
            b = setTimeout(() => {
              try {
                rd.freqSet(rd.freq);
              } catch (err) {
                log(`Error tuning radio: ${err}`);
              }
              b = null;
            }, 200);
            d && clearTimeout(d);
            d = setTimeout(() => (d = null), 20);
          } else {
            e = a;
          }
        }
        Pip.on('knob2', i);
        Pip.removeSubmenu = function () {
          (Pip.radioKPSS = !1),
            (Pip.radioAPPA = !1),
            (Pip.radioDIAM = !1),
            (Pip.radioVEGA = !1),
            clearInterval(h),
            rd.tuningInterval && clearInterval(rd.tuningInterval),
            (rd.tuningInterval = null),
            rd.rdsTimer && clearInterval(rd.rdsTimer),
            (rd.rdsTimer = null),
            Pip.removeListener('knob2', i),
            b && clearTimeout(b),
            g();
        };
      };
    } 
  } catch (err) {
    print('[initAdditionalRadiostations] Failed to patch radio tab:', err);
  }
})();
initAdditionalRadiostations();