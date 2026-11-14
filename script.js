"use strict";

// Der Anker übernimmt das Scrollen auch ohne JavaScript.
// Ergänzend erhält das Sprungziel Fokus für Tastatur und Screenreader.
const discoverLink = document.querySelector('.discover-button');
const storyIntro = document.querySelector('#geschichte');

if (discoverLink && storyIntro) {
  discoverLink.addEventListener('click', (event) => {
    // Geänderte Klicks (z. B. Strg-Klick) behalten das Browser-Standardverhalten.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    storyIntro.focus({ preventScroll: true });
  });
}

// Einmalige, dezente Einblendung. Ohne Unterstützung oder bei reduzierter
// Bewegung bleiben alle Inhalte sofort sichtbar; keine Bibliothek erforderlich.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealItems = document.querySelectorAll('[data-reveal]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-pending');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  revealItems.forEach((item) => {
    item.classList.add('is-pending');
    observer.observe(item);
  });

  // Auch Änderungen der Systemeinstellung während des Besuchs berücksichtigen.
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      observer.disconnect();
      revealItems.forEach((item) => item.classList.remove('is-pending'));
    }
  });
}

// Timeline: ein gemeinsamer Inhalt für Desktop-Tabs und mobile Lesereihenfolge.
const timeline = document.querySelector('.timeline');
if (timeline) {
  const tablist = timeline.querySelector('.timeline__tabs');
  const panels = [...timeline.querySelectorAll('.timeline__panel')];
  const desktop = window.matchMedia('(min-width: 901px)');
  let selectedIndex = 0;
  let switchAnimation;

  const tabs = panels.map((panel, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'timeline__tab';
    tab.id = `tab-${panel.id}`;
    tab.textContent = panel.dataset.year;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    tab.addEventListener('click', () => selectStation(index));
    tablist.append(tab);
    return tab;
  });

  function selectStation(index, moveFocus = false, animate = true) {
    const changed = selectedIndex !== index;
    selectedIndex = index;
    switchAnimation?.cancel();
    panels.forEach((panel, position) => {
      const active = position === selectedIndex;
      panel.hidden = !active;
      tabs[position].setAttribute('aria-selected', String(active));
      tabs[position].tabIndex = active ? 0 : -1;
    });
    if (moveFocus) tabs[index].focus();
    if (animate && changed && !reducedMotion.matches && panels[index].animate) {
      switchAnimation = panels[index].animate(
        [{ opacity: .35, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 280, easing: 'ease-out' }
      );
    }
  }

  // Automatische Aktivierung per Pfeiltaste; Tab führt weiter zum aktiven Inhalt.
  tablist.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (selectedIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (selectedIndex - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectStation(next, true);
    }
  });

  function updateTimelineMode() {
    switchAnimation?.cancel();
    const focusedTab = tabs.indexOf(document.activeElement);
    timeline.classList.toggle('timeline--interactive', desktop.matches);
    tablist.hidden = !desktop.matches;
    panels.forEach((panel, index) => {
      if (desktop.matches) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabs[index].id);
        panel.tabIndex = 0;
      } else {
        panel.hidden = false;
        panel.removeAttribute('role');
        panel.setAttribute('aria-labelledby', panel.querySelector('h3').id);
        panel.removeAttribute('tabindex');
      }
    });
    if (desktop.matches) selectStation(selectedIndex, false, false);
    // Fokus beim Wechsel auf die mobile Ansicht nicht in einer versteckten Leiste lassen.
    if (!desktop.matches && focusedTab !== -1) {
      panels[focusedTab].tabIndex = -1;
      panels[focusedTab].focus({ preventScroll: true });
    }
  }

  desktop.addEventListener('change', updateTimelineMode);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) switchAnimation?.cancel();
  });
  updateTimelineMode();
}

