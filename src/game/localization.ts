import { GameLanguage, GameSettings } from '../types/game';

const SETTINGS_STORAGE_KEY = 'prostophilya_settings_v2';

export const DEFAULT_SETTINGS: GameSettings = {
  language: 'ru',
  censorship: true,
  familyMode: false,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const familyMode = Boolean(parsed.familyMode);
    return {
      language: parsed.language === 'en' ? 'en' : 'ru',
      censorship: familyMode ? true : Boolean(parsed.censorship),
      familyMode,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota / private mode errors
  }
}

export interface LocalizedLine {
  display: string;
  speech: string;
  hasCensorBeep?: boolean;
}

/**
 * Standard chaser phrases (Коч коч братан, Танцуй пантера, ГОЛДА).
 */
export function getStandardChaserPhrases(settings: GameSettings): LocalizedLine[] {
  if (settings.language === 'en') {
    if (settings.familyMode) {
      return [
        { display: 'Koch koch, buddy!', speech: 'Koch koch, buddy!' },
        { display: 'Dance, panther!', speech: 'Dance, panther!' },
        { display: 'GOLDIE!', speech: 'Goldie!' },
      ];
    }
    return [
      { display: 'Koch koch, bro!', speech: 'Koch koch, bro!' },
      { display: 'Dance, panther!', speech: 'Dance, panther!' },
      { display: 'GOLD!', speech: 'Gold!' },
    ];
  }

  if (settings.familyMode) {
    return [
      { display: 'Коч коч, дружок!', speech: 'Коч коч, дружок!' },
      { display: 'Танцуй, пантера!', speech: 'Танцуй, пантера!' },
      { display: 'ГОЛДА!', speech: 'Голда!' },
    ];
  }

  return [
    { display: 'Коч коч братан', speech: 'Коч коч братан' },
    { display: 'Танцуй пантера', speech: 'Танцуй пантера' },
    { display: 'ГОЛДА', speech: 'Голда!' },
  ];
}

export function pickRandomChaserPhrase(settings: GameSettings): LocalizedLine {
  const list = getStandardChaserPhrases(settings);
  return list[Math.floor(Math.random() * list.length)];
}

export function getKrysaRetreatLine(settings: GameSettings): LocalizedLine {
  if (settings.language === 'en') {
    if (settings.familyMode) {
      return {
        display: 'Oh you sneaky buddy!',
        speech: 'Oh you sneaky buddy!',
      };
    }
    if (settings.censorship) {
      return {
        display: 'Oh you sneaky [***]!',
        speech: 'Oh you sneaky!',
        hasCensorBeep: true,
      };
    }
    return {
      display: 'Oh you rat!',
      speech: 'Oh you rat!',
    };
  }

  if (settings.familyMode) {
    return {
      display: 'Ля ты хитрый!',
      speech: 'Ля ты хитрый!',
    };
  }
  if (settings.censorship) {
    return {
      display: 'Ля ты [цензура]!',
      speech: 'Ля ты пип!',
      hasCensorBeep: true,
    };
  }
  return {
    display: 'Ля ты крыса!',
    speech: 'Ля ты крыса!',
  };
}

export function getCaughtScreamLine(settings: GameSettings): LocalizedLine {
  if (settings.language === 'en') {
    if (settings.familyMode) {
      return {
        display: 'TAG! I WANNA BE LIKE GAZAN!!!!!!',
        speech: 'Tag! I wanna be like Gazan!',
      };
    }
    return {
      display: 'I WANT TO BE LIKE GAZAN!!!!!!',
      speech: 'I want to be like Gazan!',
    };
  }

  if (settings.familyMode) {
    return {
      display: 'ОСАЛИЛ! Я ХОЧУ БЫТЬ КАК ГАЗАН!!!!!!',
      speech: 'Осалил! Я хочу быть как Газан!',
    };
  }
  return {
    display: 'Я ХОЧУ БЫТЬ КАК ГАЗАН!!!!!!',
    speech: 'Я хочу быть как Газан!',
  };
}

