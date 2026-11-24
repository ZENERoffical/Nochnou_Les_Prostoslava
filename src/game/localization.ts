import { AchievementId, GameLanguage, GameSettings } from '../types/game';

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
  | 'act2_secret'
  | 'act2_intro_0'
  | 'act2_intro_1'
  | 'act2_intro_2a'
  | 'act2_intro_2b'
  | 'act2_intro_2c'
  | 'act2_door_0'
  | 'act2_door_1'
  | 'act2_final_0'
  | 'act2_outro_0'
  | 'act3_secret'
  | 'act3_intro_0'
  | 'act3_outro_0'
  | 'act3_outro_1'
  | 'act3_outro_2';

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

    case 'act3_secret':
      if (isEn) {
        return {
          display: 'Whoa... so that is the city of «Malinka»! Act 3 awaits beyond these gates!',
          speech: 'Whoa, so that is the city of Malinka! Act three awaits beyond these gates!',
        };
      }
      return {
        display: 'Ого... так вот он какой, вход в город «Малинка»! Продолжение ждёт в Акте 3!',
        speech: 'Ого, так вот он какой, вход в город Малинка! Продолжение ждёт в Акте три!',
      };

    case 'act2_intro_0':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'Phew, I outran those crazy pranksters!',
            speech: 'Phew, I outran those crazy pranksters!',
          };
        }
        if (censored) {
          return {
            display: 'Phew, I escaped from those [***]!',
            speech: 'Phew, I escaped from those!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'Phew, I escaped from those Ebanatov!',
          speech: 'Phew, I escaped from those Ebanatov!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Фух, я убежал от этих озорников!',
          speech: 'Фух, я убежал от этих озорников!',
        };
      }
      if (censored) {
        return {
          display: 'Фух я убежал от етих [***]',
          speech: 'Фух, я убежал от этих пип!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'Фух я убежал от етих Ebanatov',
        speech: 'Фух, я убежал от этих ебанатов!',
      };

    case 'act2_intro_1':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'OH AWESOME!! FINALLY I CAN MAKE MY MIVINA!!!!!!',
            speech: 'Oh awesome! Finally I can make my Mivina!',
          };
        }
        if (censored) {
          return {
            display: 'OH [***]!! FINALLY MAKING MIVINA!!!!!!',
            speech: 'Oh! Finally making Mivina!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'OH NIXYA!! FINALLY MAKING MIVINA!!!!!!',
          speech: 'Oh nixya! Finally making Mivina!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'ОГО ВОТ ЭТО ДА, НАКОНЕЦ-ТО СОБЕРУ МИВИНУ!!!!!!',
          speech: 'Ого вот это да, наконец-то соберу мивину!',
        };
      }
      if (censored) {
        return {
          display: 'ОХ [ЦЕНЗУРА] НАКОНЕЦТО СОБЕРУ МИВИНУ!!!!!!',
          speech: 'Ох пип, наконец-то соберу мивину!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'ОХ NIXYA НАКОНЕЦТО СОБЕРУ МИВИНУ!!!!!!',
        speech: 'Ох нихуя, наконец-то соберу мивину!',
      };

    case 'act2_intro_2a':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'Hey!! Did you lose your mind?!',
            speech: 'Hey! Did you lose your mind?',
          };
        }
        if (censored) {
          return {
            display: 'Are you completely [***]?!',
            speech: 'Are you completely!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'You totally Axyel?!',
          speech: 'You totally axyel?',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Ты что совсем обалдел?!',
          speech: 'Ты что совсем обалдел?',
        };
      }
      if (censored) {
        return {
          display: 'Ты чо савсем [***]?!',
          speech: 'Ты чо совсем пип?',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'Ты чо савсем Axyel?!',
        speech: 'Ты чо совсем ахуел?',
      };

    case 'act2_intro_2b':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'Shining that bright beam right in my eyes!',
            speech: 'Shining that bright beam right in my eyes!',
          };
        }
        if (censored) {
          return {
            display: 'Shining in my eyes, [***]!',
            speech: 'Shining in my eyes!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'Shining in my eyes, Blyat!',
          speech: 'Shining in my eyes, blyat!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'В глаза светить вздумал, а?!',
          speech: 'В глаза светить вздумал, а?',
        };
      }
      if (censored) {
        return {
          display: 'В глаза светить [***]',
          speech: 'В глаза светить пип!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'В глаза светить Blyat',
        speech: 'В глаза светить блять!',
      };

    case 'act2_intro_2c':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'That is it, you are in big trouble now!!',
            speech: 'That is it, you are in big trouble now!',
          };
        }
        if (censored) {
          return {
            display: 'Alright that is it, [***] [***]!',
            speech: 'Alright that is it!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'Alright you are done, Pizda Pidor Konchenu!',
          speech: 'Alright you are done, Pizda Pidor Konchenu!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Ну всё, держись, мы ещё до тебя доберёмся!',
          speech: 'Ну всё, держись, мы ещё до тебя доберёмся!',
        };
      }
      if (censored) {
        return {
          display: 'Ну все тебе [ЦЕНЗУРА]!',
          speech: 'Ну всё тебе пип!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'Ну все тебе Pizda Pidor Konchenu',
        speech: 'Ну всё тебе пизда пидор конченый!',
      };

    case 'act2_door_0':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'Wait, what do you mean there is ANOTHER door?!',
            speech: 'Wait, what do you mean there is another door?',
          };
        }
        return {
          display: 'Wait... why is there ANOTHER door?!',
          speech: 'Wait, why is there another door?',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Ой, в смысле, ещё одна дверь?!',
          speech: 'Ой, в смысле, ещё одна дверь?',
        };
      }
      return {
        display: 'е всмысле ищо одна дверь',
        speech: 'Э, в смысле, ещё одна дверь?',
      };

    case 'act2_door_1':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'Whoa... what is this super long hallway?!',
            speech: 'Whoa, what is this super long hallway?',
          };
        }
        if (censored) {
          return {
            display: '[***]... what the heck is this?!',
            speech: 'What the heck is this?',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'Pizdet... what is this xyuna?!',
          speech: 'Pizdet, what is this xyuna?',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'ОГО... это что за длиннющий коридор?!',
          speech: 'Ого, это что за длиннющий коридор?',
        };
      }
      if (censored) {
        return {
          display: '[ЦЕНЗУРА]... ето чо за [***]?!',
          speech: 'Пип, это чо за пип?',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'Pizdet... ето чо за xyuna?!',
        speech: 'Пиздец... это чо за хуйня?!',
      };

    case 'act2_final_0':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'Alright, game over for them >:)',
            speech: 'Alright, game over for them!',
          };
        }
        if (censored) {
          return {
            display: 'Now they are totally [***] >:)',
            speech: 'Now they are totally finished!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'Now it is Pizda for them >:)',
          speech: 'Now it is Pizda for them!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Ну всё, держитесь, проказники >:)',
          speech: 'Ну всё, держитесь, проказники!',
        };
      }
      if (censored) {
        return {
          display: 'ну все им [ЦЕНЗУРА] >:)',
          speech: 'Ну всё им пип!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'ну все им Pizda >:)',
        speech: 'Ну всё, им пизда!',
      };

    case 'act2_outro_0':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: '360 SNIPER TAG!! EXIT LOL, SEE YA LATER!',
            speech: 'Three sixty sniper tag! Exit lol, see you later!',
          };
        }
        return {
          display: '360 HEADSHOT!! EXIT LOL, BYE LOSERS!',
          speech: 'Three sixty headshot! Exit lol, bye losers!',
        };
      }
      if (settings.familyMode) {
        return {
          display: '360 СНАЙПЕР-САЛКИ!! ВЫХОД ЛОЛ, ДО ВСТРЕЧИ!',
          speech: 'Триста шестьдесят снайпер салки! Выход лол, до встречи!',
        };
      }
      return {
        display: '360 ХЕДШОТ!! ВЫХОД ЛОЛ, ПОКА ПРИКОЛЬДЕСЫ!',
        speech: 'Триста шестьдесят хедшот! Выход лол, пока прикольдесы!',
      };

    case 'act3_intro_0':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'Yikes, I am in trouble if I do not sprint away from here!',
            speech: 'Yikes, I am in trouble if I do not sprint away from here!',
          };
        }
        if (censored) {
          return {
            display: '[***] I am in [***] if I do not [***] out of here!',
            speech: 'I am in trouble if I do not run out of here!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'Cyka I am Pizda if I do not sebysi out of here!',
          speech: 'Cyka I am Pizda if I do not sebysi out of here!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Ой-ой, мне конец, если я срочно не сбегу отсюда!',
          speech: 'Ой-ой, мне конец, если я срочно не сбегу отсюда!',
        };
      }
      if (censored) {
        return {
          display: '[ЦЕНЗУРА] мне [***] если я не [***] от сюда',
          speech: 'Пип, мне пип, если я не свалю отсюда!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'Cyka мне Pizda если я не sebysi от сюда',
        speech: 'Сука, мне пизда, если я не съебусь отсюда!',
      };

    case 'act3_outro_0':
      if (isEn) {
        return {
          display: 'Lord have mercy, I barely survived!',
          speech: 'Lord have mercy, I barely survived!',
        };
      }
      return {
        display: 'Господи помилуй ели выжыл',
        speech: 'Господи помилуй, еле выжил!',
      };

    case 'act3_outro_1':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'You cheater, sneaky sharpshooter!!!!!!',
            speech: 'You cheater, sneaky sharpshooter!',
          };
        }
        if (censored) {
          return {
            display: 'You cheater, [***] aimer!!!!!!',
            speech: 'You cheater, aimer!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'You cheater, friggin aimer!!!!!!',
          speech: 'You cheater, friggin aimer!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Ты читер, хитрый снайпер!!!!!!',
          speech: 'Ты читер, хитрый снайпер!',
        };
      }
      if (censored) {
        return {
          display: 'Ты читер,[***] аймер!!!!!!',
          speech: 'Ты читер, пип аймер!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'Ты читер,сраний аймер!!!!!!',
        speech: 'Ты читер, сраный аймер!',
      };

    case 'act3_outro_2':
      if (isEn) {
        return {
          display: 'that is where we need to go...',
          speech: 'that is where we need to go...',
        };
      }
      return {
        display: 'туда нам надо...',
        speech: 'туда нам надо...',
      };
  }
}