// Familie: echte Buttons eröffnen dieselben Inhalte per Maus, Touch und Tastatur.
// Ohne JavaScript bleiben alle Beschreibungen sichtbar.
const family = document.querySelector('.family');
if (family) {
  const gallery = family.querySelector('.family__gallery');
  const people = [...family.querySelectorAll('.family__person')];
  const wideScreen = window.matchMedia('(min-width: 1101px)');
  const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let activePerson = wideScreen.matches ? 0 : -1;
  let detailAnimation;

  function showPerson(index, animate = true) {
    const changed = activePerson !== index;
    activePerson = index;
    gallery.dataset.active = String(index);
    detailAnimation?.cancel();
    people.forEach((person, position) => {
      const active = position === index;
      person.classList.toggle('is-active', active);
      person.querySelector('.family__select').setAttribute('aria-expanded', String(active));
      person.querySelector('.family__indicator').textContent = active ? '−' : '+';
      person.querySelector('.family__detail').hidden = !active;
    });
    if (index >= 0 && changed && animate && !reducedMotion.matches) {
      const detail = people[index].querySelector('.family__detail');
      if (detail.animate) detailAnimation = detail.animate(
        [{ opacity: .35 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' }
      );
    }
  }

  people.forEach((person, index) => {
    const button = person.querySelector('.family__select');
    button.disabled = false;
    button.addEventListener('click', () => {
      const closeMobile = !wideScreen.matches && activePerson === index;
      showPerson(closeMobile ? -1 : index);
    });
    person.querySelector('.family__portrait').addEventListener('pointerenter', (event) => {
      // Tastaturfokus hat Vorrang vor einem zufällig über einem anderen Bild liegenden Zeiger.
      if (wideScreen.matches && hoverPointer.matches && event.pointerType === 'mouse'
          && !gallery.querySelector('.family__select:focus-visible')) showPerson(index);
    });
  });

  wideScreen.addEventListener('change', () => {
    if (wideScreen.matches && activePerson < 0) showPerson(0, false);
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) detailAnimation?.cancel();
  });
  family.classList.add('family--enhanced');
  showPerson(activePerson, false);
}

// Bildvergleich: native Range-Tastaturbedienung plus präzises Ziehen/Tippen
// über die gesamte Bildbreite. Keine automatische Bewegung oder externe Bibliothek.
const comparison = document.querySelector('.comparison');
if (comparison) {
  const viewer = comparison.querySelector('.comparison__viewer');
  const range = comparison.querySelector('.comparison__range');
  let activePointer = null;

  function updateComparison() {
    const value = Number(range.value);
    viewer.style.setProperty('--past-share', `${value}%`);
    range.setAttribute('aria-valuetext', `1928: ${value} Prozent sichtbar; 2026: ${100 - value} Prozent sichtbar`);
  }
  function setFromPointer(event) {
    const bounds = viewer.getBoundingClientRect();
    range.value = Math.round(Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)));
    updateComparison();
  }
  range.addEventListener('input', updateComparison);
  range.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    activePointer = event.pointerId;
    range.focus({ preventScroll: true });
    range.setPointerCapture(activePointer);
    viewer.classList.add('is-dragging');
    setFromPointer(event);
  });
  range.addEventListener('pointermove', (event) => {
    if (event.pointerId === activePointer) setFromPointer(event);
  });
  function endDrag(event) {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    viewer.classList.remove('is-dragging');
    if (range.hasPointerCapture(event.pointerId)) range.releasePointerCapture(event.pointerId);
  }
  range.addEventListener('pointerup', endDrag);
  range.addEventListener('pointercancel', endDrag);
  range.addEventListener('lostpointercapture', endDrag);
  range.disabled = false;
  comparison.classList.add('comparison--enhanced');
  updateComparison();
}