export type CutsceneLineKey =
  | 'intro_0'
  | 'intro_1'
  | 'intro_1_b'
  | 'intro_2'
  | 'intro_3'
  | 'outro_0'
  | 'act2_teaser'
  | 'act2_secret';

export function getCutsceneLine(
  key: CutsceneLineKey,
  settings: GameSettings
): LocalizedLine {
  const isEn = settings.language === 'en';
  const censored = settings.censorship || settings.familyMode;

  switch (key) {
    case 'intro_0':
      if (isEn) {
        return {
          display: 'Alright, I need Prostophilya mushrooms for Mivina noodles.',
          speech: 'Alright, I need Prostophilya mushrooms for Mivina noodles.',
        };
      }
      return {
        display: 'Так мне нужно грибы простофилы для мивины.',
        speech: 'Так мне нужно грибы простофилы для мивины.',
      };

    case 'intro_1':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'HeY buddy! Hand over those mushrooms right now, got it?!',
            speech: 'Hey buddy! Hand over those mushrooms right now, got it?',
          };
        }
        if (censored) {
          return {
            display: 'HeLLo [***]! We are coming for you, got it?!',
            speech: 'Hello, we are coming for you, got it?',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'HeLLo Eblan! We gonna get you in Ohco, got it?!',
          speech: 'Hello Eblan! We gonna get you in Ohco, got it?',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'ПриВеТ дружок! Отдавай грибочки для супа, понял?!',
          speech: 'Привет дружок! Отдавай грибочки для супа, понял?',
        };
      }
      if (censored) {
        return {
          display: 'ПрИвЕт [***]! мы тебе пройдем в [***] понял?!',
          speech: 'Привет! Мы тебя поймаем, понял?',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'ПрИвЕт Eblan! мы тебе пройдем в Ohco понял?!',
        speech: 'Привет еблан! Мы тебе пройдем в очко, понял?',
      };

    case 'intro_1_b':
      if (isEn) {
        return {
          display: 'Yeah, got it?!',
          speech: 'Yeah, got it?',
        };
      }
      return {
        display: 'Да-да, понял?!',
        speech: 'Да-да, понял?',
      };

    case 'intro_2':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'TAKE THIS FLASHLIGHT BEAM!!!!!!',
            speech: 'Take this flashlight beam!',
          };
        }
        if (censored) {
          return {
            display: 'TAKE THIS [***]!!!!!!',
            speech: 'Take this!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'TAKE THIS PEZDU!!!!!!',
          speech: 'Take this pezdu!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'ПОЛУЧИ ФОНАРИКОМ В ГЛАЗА!!!!!!',
          speech: 'Получи фонариком в глаза!',
        };
      }
      if (censored) {
        return {
          display: 'ПОЛУЧИ [ЦЕНЗУРА]!!!!!!',
          speech: 'Получи пип!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'ПОЛУЧИ PEZDU!!!!!!',
        speech: 'Получи пизду!',
      };

    case 'intro_3':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'OH NO WE WILL CATCH YOU LATER!!!!!!!!',
            speech: 'Oh no we will catch you later!',
          };
        }
        if (censored) {
          return {
            display: '[***] WE WILL GET YOU!!!!!!!!',
            speech: 'We will get you!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'CYKA MY TEBA MOGNEM!!!!!!!!',
          speech: 'Cyka my teba mognem!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'ОЙ-ОЙ МЫ ТЕБЯ ЕЩЁ ДОГОНИМ!!!!!!!!',
          speech: 'Ой-ой, мы тебя ещё догоним!',
        };
      }
      if (censored) {
        return {
          display: '[ЦЕНЗУРА] МЫ ТЕБЯ ДОГОНИМ!!!!!!!!',
          speech: 'Пип, мы тебя догоним!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'CYKA MY TEBA MOGNEM!!!!!!!!',
        speech: 'Сука, мы тебя могнём!',
      };

    case 'outro_0':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'GO AWAY WITH YOUR SILLY PRANKS, IM MAKING NOODLES!!!!!!!!',
            speech: 'Go away with your silly pranks, I am making noodles!',
          };
        }
        if (censored) {
          return {
            display: '[***] GO AWAY WITH YOUR PRANKSTERS!!!!!!!!!!!!',
            speech: 'Go away with your pranksters!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'HAXYU GO AWAY WITH YOUR PRANKSTERS!!!!!!!!!!!!',
          speech: 'Haxyu go away with your pranksters!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'УХОДИТЕ СО СВОИМИ ПРИКОЛЬДЕСАМИ, Я ВАРИТЬ МИВИНУ!!!!!!!!',
          speech: 'Уходите со своими прикольдесами, я варить мивину!',
        };
      }
      if (censored) {
        return {
          display: '[ЦЕНЗУРА] ИДИТЕ СО СВОЙМИ ПРИКОЛЬДЕСАМИ!!!!!!!!!!!!',
          speech: 'Пип, идите со своими прикольдесами!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'HAXYU ИДИТЕ СО СВОЙМИ ПРИКОЛЬДЕСАМИ!!!!!!!!!!!!',
        speech: 'Нахуй идите со своими прикольдесами!',
      };

    case 'act2_teaser':
      if (isEn) {
        return {
          display: 'Whoa... the factory doors are cracked open! To be continued in Act 2!',
          speech: 'Whoa, the factory doors are cracked open! To be continued in Act two!',
        };
      }
      return {
        display: 'Двери цеха слегка приоткрылись... Продолжение ждёт в Акте 2!',
        speech: 'Двери цеха слегка приоткрылись... Продолжение ждёт в Акте два!',
      };

    case 'act2_secret':
      if (isEn) {
        return {
          display: 'Mivina Corporation doors are slightly ajar... Beat Act 1 (1000m) to reach here!',
          speech: 'Mivina Corporation doors are slightly ajar. Beat Act one to reach here!',
        };
      }
      return {
        display: 'Двери завода «Мивина Корпорейшен» слегка приоткрыты... Пройди Акт 1 (1000м), чтобы добраться сюда!',
        speech: 'Двери завода Мивина Корпорейшен слегка приоткрыты. Пройди Акт один, чтобы добраться сюда!',
      };
  }
}

