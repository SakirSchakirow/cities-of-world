export type Language = 'en' | 'de';

import {
  IMPRINT_OWNER_NAME,
  IMPRINT_OWNER_TOWN_DE,
  IMPRINT_OWNER_TOWN_EN,
} from '../config/imprint';

export const TRANSLATIONS = {
  en: {
    brandTitle: 'Cities of World',
    sound: 'Sound',
    muted: 'Muted',
    privacyShort: 'Privacy',
    privacyFull: 'Privacy & Disclaimer',
    startMatch: 'Start Match',
    newMatch: 'New Match',

    // Setup
    tagline: 'Global Geography Chain',
    setupDesc:
      'Link cities around the 3D globe from last letter to first. Farther jumps score bigger points, with bonus points for cities hosting a GDG chapter as of 2026 (including Linz).',
    opponentMode: 'Opponent Mode',
    soloVsAi: 'Solo vs AI',
    soloDesc: 'Compete against Atlas AI',
    sharedKeyboard: 'Shared Keyboard',
    pvpDesc: '2 players take turns locally',
    player1Label: 'Player 1',
    player2Label: 'Player 2',
    competitorLabel: 'Competitor',
    ready: 'Ready',
    turnStructure: 'Match Length & Structure',
    roundsMode: 'Rounds (each)',
    movesMode: 'Total Turns',
    turnsCountLabel: 'Number of Cities / Turns',
    estPlayTime: 'Estimated play time',
    minUnit: 'min',
    turnClockLabel: 'Turn Clock',
    secondsShort: 's',
    ruleClockTitle: 'Turn Clock',
    ruleClockDesc: 'Misspellings allowed, except the first letter.',
    ruleDistTitle: 'Distance Points',
    ruleDistDesc: '1 point per 20 km great-circle jump.',
    ruleGdgTitle: 'GDG City +100 pts',
    ruleGdgDesc: 'Cities with a GDG chapter as of 2026 (incl. Linz).',
    chartingCity: 'Charting Starting City...',
    localPrivacyNote: 'Runs 100% in your browser · No cookies',

    // Active HUD
    activeLabel: 'Active',
    pts: 'pts',
    matchComplete: 'Match Complete',
    roundOf: (r: number, total: number) => `Round ${r} of ${total}`,
    turnOf: (t: number, total: number) => `Turn ${t} of ${total}`,
    currentCity: 'Current',
    routeLabel: 'Route',
    showDock: 'Show Turn Dock',
    hideControls: 'Hide Controls',
    turnBreakdown: 'Turn Breakdown',
    clickToFocus: 'Click any row to focus globe',
    colTurn: '#',
    colPlayer: 'Player',
    colCity: 'City',
    colDistance: 'Distance',
    colPoints: 'Points',
    startTag: 'Start',
    originTag: 'Origin',
    fromQuery: (q: string) => `from "${q}"`,
    timedOutNeeded: (letter: string) => `Timed out (needed "${letter}")`,
    playersTurn: (name: string) => `${name}'s Turn`,
    startWith: 'Start with',
    logLabel: (n: number) => `Log (${n})`,
    routeLogLabel: (n: number) => `Route Log (${n})`,
    hideLog: 'Hide Log',
    inputPlaceholder: (letter: string) => `Type a city starting with "${letter}"...`,
    submit: 'Submit',
    aiThinking: (name: string, letter: string) =>
      `${name} is picking a city starting with "${letter}"...`,
    aiReady: (name: string) => `${name} ready`,
    inspectingRoute: 'Inspecting Final Route',
    dragToRotate: 'Drag to rotate globe or tap any city above',
    viewFinalScoreboard: 'View Final Scoreboard',

    // Feedback & Errors
    startingPrompt: (city: string, player: string, letter: string) =>
      `Starting city: ${city}. ${player}, enter a city starting with "${letter}".`,
    errEmpty: 'Please type a city name.',
    errWrongFirstLetter: (typed: string, req: string) =>
      `Starts with "${typed}", but must start with "${req}". You can misspell the city, not its first letter.`,
    errAlreadyUsed: (city: string) => `${city} has already been played in this match.`,
    errNotFound: (req: string, query: string) =>
      `No known city starting with "${req}" matched "${query}".`,
    matchedFrom: (query: string) => `Matched "${query}" → `,
    gdgBonusTag: (pts: number) => ` (+${pts} GDG Chapter)`,
    ranOutOfTime: (player: string, letter: string) =>
      `${player} ran out of time! The next city must still start with "${letter}".`,
    aiPassed: (name: string, letter: string) =>
      `${name} passed on "${letter}". Your turn!`,

    // Summary Modal
    finalStandings: 'Final Standings',
    playerWins: (name: string) => `${name} Wins!`,
    drawMatch: 'Draw Match',
    totalRoute: 'Total Route',
    longestFlight: 'Longest Flight',
    gdgBonuses: 'GDG Chapter Bonuses',
    citySingular: 'city',
    cityPlural: 'cities',
    gdgChapterBadge: 'GDG Chapter',
    shareResult: 'Share Your Result',
    copyBtn: 'Copy',
    shareMoreBtn: 'Share...',
    copiedLinkedIn: 'Result copied — paste it into your LinkedIn post!',
    copiedClipboard: 'Result copied to clipboard!',
    copyFailed: 'Copy failed — select and copy your route manually.',
    inspectGlobe: 'Inspect 3D Globe',
    playAgain: 'Play Again',
    shareTemplate: (
      winnerText: string,
      p1Score: string,
      p2Score: string,
      dist: string,
      gdgText: string,
      chain: string,
    ) =>
      `Cities of World — ${winnerText} (${p1Score} vs ${p2Score} pts)\nTotal route: ${dist}${gdgText}\nRoute: ${chain}`,

    // Privacy & Disclaimer Modal
    privacyTitle: 'Privacy Policy & Disclaimer',
    privacyClose: 'Close',
    privacySec1Title: '1. Zero Personal Data Storage',
    privacySec1Body:
      "This game runs 100% locally inside your web browser. Any player names, city entries, scores, or match histories exist strictly in your browser's temporary session memory and vanish as soon as you close or refresh the page. The game itself does not collect, transmit, log, or store any personal data on any server or database. For the technical data processed by the hosting and font providers, see section 6.",
    privacySec2Title: '2. No Cookies & No Tracking',
    privacySec2Body:
      'This website does not set or read any cookies (first-party or third-party), does not use browser localStorage or fingerprinting for tracking, and contains no analytics, advertising, or behavioral tracking scripts.',
    privacySec3Title: '3. Trademark & Affiliation Disclaimer',
    privacySec3Body1:
      'The creator of this application does not own any trademarks, service marks, brand names, or organization names referenced in the game—including "Google", "GDG", "Google Developers Group", "LinkedIn", or any city/country names and social platform marks. All trademarks remain the exclusive property of their respective owners.',
    privacySec3Body2:
      'This is an independent, non-commercial educational geography game and is not affiliated with, sponsored by, or endorsed by Google LLC or any local GDG chapter.',
    privacySec4Title: '4. External Share Links',
    privacySec4Body:
      'If you choose to share your match score via LinkedIn, X, or WhatsApp, your browser opens those third-party platforms directly under their own privacy policies and terms of service.',
    privacySec5Title: '5. City Data Source',
    privacySec5Body:
      'City names, their Latin-script spellings, coordinates and population figures come from GeoNames, licensed under Creative Commons Attribution 4.0. A few German exonyms (e.g. Wien, Mailand) were added by hand.',
    privacySec5LinkLabel: 'GeoNames geographical database',
    privacySec5LicenseLabel: 'CC BY 4.0 license',
    privacySec6Title: '6. Hosting & Web Fonts',
    privacySec6Body:
      'This website is hosted on GitHub Pages (GitHub, Inc.). When you open it, GitHub necessarily processes technical data such as your IP address, browser type and time of access to deliver the page and keep it secure. Fonts are loaded from Google Fonts (Google LLC), so your browser also sends your IP address to Google. Neither service sets cookies on this site. Their own privacy policies apply.',
    privacySec6GithubLabel: 'GitHub Privacy Statement',
    privacySec6GoogleLabel: 'Google Privacy Policy',
    privacySec7Title: '7. No Warranty',
    privacySec7Body:
      'This game is provided free of charge, "as is" and "as available", without any warranty of any kind, express or implied, including but not limited to warranties of correctness, completeness, availability, fitness for a particular purpose, or freedom from errors. The game may be changed, interrupted or taken offline at any time without notice.',
    privacySec8Title: '8. Accuracy of Geographic Information',
    privacySec8Body1:
      'City names, spellings, coordinates, population figures, distances, scores and map outlines are provided for entertainment and educational purposes only. They may be incomplete, outdated or inaccurate and must not be used for navigation, travel planning, research or any other decision.',
    privacySec8Body2:
      'The names, borders and outlines shown do not imply any opinion whatsoever concerning the legal status of any country, territory, city or area, or of its authorities, or concerning the delimitation of its frontiers or boundaries.',
    privacySec9Title: '9. Limitation of Liability',
    privacySec9Body:
      'To the fullest extent permitted by applicable law, the creator accepts no liability for any direct, indirect, incidental or consequential damages, losses or costs arising from the use of, or inability to use, this game or the information it contains. This does not limit liability that cannot be excluded by law, in particular for intent, gross negligence, or injury to life, body or health.',
    privacySec10Title: '10. External Links',
    privacySec10Body:
      'This game contains links to third-party websites. The creator has no influence over their content and accepts no responsibility for it; the respective provider or operator is solely responsible. No unlawful content was apparent at the time of linking. If any infringements become known, such links will be removed promptly.',
    privacySec11Title: '11. Legal Notice (Impressum)',
    privacySec11Owner: `Media owner: ${IMPRINT_OWNER_NAME}, ${IMPRINT_OWNER_TOWN_EN}.`,
    privacySec11Body:
      'Disclosure pursuant to § 25 of the Austrian Media Act (Mediengesetz): private, non-commercial geography game with no intention of influencing public opinion.',
  },
  de: {
    brandTitle: 'Städte der Welt',
    sound: 'Ton',
    muted: 'Stumm',
    privacyShort: 'Datenschutz',
    privacyFull: 'Datenschutz & Hinweise',
    startMatch: 'Spiel starten',
    newMatch: 'Neues Spiel',

    // Setup
    tagline: 'Globale Geografie-Kette',
    setupDesc:
      'Verbinde Städte auf dem 3D-Globus vom Endbuchstaben zum Anfangsbuchstaben. Weitere Entfernungen bringen mehr Punkte – plus Zusatzpunkte für Städte mit einer GDG-Gruppe (Stand 2026, inklusive Linz).',
    opponentMode: 'Spielmodus',
    soloVsAi: 'Allein gegen KI',
    soloDesc: 'Spiele gegen Atlas KI',
    sharedKeyboard: 'Geteilte Tastatur',
    pvpDesc: '2 Personen abwechselnd',
    player1Label: 'Spieler 1',
    player2Label: 'Spieler 2',
    competitorLabel: 'Gegner',
    ready: 'Bereit',
    turnStructure: 'Spielumfang & Modus',
    roundsMode: 'Runden (je)',
    movesMode: 'Züge gesamt',
    turnsCountLabel: 'Anzahl der Städte / Züge',
    estPlayTime: 'Geschätzte Spielzeit',
    minUnit: 'Min.',
    turnClockLabel: 'Zugzeit',
    secondsShort: 's',
    ruleClockTitle: 'Zug-Timer',
    ruleClockDesc: 'Tippfehler erlaubt, außer beim ersten Buchstaben.',
    ruleDistTitle: 'Entfernungspunkte',
    ruleDistDesc: '1 Punkt pro 20 km Luftlinie.',
    ruleGdgTitle: 'GDG-Stadt +100 Pkt.',
    ruleGdgDesc: 'Städte mit GDG-Gruppe (2026, inkl. Linz).',
    chartingCity: 'Startstadt wird gewählt...',
    localPrivacyNote: 'Läuft 100% lokal im Browser · Keine Cookies',

    // Active HUD
    activeLabel: 'Aktiv',
    pts: 'Pkt.',
    matchComplete: 'Spiel beendet',
    roundOf: (r: number, total: number) => `Runde ${r} von ${total}`,
    turnOf: (t: number, total: number) => `Zug ${t} von ${total}`,
    currentCity: 'Aktuell',
    routeLabel: 'Route',
    showDock: 'Steuerung zeigen',
    hideControls: 'Ausblenden',
    turnBreakdown: 'Zug-Übersicht',
    clickToFocus: 'Zeile antippen, um den Globus zu fokussieren',
    colTurn: '#',
    colPlayer: 'Spieler',
    colCity: 'Stadt',
    colDistance: 'Distanz',
    colPoints: 'Punkte',
    startTag: 'Start',
    originTag: 'Start',
    fromQuery: (q: string) => `aus „${q}“`,
    timedOutNeeded: (letter: string) => `Zeit abgelaufen („${letter}“ nötig)`,
    playersTurn: (name: string) => `${name} ist am Zug`,
    startWith: 'Beginne mit',
    logLabel: (n: number) => `Verlauf (${n})`,
    routeLogLabel: (n: number) => `Routenverlauf (${n})`,
    hideLog: 'Verlauf schließen',
    inputPlaceholder: (letter: string) => `Stadt mit „${letter}“ eingeben...`,
    submit: 'Senden',
    aiThinking: (name: string, letter: string) =>
      `${name} wählt eine Stadt mit „${letter}“...`,
    aiReady: (name: string) => `${name} bereit`,
    inspectingRoute: 'Endroute ansehen',
    dragToRotate: 'Globus drehen oder Stadt oben antippen',
    viewFinalScoreboard: 'Endergebnis anzeigen',

    // Feedback & Errors
    startingPrompt: (city: string, player: string, letter: string) =>
      `Startstadt: ${city}. ${player}, gib eine Stadt mit „${letter}“ ein.`,
    errEmpty: 'Bitte gib einen Stadtnamen ein.',
    errWrongFirstLetter: (typed: string, req: string) =>
      `Beginnt mit „${typed}“, muss aber mit „${req}“ beginnen. Tippfehler sind erlaubt, nur nicht beim ersten Buchstaben.`,
    errAlreadyUsed: (city: string) => `${city} wurde in diesem Spiel bereits genannt.`,
    errNotFound: (req: string, query: string) =>
      `Keine bekannte Stadt mit „${req}“ passte zu „${query}“.`,
    matchedFrom: (query: string) => `Erkannt aus „${query}“ → `,
    gdgBonusTag: (pts: number) => ` (+${pts} GDG-Gruppe)`,
    ranOutOfTime: (player: string, letter: string) =>
      `${player} hat keine Zeit mehr! Die nächste Stadt muss weiterhin mit „${letter}“ beginnen.`,
    aiPassed: (name: string, letter: string) =>
      `${name} hat bei „${letter}“ gepasst. Du bist dran!`,

    // Summary Modal
    finalStandings: 'Endergebnis',
    playerWins: (name: string) => `${name} gewinnt!`,
    drawMatch: 'Unentschieden',
    totalRoute: 'Gesamtstrecke',
    longestFlight: 'Weiteste Strecke',
    gdgBonuses: 'GDG-Städte-Boni',
    citySingular: 'Stadt',
    cityPlural: 'Städte',
    gdgChapterBadge: 'GDG-Stadt',
    shareResult: 'Ergebnis teilen',
    copyBtn: 'Kopieren',
    shareMoreBtn: 'Teilen...',
    copiedLinkedIn: 'Ergebnis kopiert – einfach in deinen LinkedIn-Beitrag einfügen!',
    copiedClipboard: 'Ergebnis in die Zwischenablage kopiert!',
    copyFailed: 'Kopieren fehlgeschlagen – bitte Text manuell kopieren.',
    inspectGlobe: '3D-Globus ansehen',
    playAgain: 'Nochmal spielen',
    shareTemplate: (
      winnerText: string,
      p1Score: string,
      p2Score: string,
      dist: string,
      gdgText: string,
      chain: string,
    ) =>
      `Städte der Welt — ${winnerText} (${p1Score} vs. ${p2Score} Pkt.)\nGesamtstrecke: ${dist}${gdgText}\nRoute: ${chain}`,

    // Privacy & Disclaimer Modal
    privacyTitle: 'Datenschutz & Haftungsausschluss',
    privacyClose: 'Schließen',
    privacySec1Title: '1. Keine Speicherung personenbezogener Daten',
    privacySec1Body:
      'Dieses Spiel läuft zu 100 % lokal in deinem Webbrowser. Eingegebene Spielernamen, Städte, Punktestände und Spielverläufe existieren ausschließlich im temporären Arbeitsspeicher deiner Sitzung und werden beim Schließen oder Neuladen sofort gelöscht. Das Spiel selbst überträgt oder speichert keine personenbezogenen Daten auf Servern oder in Datenbanken. Zu den technischen Daten, die beim Hosting- und Schriftanbieter anfallen, siehe Abschnitt 6.',
    privacySec2Title: '2. Keine Cookies & kein Tracking',
    privacySec2Body:
      'Diese Website setzt und liest keinerlei Cookies (weder eigene noch Drittanbieter-Cookies), verwendet kein Tracking über localStorage oder Fingerprinting und enthält keinerlei Analyse-, Werbe- oder Tracking-Skripte.',
    privacySec3Title: '3. Markenrechte & Unabhängigkeitshinweis',
    privacySec3Body1:
      'Der Ersteller dieser Anwendung besitzt keinerlei Marken-, Dienstleistungs-, Firmen- oder Organisationsrechte an den im Spiel genannten Namen – einschließlich „Google“, „GDG“, „Google Developers Group“, „LinkedIn“ sowie sämtlicher Plattform-, Städte- und Ländernamen. Alle Markenrechte liegen ausschließlich bei den jeweiligen Rechteinhabern.',
    privacySec3Body2:
      'Dies ist ein unabhängiges, nicht-kommerzielles Geografie-Lernspiel und steht in keiner Verbindung zu Google LLC oder einzelnen lokalen GDG-Gruppen und wird von diesen weder gesponsert noch unterstützt.',
    privacySec4Title: '4. Externe Teilen-Links',
    privacySec4Body:
      'Wenn du dein Ergebnis über LinkedIn, X oder WhatsApp teilst, öffnet dein Browser diese externen Plattformen direkt unter deren jeweiligen Datenschutzbestimmungen und Nutzungsbedingungen.',
    privacySec5Title: '5. Quelle der Städtedaten',
    privacySec5Body:
      'Städtenamen, ihre Schreibweisen in lateinischer Schrift, Koordinaten und Einwohnerzahlen stammen von GeoNames, lizenziert unter Creative Commons Namensnennung 4.0. Einige deutsche Exonyme (z. B. Wien, Mailand) wurden manuell ergänzt.',
    privacySec5LinkLabel: 'Geografische Datenbank GeoNames',
    privacySec5LicenseLabel: 'Lizenz CC BY 4.0',
    privacySec6Title: '6. Hosting & Web-Schriftarten',
    privacySec6Body:
      'Diese Website wird über GitHub Pages (GitHub, Inc.) bereitgestellt. Beim Aufruf verarbeitet GitHub zwangsläufig technische Daten wie deine IP-Adresse, den Browsertyp und den Zeitpunkt des Zugriffs, um die Seite auszuliefern und abzusichern. Schriftarten werden von Google Fonts (Google LLC) geladen, wodurch dein Browser deine IP-Adresse auch an Google übermittelt. Keiner der beiden Dienste setzt auf dieser Website Cookies. Es gelten deren eigene Datenschutzbestimmungen.',
    privacySec6GithubLabel: 'Datenschutzerklärung von GitHub',
    privacySec6GoogleLabel: 'Datenschutzerklärung von Google',
    privacySec7Title: '7. Keine Gewährleistung',
    privacySec7Body:
      'Dieses Spiel wird unentgeltlich, „wie besehen“ und „wie verfügbar“ bereitgestellt, ohne jegliche ausdrückliche oder stillschweigende Gewährleistung, insbesondere nicht für Richtigkeit, Vollständigkeit, Verfügbarkeit, Eignung für einen bestimmten Zweck oder Fehlerfreiheit. Das Spiel kann jederzeit ohne Ankündigung geändert, unterbrochen oder eingestellt werden.',
    privacySec8Title: '8. Richtigkeit geografischer Angaben',
    privacySec8Body1:
      'Städtenamen, Schreibweisen, Koordinaten, Einwohnerzahlen, Entfernungen, Punktestände und Kartenumrisse dienen ausschließlich der Unterhaltung und Bildung. Sie können unvollständig, veraltet oder fehlerhaft sein und dürfen nicht zur Navigation, Reiseplanung, Recherche oder für sonstige Entscheidungen verwendet werden.',
    privacySec8Body2:
      'Die dargestellten Namen, Grenzen und Umrisse stellen keinerlei Stellungnahme zum völkerrechtlichen Status eines Landes, Gebiets, einer Stadt oder Region bzw. deren Behörden oder zum Verlauf ihrer Grenzen dar.',
    privacySec9Title: '9. Haftungsbeschränkung',
    privacySec9Body:
      'Soweit gesetzlich zulässig, übernimmt der Ersteller keine Haftung für unmittelbare oder mittelbare Schäden, Verluste oder Kosten, die aus der Nutzung oder Nichtnutzbarkeit dieses Spiels oder der darin enthaltenen Informationen entstehen. Davon unberührt bleibt die gesetzlich nicht ausschließbare Haftung, insbesondere bei Vorsatz, grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.',
    privacySec10Title: '10. Externe Links',
    privacySec10Body:
      'Dieses Spiel enthält Links zu Websites Dritter. Auf deren Inhalte hat der Ersteller keinen Einfluss und übernimmt dafür keine Verantwortung; verantwortlich ist stets der jeweilige Anbieter oder Betreiber. Zum Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte erkennbar. Bei Bekanntwerden von Rechtsverletzungen werden derartige Links umgehend entfernt.',
    privacySec11Title: '11. Impressum / Offenlegung',
    privacySec11Owner: `Medieninhaber: ${IMPRINT_OWNER_NAME}, ${IMPRINT_OWNER_TOWN_DE}.`,
    privacySec11Body:
      'Offenlegung gemäß § 25 Mediengesetz: privates, nicht-kommerzielles Geografie-Spiel ohne Einfluss auf die öffentliche Meinungsbildung.',
  },
} as const;

export type TranslationDict = (typeof TRANSLATIONS)['en'];