const MEME_WORD_PHONETICS: Array<[RegExp, string]> = [
  [/\beblan\b/gi, 'еблан'],
  [/\bebanatov\b/gi, 'ебанатов'],
  [/\bohco\b/gi, 'очко'],
  [/\bpezdu\b/gi, 'пизду'],
  [/\bcyka\b/gi, 'сука'],
  [/\bmy\b/gi, 'мы'],
  [/\bteba\b/gi, 'тебя'],
  [/\bmognem\b/gi, 'могнём'],
  [/\bhaxyu\b/gi, 'нахуй'],
  [/\bnixya\b/gi, 'нихуя'],
  [/\baxyel\b/gi, 'ахуел'],
  [/\bblyat\b/gi, 'блять'],
  [/\bpizda\b/gi, 'пизда'],
  [/\bpizdet\b/gi, 'пиздец'],
  [/\bxyuna\b/gi, 'хуйня'],
  [/\bsebysi\b/gi, 'съебусь'],
  [/\bpidor\b/gi, 'пидор'],
  [/\bkonchenu\b/gi, 'конченый'],
  [/\bnikitys6666\b/gi, 'никитус шесть шесть шесть'],
  [/\broner_?552\b/gi, 'ронер'],
  [/\bsasha55k_?xl\b/gi, 'саша'],
  [/\bprostophilya\b/gi, 'простофиля'],
  [/\bmivina\b/gi, 'мивина'],
  [/\bmalinka\b/gi, 'малинка'],
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
  conveyor: 'конвейер',
  seasoning: 'сизонинг',
  season: 'сизон',
  packet: 'пэкет',
  packets: 'пэкетс',
  box: 'бокс',
  boxes: 'боксис',
  pack: 'пэк',
  packed: 'пэкт',
  press: 'пресс',
  twenty: 'твенти',
  forty: 'форти',
  turn: 'тёрн',
  into: 'инту',
  grab: 'грэб',
  drop: 'дроп',
  onto: 'онту',
  seal: 'сил',
  made: 'мэйд',
  time: 'тайм',
  fire: 'файр',
  up: 'ап',
  find: 'файнд',
  them: 'зем',
  all: 'ол',
  awesome: 'осом',
  ready: 'рэди',
  best: 'бест',
  ever: 'эвер',
  delicious: 'делишес',
  let: 'лет',
  stay: 'стэй',
  hungry: 'хангри',
  outside: 'аутсайд',
  mivinas: 'мивинас',
  into2: 'инту',
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

export function getAchievementText(
  id: AchievementId,
  lang: GameLanguage
): { title: string; desc: string } {
  const isEn = lang === 'en';
  switch (id) {
    case 'act1_clear':
      return isEn
        ? { title: 'What idiots...', desc: 'Complete Act 1' }
        : { title: 'Дебилы какието...', desc: 'Пройти Акт 1' };
    case 'act2_clear':
      return isEn
        ? { title: 'Mivina is mine now!', desc: 'Complete Act 2' }
        : { title: 'Мивина теперь моя!', desc: 'Пройти Акт 2' };
    case 'act3_malinka':
      return isEn
        ? { title: 'Raspberry Clouds', desc: 'Complete Act 3' }
        : { title: 'Малиновие облока', desc: 'Пройти Акт 3' };
    case 'fnaf_50':
      return isEn
        ? { title: '5 out of 20', desc: 'Pack 50 Mivinas in minigame «FNAF Epta»' }
        : { title: '5 на 20', desc: 'Собрать 50 мивин в мини-игре «Фнаф Епта»' };
    case 'fnaf_100':
      return isEn
        ? { title: 'King of Mivina', desc: 'Pack 100 Mivinas in minigame «FNAF Epta»' }
        : { title: 'Король мивин', desc: 'Собрать 100 мивин в мини-игре «Фнаф Епта»' };
    case 'mush_50':
      return isEn
        ? { title: 'Forester', desc: 'Collect 50 mushrooms' }
        : { title: 'Лесник', desc: 'Собрать 50 грибов' };
    case 'mush_100':
      return isEn
        ? { title: 'Shroom-crazed', desc: 'Collect 100 mushrooms' }
        : { title: 'Грибонутий', desc: 'Собрать 100 грибов' };
    case 'mush_200':
      return isEn
        ? { title: 'Mushroom King', desc: 'Collect 200 mushrooms' }
        : { title: 'Король Грибов', desc: 'Собрать 200 грибов' };
    case 'sniper_100':
      return isEn
        ? { title: "Mom's Sniper", desc: 'Kill 100 clones in «The Sniper Is Mine!»' }
        : { title: 'Мамкин Снайпер', desc: 'Убить 100 клонов в мини-игре «Снайперка теперь моя!»' };
    case 'secret_malinka':
      return isEn
        ? { title: 'Jacque Fresco Secret', desc: 'Peek at the entrance to city «Malinka»' }
        : { title: 'Секретик от жако фреско', desc: 'Посмотреть на город Малинка' };
  }
}

export function getUiText(lang: GameLanguage) {
  if (lang === 'en') {
    return {
      titleTop: 'NIGHT FOREST',
      titleBottom: 'PROSTOPHILYA',
      titleSubtitle: 'The Adventures of Nikita: Off to the Mivina Factory',
      muteLabel: 'Mute sound',
      unmuteLabel: 'Unmute sound',
      settingsBtn: 'Settings',
      achievementsBtn: 'Achievements',
      achievementsTitle: 'ACHIEVEMENTS',
      achievementUnlockedLabel: 'ACHIEVEMENT UNLOCKED!',
      achievementsProgressHint: 'Track your milestones across Story & Minigames',
      unlockedLabel: 'Unlocked',
      lockedLabel: 'Locked',
      tabStory: 'Story',
      tabMinigames: 'Minigames',
      modeStory: 'Story · Act 1',
      modeStory2: 'Story · Act 2',
      modeStory3: 'Story · Act 3',
      modeAct2Title: 'Act 2 · Factory',
      modeAct2Sub: '20 Mivinas + Corridor',
      modeAct3Sub: '30 Nights · Malinka Park',
      modeAct2Tooltip: 'Secret: peek at Mivina Corporation factory entrance',
      act2SecretLink: 'Secret: Act 2 Entrance',
      act3SecretLink: 'Secret: Act 3 (Malinka)',
      modeFnafTitle: 'FNAF Epta',
      modeFnafSub: 'Endless Act 2',
      modeSniperTitle: 'Sniper Is Mine!',
      modeSniperSub: 'Endless Clones',
      modeFP: '1st Person',
      modeHardcore: 'Hardcore 3rd',
      endless: 'Endless',
      record: 'Best',
      descStory:
        'Act 1 (1000m): Cross the foggy 1000m road, grab 40 mushrooms, charge your flashlight and reach Mivina Corporation!',
      descStory2:
        'Act 2 (Factory): Pack 20 Mivinas for the Key, unlock the padlocked door, survive the long corridor hiding in closets [E] from Sasha, and grab the sniper at «Exit LOL»!',
      descStory3:
        'Act 3 (Malinka Central Park): 1m Day / 1m Night · 30 Nights! Keep campfire lit [E], scare night RONERs [F], crush metal [E] up to Lv.4–6 Bed (skips 1/2/3 days, 1-night CD) & beat Night 30!',
      descFnaf:
        'FNAF Epta (Endless Act 2): Craft & pack batches of 20 Mivinas infinitely while hiding from blindfolded Sasha [E] and flashing RONER at windows [F]!',
      descSniper:
        'The Sniper Is Mine! (Endless Shooter): Blast waves of Sasha and RONER clones [LMB / E] with your sniper rifle and rack up 100 kills!',
      descFP:
        'Endless Mode (1st Person): Shine flashlight [F] at RONER_552 and sasha55k_XL and beat your best score!',
      descHardcore:
        'Endless Mode (Hardcore 3rd Person): Faster, angrier chasers — survive as long as you can!',
      playBtn: 'PLAY',
      controlsTitle:
        'WASD Move · Shift Sprint · Space Jump · F Flashlight · E/LMB Interact / Fire',
      controlsHud:
        'WASD Move · Shift Run · Space Jump · F/RMB Light · Mouse Look · Esc Pause',
      controlsHudAct2:
        'WASD Move · E/LMB Box / Season / Closet / Pack / Door · F Flash Window · Esc Pause',
      controlsHudAct3:
        'WASD Move · Shift Run · E/LMB Log / Metal / Fire / Crusher / Sniper (Night 30) · F Light · Esc Pause',
      controlsHudSniper:
        'WASD Move · Shift Run · Space Jump · LMB / E Sniper Fire · Mouse Aim · Esc Pause',
      hideControls: 'Hide controls',
      showControls: 'Controls',
      mushroomName: 'Prostophilya',
      badgeHardcore: 'HARDCORE 3RD · ENDLESS',
      badgeStory: 'ACT 1',
      badgeStory2: 'ACT 2 · FACTORY',
      badgeFP: '1ST PERSON · ENDLESS',
      fnafBadge: 'FNAF EPTA · ENDLESS',
      fnafTotalLabel: 'Total Mivinas',
      fnafBatchLabel: 'Batch',
      fnafStageLoop: 'Endless loop: season 20 noodles, pack them at the press & survive!',
      sniperBadge: 'THE SNIPER IS MINE!',
      sniperClonesLabel: 'Clones Killed',
      sniperWaveLabel: 'Wave',
      sniperHpLabel: 'Armor',
      sniperShootPrompt: 'FIRE [LMB / E]',
      sniperTouchFire: 'FIRE',
      factoryShort: 'Mivina Corp.:',
      panther: 'PANTHER!',
      stamina: 'Stamina',
      battery: 'Battery',
      dangerNearby: 'Chaser nearby:',
      act2Badge: 'ACT 2 · MIVINA CORP.',
      act2SeasonedLabel: 'Seasoned',
      act2PackedLabel: 'Packed',
      act2PacketsLabel: 'Packets',
      act2MushroomsStock: 'Mushrooms',
      act2KeyBadge: 'CORRIDOR KEY',
      act2StageConveyor: 'Stage 1: Season 20 noodles on conveyor',
      act2StagePackaging: 'Stage 2: Pack 20 Mivinas at the Press to earn the Key!',
      act2StageCorridorKey: 'Stage 3: Key earned! Unlock the North Wing door',
      act2StageCorridor: 'Stage 4: Walk the long corridor, hide in closets [E], find «Exit LOL»!',
      act2CorridorProgressLabel: 'Exit LOL',
      act2TouchInteract: 'ACT (E)',
      act2HidingBadge: 'HIDING IN CLOSET · [E / CLICK] EXIT',
      act2FlickerWarning: 'LIGHTS FLICKERING! Blindfolded Sasha is coming — HIDE IN A CLOSET [E]!',
      act2AlarmWarning: 'ALARM! RONER is breaking a window — SHINE FLASHLIGHT [F] ON HIM!',
      act2WindowBreachLabel: 'Window breach',
      pauseTitle: 'PAUSE',
      collectedLabel: 'Mushrooms collected:',
      resumeBtn: 'RESUME',
      restartBtn: 'RESTART',
      menuBtn: 'MAIN MENU',
      cutsceneAct1: 'STORY · ACT 1',
      cutsceneAct2: 'THE ADVENTURES OF NIKITA · OFF TO THE MIVINA FACTORY',
      cutsceneAct3: 'ACT 3 · 30 NIGHTS IN MALINKA PARK',
      cutsceneSecret: 'SECRET · ACT 2 PREVIEW — «MIVINA CORPORATION»',
      cutsceneAct3Secret: 'SECRET · ACT 3 PREVIEW — CITY «MALINKA» ENTRANCE',
      skipBtn: 'Skip',
      menuShort: 'Menu',
      secretHint: 'Press Esc / Space or «Main Menu» to return',
      skipHint: 'Press Space or click «Skip»',
      victoryTitle: 'ACT 1 COMPLETE!',
      victorySub: 'The mushrooms for Mivina are saved!',
      victorySaidPrefix: 'nikitys6666 escaped into «Mivina Corporation»:',
      act2CardTitle: 'ACT 2 — MIVINA FACTORY READY!',
      act2CardSub: 'Turn your mushrooms into 20 packed Mivinas on the factory floor!',
      act2EnterBtn: 'CONTINUE TO ACT 2: FACTORY',
      act3CardTitle: 'ACT 3 — MALINKA PARK SURVIVAL!',
      act3CardSub: 'Survive 30 nights against 2× Giant Sasha, fortify your camp & fight Night 30!',
      act3EnterBtn: 'CONTINUE TO ACT 3: MALINKA PARK',
      act2SecretBtn: 'Secret: Show Factory Entrance',
      act2VictoryTitle: 'ACT 2 COMPLETE!',
      act2VictorySub: '20 Mushroom Mivinas crafted and packed!',
      act2VictorySaid: 'nikitys6666 sealed the export crate:',
      act3VictoryTitle: 'ACT 3 COMPLETE!',
      act3VictorySub: '30 Nights in Malinka Park survived! The RONER army is destroyed!',
      act3VictorySaid: 'nikitys6666 heads toward «JoJo» Village:',
      replayAct2: 'Play Act 2 Again',
      replayAct3: 'Play Act 3 Again',
      act3Badge: 'ACT 3 · MALINKA PARK',
      act3NightLabel: 'Night',
      act3DayWord: 'DAY',
      act3NightWord: 'NIGHT',
      act3FireLabel: 'Campfire',
      act3LogsLabel: 'Logs',
      act3MetalLabel: 'Metal',
      act3BaseLevelLabel: 'Base Lv.',
      act3MaxedLabel: 'MAX FORT',
      act3BedReadyLabel: 'Bed: Ready',
      act3BedCooldownLabel: 'Bed: 1 night CD',
      act3BossLabel: 'BOSS GIANT SASHA',
      act3RonerWaveLabel: 'RONER Wave',
      act3Night30Objective: 'NIGHT 30 FINALE! Grabbed Sniper — defeat Boss Sasha & the RONER army [LMB / E]!',
      statNights: 'Nights',
      statBaseLv: 'Base Lv.',
      statMushrooms: 'Mushrooms',
      statMivinas: 'Mivinas',
      statClones: 'Clones',
      statTime: 'Time',
      statScared: 'Flashed',
      statBest: 'Best',
      statBoxes: 'Boxes',
      statPacked: 'Packed',
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
    titleSubtitle: 'Похождения Никиты: За мивиной на завод',
    muteLabel: 'Выключить звук',
    unmuteLabel: 'Включить звук',
    settingsBtn: 'Настройки',
    achievementsBtn: 'Достижения',
    achievementsTitle: 'ДОСТИЖЕНИЯ',
    achievementUnlockedLabel: 'ДОСТИЖЕНИЕ ОТКРЫТО!',
    achievementsProgressHint: 'Выполняй задания в сюжете, секретах и мини-играх',
    unlockedLabel: 'Открыто',
    lockedLabel: 'Закрыто',
    tabStory: 'История',
    tabMinigames: 'Мини-игры',
    modeStory: 'История · Акт 1',
    modeStory2: 'История · Акт 2',
    modeStory3: 'История · Акт 3',
    modeAct2Title: 'Акт 2 · Завод',
    modeAct2Sub: '20 мивин + Коридор',
    modeAct3Sub: '30 ночей · Парк Малинка',
    modeAct2Tooltip: 'Секрет: посмотреть вход на завод «Мивина Корпорейшен»',
    act2SecretLink: 'Секрет: Вход Акт 2',
    act3SecretLink: 'Секрет: Акт 3 (Малинка)',
    modeFnafTitle: 'Фнаф Епта',
    modeFnafSub: 'Бесконечный Акт 2',
    modeSniperTitle: 'Снайперка теперь моя!',
    modeSniperSub: 'Клоны Сани и RONER',
    modeFP: '1-е лицо',
    modeHardcore: 'Хардкор 3-е',
    endless: 'Бесконечный',
    record: 'Рекорд',
    descStory:
      'Акт 1 (1000м): Пройди длинную туманную дорогу, собери 40 грибов, заряжай фонарик и добеги до завода «Мивина Корпорейшен»!',
    descStory2:
      'Акт 2 (Завод): Упакуй 20 мивин и получи ключ, открой дверь с замком, пройди длинный коридор прячась в шкаф [E] от Сани и найди «Выход лол»!',
    descStory3:
      'Акт 3 (Парк «Малинка»): День 1 мин / Ночь 1 мин · 30 ночей! Поддерживай костёр [E], отгоняй фонариком [F] ночных RONER, качай базу металлом до 4–6 ур. (Кровать: скип 1/2/3 дня, КД 1 ночь) и бей босса на 30-ю ночь!',
    descFnaf:
      'Фнаф Епта (Бесконечный Акт 2): Делай партии по 20 мивин бесконечно, прячься в шкаф [E] когда мигает свет и отгоняй фонариком [F] RONER от окон!',
    descSniper:
      'Снайперка теперь моя! (Бесконечный режим): Отстреливай волны клонов Сани и RONER из снайперской винтовки [ЛКМ / E]!',
    descFP:
      'Бесконечный режим (1-е лицо): свети фонариком [F] на RONER_552 и sasha55k_XL и ставь рекорд!',
    descHardcore:
      'Бесконечный режим (Хардкор 3-е лицо): враги быстрее и злее, продержись как можно дольше!',
    playBtn: 'ИГРАТЬ',
    controlsTitle:
      'WASD Идти · Shift Рывок · Space Прыжок · F Фонарик · E/ЛКМ Действие / Выстрел',
    controlsHud:
      'WASD Идти · Shift Бег · Space Прыжок · F/ПКМ Фонарик · Мышь/Q,E Камера · Esc Пауза',
    controlsHudAct2:
      'WASD Идти · E/ЛКМ Коробка / Шкаф / Лапша / Пресс / Дверь · F Светить в окно · Esc Пауза',
    controlsHudAct3:
      'WASD Идти · Shift Бег · E/ЛКМ Бревно / Металл / Костер / Дробилка / Снайперка (30 ночь) · F Фонарик · Esc Пауза',
    controlsHudSniper:
      'WASD Идти · Shift Бег · Space Прыжок · ЛКМ / E Выстрел со снайперки · Мышь Прицел · Esc Пауза',
    hideControls: 'Скрыть управление',
    showControls: 'Управление',
    mushroomName: 'Простофиля',
    badgeHardcore: 'ХАРДКОР 3-Е · БЕСК.',
    badgeStory: 'АКТ 1',
    badgeStory2: 'АКТ 2 · ЗАВОД',
    badgeFP: '1-Е ЛИЦО · БЕСК.',
    fnafBadge: 'ФНАФ ЕПТА · БЕСК.',
    fnafTotalLabel: 'Всего мивин',
    fnafBatchLabel: 'Партия',
    fnafStageLoop: 'Бесконечный завод: делай партии по 20 мивин и выживай!',
    sniperBadge: 'СНАЙПЕРКА ТЕПЕРЬ МОЯ!',
    sniperClonesLabel: 'Клонов убито',
    sniperWaveLabel: 'Волна',
    sniperHpLabel: 'Броня',
    sniperShootPrompt: 'ОГОНЬ [ЛКМ / E]',
    sniperTouchFire: 'ВЫСТРЕЛ',
    factoryShort: 'Мивина Корп.:',
    panther: 'ПАНТЕРА!',
    stamina: 'Выносливость',
    battery: 'Батарея',
    dangerNearby: 'Погоня рядом:',
    act2Badge: 'АКТ 2 · МИВИНА КОРП.',
    act2SeasonedLabel: 'С приправой',
    act2PackedLabel: 'Упаковано',
    act2PacketsLabel: 'Пакетики',
    act2MushroomsStock: 'Грибы',
    act2KeyBadge: 'КЛЮЧ ОТ ДВЕРИ',
    act2StageConveyor: 'Этап 1: Разложи приправу на 20 кубиков лапши',
    act2StagePackaging: 'Этап 2: Иди к прессу и упакуй 20 мивин!',
    act2StageCorridorKey: 'Этап 3: Ключ получен! Открой дверь с замком в северном цехе',
    act2StageCorridor: 'Этап 4: Иди по длинному коридору, прячься в шкаф [E] от Сани, дойди до «Выход лол»!',
    act2CorridorProgressLabel: 'Выход лол',
    act2TouchInteract: 'ДЕЙСТВ. (E)',
    act2HidingBadge: 'ТЫ В ШКАФУ · [E / ЛКМ] ВЫЙТИ',
    act2FlickerWarning: 'СВЕТ МИГАЕТ! Идёт слепой Саня — ПРЯЧЬСЯ В ШКАФ [E]!',
    act2AlarmWarning: 'ТРЕВОГА! RONER лезет в окно — СВЕТИ НА НЕГО ФОНАРИКОМ [F]!',
    act2WindowBreachLabel: 'Взлом окна',
    pauseTitle: 'ПАУЗА',
    collectedLabel: 'Грибов собрано:',
    resumeBtn: 'ПРОДОЛЖИТЬ',
    restartBtn: 'ЗАНОВО',
    menuBtn: 'НА ГЛАВНЫЙ ЭКРАН',
    cutsceneAct1: 'ИСТОРИЯ · АКТ 1',
    cutsceneAct2: 'ПОХОЖДЕНИЯ НИКИТЫ · ЗА МИВИНОЙ НА ЗАВОД',
    cutsceneAct3: 'АКТ 3 · 30 НОЧЕЙ В ПАРКЕ «МАЛИНКА»',
    cutsceneSecret: 'СЕКРЕТ · НАЧАЛО АКТА 2 — «МИВИНА КОРПОРЕЙШЕН»',
    cutsceneAct3Secret: 'СЕКРЕТ · АКТ 3 — ВХОД В ГОРОД «МАЛИНКА»',
    skipBtn: 'Пропустить',
    menuShort: 'Меню',
    secretHint: 'Нажми Esc / Space или «На главный экран», чтобы вернуться',
    skipHint: 'Нажми Space или кнопку «Пропустить»',
    victoryTitle: 'АКТ 1 ПРОЙДЕН!',
    victorySub: 'Грибы для мивины спасены!',
    victorySaidPrefix: 'nikitys6666 убежал в «Мивина Корпорейшен»:',
    act2CardTitle: 'АКТ 2 — ЗАВОД «МИВИНА КОРПОРЕЙШЕН»!',
    act2CardSub: 'Сделай из собранных грибов 20 мивин на конвейере и упакуй их!',
    act2EnterBtn: 'ПЕРЕЙТИ К АКТУ 2: ЗАВОД',
    act3CardTitle: 'АКТ 3 — 30 НОЧЕЙ В ПАРКЕ «МАЛИНКА»!',
    act3CardSub: 'Выживи 30 ночей от большого Сани (×2), качай базу за металл и отбейся на 30-ю ночь!',
    act3EnterBtn: 'ПЕРЕЙТИ К АКТУ 3: ПАРК «МАЛИНКА»',
    act2SecretBtn: 'Секрет: Показать вход Акта 2',
    act2VictoryTitle: 'АКТ 2 ПРОЙДЕН!',
    act2VictorySub: '20 грибных мивин произведено и упаковано!',
    act2VictorySaid: 'nikitys6666 запечатал ящик с мивиной:',
    act3VictoryTitle: 'АКТ 3 ПРОЙДЕН!',
    act3VictorySub: '30 ночей в парке «Малинка» прожиты! Армия RONER уничтожена!',
    act3VictorySaid: 'nikitys6666 шагает в деревню «ДжоДжо»:',
    replayAct2: 'Пройти Акт 2 ещё раз',
    replayAct3: 'Пройти Акт 3 ещё раз',
    act3Badge: 'АКТ 3 · ПАРК «МАЛИНКА»',
    act3NightLabel: 'Ночь',
    act3DayWord: 'ДЕНЬ',
    act3NightWord: 'НОЧЬ',
    act3FireLabel: 'Костёр',
    act3LogsLabel: 'Бревна',
    act3MetalLabel: 'Металл',
    act3BaseLevelLabel: 'База ур.',
    act3MaxedLabel: 'МАКС. БАЗА',
    act3BedReadyLabel: 'Кровать: Готова',
    act3BedCooldownLabel: 'Кровать: КД 1 ночь',
    act3BossLabel: 'БОСС БОЛЬШОЙ САНЯ',
    act3RonerWaveLabel: 'Волна RONER',
    act3Night30Objective: '30-Я НОЧЬ! Получена снайперка — побей Босса Саню и волну RONER [ЛКМ / E]!',
    statNights: 'Ночей',
    statBaseLv: 'Ур. базы',
    statMushrooms: 'Грибы',
    statMivinas: 'Мивины',
    statClones: 'Клоны',
    statTime: 'Время',
    statScared: 'Отпугнул',
    statBest: 'Рекорд',
    statBoxes: 'Коробки',
    statPacked: 'Упаковано',
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