const MEME_WORD_PHONETICS: Array<[RegExp, string]> = [
  [/\beblan\b/gi, 'еблан'],
  [/\bohco\b/gi, 'очко'],
  [/\bpezdu\b/gi, 'пизду'],
  [/\bcyka\b/gi, 'сука'],
  [/\bmy\b/gi, 'мы'],
  [/\bteba\b/gi, 'тебя'],
  [/\bmognem\b/gi, 'могнём'],
  [/\bhaxyu\b/gi, 'нахуй'],
  [/\bnikitys6666\b/gi, 'никитус шесть шесть шесть'],
  [/\broner_?552\b/gi, 'ронер'],
  [/\bsasha55k_?xl\b/gi, 'саша'],
  [/\bprostophilya\b/gi, 'простофиля'],
  [/\bmivina\b/gi, 'мивина'],
  [/\bgazan\b/gi, 'газан'],
];

const EN_WORD_PHONETICS: Record<string, string> = {
  alright: 'олрайт',
  i: 'ай',
  am: 'эм',
  im: 'айм',
  need: 'нид',
  mushrooms: 'машрумс',
  mushroom: 'машрум',
  for: 'фор',
  noodles: 'нудлс',
  hey: 'хэй',
  hello: 'хэллоу',
  buddy: 'бади',
  bro: 'бро',
  hand: 'хэнд',
  over: 'оувер',
  those: 'зоуз',
  right: 'райт',
  now: 'нау',
  got: 'гот',
  it: 'ит',
  yeah: 'йеа',
  we: 'ви',
  are: 'ар',
  gonna: 'гона',
  coming: 'каминг',
  get: 'гет',
  you: 'ю',
  in: 'ин',
  take: 'тэйк',
  this: 'зис',
  flashlight: 'флэшлайт',
  beam: 'бим',
  oh: 'оу',
  no: 'ноу',
  will: 'вил',
  catch: 'кэтч',
  later: 'лэйтер',
  go: 'гоу',
  away: 'эвэй',
  with: 'виз',
  your: 'ёр',
  silly: 'сили',
  pranks: 'прэнкс',
  pranksters: 'прэнкстерс',
  making: 'мэйкинг',
  koch: 'коч',
  dance: 'дэнс',
  panther: 'пэнтер',
  gold: 'голд',
  goldie: 'голди',
  sneaky: 'сники',
  rat: 'рэт',
  tag: 'тэг',
  want: 'вонт',
  wanna: 'вона',
  to: 'ту',
  be: 'би',
  like: 'лайк',
  whoa: 'воу',
  the: 'зе',
  factory: 'фэктори',
  doors: 'дорс',
  slightly: 'слайтли',
  cracked: 'крэкт',
  ajar: 'аджар',
  open: 'оупен',
  continued: 'континьюд',
  act: 'экт',
  one: 'ван',
  two: 'ту',
  corporation: 'корпорэйшн',
  beat: 'бит',
  reach: 'рич',
  here: 'хир',
  soup: 'суп',
  okay: 'окей',
  share: 'шэйр',
};