// Lokale Audio-Stationen. Status und Zeiten folgen den tatsächlichen Medienereignissen.
const voiceStations = [...document.querySelectorAll('.voice')];
const voiceRecordings = voiceStations.map(station => station.querySelector('audio'));
function formatAudioTime(seconds) {
  const whole = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
voiceStations.forEach((station) => {
  const audio = station.querySelector('audio');
  audio.volume = 0.35;
  const play = station.querySelector('.voice__play');
  const seek = station.querySelector('.voice__seek');
  const elapsed = station.querySelector('.voice__elapsed');
  const duration = station.querySelector('.voice__duration');
  const status = station.querySelector('.voice__status');
  const title = station.querySelector('h3').textContent;

  function updateTime() {
    const ready = Number.isFinite(audio.duration) && audio.duration > 0;
    seek.disabled = !ready;
    if (ready) {
      seek.max = audio.duration;
      seek.value = audio.currentTime;
      seek.style.setProperty('--played', `${audio.currentTime / audio.duration * 100}%`);
      duration.textContent = formatAudioTime(audio.duration);
    }
    elapsed.textContent = formatAudioTime(audio.currentTime);
    seek.setAttribute('aria-valuetext', `${formatAudioTime(audio.currentTime)} von ${ready ? formatAudioTime(audio.duration) : 'unbekannter Dauer'}`);
  }
  function updatePlay() {
    const playing = !audio.paused && !audio.ended;
    station.classList.toggle('is-playing', playing);
    play.setAttribute('aria-label', `${title} ${playing ? 'pausieren' : 'abspielen'}`);
  }
  play.disabled = false;
  play.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    // Bereits vor play() pausieren, damit auch schnelle Wechsel nicht überlappen.
    voiceRecordings.forEach(other => { if (other !== audio) other.pause(); });
    status.textContent = '';
    if (audio.ended) audio.currentTime = 0;
    try { await audio.play(); }
    catch (error) {
      if (error.name !== 'AbortError') status.textContent = 'Die Aufnahme konnte nicht gestartet werden. Bitte erneut versuchen.';
      updatePlay();
    }
  });
  audio.addEventListener('play', () => {
    voiceRecordings.forEach(other => { if (other !== audio) other.pause(); });
    updatePlay();
  });
  ['pause', 'ended'].forEach(event => audio.addEventListener(event, updatePlay));
  ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked', 'ended'].forEach(event => audio.addEventListener(event, updateTime));
  audio.addEventListener('error', () => {
    status.textContent = 'Die Audiodatei konnte nicht geladen werden.';
    play.disabled = true;
    seek.disabled = true;
    updatePlay();
  });
  seek.addEventListener('input', () => {
    if (Number.isFinite(audio.duration)) { audio.currentTime = Number(seek.value); updateTime(); }
  });
  updateTime();
  updatePlay();
});

// Luna-Quiz: genau eine Wertung pro Frage; Neustart löscht den gesamten Spielstand.
const quiz = document.querySelector('.quiz');
if (quiz) {
  const questions = [
    { text: 'In welchem Jahr wurden die Luna Lichtspiele eröffnet?', answers: ['1919', '1928', '1936'], correct: 1 },
    { text: 'Wer gründete die Luna Lichtspiele?', answers: ['Wilhelm Hartmann', 'Friedrich Hartmann', 'Claudia Hartmann'], correct: 0 },
    { text: 'Was veränderte sich 1994 im Luna?', answers: ['Das Kino zog an einen neuen Standort.', 'Ein zweiter Kinosaal wurde eröffnet.', 'Die erste digitale Projektion wurde installiert.'], correct: 1 },
    { text: 'Welche Generation führt das Luna im Jahr 2026?', answers: ['Die zweite', 'Die dritte', 'Die vierte'], correct: 2 },
    { text: 'Seit wann leitet Jonas Hartmann das Luna?', answers: ['2012', '2018', '2020'], correct: 1 }
  ];
  const stage = quiz.querySelector('.quiz__stage');
  const questionView = quiz.querySelector('.quiz__question-view');
  const questionHeading = quiz.querySelector('.quiz__question');
  const answers = quiz.querySelector('.quiz__answers');
  const counter = quiz.querySelector('.quiz__counter');
  const frames = [...quiz.querySelectorAll('.quiz__frames span')];
  const feedback = quiz.querySelector('.quiz__feedback');
  const next = quiz.querySelector('.quiz__next');
  const result = quiz.querySelector('.quiz__result');
  const scoreHeading = quiz.querySelector('.quiz__score');
  let questionIndex = 0;
  let score = 0;
  let answered = false;
  let quizAnimation;

  function animateQuiz(element) {
    quizAnimation?.cancel();
    if (!reducedMotion.matches && element.animate) {
      quizAnimation = element.animate([{ opacity: .4, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' });
    }
  }
  function renderQuestion(moveFocus = true) {
    answered = false;
    result.hidden = true;
    questionView.hidden = false;
    next.hidden = true;
    feedback.textContent = '';
    counter.textContent = `FRAGE ${questionIndex + 1} / ${questions.length}`;
    frames.forEach((frame, index) => frame.classList.toggle('is-reached', index <= questionIndex));
    const question = questions[questionIndex];
    questionHeading.textContent = question.text;
    answers.replaceChildren();
    question.answers.forEach((answer, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz__answer';
      const letter = document.createElement('span');
      letter.className = 'quiz__letter';
      letter.textContent = String.fromCharCode(65 + index);
      letter.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span');
      text.className = 'quiz__answer-text';
      text.textContent = answer;
      const mark = document.createElement('span');
      mark.className = 'quiz__mark';
      mark.setAttribute('aria-hidden', 'true');
      button.append(letter, text, mark);
      button.addEventListener('click', () => chooseAnswer(index));
      answers.append(button);
    });
    if (moveFocus) { questionHeading.focus({ preventScroll: true }); animateQuiz(questionView); }
  }
  function chooseAnswer(choice) {
    if (answered) return;
    answered = true;
    const question = questions[questionIndex];
    const correct = choice === question.correct;
    if (correct) score += 1;
    [...answers.children].forEach((button, index) => {
      // aria-disabled hält den Fokus auf der Auswahl; die Zustandsprüfung sperrt weitere Wertungen.
      button.setAttribute('aria-disabled', 'true');
      button.tabIndex = -1;
      if (index === question.correct) {
        button.classList.add('is-correct');
        button.querySelector('.quiz__mark').textContent = '✓';
        button.setAttribute('aria-label', `${question.answers[index]} – richtige Antwort`);
      } else if (index === choice) {
        button.classList.add('is-wrong');
        button.querySelector('.quiz__mark').textContent = '×';
        button.setAttribute('aria-label', `${question.answers[index]} – falsche Antwort`);
      }
    });
    feedback.textContent = correct ? 'Richtig beantwortet.' : `Nicht ganz. Richtig ist: ${question.answers[question.correct]}`;
    next.textContent = questionIndex === questions.length - 1 ? 'Ergebnis anzeigen' : 'Nächste Frage';
    next.hidden = false;
  }
  next.addEventListener('click', () => {
    if (!answered) return;
    if (questionIndex < questions.length - 1) { questionIndex += 1; renderQuestion(); return; }
    questionView.hidden = true;
    result.hidden = false;
    scoreHeading.textContent = `${score} / ${questions.length}`;
    scoreHeading.setAttribute('aria-label', `${score} von ${questions.length} Antworten richtig`);
    quiz.querySelector('.quiz__result-text').textContent = score <= 2
      ? 'Dein nächster Besuch in unserer Geschichte kann kommen.'
      : score <= 4 ? 'Du kennst das Luna ziemlich gut.' : 'Fast ein Teil der Familie Hartmann.';
    scoreHeading.focus({ preventScroll: true });
    animateQuiz(result);
  });
  quiz.querySelector('.quiz__restart').addEventListener('click', () => {
    questionIndex = 0;
    score = 0;
    scoreHeading.textContent = '';
    scoreHeading.removeAttribute('aria-label');
    quiz.querySelector('.quiz__result-text').textContent = '';
    renderQuestion();
  });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) quizAnimation?.cancel(); });
  stage.hidden = false;
  renderQuestion(false);
}

