import { AchievementId, GameLanguage, GameSettings } from '../types/game';

const SETTINGS_STORAGE_KEY = 'prostophilya_settings_v2';

export const DEFAULT_SETTINGS: GameSettings = {
  language: 'ru',
  censorship: true,
  familyMode: false,
  hardcoreMode: false,
  voidMode: false,
  graphicsQuality: 'high',
  mobileMode: false,
  autoAim: false,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const familyMode = Boolean(parsed.familyMode);
    const language: GameLanguage =
      parsed.language === 'en' ? 'en' : parsed.language === 'pl' ? 'pl' : 'ru';
    const graphicsQuality =
      parsed.graphicsQuality === 'low' ||
      parsed.graphicsQuality === 'medium' ||
      parsed.graphicsQuality === 'high'
        ? parsed.graphicsQuality
        : 'high';
    return {
      language,
      censorship: familyMode ? true : parsed.censorship !== undefined ? Boolean(parsed.censorship) : true,
      familyMode,
      hardcoreMode: Boolean(parsed.hardcoreMode),
      voidMode: Boolean(parsed.voidMode),
      graphicsQuality,
      mobileMode: Boolean(parsed.mobileMode),
      autoAim: Boolean(parsed.autoAim),
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
  if (settings.language === 'pl') {
    if (settings.familyMode) {
      return [
        { display: 'Kocz kocz, kolego!', speech: 'Kocz kocz, kolego!' },
        { display: 'Tańcz, pantero!', speech: 'Tańcz, pantero!' },
        { display: 'ZŁOTKO!', speech: 'Złotko!' },
      ];
    }
    return [
      { display: 'Kocz kocz, bracie!', speech: 'Kocz kocz, bracie!' },
      { display: 'Tańcz, pantero!', speech: 'Tańcz, pantero!' },
      { display: 'GOLDA!', speech: 'Golda!' },
    ];
  }

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
  if (settings.language === 'pl') {
    if (settings.familyMode) {
      return { display: 'Ale z ciebie spryciarz!', speech: 'Ale z ciebie spryciarz!' };
    }
    if (settings.censorship) {
      return { display: 'Ale z ciebie [***]!', speech: 'Ale z ciebie!', hasCensorBeep: true };
    }
    return { display: 'Ale z ciebie szczur!', speech: 'Ale z ciebie szczur!' };
  }

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
  if (settings.language === 'pl') {
    if (settings.familyMode) {
      return {
        display: 'BEREK! CHCĘ BYĆ JAK GAZAN!!!!!!',
        speech: 'Berek! Chcę być jak Gazan!',
      };
    }
    return {
      display: 'CHCĘ BYĆ JAK GAZAN!!!!!!',
      speech: 'Chcę być jak Gazan!',
    };
  }

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
  | 'act3_outro_2'
  | 'act4_intro_0'
  | 'act4_intro_1'
  | 'act4_intro_2'
  | 'act4_intro_3'
  | 'act4_intro_4'
  | 'act4_house_0'
  | 'act4_uzi_secret'
  | 'act4_outro_0';

export function getCutsceneLine(
  key: CutsceneLineKey,
  settings: GameSettings
): LocalizedLine {
  const isEn = settings.language === 'en' || settings.language === 'pl';
  const isPl = settings.language === 'pl';
  const censored = settings.censorship || settings.familyMode;

  if (isPl) {
    const plLines: Partial<Record<CutsceneLineKey, LocalizedLine>> = {
      intro_0: { display: 'Dobra, potrzebuję grzybów Prostophilya do zupki Mivina.', speech: 'Dobra, potrzebuję grzybów Prostophilya do zupki Mivina.' },
      intro_1: censored
        ? { display: 'Ej [***]! Zaraz cię złapiemy, jasne?!', speech: 'Ej! Zaraz cię złapiemy, jasne?', hasCensorBeep: true }
        : { display: 'Siema Eblan! Już po tobie, jasne?!', speech: 'Siema Eblan! Już po tobie, jasne?' },
      intro_1_b: { display: 'No jasne, nie?!', speech: 'No jasne, nie?' },
      intro_2: { display: 'MASZ LATARKĄ PO OCZACH!!!!!!', speech: 'Masz latarką po oczach!' },
      intro_3: { display: 'O NIE, JESZCZE CIĘ DORWIEMY!!!!!!!!', speech: 'O nie, jeszcze cię dorwiemy!' },
      outro_0: { display: 'UCIEKAJCIE ZE SWOIMI ŻARTAMI, GOTUJĘ MIVINĘ!!!!!!!!', speech: 'Uciekajcie ze swoimi żartami, gotuję Mivinę!' },
      act2_teaser: { display: 'Wow... drzwi fabryki lekko uchylone! Ciąg dalszy w Akcie 2!', speech: 'Drzwi fabryki uchylone! Ciąg dalszy w Akcie dwa!' },
      act2_secret: { display: 'Drzwi Mivina Corporation uchylone... Przejdź Akt 1 (1000m), aby tu dotrzeć!', speech: 'Drzwi Mivina Corporation uchylone!' },
      act3_secret: { display: 'Wow... to jest miasto «Malinka»! Za bramą czeka Akt 3!', speech: 'To jest miasto Malinka! Akt trzeci czeka!' },
      act2_intro_0: { display: 'Uff, uciekłem od tych wariatów!', speech: 'Uff, uciekłem od tych wariatów!' },
      act2_intro_1: { display: 'SUPER!! WRESZCIE ZROBIĘ MOJĄ MIVINĘ!!!!!!', speech: 'Super! Wreszcie zrobię moją Mivinę!' },
      act2_intro_2a: { display: 'Ej!! Oszalałeś czy co?!', speech: 'Ej! Oszalałeś czy co?' },
      act2_intro_2b: { display: 'Świecisz mi prosto w oczy!', speech: 'Świecisz mi prosto w oczy!' },
      act2_intro_2c: { display: 'No to masz problem kolego!!', speech: 'No to masz problem kolego!' },
      act2_door_0: { display: 'Czekaj, dlaczego tu są KOLEJNE drzwi?!', speech: 'Dlaczego tu są kolejne drzwi?' },
      act2_door_1: { display: 'Łał... co to za gigantyczny korytarz?!', speech: 'Co to za gigantyczny korytarz?' },
      act2_final_0: { display: 'Dobra, koniec gry dla nich >:)', speech: 'Dobra, koniec gry dla nich!' },
      act2_outro_0: { display: '360 SNAJPER!! WYJŚCIE LOL, DO ZOBACZENIA!', speech: 'Trzysta sześćdziesiąt snajper! Wyjście lol!' },
      act3_intro_0: { display: 'O nie, będzie po mnie jeśli stąd nie ucieknę!', speech: 'Będzie po mnie jeśli stąd nie ucieknę!' },
      act3_outro_0: { display: 'Boże miłosierny, ledwo przeżyłem!', speech: 'Boże miłosierny, ledwo przeżyłem!' },
      act3_outro_1: { display: 'Ty oszuście, wstrętny aimerze!!!!!!', speech: 'Ty oszuście, wstrętny aimerze!' },
      act3_outro_2: { display: 'tam musimy iść...', speech: 'tam musimy iść...' },
      act4_intro_0: { display: 'Ależ ich tam załatwiłem!', speech: 'Ależ ich tam załatwiłem!' },
      act4_intro_1: censored ? { display: 'Cześć Nikita [***]))))', speech: 'Cześć Nikita!', hasCensorBeep: true } : { display: 'Hi Nikita pedofail))))', speech: 'Hi Nikita pedofail!' },
      act4_intro_2: { display: 'Ej, oszalałeś?!', speech: 'Ej, oszalałeś?' },
      act4_intro_3: { display: 'Lubisz pizzę?', speech: 'Lubisz pizzę?' },
      act4_intro_4: { display: 'KOCHAŁEM TEN CHLEB!!!!', speech: 'Kochałem ten chleb!' },
      act4_house_0: { display: 'Nikita, łap pistolet — nadchodzą klony RONER! Kupuj bronie i wieżyczki za kille!', speech: 'Nikita, łap pistolet! Nadchodzą klony Roner!' },
      act4_uzi_secret: { display: 'MASZ ZA SWOJE!!!!!!!', speech: 'Masz za swoje!' },
      act4_outro_0: { display: 'Najlepsza Mivina i herbatka we trójkę — nikt nam nie podskoczy!', speech: 'Najlepsza Mivina i herbatka we trójkę!' },
    };
    const match = plLines[key];
    if (match) return match;
  }

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

    case 'act4_intro_0':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'Man, I totally crushed those pranksters back there!',
            speech: 'Man, I totally crushed those pranksters back there!',
          };
        }
        if (censored) {
          return {
            display: '[***] I totally [***] them up back there!',
            speech: 'I totally messed them up back there!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'Bla how cool was I when I Razebal them!',
          speech: 'Bla how cool was I when I Razebal them!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Ого, как же я их круто переиграл!',
          speech: 'Ого, как же я их круто переиграл!',
        };
      }
      if (censored) {
        return {
          display: '[***] какже я их круто [***]',
          speech: 'Пип, как же я их круто пип!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'Bla какже я их круто Razebal',
        speech: 'Бля, как же я их круто разъебал!',
      };

    case 'act4_intro_1':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'Hi Nikita bestfriend))))',
            speech: 'Hi Nikita bestfriend!',
          };
        }
        if (censored) {
          return {
            display: 'Hi Nikita [***]))))',
            speech: 'Hi Nikita!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'Hi Nikita pedofail))))',
          speech: 'Hi Nikita pedofail!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Hi Nikita дружище))))',
          speech: 'Хай Никита дружище!',
        };
      }
      if (censored) {
        return {
          display: 'Hi Nikita [***]))))',
          speech: 'Хай Никита пип!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'Hi Nikita pedofail))))',
        speech: 'Хай Никита педофайл!',
      };

    case 'act4_intro_2':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'Hey, are you kidding me?!',
            speech: 'Hey, are you kidding me?',
          };
        }
        if (censored) {
          return {
            display: 'Are you [***]?!',
            speech: 'Are you crazy?',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'Are you axyel?!',
          speech: 'Are you axyel?',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Ты что, обалдел совсем?!',
          speech: 'Ты что, обалдел совсем?',
        };
      }
      if (censored) {
        return {
          display: 'Ты чо [***]?!',
          speech: 'Ты чо пип?',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'Ты чо axyel?!',
        speech: 'Ты чо ахуел?',
      };

    case 'act4_intro_3':
      if (isEn) {
        return {
          display: 'Do you like pizza?',
          speech: 'Do you like pizza?',
        };
      }
      return {
        display: 'Любиш пиццу?',
        speech: 'Любишь пиццу?',
      };

    case 'act4_intro_4':
      if (isEn) {
        if (settings.familyMode) {
          return {
            display: 'I LOVED THAT BREAD!!!!',
            speech: 'I loved that bread!',
          };
        }
        if (censored) {
          return {
            display: 'I [***] BREAD!!!!',
            speech: 'I bread!',
            hasCensorBeep: true,
          };
        }
        return {
          display: 'I Veibal BREAD!!!!',
          speech: 'I veibal bread!',
        };
      }
      if (settings.familyMode) {
        return {
          display: 'Я ОБОЖАЮ ХЛЕБ!!!!',
          speech: 'Я обожаю хлеб!',
        };
      }
      if (censored) {
        return {
          display: 'Я [***] хлеб!!!!',
          speech: 'Я пип хлеб!',
          hasCensorBeep: true,
        };
      }
      return {
        display: 'Я Veibal хлеб!!!!',
        speech: 'Я выебал хлеб!',
      };

    case 'act4_house_0':
      if (isEn) {
        return {
          display: 'Nikita, take this pistol — RONER clones are swarming! Check us for guns & turrets!',
          speech: 'Nikita, take this pistol! Clones are coming!',
        };
      }
      return {
        display: 'Никита, держи пистолет — прут клоны RONER! За килы бери у нас пушки и пулемёты!',
        speech: 'Никита, держи пистолет! Прут клоны Ронер!',
      };

    case 'act4_uzi_secret':
      if (isEn) {
        return {
          display: 'BITE THIS!!!!!!!',
          speech: 'Bite this!',
        };
      }
      return {
        display: 'ВЫКУСИ!!!!!!!',
        speech: 'Выкуси!',
      };

    case 'act4_outro_0':
      if (isEn) {
        return {
          display: 'Best Mivina noodles and hot tea ever — nobody messes with our trio!',
          speech: 'Best Mivina noodles and hot tea ever!',
        };
      }
      return {
        display: 'Вот это кайф — сидим втроём, кушаем мивину и пьём чай!',
        speech: 'Вот это кайф! Сидим втроём, кушаем мивину и пьём чай!',
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
  [/\bbla\b/gi, 'бля'],
  [/\brazebal\b/gi, 'разъебал'],
  [/\bpedofail\b/gi, 'педофайл'],
  [/\bveibal\b/gi, 'выебал'],
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
  if (lang === 'pl') {
    switch (id) {
      case 'act1_clear':
        return { title: 'Jacyś idioci...', desc: 'Ukończ Akt 1' };
      case 'act2_clear':
        return { title: 'Mivina jest moja!', desc: 'Ukończ Akt 2' };
      case 'act3_malinka':
        return { title: 'Malinowe chmury', desc: 'Ukończ Akt 3' };
      case 'fnaf_50':
        return { title: '5 na 20', desc: 'Zapakuj 50 Mivin w mini-grze «FNAF Epta»' };
      case 'fnaf_100':
        return { title: 'Król Miviny', desc: 'Zapakuj 100 Mivin w mini-grze «FNAF Epta»' };
      case 'mush_50':
        return { title: 'Leśniczy', desc: 'Zbierz 50 grzybów' };
      case 'mush_100':
        return { title: 'Grzyboświr', desc: 'Zbierz 100 grzybów' };
      case 'mush_200':
        return { title: 'Król Grzybów', desc: 'Zbierz 200 grzybów' };
      case 'sniper_100':
        return { title: 'Snajper mamusi', desc: 'Pokonaj 100 klonów w «Snajperka teraz moja!»' };
      case 'secret_malinka':
        return { title: 'Zagadka od Jacquesa Fresco', desc: 'W Akcie 3 znajdź tabliczkę P+P=? w rogu parku i odpowiedz 28' };
      case 'act4_shahediki':
        return { title: 'Szahediki', desc: 'Ukryty easter egg z Uzi w Akcie 4' };
      case 'act4_jojo':
        return { title: 'Impreza z Miviną i herbatką', desc: 'Ukończ Akt 4 w wiosce «JoJo»' };
      case 'act3_40_days':
        return { title: 'Ile jeszcze można?', desc: 'Przetrwaj 40 dni w trybie «Przetrwanie»' };
      case 'act3_99_days':
        return { title: "99 Roner's w lesie", desc: 'Przetrwaj 99 dni w trybie «Przetrwanie»' };
      case 'parkour_clear':
        return { title: 'Jestem Skoczkiem!', desc: 'Ukończ mini-grę «Parkour»' };
      case 'pvz_gardener':
        return { title: 'Ogrodnik', desc: "Ukończ mini-grę «Rośliny kontra Roner's»" };
      case 'hardcore_all_acts':
        return { title: 'SPALACZ TYŁKA 3000', desc: 'Ukończ wszystkie 4 Akty w trybie Hardcore' };
    }
  }

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
        ? { title: 'Jacque Fresco Riddle', desc: 'In Act 3, find the P+P=? sign in the park corner and answer 28' }
        : { title: 'Загадка от жака фреско', desc: 'В Акте 3 найди табличку P+P=? в углу парка и ответь 28' };
    case 'act4_shahediki':
      return isEn
        ? { title: 'Shahediki', desc: 'Secret Easter egg while holding the Uzi in Act 4' }
        : { title: 'Шахедики', desc: 'Секретная пасхалка с Узи в Акте 4' };
    case 'act4_jojo':
      return isEn
        ? { title: 'Mivina & Tea Party', desc: 'Complete Act 4 in «JoJo» Village' }
        : { title: 'Мивина с чайком', desc: 'Пройти Акт 4 в деревне «ДжоДжо»' };
    case 'act3_40_days':
      return isEn
        ? { title: 'How Much Longer?', desc: 'Survive 40 days in «Survival»' }
        : { title: 'Сколько можно?', desc: 'Прожить 40 дней в мини-игре «Выжывачь»' };
    case 'act3_99_days':
      return isEn
        ? { title: "99 Roner's in the Woods", desc: 'Survive 99 days in «Survival»' }
        : { title: "99 Roner's в лесу", desc: 'Прожить 99 дней в мини-игре «Выжывачь»' };
    case 'parkour_clear':
      return isEn
        ? { title: 'I Am a Jumper!', desc: 'Complete the «Parkour» minigame' }
        : { title: 'Я Прыгун!', desc: 'Пройти мини-игру «Паркур»' };
    case 'pvz_gardener':
      return isEn
        ? { title: 'Gardener', desc: "Complete «Plants vs Roner's» minigame" }
        : { title: 'Садовник', desc: "Пройти мини-игру «Ростения против Roner's»" };
    case 'hardcore_all_acts':
      return isEn
        ? { title: 'ASS BURNER 3000', desc: 'Complete all 4 Story Acts with Hardcore Mode ON' }
        : { title: 'ЖОПА СЖИГАТЕЛЬ 3000', desc: 'Пройти все 4 Акта в режиме Хардкор' };
  }
}