function englishWordToRussianSyllables(word: string): string {
  const lower = word.toLowerCase();
  if (EN_WORD_PHONETICS[lower]) {
    return EN_WORD_PHONETICS[lower];
  }
  let w = lower;
  w = w
    .replace(/tion/g, 'шн')
    .replace(/sion/g, 'жн')
    .replace(/sh/g, 'ш')
    .replace(/ch/g, 'ч')
    .replace(/th/g, 'з')
    .replace(/ph/g, 'ф')
    .replace(/qu/g, 'кв')
    .replace(/ck/g, 'к')
    .replace(/oo/g, 'у')
    .replace(/ee/g, 'и')
    .replace(/ea/g, 'и')
    .replace(/ay/g, 'эй')
    .replace(/ey/g, 'эй')
    .replace(/oy/g, 'ой')
    .replace(/ow/g, 'ау')
    .replace(/ou/g, 'ау')
    .replace(/ng/g, 'нг')
    .replace(/zh/g, 'ж')
    .replace(/ts/g, 'ц')
    .replace(/ya/g, 'я')
    .replace(/yo/g, 'ё')
    .replace(/yu/g, 'ю');

  const charMap: Record<string, string> = {
    a: 'а',
    b: 'б',
    c: 'к',
    d: 'д',
    e: 'е',
    f: 'ф',
    g: 'г',
    h: 'х',
    i: 'и',
    j: 'дж',
    k: 'к',
    l: 'л',
    m: 'м',
    n: 'н',
    o: 'о',
    p: 'п',
    q: 'к',
    r: 'р',
    s: 'с',
    t: 'т',
    u: 'у',
    v: 'в',
    w: 'в',
    x: 'кс',
    y: 'и',
    z: 'з',
  };

  let out = '';
  for (const ch of w) {
    out += charMap[ch] ?? ch;
  }
  return out;
}

/**
 * Converts ALL English/Latin words (both meme translit like Eblan/Ohco/PEZDU/CYKA/HAXYU
 * and full English phrases when EN mode is enabled) into Russian phonetic Cyrillic
 * so ru-RU speechSynthesis reads every English phrase like Russian.
 */
export function transliterateEnglishToRussianPhonetics(text: string): string {
  let result = text.replace(/\[[^\]]+\]/g, 'пип');

  for (const [pattern, ru] of MEME_WORD_PHONETICS) {
    result = result.replace(pattern, ru);
  }

  result = result.replace(/[A-Za-z]+/g, (word) =>
    englishWordToRussianSyllables(word)
  );

  return result;
}