// Archiv: ein nativer Dialog für alle sechs lokalen Bilder in ihrer Chronologie.
const archive = document.querySelector('.archive');
if (archive) {
  const dialog = archive.querySelector('.archive-dialog');
  const links = [...archive.querySelectorAll('.archive__link')];
  const largeImage = dialog.querySelector('.archive-dialog__image');
  const closeButton = dialog.querySelector('.archive-dialog__close');
  let imageIndex = 0;
  let opener = null;
  let scrollPosition = 0;
  let savedBodyStyle = null;
  let savedOverflow = '';

  function showArchiveImage(index) {
    imageIndex = (index + links.length) % links.length;
    const link = links[imageIndex];
    const thumbnail = link.querySelector('img');
    largeImage.src = link.href;
    largeImage.alt = thumbnail.alt;
    largeImage.width = Number(thumbnail.getAttribute('width'));
    largeImage.height = Number(thumbnail.getAttribute('height'));
    dialog.querySelector('.archive-dialog__year').textContent = link.querySelector('.archive__year').textContent;
    const title = link.querySelector('.archive__name').textContent;
    dialog.querySelector('#archive-dialog-title').textContent = title;
    dialog.querySelector('#archive-dialog-description').textContent = link.closest('.archive__item').querySelector('.archive__description').textContent;
    dialog.querySelector('.archive-dialog__counter').textContent = `${imageIndex + 1} / ${links.length} · ${title}`;
  }

  if (typeof dialog.showModal === 'function') {
    links.forEach((link, index) => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = link;
        showArchiveImage(index);
        scrollPosition = window.scrollY;
        savedBodyStyle = document.body.getAttribute('style');
        savedOverflow = document.documentElement.style.overflow;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPosition}px`;
        document.body.style.width = '100%';
        document.documentElement.style.overflow = 'hidden';
        dialog.showModal();
        dialog.scrollTop = 0;
        closeButton.focus({ preventScroll: true });
      });
    });
  }
  closeButton.addEventListener('click', () => dialog.close());
  dialog.querySelector('.archive-dialog__previous').addEventListener('click', () => showArchiveImage(imageIndex - 1));
  dialog.querySelector('.archive-dialog__next').addEventListener('click', () => showArchiveImage(imageIndex + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showArchiveImage(imageIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
    // Tab auch an den Rändern im Dialog halten; Escape übernimmt der Browser.
    if (event.key === 'Tab') {
      const buttons = [...dialog.querySelectorAll('button')];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (savedBodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', savedBodyStyle);
    document.documentElement.style.overflow = savedOverflow;
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    opener?.focus({ preventScroll: true });
  });
}

// Hauptnavigation: eigenständiges Disclosure-Menü, ohne Eingriff in bestehende Player/Dialoge.
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const menu = siteHeader.querySelector('.site-nav');
  const menuToggle = siteHeader.querySelector('.site-header__toggle');
  const menuLinks = [...menu.querySelectorAll('a')];
  const mobileMenu = window.matchMedia('(max-width: 1000px)');
  let menuOpen = false;
  let navigationFrame = null;
  const sectionLinks = [
    ['start', 'start'], ['geschichte', 'chronik'], ['chronik', 'chronik'],
    ['generationen', 'generationen'], ['damals-heute', 'chronik'],
    ['stimmen', 'stimmen'], ['luna-quiz', 'stimmen'],
    ['luna-archiv', 'luna-archiv'], ['blick-nach-vorn', 'blick-nach-vorn']
  ].map(([id, target]) => ({ section: document.getElementById(id), target }));

  function setMenu(open, returnFocus = false) {
    menuOpen = open && mobileMenu.matches;
    menu.hidden = mobileMenu.matches && !menuOpen;
    menuToggle.setAttribute('aria-expanded', String(menuOpen));
    menuToggle.querySelector('span').textContent = menuOpen ? '×' : '☰';
    if (returnFocus) menuToggle.focus({ preventScroll: true });
  }
  function updateNavigation() {
    navigationFrame = null;
    const height = siteHeader.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--site-nav-height', `${height}px`);
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 16);
    const boundary = height + Math.min(160, innerHeight * .2);
    let active = 'start';
    for (const item of sectionLinks) {
      if (item.section.getBoundingClientRect().top <= boundary) active = item.target;
    }
    menuLinks.forEach(link => {
      if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleNavigation() {
    if (navigationFrame === null) navigationFrame = requestAnimationFrame(updateNavigation);
  }
  function updateMenuMode() {
    const focusWasToggle = document.activeElement === menuToggle;
    const focusWasLink = menu.contains(document.activeElement);
    menuToggle.hidden = !mobileMenu.matches;
    setMenu(false, mobileMenu.matches && focusWasLink);
    if (!mobileMenu.matches && focusWasToggle) menuLinks[0].focus({ preventScroll: true });
    scheduleNavigation();
  }
  menuToggle.addEventListener('click', () => {
    setMenu(!menuOpen);
    if (menuOpen) menuLinks[0].focus({ preventScroll: true });
  });
  siteHeader.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuOpen) { event.preventDefault(); setMenu(false, true); }
  });
  siteHeader.addEventListener('focusout', () => {
    requestAnimationFrame(() => { if (menuOpen && !siteHeader.contains(document.activeElement)) setMenu(false); });
  });
  document.addEventListener('pointerdown', (event) => {
    if (menuOpen && !siteHeader.contains(event.target)) setMenu(false);
  });
  document.querySelectorAll('.site-header a[href^="#"], .site-footer a[href^="#"]').forEach(link => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      setMenu(false);
      const target = document.querySelector(link.hash);
      if (!target) return;
      // Der native Anker scrollt; scroll-padding berücksichtigt die gemessene Leistenhöhe.
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
    });
  });
  siteHeader.classList.add('site-header--enhanced');
  mobileMenu.addEventListener('change', updateMenuMode);
  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', scheduleNavigation);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleNavigation).observe(siteHeader);
  updateMenuMode();
  updateNavigation();
}