export function getUiText(lang: GameLanguage) {
  if (lang === 'pl') {
    return {
      titleTop: 'NOCNY LAS',
      titleBottom: 'PROSTOPHILYA',
      titleSubtitle: 'Przygody Nikity: Po Mivinę do fabryki',
      muteLabel: 'Wycisz dźwięk',
      unmuteLabel: 'Włącz dźwięk',
      settingsBtn: 'Ustawienia',
      achievementsBtn: 'Osiągnięcia',
      achievementsTitle: 'OSIĄGNIĘCIA',
      achievementUnlockedLabel: 'ODBLOKOWANO OSIĄGNIĘCIE!',
      achievementsProgressHint: 'Zdobywaj osiągnięcia w Fabule, sekretach i mini-grach',
      unlockedLabel: 'Odblokowano',
      lockedLabel: 'Zablokowano',
      tabStory: 'Fabuła',
      tabMinigames: 'Mini-gry',
      modeStory: 'Fabuła · Akt 1',
      modeStory2: 'Fabuła · Akt 2',
      modeStory3: 'Fabuła · Akt 3',
      modeStory4: 'Fabuła · Akt 4',
      modeAct2Title: 'Akt 2 · Fabryka',
      modeAct2Sub: '20 Mivin + Korytarz',
      modeAct3Sub: '30 Nocy · Park Malinka',
      modeAct4Sub: 'Wioska JoJo · 7 Fal',
      modeAct2Tooltip: 'Sekret: wejście do fabryki Mivina Corporation',
      act2SecretLink: 'Sekret: Wejście Akt 2',
      act3SecretLink: 'Sekret: Akt 3 (Malinka)',
      modeFnafTitle: 'FNAF Epta',
      modeFnafSub: 'Nieskończony Akt 2',
      modeSniperTitle: 'Snajperka moja!',
      modeSniperSub: 'Fale klonów',
      modeAct3SurvivalTitle: 'Przetrwanie',
      modeAct3SurvivalSub: 'Nieskończony Akt 3',
      modeParkourTitle: 'Parkour',
      modeParkourSub: 'Wielki tor',
      modePvzTitle: "Rośliny vs Roner's",
      modePvzSub: 'Obrona ogrodu',
      modeFP: '1. osoba',
      modeHardcore: 'Hardcore 3 os.',
      endless: 'Nieskończony',
      record: 'Rekord',
      descStory: 'Akt 1 (1000m): Przejdź zamgloną drogę 1000m, zbierz 40 grzybów i dotrzyj do Mivina Corporation!',
      descStory2: 'Akt 2 (Fabryka): Zapakuj 20 Mivin po klucz, przejdź długi korytarz chowając się w szafach [E] przed Saszą!',
      descStory3: 'Akt 3 (Park Malinka): Dzień 1m / Noc 1m · 30 Nocy! Pilnuj ogniska [E], odstraszaj nocne RONERy [F], ulepsz bazę do poz. 6 i pokonaj Noc 30!',
      descStory4: 'Akt 4 (Wioska JoJo): Spotkaj Giorno, odbierz broń od Saszy i Ronera, pokonaj 7 fal i Bossa Saszę 67 (11488 HP)!',
      descFnaf: 'FNAF Epta (Nieskończony Akt 2): Pakuj partie po 20 Mivin, chowaj się w szafie [E] i świeć w okna [F]!',
      descSniper: 'Snajperka teraz moja!: Strzelaj do fal klonów Saszy i RONERów [LPM / E] i bij rekord!',
      descAct3Survival: 'Przetrwanie (Nieskończony Akt 3): Przeżyj jak najwięcej dni w Parku Malinka! Celuj w 40 i 99 dni!',
      descParkour: 'Parkour: Pokonaj wielki podniebny tor z ruchomymi platformami, trampolinami i checkpointami!',
      descPvz: "Rośliny kontra Roner's: Sadź Słoneczniki, Działka Grochowe i Orzechy [E/LPM] na trawniku 5×8 i powstrzymaj 4 fale RONERów!",
      descFP: 'Tryb Nieskończony (1. osoba): Świeć latarką [F] na RONER_552 i sasha55k_XL!',
      descHardcore: 'Tryb Nieskończony (Hardcore 3. osoba): Szybsi i groźniejsi przeciwnicy!',
      playBtn: 'GRAJ',
      controlsTitle: 'WASD Ruch · Shift Sprint · Space Skok · F Latarka · E/LPM Akcja / Strzał',
      controlsHud: 'WASD Ruch · Shift Bieg · Space Skok · F/PPM Latarka · Mysz Rozglądanie · Esc Pauza',
      controlsHudAct2: 'WASD Ruch · E/LPM Pudełko / Szafa / Prasa / Drzwi · F Świeć w okno · Esc Pauza',
      controlsHudAct3: 'WASD Ruch · Shift Bieg · E/LPM Drewno / Metal / Ognisko / Prasa / Snajper · F Latarka · Esc Pauza',
      controlsHudAct4: 'WASD Ruch · LPM Ogień · 1-6 Broń · E Sklep / Rozmowa · F Latarka · Esc Pauza',
      controlsHudSniper: 'WASD Ruch · Shift Bieg · Space Skok · LPM / E Strzał · Mysz Celowanie · Esc Pauza',
      controlsHudParkour: 'WASD Ruch · Shift Sprint · Space Skok · Mysz Kamera · Esc Pauza',
      controlsHudPvz: 'WASD Ruch · 1-5 Wybierz roślinę/łopatę · E/LPM Posadź / Wykop · Esc Pauza',
      hideControls: 'Ukryj sterowanie',
      showControls: 'Sterowanie',
      mushroomName: 'Prostophilya',
      badgeHardcore: 'HARDCORE 3 OS. · BEZ KOŃCA',
      badgeStory: 'AKT 1',
      badgeStory2: 'AKT 2 · FABRYKA',
      badgeFP: '1 OSOBA · BEZ KOŃCA',
      fnafBadge: 'FNAF EPTA · BEZ KOŃCA',
      fnafTotalLabel: 'Razem Mivin',
      fnafBatchLabel: 'Partia',
      fnafStageLoop: 'Nieskończona pętla: przypraw 20 Mivin, zapakuj i przetrwaj!',
      sniperBadge: 'SNAJPERKA TERAZ MOJA!',
      sniperClonesLabel: 'Zabite klony',
      sniperWaveLabel: 'Fala',
      sniperHpLabel: 'Pancerz',
      sniperShootPrompt: 'OGIEŃ [LPM / E]',
      sniperTouchFire: 'OGIEŃ',
      factoryShort: 'Mivina Corp.:',
      panther: 'PANTERA!',
      stamina: 'Wytrzymałość',
      battery: 'Bateria',
      dangerNearby: 'Pościg blisko:',
      act2Badge: 'AKT 2 · MIVINA CORP.',
      act2SeasonedLabel: 'Przyprawione',
      act2PackedLabel: 'Spakowane',
      act2PacketsLabel: 'Paczki',
      act2MushroomsStock: 'Grzyby',
      act2KeyBadge: 'KLUCZ DO KORYTARZA',
      act2StageConveyor: 'Etap 1: Przypraw 20 klusek na taśmie',
      act2StagePackaging: 'Etap 2: Zapakuj 20 Mivin przy prasie po Klucz!',
      act2StageCorridorKey: 'Etap 3: Masz klucz! Otwórz drzwi Północnego Skrzydła',
      act2StageCorridor: 'Etap 4: Przejdź długi korytarz, chowaj się w szafach [E] i znajdź «Wyjście LOL»!',
      act2CorridorProgressLabel: 'Wyjście LOL',
      act2TouchInteract: 'AKCJA (E)',
      act2HidingBadge: 'SCHOWANY W SZAFIE · [E / LPM] WYJDŹ',
      act2FlickerWarning: 'ŚWIATŁO MIGA! Idzie ślepy Sasza — CHOWAJ SIĘ W SZAFIE [E]!',
      act2AlarmWarning: 'ALARM! RONER wybija okno — ŚWIEĆ NA NIEGO LATARKĄ [F]!',
      act2WindowBreachLabel: 'Wyłamanie okna',
      pauseTitle: 'PAUZA',
      collectedLabel: 'Zebrane grzyby:',
      resumeBtn: 'WZNÓW',
      restartBtn: 'OD NOWA',
      menuBtn: 'MENU GŁÓWNE',
      cutsceneAct1: 'FABUŁA · AKT 1',
      cutsceneAct2: 'PRZYGODY NIKITY · DO FABRYKI MIVINY',
      cutsceneAct3: 'AKT 3 · 30 NOCY W PARKU MALINKA',
      cutsceneAct4: 'AKT 4 · WIOSKA «JOJO»',
      cutsceneSecret: 'SEKRET · ZAPOWIEDŹ AKTU 2 — «MIVINA CORPORATION»',
      cutsceneAct3Secret: 'SEKRET · AKT 3 — BRAMA MIASTA «MALINKA»',
      skipBtn: 'Pomiń',
      menuShort: 'Menu',
      secretHint: 'Naciśnij Esc / Space lub «Menu główne», aby wrócić',
      skipHint: 'Naciśnij Space lub kliknij «Pomiń»',
      victoryTitle: 'AKT 1 UKOŃCZONY!',
      victorySub: 'Grzyby na Mivinę uratowane!',
      victorySaidPrefix: 'nikitys6666 uciekł do «Mivina Corporation»:',
      act2CardTitle: 'AKT 2 — FABRYKA MIVINY GOTOWA!',
      act2CardSub: 'Przerób swoje grzyby na 20 zapakowanych Mivin!',
      act2EnterBtn: 'PRZEJDŹ DO AKTU 2: FABRYKA',
      act3CardTitle: 'AKT 3 — PRZETRWANIE W PARKU MALINKA!',
      act3CardSub: 'Przeżyj 30 nocy z Wielkim Saszą (×2), ulepsz obóz i pokonaj Noc 30!',
      act3EnterBtn: 'PRZEJDŹ DO AKTU 3: PARK MALINKA',
      act4CardTitle: 'AKT 4 — WIOSKA «JOJO»!',
      act4CardSub: 'Spotkaj Giorno, zdobądź broń od Saszy i Ronera, pokonaj 7 fal i Bossa Saszę 67!',
      act4EnterBtn: 'PRZEJDŹ DO AKTU 4: WIOSKA «JOJO»',
      act2SecretBtn: 'Sekret: Pokaż wejście fabryki',
      act2VictoryTitle: 'AKT 2 UKOŃCZONY!',
      act2VictorySub: '20 Grzybowych Mivin wyprodukowane i spakowane!',
      act2VictorySaid: 'nikitys6666 zapieczętował skrzynię:',
      act3VictoryTitle: 'AKT 3 UKOŃCZONY!',
      act3VictorySub: '30 Nocy w Parku Malinka przetrwane! Armia RONER zniszczona!',
      act3VictorySaid: 'nikitys6666 rusza do wioski «JoJo»:',
      act4VictoryTitle: 'AKT 4 UKOŃCZONY!',
      act4VictorySub: 'Boss Sasza 67 pokonany! Mivina i herbatka z Saszą i Ronerem!',
      act4VictorySaid: 'nikitys6666, Sasza i Roner przy stole:',
      parkourVictoryTitle: 'PARKOUR UKOŃCZONY!',
      parkourVictorySub: 'Dotarłeś na szczyt podniebnego toru przeszkód!',
      parkourVictorySaid: 'nikitys6666 na mecie:',
      pvzVictoryTitle: 'OGRÓD OBRONIONY!',
      pvzVictorySub: "Wszystkie 4 fale RONER's zostały powstrzymane przez Twoje wieżyczki!",
      pvzVictorySaid: 'nikitys6666 — mistrz ogrodnictwa:',
      replayAct2: 'Zagraj Akt 2 ponownie',
      replayAct3: 'Zagraj Akt 3 ponownie',
      replayAct4: 'Zagraj Akt 4 ponownie',
      replayParkour: 'Zagraj Parkour ponownie',
      replayPvz: "Zagraj Rośliny vs Roner's ponownie",
      act3Badge: 'AKT 3 · PARK MALINKA',
      act3SurvivalBadge: 'PRZETRWANIE · BEZ KOŃCA',
      parkourBadge: 'PARKOUR · TOR PRZESZKÓD',
      parkourCheckpointLabel: 'Checkpoint',
      parkourProgressLabel: 'Postęp',
      pvzBadge: "ROŚLINY VS RONER'S",
      pvzEnergyLabel: 'Energia',
      pvzWaveLabel: 'Fala',
      pvzEnemiesLabel: 'Wrogowie',
      pvzPlantBtn: 'SADŹ [E]',
      pvzPlants: {
        sun: 'Słonecznik (50)',
        peashooter: 'Groszek (75)',
        repeater: 'Podwójny (125)',
        wallnut: 'Orzech (50)',
        shovel: 'Łopata (0)',
      },
      act4Badge: 'AKT 4 · WIOSKA «JOJO»',
      act4WalkHouseObjective: 'Podejdź do domku przed sobą, gdzie czekają Sasza (z wizjerem) i Roner [E]',
      act4WaveLabel: 'Fala',
      act4EnemiesLeftLabel: 'Pozostało',
      act4KillsLabel: 'Kille (nie wydają się)',
      act4TurretsActive: 'Wieżyczki AKTYWNE',
      act4TurretsLocked: 'Wieżyczki [100 killi]',
      act4TurretsUnlockBtn: 'Odblokuj wieżyczki (100)',
      act4Boss67Label: 'BOSS SASZA 67!!!!!!',
      act4Weapons: {
        pistol: 'Pistolet',
        uzi: 'Uzi',
        ak47: 'AK-47',
        sniper: 'Snajperka',
        rpg: 'RPG',
        flamethrower: 'Miotacz ognia',
      },
      act3NightLabel: 'Noc',
      act3DayWord: 'DZIEŃ',
      act3NightWord: 'NOC',
      act3FireLabel: 'Ognisko',
      act3LogsLabel: 'Drewno',
      act3MetalLabel: 'Metal',
      act3BaseLevelLabel: 'Baza poz.',
      act3MaxedLabel: 'MAKS. BAZA',
      act3BedReadyLabel: 'Łóżko: Gotowe',
      act3BedCooldownLabel: 'Łóżko: CD 1 noc',
      act3BossLabel: 'BOSS WIELKI SASZA',
      act3RonerWaveLabel: 'Fala RONER',
      act3Night30Objective: 'NOC 30! Masz Snajperkę — pokonaj Bossa Saszę i armię RONER [LPM / E]!',
      statNights: 'Noce',
      statDays: 'Dni',
      statBaseLv: 'Poz. bazy',
      statKills: 'Kille',
      statWave: 'Fala',
      statCheckpoint: 'Punkt',
      statMushrooms: 'Grzyby',
      statMivinas: 'Miviny',
      statClones: 'Klony',
      statTime: 'Czas',
      statScared: 'Oślepieni',
      statBest: 'Rekord',
      statBoxes: 'Pudła',
      statPacked: 'Spakowane',
      replayAct1: 'Zagraj Akt 1 ponownie',
      hardcoreEndlessBtn: 'Hardcore 3 os. (Bez końca)',
      fpEndlessBtn: '1. osoba (Bez końca)',
      gameOverTitle: 'KONIEC GRY',
      modeLabel: 'Tryb:',
      caughtFamilySuffix: 'złapał cię i krzyknął:',
      caughtNormalSuffix: 'dopadł cię i wrzasnął:',
      hardcoreBurnoutMsg: 'KONIEC CZASU HARDCORE (2:00)! Spłonąłeś w piekle mapy!',
      playAgainBtn: 'ZAGRAJ PONOWNIE',
      restartHint: 'Naciśnij Enter lub Space aby zagrać ponownie',
      settingsTitle: 'USTAWIENIA',
      langLabel: 'Język',
      langRu: 'Русский (RU)',
      langEn: 'English (EN)',
      langPl: 'Polski (PL)',
      censorLabel: 'Cenzura',
      censorDesc: 'Maskuje przekleństwa znakiem [***] i cenzuruje głos',
      familyLabel: 'Tryb Rodzinny',
      familyDesc: 'Przyjazne żarty i czyste dialogi (włącza cenzurę)',
      hardcoreLabel: 'Tryb Hardcore',
      hardcoreDesc: 'Szybsi wrogowie, płonące wszystkie mapy i zabójczy licznik 2:00!',
      hardcoreActiveBadge: 'HARDCORE',
      hardcoreTimerLabel: 'OGIEŃ',
      hardcoreActsProgress: 'Akty w Hardcore:',
      voidLabel: 'Tryb Pustki',
      voidDesc: 'Ekstremalnie gęsta czarna mgła na wszystkich mapach',
      graphicsLabel: 'Grafika',
      graphicsLow: 'Niska',
      graphicsMedium: 'Średnia',
      graphicsHigh: 'Wysoka',
      mobileModeLabel: 'Tryb mobilny',
      mobileModeDesc: 'Przyciski ekranowe, kompaktowy HUD i blokada trybu pionowego',
      autoAimLabel: 'Auto-Aim',
      autoAimDesc: 'Stopniowe namierzanie wrogów z broni palnej (nie natychmiastowe)',
      autoAimActiveBadge: 'AUTO-AIM',
      portraitBlockTitle: 'OBRÓĆ URZĄDZENIE POZIOMO',
      portraitBlockDesc: 'Tryb mobilny nie pozwala na grę w orientacji pionowej. Obróć ekran w poziom!',
      act3RiddleTitle: 'ZAGADKA JACQUESA FRESCO',
      act3RiddlePrompt: 'Na tabliczce w rogu parku widnieje: P + P = ? Wpisz poprawną liczbę:',
      act3RiddlePlaceholder: 'Twoja odpowiedź...',
      act3RiddleSubmit: 'Odpowiedz',
      act3RiddleCancel: 'Zamknij',
      act3RiddleWrong: 'Źle! Pomyśl jak Jacques Fresco...',
      act3RiddleSolved: 'Brawo! Odpowiedź 28 zaliczona!',
      prequelBtnTitle: '???',
      prequelBtnDesc: 'Zamiana postaci na Ronera zamiast Nikity (Prequel)',
      prequelSoonBadge: 'Wkrótce',
      prequelSoonNotice: 'Wkrótce — tryb prequela z Ronerem zamiast Nikity jest w produkcji!',
      partyBtn: 'Multiplayer Party',
      customizeBtn: 'Postać',
      customizerTitle: 'PERSONALIZACJA POSTACI',
      customizerSubtitle: 'Łącz w dowolnej kolejności części 3 głównych bohaterów',
      nicknameLabel: 'Nick',
      slotHead: 'Głowa / Twarz',
      slotHat: 'Czapka / Włosy',
      slotTorso: 'Bluza / Kurtka',
      slotWings: 'Skrzydła / Plecak',
      slotLegs: 'Spodnie / Buty',
      heroNikita: 'Nikita',
      heroRoner: 'RONER',
      heroSasha: 'Sasza',
      heroNone: 'Brak',
      randomMixBtn: 'Losowy miks',
      saveCustomBtn: 'Zapisz wygląd',
      partyTitle: 'MULTIPLAYER · PARTY',
      partyCreateTitle: 'Utwórz Party',
      partyCreateDesc: 'Stwórz pokój, wyślij kod znajomym, wybierz akt lub mini-grę i grajcie razem!',
      partyCreateBtn: 'Utwórz Party',
      partyJoinTitle: 'Dołącz kodem',
      partyCodePlaceholder: 'Kod (np. MIV42X)',
      partyJoinBtn: 'Dołącz',
      partyCodeLabel: 'Kod zaproszenia',
      partyCopyCode: 'Kopiuj kod',
      partyCopyLink: 'Kopiuj link',
      partyCopied: 'Skopiowano!',
      partyLeaveBtn: 'Opuść Party',
      partyMembersLabel: 'Gracze w Party',
      partyHostBadge: 'HOST',
      partyReadyBadge: 'GOTOWY',
      partyNotReadyBadge: 'CZEKA',
      partyToggleReady: 'Gotowość',
      partyModeSelectLabel: 'Wybór trybu (Akt lub Mini-gra)',
      partyHostOnlyHint: 'Host Party wybiera tryb i uruchamia grę',
      partyLaunchBtn: 'URUCHOM PARTY!',
      partyBackToLobbyBtn: 'Do lobby Party',
      partyTeammatesLabel: 'Drużyna',
      partyDownedMsg: 'Złapano cię! Odrodzenie przy drużynie za',
      partyErrorNotFound: 'Nie znaleziono Party o takim kodzie',
      partyErrorFull: 'Party jest pełne (maks. 8 graczy)',
      partyErrorConn: 'Brak połączenia z serwerem — spróbuj ponownie',
      closeSettings: 'Gotowe',
      touchLight: 'LATARKA',
      touchSprint: 'SPRINT',
      touchJump: 'SKOK',
    };
  }

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
      modeStory4: 'Story · Act 4',
      modeAct2Title: 'Act 2 · Factory',
      modeAct2Sub: '20 Mivinas + Corridor',
      modeAct3Sub: '30 Nights · Malinka Park',
      modeAct4Sub: 'JoJo Village · 7 Waves',
      modeAct2Tooltip: 'Secret: peek at Mivina Corporation factory entrance',
      act2SecretLink: 'Secret: Act 2 Entrance',
      act3SecretLink: 'Secret: Act 3 (Malinka)',
      modeFnafTitle: 'FNAF Epta',
      modeFnafSub: 'Endless Act 2',
      modeSniperTitle: 'Sniper Is Mine!',
      modeSniperSub: 'Endless Clones',
      modeAct3SurvivalTitle: 'Survival',
      modeAct3SurvivalSub: 'Endless Act 3',
      modeParkourTitle: 'Parkour',
      modeParkourSub: 'Giant Course',
      modePvzTitle: "Plants vs Roner's",
      modePvzSub: 'Turret Defense',
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
      descStory4:
        'Act 4 («JoJo» Village): Meet Giorno, get armed by Serious Sasha & Roner, survive 7 waves of RONER clones & Boss Sasha 67 (11488 HP), and unlock Uzi/AK-47/Sniper/RPG/Flamethrower & Auto-Turrets (kills are never spent)!',
      descFnaf:
        'FNAF Epta (Endless Act 2): Craft & pack batches of 20 Mivinas infinitely while hiding from blindfolded Sasha [E] and flashing RONER at windows [F]!',
      descSniper:
        'The Sniper Is Mine! (Endless Shooter): Blast waves of Sasha and RONER clones [LMB / E] with your sniper rifle and rack up 100 kills!',
      descAct3Survival:
        'Survival (Endless Act 3): Endless survival in Malinka Park! Gather logs & metal, upgrade your base, survive past Night 30 and reach 40 & 99 days!',
      descParkour:
        'Parkour: Leap across a giant sky obstacle course with moving platforms, narrow beams, bounce pads, and 4 checkpoints!',
      descPvz:
        "Plants vs Roner's: Plant Sunflowers, Pea Turrets, Repeaters, and Wall-Nuts [E / LMB] on the 5×8 lawn to stop 4 escalating RONER waves!",
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
      controlsHudAct4:
        'WASD Move · LMB Fire · 1-6 Weapons · E Shop / Talk · F Light · Esc Pause',
      controlsHudSniper:
        'WASD Move · Shift Run · Space Jump · LMB / E Sniper Fire · Mouse Aim · Esc Pause',
      controlsHudParkour:
        'WASD Move · Shift Sprint · Space Jump · Mouse Look · Esc Pause',
      controlsHudPvz:
        'WASD Move · 1-5 Select Plant / Shovel · E / LMB Plant / Dig · Esc Pause',
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
      cutsceneAct4: 'ACT 4 · «JOJO» VILLAGE',
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
      act4CardTitle: 'ACT 4 — «JOJO» VILLAGE!',
      act4CardSub: 'Meet Giorno, arm up from Sasha & Roner, defeat 7 waves & Boss Sasha 67!',
      act4EnterBtn: 'CONTINUE TO ACT 4: «JOJO» VILLAGE',
      act2SecretBtn: 'Secret: Show Factory Entrance',
      act2VictoryTitle: 'ACT 2 COMPLETE!',
      act2VictorySub: '20 Mushroom Mivinas crafted and packed!',
      act2VictorySaid: 'nikitys6666 sealed the export crate:',
      act3VictoryTitle: 'ACT 3 COMPLETE!',
      act3VictorySub: '30 Nights in Malinka Park survived! The RONER army is destroyed!',
      act3VictorySaid: 'nikitys6666 heads toward «JoJo» Village:',
      act4VictoryTitle: 'ACT 4 COMPLETE!',
      act4VictorySub: 'Boss Sasha 67 defeated! Mivina & tea party with Sasha and Roner!',
      act4VictorySaid: 'nikitys6666, Sasha & Roner at the table:',
      parkourVictoryTitle: 'PARKOUR COMPLETE!',
      parkourVictorySub: 'You reached the golden trophy at the top of the sky course!',
      parkourVictorySaid: 'nikitys6666 at the finish arch:',
      pvzVictoryTitle: 'LAWN DEFENDED!',
      pvzVictorySub: "All 4 waves of RONER's were stopped by your turrets!",
      pvzVictorySaid: 'nikitys6666, master gardener:',
      replayAct2: 'Play Act 2 Again',
      replayAct3: 'Play Act 3 Again',
      replayAct4: 'Play Act 4 Again',
      replayParkour: 'Play Parkour Again',
      replayPvz: "Play Plants vs Roner's Again",
      act3Badge: 'ACT 3 · MALINKA PARK',
      act3SurvivalBadge: 'SURVIVAL · ENDLESS',
      parkourBadge: 'PARKOUR · SKY COURSE',
      parkourCheckpointLabel: 'Checkpoint',
      parkourProgressLabel: 'Progress',
      pvzBadge: "PLANTS VS RONER'S",
      pvzEnergyLabel: 'Sun Energy',
      pvzWaveLabel: 'Wave',
      pvzEnemiesLabel: 'Enemies',
      pvzPlantBtn: 'PLANT [E]',
      pvzPlants: {
        sun: 'Sunflower (50)',
        peashooter: 'Pea Turret (75)',
        repeater: 'Twin Pea (125)',
        wallnut: 'Wall-Nut (50)',
        shovel: 'Shovel (0)',
      },
      act4Badge: 'ACT 4 · «JOJO» VILLAGE',
      act4WalkHouseObjective: 'Walk up to the house ahead where Sasha (visor) & Roner are waiting [E]',
      act4WaveLabel: 'Wave',
      act4EnemiesLeftLabel: 'Left',
      act4KillsLabel: 'Kills (not spent)',
      act4TurretsActive: 'Auto-Turrets ACTIVE',
      act4TurretsLocked: 'Auto-Turrets [100 kills]',
      act4TurretsUnlockBtn: 'Unlock Auto-Turrets (100)',
      act4Boss67Label: 'BOSS SASHA 67!!!!!!',
      act4Weapons: {
        pistol: 'Pistol',
        uzi: 'Uzi',
        ak47: 'AK-47',
        sniper: 'Sniper',
        rpg: 'RPG',
        flamethrower: 'Flamer',
      },
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
      statDays: 'Days',
      statBaseLv: 'Base Lv.',
      statKills: 'Kills',
      statWave: 'Wave',
      statCheckpoint: 'Checkpoint',
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
      hardcoreBurnoutMsg: 'HARDCORE 2:00 TIMER EXPIRED! The burning map consumed you!',
      playAgainBtn: 'PLAY AGAIN',
      restartHint: 'Press Enter or Space to play again',
      settingsTitle: 'SETTINGS',
      langLabel: 'Language',
      langRu: 'Русский (RU)',
      langEn: 'English (EN)',
      langPl: 'Polski (PL)',
      censorLabel: 'Censorship',
      censorDesc: 'Masks profanity with [***] and bleeps in voiceover',
      familyLabel: 'Family Mode',
      familyDesc: 'Friendly memes & clean dialogue (auto-enables censorship)',
      hardcoreLabel: 'Hardcore Mode',
      hardcoreDesc: 'Faster enemies, all maps catch fire & lethal 2:00 timer!',
      hardcoreActiveBadge: 'HARDCORE',
      hardcoreTimerLabel: 'FIRE',
      hardcoreActsProgress: 'Hardcore Acts:',
      voidLabel: 'Void Mode',
      voidDesc: 'Extremely thick pitch-black fog across every map',
      graphicsLabel: 'Graphics',
      graphicsLow: 'Low',
      graphicsMedium: 'Medium',
      graphicsHigh: 'High',
      mobileModeLabel: 'Mobile Device Mode',
      mobileModeDesc: 'On-screen buttons, compact HUD & portrait orientation lock',
      autoAimLabel: 'Auto-Aim',
      autoAimDesc: 'Smoothly tracks targets on firearms (gradual, not instant)',
      autoAimActiveBadge: 'AUTO-AIM',
      portraitBlockTitle: 'ROTATE DEVICE HORIZONTALLY',
      portraitBlockDesc: 'Mobile Mode disables vertical orientation. Turn your screen to landscape to play!',
      act3RiddleTitle: 'JACQUE FRESCO RIDDLE',
      act3RiddlePrompt: 'The corner park sign asks: P + P = ? Enter the answer:',
      act3RiddlePlaceholder: 'Your answer...',
      act3RiddleSubmit: 'Submit',
      act3RiddleCancel: 'Close',
      act3RiddleWrong: 'Wrong! Think like Jacque Fresco...',
      act3RiddleSolved: 'Correct! 28 solved!',
      prequelBtnTitle: '???',
      prequelBtnDesc: 'Switch player character to Roner instead of Nikita (Prequel)',
      prequelSoonBadge: 'Coming soon',
      prequelSoonNotice: 'Coming soon — the Roner prequel playable character is in development!',
      partyBtn: 'Multiplayer Party',
      customizeBtn: 'Customize',
      customizerTitle: 'CHARACTER CUSTOMIZER',
      customizerSubtitle: 'Mix & match items from the 3 main heroes in any order',
      nicknameLabel: 'Nickname',
      slotHead: 'Head / Face',
      slotHat: 'Hat / Hair',
      slotTorso: 'Hoodie / Jacket',
      slotWings: 'Wings / Back',
      slotLegs: 'Pants / Shoes',
      heroNikita: 'Nikita',
      heroRoner: 'RONER',
      heroSasha: 'Sasha',
      heroNone: 'None',
      randomMixBtn: 'Random Mix',
      saveCustomBtn: 'Save Skin',
      partyTitle: 'MULTIPLAYER · PARTY',
      partyCreateTitle: 'Create Party',
      partyCreateDesc: 'Create a room, share the invite code with friends, pick any Act or Minigame & launch!',
      partyCreateBtn: 'Create Party',
      partyJoinTitle: 'Join with Code',
      partyCodePlaceholder: 'Code (e.g. MIV42X)',
      partyJoinBtn: 'Join',
      partyCodeLabel: 'Invite Code',
      partyCopyCode: 'Copy Code',
      partyCopyLink: 'Copy Link',
      partyCopied: 'Copied!',
      partyLeaveBtn: 'Leave Party',
      partyMembersLabel: 'Party Members',
      partyHostBadge: 'HOST',
      partyReadyBadge: 'READY',
      partyNotReadyBadge: 'WAIT',
      partyToggleReady: 'Ready',
      partyModeSelectLabel: 'Select Mode (Act or Minigame)',
      partyHostOnlyHint: 'The Party Host picks the mode and launches the match',
      partyLaunchBtn: 'LAUNCH PARTY!',
      partyBackToLobbyBtn: 'Party Lobby',
      partyTeammatesLabel: 'Party',
      partyDownedMsg: 'Caught! Respawning near teammates in',
      partyErrorNotFound: 'No Party found with that invite code',
      partyErrorFull: 'This Party is already full (max 8 players)',
      partyErrorConn: 'Connecting to server — please try again',
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
    modeStory4: 'История · Акт 4',
    modeAct2Title: 'Акт 2 · Завод',
    modeAct2Sub: '20 мивин + Коридор',
    modeAct3Sub: '30 ночей · Парк Малинка',
    modeAct4Sub: 'Деревня ДжоДжо · 7 волн',
    modeAct2Tooltip: 'Секрет: посмотреть вход на завод «Мивина Корпорейшен»',
    act2SecretLink: 'Секрет: Вход Акт 2',
    act3SecretLink: 'Секрет: Акт 3 (Малинка)',
    modeFnafTitle: 'Фнаф Епта',
    modeFnafSub: 'Бесконечный Акт 2',
    modeSniperTitle: 'Снайперка теперь моя!',
    modeSniperSub: 'Клоны Сани и RONER',
    modeAct3SurvivalTitle: 'Выжывачь',
    modeAct3SurvivalSub: 'Бесконечный Акт 3',
    modeParkourTitle: 'Паркур',
    modeParkourSub: 'Большой паркур',
    modePvzTitle: "Ростения vs Roner's",
    modePvzSub: 'Турели и волны',
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
    descStory4:
      'Акт 4 (Деревня «ДжоДжо»): Встреть Джорно, дойди до домика Сани и Roner, отбей 7 волн клонов RONER и Босса Саню 67 (11488 HP)! Пушки (Узи/АК-47/Снайперка/Гранатомёт/Огнемёт) и Пулемёты открываются за килы — килы не тратятся!',
    descFnaf:
      'Фнаф Епта (Бесконечный Акт 2): Делай партии по 20 мивин бесконечно, прячься в шкаф [E] когда мигает свет и отгоняй фонариком [F] RONER от окон!',
    descSniper:
      'Снайперка теперь моя! (Бесконечный режим): Отстреливай волны клонов Сани и RONER из снайперской винтовки [ЛКМ / E]!',
    descAct3Survival:
      'Выжывачь (Бесконечный Акт 3): Бесконечное выживание в парке «Малинка»! Проживи 40 и 99 дней ради редких достижений!',
    descParkour:
      'Паркур: Огромная полоса препятствий в небе с движущимися платформами, батутами, узкими балками и 4 чекпоинтами!',
    descPvz:
      "Ростения против Roner's: Расставляй Подсолнухи, Горохострелы, Двойные турели и Орехи [E / ЛКМ] на газоне 5×8 и отбей 4 волны RONER!",
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
    controlsHudAct4:
      'WASD Идти · ЛКМ Огонь · 1-6 Пушки · E Покупка / Диалог · F Фонарик · Esc Пауза',
    controlsHudSniper:
      'WASD Идти · Shift Бег · Space Прыжок · ЛКМ / E Выстрел со снайперки · Мышь Прицел · Esc Пауза',
    controlsHudParkour:
      'WASD Идти · Shift Рывок · Space Прыжок · Мышь Камера · Esc Пауза',
    controlsHudPvz:
      'WASD Идти · 1-5 Выбор растения / лопаты · E / ЛКМ Посадить / Выкопать · Esc Пауза',
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
    cutsceneAct4: 'АКТ 4 · ДЕРЕВНЯ «ДЖОДЖО»',
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
    act4CardTitle: 'АКТ 4 — ДЕРЕВНЯ «ДЖОДЖО»!',
    act4CardSub: 'Встреть Джорно, возьми пушку у Саши и Roner, отбей 7 волн и Босса Саню 67!',
    act4EnterBtn: 'ПЕРЕЙТИ К АКТУ 4: ДЕРЕВНЯ «ДЖОДЖО»',
    act2SecretBtn: 'Секрет: Показать вход Акта 2',
    act2VictoryTitle: 'АКТ 2 ПРОЙДЕН!',
    act2VictorySub: '20 грибных мивин произведено и упаковано!',
    act2VictorySaid: 'nikitys6666 запечатал ящик с мивиной:',
    act3VictoryTitle: 'АКТ 3 ПРОЙДЕН!',
    act3VictorySub: '30 ночей в парке «Малинка» прожиты! Армия RONER уничтожена!',
    act3VictorySaid: 'nikitys6666 шагает в деревню «ДжоДжо»:',
    act4VictoryTitle: 'АКТ 4 ПРОЙДЕН!',
    act4VictorySub: 'Босс Саня 67 повержен! Никита, Саша и Roner кушают мивину и пьют чай!',
    act4VictorySaid: 'nikitys6666, Саша и Roner за столом:',
    parkourVictoryTitle: 'ПАРКУР ПРОЙДЕН!',
    parkourVictorySub: 'Ты добрался до золотого кубка на вершине огромного паркура!',
    parkourVictorySaid: 'nikitys6666 на финише:',
    pvzVictoryTitle: 'ГАЗОН ЗАЩИЩЁН!',
    pvzVictorySub: "Все 4 волны RONER's остановлены твоими турелями!",
    pvzVictorySaid: 'nikitys6666 — грозный садовник:',
    replayAct2: 'Пройти Акт 2 ещё раз',
    replayAct3: 'Пройти Акт 3 ещё раз',
    replayAct4: 'Пройти Акт 4 ещё раз',
    replayParkour: 'Пройти Паркур ещё раз',
    replayPvz: "Сыграть в Ростения vs Roner's ещё раз",
    act3Badge: 'АКТ 3 · ПАРК «МАЛИНКА»',
    act3SurvivalBadge: 'ВЫЖЫВАЧЬ · БЕСКОНЕЧНЫЙ',
    parkourBadge: 'ПАРКУР · ПОЛОСА ПРЕПЯТСТВИЙ',
    parkourCheckpointLabel: 'Чекпоинт',
    parkourProgressLabel: 'Прогресс',
    pvzBadge: "РОСТЕНИЯ ПРОТИВ RONER'S",
    pvzEnergyLabel: 'Энергия',
    pvzWaveLabel: 'Волна',
    pvzEnemiesLabel: 'Враги',
    pvzPlantBtn: 'ПОСАДИТЬ [E]',
    pvzPlants: {
      sun: 'Подсолнух (50)',
      peashooter: 'Горох-турель (75)',
      repeater: 'Двойная (125)',
      wallnut: 'Орех-щит (50)',
      shovel: 'Лопата (0)',
    },
    act4Badge: 'АКТ 4 · ДЕРЕВНЯ «ДЖОДЖО»',
    act4WalkHouseObjective: 'Дойди до домика впереди, где ждут Саша (с визором) и Roner [E]',
    act4WaveLabel: 'Волна',
    act4EnemiesLeftLabel: 'Осталось',
    act4KillsLabel: 'Килы (не тратятся)',
    act4TurretsActive: 'Пулемёты АКТИВНЫ',
    act4TurretsLocked: 'Пулемёты [100 килов]',
    act4TurretsUnlockBtn: 'Взять пулемёты (100)',
    act4Boss67Label: 'БОСС САНЯ 67!!!!!!',
    act4Weapons: {
      pistol: 'Пистолет',
      uzi: 'Узи',
      ak47: 'АК-47',
      sniper: 'Снайперка',
      rpg: 'Гранатомёт',
      flamethrower: 'Огнемёт',
    },
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
    statDays: 'Дней',
    statBaseLv: 'Ур. базы',
    statKills: 'Килы',
    statWave: 'Волна',
    statCheckpoint: 'Точка',
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
    hardcoreBurnoutMsg: 'СМЕРТЕЛЬНЫЙ ТАЙМЕР ХАРДКОРА (2:00) ИСТЁК! Карта сгорела вместе с тобой!',
    playAgainBtn: 'ИГРАТЬ СНОВА',
    restartHint: 'Нажми Enter или Space чтобы начать заново',
    settingsTitle: 'НАСТРОЙКИ',
    langLabel: 'Язык',
    langRu: 'Русский (RU)',
    langEn: 'English (EN)',
    langPl: 'Polski (PL)',
    censorLabel: 'Цензура',
    censorDesc: 'Скрывает мат под [***] и запикивает в озвучке',
    familyLabel: 'Семейный режим',
    familyDesc: 'Добрые шутки и чистые реплики (включает цензуру)',
    hardcoreLabel: 'Режим Хардкор',
    hardcoreDesc: 'Враги быстрее, все карты горят в огне + смертельный таймер 2:00!',
    hardcoreActiveBadge: 'ХАРДКОР',
    hardcoreTimerLabel: 'ОГОНЬ',
    hardcoreActsProgress: 'Акты в Хардкоре:',
    voidLabel: 'Режим пустоты',
    voidDesc: 'ОЧЕНЬ густой чёрный туман на всех картах',
    graphicsLabel: 'Графика',
    graphicsLow: 'Низкая',
    graphicsMedium: 'Средняя',
    graphicsHigh: 'Высокая',
    mobileModeLabel: 'Режим для мобильных',
    mobileModeDesc: 'Кнопки на экране, сжатый интерфейс и запрет вертикального экрана',
    autoAimLabel: 'Auto-Aim',
    autoAimDesc: 'Плавная авто-наводка на врагов для огнестрела (не моментальная)',
    autoAimActiveBadge: 'AUTO-AIM',
    portraitBlockTitle: 'ПОВЕРНИ УСТРОЙСТВО ГОРИЗОНТАЛЬНО',
    portraitBlockDesc: 'В мобильном режиме нельзя играть в вертикальном положении. Переверни экран горизонтально!',
    act3RiddleTitle: 'ЗАГАДКА ОТ ЖАКА ФРЕСКО',
    act3RiddlePrompt: 'На табличке в углу парка написано: P + P = ? Введи ответ:',
    act3RiddlePlaceholder: 'Введи число...',
    act3RiddleSubmit: 'Ответить',
    act3RiddleCancel: 'Закрыть',
    act3RiddleWrong: 'Неверно! Вспомни классику от Жака Фреско...',
    act3RiddleSolved: 'Верно! Ответ 28 принят!',
    prequelBtnTitle: '???',
    prequelBtnDesc: 'Сменить персонажа на Roner вместо Никиты (Предыстория)',
    prequelSoonBadge: 'Скоро будет',
    prequelSoonNotice: 'Скоро будет — предыстория с игрой за Roner находится в разработке!',
    partyBtn: 'Мультиплеер Party',
    customizeBtn: 'Персонаж',
    customizerTitle: 'КАСТОМИЗАЦИЯ ПЕРСОНАЖА',
    customizerSubtitle: 'Ставь в любом порядке вещи с 3 главных героев (Никита, RONER, Саша)',
    nicknameLabel: 'Никнейм',
    slotHead: 'Голова / Лицо',
    slotHat: 'Шапка / Волосы',
    slotTorso: 'Кофта / Куртка',
    slotWings: 'Крылья / Спина',
    slotLegs: 'Штаны / Кроссовки',
    heroNikita: 'Никита',
    heroRoner: 'RONER',
    heroSasha: 'Саша',
    heroNone: 'Без шапки',
    randomMixBtn: 'Случайный микс',
    saveCustomBtn: 'Сохранить скин',
    partyTitle: 'МУЛЬТИПЛЕЕР · PARTY',
    partyCreateTitle: 'Создать Party',
    partyCreateDesc: 'Создай комнату, пригласи друзей по коду, выбери акт или мини-игру и запускай!',
    partyCreateBtn: 'Создать Party',
    partyJoinTitle: 'Войти в Party по коду',
    partyCodePlaceholder: 'Код (напр. MIV42X)',
    partyJoinBtn: 'Войти',
    partyCodeLabel: 'Код приглашения',
    partyCopyCode: 'Копировать код',
    partyCopyLink: 'Копировать ссылку',
    partyCopied: 'Скопировано!',
    partyLeaveBtn: 'Выйти из Party',
    partyMembersLabel: 'Игроки в Party',
    partyHostBadge: 'ХОСТ',
    partyReadyBadge: 'ГОТОВ',
    partyNotReadyBadge: 'ЖДЁТ',
    partyToggleReady: 'Готов',
    partyModeSelectLabel: 'Выбор режима (Акт или Мини-игра)',
    partyHostOnlyHint: 'Режим и старт выбирает хост Party',
    partyLaunchBtn: 'ЗАПУСТИТЬ PARTY!',
    partyBackToLobbyBtn: 'В лобби Party',
    partyTeammatesLabel: 'Команда',
    partyDownedMsg: 'Тебя поймали! Возрождение у команды через',
    partyErrorNotFound: 'Party с таким кодом не найдено',
    partyErrorFull: 'В этом Party уже максимум игроков (8)',
    partyErrorConn: 'Подключение к серверу — попробуй ещё раз',
    closeSettings: 'Готово',
    touchLight: 'ФОНАРЬ',
    touchSprint: 'РЫВОК',
    touchJump: 'ПРЫЖОК',
  };
}