export function getUiText(lang: GameLanguage) {
  if (lang === 'en') {
    return {
      titleTop: 'NIGHT FOREST',
      titleBottom: 'PROSTOPHILYA',
      titleSubtitle: "The Adventures of Nikita · Mivina Mushroom Quest",
      muteLabel: 'Mute sound',
      unmuteLabel: 'Unmute sound',
      settingsBtn: 'Settings',
      modeStory: 'Story · Act 1',
      modeAct2Title: 'Act 2 · Soon!',
      modeAct2Sub: 'Secret: Entrance',
      modeAct2Tooltip: 'Secret: peek at Mivina Corporation factory entrance',
      modeFP: '1st Person',
      modeHardcore: 'Hardcore 3rd',
      endless: 'Endless',
      record: 'Best',
      descStory:
        'Act 1 (1000m): Cross the foggy 1000m road, grab 40 mushrooms, charge your flashlight and reach Mivina Corporation!',
      descFP:
        'Endless Mode (1st Person): Shine flashlight [F] at RONER_552 and sasha55k_XL and beat your best score!',
      descHardcore:
        'Endless Mode (Hardcore 3rd Person): Faster, angrier chasers — survive as long as you can!',
      playBtn: 'PLAY',
      controlsTitle:
        'WASD Move · Shift Sprint · Space Jump · F Flashlight · Mouse/Q,E Camera',
      controlsHud:
        'WASD Move · Shift Run · Space Jump · F/RMB Light · Mouse/Q,E Look · Esc Pause',
      hideControls: 'Hide controls',
      showControls: 'Controls',
      mushroomName: 'Prostophilya',
      badgeHardcore: 'HARDCORE 3RD · ENDLESS',
      badgeStory: 'ACT 1',
      badgeFP: '1ST PERSON · ENDLESS',
      factoryShort: 'Mivina Corp.:',
      panther: 'PANTHER!',
      stamina: 'Stamina',
      battery: 'Battery',
      dangerNearby: 'Chaser nearby:',
      pauseTitle: 'PAUSE',
      collectedLabel: 'Mushrooms collected:',
      resumeBtn: 'RESUME',
      restartBtn: 'RESTART',
      menuBtn: 'MAIN MENU',
      cutsceneAct1: 'STORY · ACT 1',
      cutsceneSecret: 'SECRET · ACT 2 PREVIEW — «MIVINA CORPORATION»',
      skipBtn: 'Skip',
      menuShort: 'Menu',
      secretHint: 'Press Esc / Space or «Main Menu» to return',
      skipHint: 'Press Space or click «Skip»',
      victoryTitle: 'ACT 1 COMPLETE!',
      victorySub: 'The mushrooms for Mivina are saved!',
      victorySaidPrefix: 'nikitys6666 escaped into «Mivina Corporation»:',
      act2CardTitle: 'ACT 2 — COMING SOON!!',
      act2CardSub: 'Mivina Corporation factory entrance is open...',
      act2SecretBtn: 'Secret: Show Act 2 Entrance',
      statMushrooms: 'Mushrooms',
      statTime: 'Time',
      statScared: 'Flashed',
      statBest: 'Best',
      replayAct1: 'Play Act 1 Again',
      hardcoreEndlessBtn: 'Hardcore 3rd Person (Endless)',
      fpEndlessBtn: '1st Person (Endless)',
      gameOverTitle: 'GAME OVER',
      modeLabel: 'Mode:',
      caughtFamilySuffix: 'tagged you and yelled:',
      caughtNormalSuffix: 'caught you and screamed:',
      playAgainBtn: 'PLAY AGAIN',
      restartHint: 'Press Enter or Space to play again',
      settingsTitle: 'SETTINGS',
      langLabel: 'Language',
      langRu: 'Русский (RU)',
      langEn: 'English (EN)',
      censorLabel: 'Censorship',
      censorDesc: 'Masks profanity with [***] and bleeps in voiceover',
      familyLabel: 'Family Mode',
      familyDesc: 'Friendly memes & clean dialogue (auto-enables censorship)',
      closeSettings: 'Done',
      touchLight: 'LIGHT',
      touchSprint: 'SPRINT',
      touchJump: 'JUMP',
    };
  }

  return {
    titleTop: 'НОЧНОЙ ЛЕС',
    titleBottom: 'ПРОСТОФИЛЯ',
    titleSubtitle: 'Похождения Никиты · За грибами для мивины',
    muteLabel: 'Выключить звук',
    unmuteLabel: 'Включить звук',
    settingsBtn: 'Настройки',
    modeStory: 'История · Акт 1',
    modeAct2Title: 'Акт 2 · Скоро!',
    modeAct2Sub: 'Секрет: Вход',
    modeAct2Tooltip: 'Секрет: посмотреть вход на завод «Мивина Корпорейшен»',
    modeFP: '1-е лицо',
    modeHardcore: 'Хардкор 3-е',
    endless: 'Бесконечный',
    record: 'Рекорд',
    descStory:
      'Акт 1 (1000м): Пройди длинную туманную дорогу, собери 40 грибов, заряжай фонарик и добеги до завода «Мивина Корпорейшен»!',
    descFP:
      'Бесконечный режим (1-е лицо): свети фонариком [F] на RONER_552 и sasha55k_XL и ставь рекорд!',
    descHardcore:
      'Бесконечный режим (Хардкор 3-е лицо): враги быстрее и злее, продержись как можно дольше!',
    playBtn: 'ИГРАТЬ',
    controlsTitle:
      'WASD Идти · Shift Рывок · Space Прыжок · F Фонарик · Мышь/Q,E Камера',
    controlsHud:
      'WASD Идти · Shift Бег · Space Прыжок · F/ПКМ Фонарик · Мышь/Q,E Камера · Esc Пауза',
    hideControls: 'Скрыть управление',
    showControls: 'Управление',
    mushroomName: 'Простофиля',
    badgeHardcore: 'ХАРДКОР 3-Е · БЕСК.',
    badgeStory: 'АКТ 1',
    badgeFP: '1-Е ЛИЦО · БЕСК.',
    factoryShort: 'Мивина Корп.:',
    panther: 'ПАНТЕРА!',
    stamina: 'Выносливость',
    battery: 'Батарея',
    dangerNearby: 'Погоня рядом:',
    pauseTitle: 'ПАУЗА',
    collectedLabel: 'Грибов собрано:',
    resumeBtn: 'ПРОДОЛЖИТЬ',
    restartBtn: 'ЗАНОВО',
    menuBtn: 'НА ГЛАВНЫЙ ЭКРАН',
    cutsceneAct1: 'ИСТОРИЯ · АКТ 1',
    cutsceneSecret: 'СЕКРЕТ · НАЧАЛО АКТА 2 — «МИВИНА КОРПОРЕЙШЕН»',
    skipBtn: 'Пропустить',
    menuShort: 'Меню',
    secretHint: 'Нажми Esc / Space или «На главный экран», чтобы вернуться',
    skipHint: 'Нажми Space или кнопку «Пропустить»',
    victoryTitle: 'АКТ 1 ПРОЙДЕН!',
    victorySub: 'Грибы для мивины спасены!',
    victorySaidPrefix: 'nikitys6666 убежал в «Мивина Корпорейшен»:',
    act2CardTitle: 'АКТ 2 — СКОРО БУДЕТ!!',
    act2CardSub: 'Вход на завод «Мивина Корпорейшен» уже открыт...',
    act2SecretBtn: 'Секрет: Показать вход Акта 2',
    statMushrooms: 'Грибы',
    statTime: 'Время',
    statScared: 'Отпугнул',
    statBest: 'Рекорд',
    replayAct1: 'Пройти Акт 1 ещё раз',
    hardcoreEndlessBtn: 'Хардкор 3-е лицо (Бесконечный)',
    fpEndlessBtn: '1-е лицо (Бесконечный)',
    gameOverTitle: 'ГЕЙМ ОВЕР',
    modeLabel: 'Режим:',
    caughtFamilySuffix: 'осалил тебя и закричал:',
    caughtNormalSuffix: 'догнал тебя и закричал:',
    playAgainBtn: 'ИГРАТЬ СНОВА',
    restartHint: 'Нажми Enter или Space чтобы начать заново',
    settingsTitle: 'НАСТРОЙКИ',
    langLabel: 'Язык',
    langRu: 'Русский (RU)',
    langEn: 'English (EN)',
    censorLabel: 'Цензура',
    censorDesc: 'Скрывает мат под [***] и запикивает в озвучке',
    familyLabel: 'Семейный режим',
    familyDesc: 'Добрые шутки и чистые реплики (включает цензуру)',
    closeSettings: 'Готово',
    touchLight: 'ФОНАРЬ',
    touchSprint: 'РЫВОК',
    touchJump: 'ПРЫЖОК',
  };
}
