/**
 * Accessibility Panel — Full Feature Set
 * Manages: text size, color blind modes, line focus, high contrast,
 * dyslexia font, reduced motion, big cursor, link highlight, invert,
 * hide images, focus indicators, letter spacing, line height
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'imj-a11y-settings';

  // All available accessibility modes
  const MODES = {
    // Text
    bigText:        { cssClass: 'a11y-big-text',        group: 'textSize' },
    biggerText:     { cssClass: 'a11y-bigger-text',     group: 'textSize' },
    dyslexia:       { cssClass: 'a11y-dyslexia',        group: null },
    letterSpacing:  { cssClass: 'a11y-letter-spacing',  group: null },
    lineHeight:     { cssClass: 'a11y-line-height',     group: null },

    // Visual
    highContrast:   { cssClass: 'a11y-high-contrast',   group: null },
    invert:         { cssClass: 'a11y-invert',          group: null },
    saturate:       { cssClass: 'a11y-saturate',        group: 'saturation' },
    desaturate:     { cssClass: 'a11y-desaturate',      group: 'saturation' },

    // Color blind
    protanopia:     { cssClass: 'a11y-protanopia',      group: 'colorBlind' },
    deuteranopia:   { cssClass: 'a11y-deuteranopia',    group: 'colorBlind' },
    tritanopia:     { cssClass: 'a11y-tritanopia',      group: 'colorBlind' },
    achromatopsia:  { cssClass: 'a11y-achromatopsia',   group: 'colorBlind' },

    // Interaction
    lineFocus:      { cssClass: 'a11y-line-focus',      group: null },
    bigCursor:      { cssClass: 'a11y-big-cursor',      group: null },
    highlightLinks: { cssClass: 'a11y-highlight-links', group: null },
    reducedMotion:  { cssClass: 'a11y-reduced-motion',  group: null },
    hideImages:     { cssClass: 'a11y-hide-images',     group: null },
  };

  let activeSettings = {};
  let readingGuideTop = null;
  let readingGuideBottom = null;

  /* ---- Initialize ---- */
  function init() {
    loadSettings();
    buildPanel();
    buildSVGFilters();
    buildReadingGuide();
    applyAllSettings();
    bindEvents();
  }

  /* ---- Build SVG color blind filters (injected into DOM) ---- */
  function buildSVGFilters() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    svg.innerHTML = `
      <defs>
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567, 0.433, 0,     0, 0
            0.558, 0.442, 0,     0, 0
            0,     0.242, 0.758, 0, 0
            0,     0,     0,     1, 0"/>
        </filter>
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625, 0.375, 0,   0, 0
            0.7,   0.3,   0,   0, 0
            0,     0.3,   0.7, 0, 0
            0,     0,     0,   1, 0"/>
        </filter>
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.95, 0.05,  0,     0, 0
            0,    0.433, 0.567, 0, 0
            0,    0.475, 0.525, 0, 0
            0,    0,     0,     1, 0"/>
        </filter>
      </defs>`;
    document.body.appendChild(svg);
  }

  /* ---- Build Reading Guide Overlays ---- */
  function buildReadingGuide() {
    readingGuideTop = document.createElement('div');
    readingGuideTop.className = 'a11y-reading-guide-top';
    readingGuideTop.setAttribute('aria-hidden', 'true');

    readingGuideBottom = document.createElement('div');
    readingGuideBottom.className = 'a11y-reading-guide-bottom';
    readingGuideBottom.setAttribute('aria-hidden', 'true');

    document.body.appendChild(readingGuideTop);
    document.body.appendChild(readingGuideBottom);

    document.addEventListener('mousemove', updateReadingGuide);
    document.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      if (touch) updateReadingGuidePosition(touch.clientY);
    });
  }

  function updateReadingGuide(e) {
    updateReadingGuidePosition(e.clientY);
  }

  function updateReadingGuidePosition(y) {
    if (!activeSettings.lineFocus) return;
    const lineHeight = 80; // px — height of the focus band
    const topEdge = y - lineHeight / 2;
    const bottomEdge = y + lineHeight / 2;

    readingGuideTop.style.top = '0';
    readingGuideTop.style.height = Math.max(0, topEdge) + 'px';

    readingGuideBottom.style.top = bottomEdge + 'px';
    readingGuideBottom.style.height = (window.innerHeight - bottomEdge) + 'px';
  }

  /* ---- Build Panel HTML ---- */
  function buildPanel() {
    // Accessibility Icon SVG
    const a11yIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6C8.5 8 4 8.5 4 9.5S4 11 4 11h5v10h2v-5h2v5h2V11h5s0-.5 0-1.5S15.5 8 13 8h-2z"/></svg>`;

    // Toggle button
    const toggle = document.createElement('button');
    toggle.className = 'a11y-toggle';
    toggle.id = 'a11y-toggle';
    toggle.setAttribute('aria-label', 'Abrir panel de accesibilidad');
    toggle.setAttribute('title', 'Accesibilidad');
    toggle.innerHTML = a11yIcon;
    document.body.appendChild(toggle);

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'a11y-backdrop';
    backdrop.id = 'a11y-backdrop';
    document.body.appendChild(backdrop);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.id = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Panel de accesibilidad');
    panel.innerHTML = `
      <div class="a11y-header">
        <span class="a11y-header-title">${a11yIcon} Accesibilidad</span>
        <button class="a11y-close" id="a11y-close" aria-label="Cerrar panel">✕</button>
      </div>
      <div class="a11y-body">

        <!-- TEXT -->
        <div class="a11y-group">
          <div class="a11y-group-title">Texto</div>
          <div class="a11y-options">
            <button class="a11y-option" data-mode="bigText" id="a11y-bigText">
              <span class="a11y-option-icon">🔤</span>
              <span class="a11y-option-label">Texto Grande</span>
            </button>
            <button class="a11y-option" data-mode="biggerText" id="a11y-biggerText">
              <span class="a11y-option-icon">🔠</span>
              <span class="a11y-option-label">Texto Extra Grande</span>
            </button>
            <button class="a11y-option" data-mode="dyslexia" id="a11y-dyslexia">
              <span class="a11y-option-icon">📖</span>
              <span class="a11y-option-label">Fuente Dislexia</span>
            </button>
            <button class="a11y-option" data-mode="letterSpacing" id="a11y-letterSpacing">
              <span class="a11y-option-icon">↔️</span>
              <span class="a11y-option-label">Espaciado Letras</span>
            </button>
            <button class="a11y-option" data-mode="lineHeight" id="a11y-lineHeight">
              <span class="a11y-option-icon">↕️</span>
              <span class="a11y-option-label">Interlineado Alto</span>
            </button>
          </div>
        </div>

        <!-- VISUAL -->
        <div class="a11y-group">
          <div class="a11y-group-title">Visual</div>
          <div class="a11y-options">
            <button class="a11y-option" data-mode="highContrast" id="a11y-highContrast">
              <span class="a11y-option-icon">◐</span>
              <span class="a11y-option-label">Alto Contraste</span>
            </button>
            <button class="a11y-option" data-mode="invert" id="a11y-invert">
              <span class="a11y-option-icon">🔄</span>
              <span class="a11y-option-label">Invertir Colores</span>
            </button>
            <button class="a11y-option" data-mode="saturate" id="a11y-saturate">
              <span class="a11y-option-icon">🎨</span>
              <span class="a11y-option-label">+Saturación</span>
            </button>
            <button class="a11y-option" data-mode="desaturate" id="a11y-desaturate">
              <span class="a11y-option-icon">🌫️</span>
              <span class="a11y-option-label">−Saturación</span>
            </button>
            <button class="a11y-option" data-mode="hideImages" id="a11y-hideImages">
              <span class="a11y-option-icon">🚫</span>
              <span class="a11y-option-label">Ocultar Imágenes</span>
            </button>
          </div>
        </div>

        <!-- DALTONISMO -->
        <div class="a11y-group">
          <div class="a11y-group-title">Daltonismo</div>
          <div class="a11y-options">
            <button class="a11y-option" data-mode="protanopia" id="a11y-protanopia">
              <span class="a11y-option-icon">🔴</span>
              <span class="a11y-option-label">Protanopía</span>
            </button>
            <button class="a11y-option" data-mode="deuteranopia" id="a11y-deuteranopia">
              <span class="a11y-option-icon">🟢</span>
              <span class="a11y-option-label">Deuteranopía</span>
            </button>
            <button class="a11y-option" data-mode="tritanopia" id="a11y-tritanopia">
              <span class="a11y-option-icon">🔵</span>
              <span class="a11y-option-label">Tritanopía</span>
            </button>
            <button class="a11y-option" data-mode="achromatopsia" id="a11y-achromatopsia">
              <span class="a11y-option-icon">⚫</span>
              <span class="a11y-option-label">Acromatopsia</span>
            </button>
          </div>
        </div>

        <!-- NAVIGATION -->
        <div class="a11y-group">
          <div class="a11y-group-title">Navegación</div>
          <div class="a11y-options">
            <button class="a11y-option" data-mode="lineFocus" id="a11y-lineFocus">
              <span class="a11y-option-icon">📏</span>
              <span class="a11y-option-label">Enfoque de Línea</span>
            </button>
            <button class="a11y-option" data-mode="bigCursor" id="a11y-bigCursor">
              <span class="a11y-option-icon">🖱️</span>
              <span class="a11y-option-label">Cursor Grande</span>
            </button>
            <button class="a11y-option" data-mode="highlightLinks" id="a11y-highlightLinks">
              <span class="a11y-option-icon">🔗</span>
              <span class="a11y-option-label">Resaltar Enlaces</span>
            </button>
            <button class="a11y-option" data-mode="reducedMotion" id="a11y-reducedMotion">
              <span class="a11y-option-icon">⏸️</span>
              <span class="a11y-option-label">Sin Animaciones</span>
            </button>
          </div>
        </div>

        <button class="a11y-reset" id="a11y-reset">
          ↺ Restablecer Todo
        </button>

      </div>
    `;

    document.body.appendChild(panel);
  }

  /* ---- Event Bindings ---- */
  function bindEvents() {
    const toggle = document.getElementById('a11y-toggle');
    const panel = document.getElementById('a11y-panel');
    const close = document.getElementById('a11y-close');
    const backdrop = document.getElementById('a11y-backdrop');
    const reset = document.getElementById('a11y-reset');

    toggle.addEventListener('click', () => openPanel());
    close.addEventListener('click', () => closePanel());
    backdrop.addEventListener('click', () => closePanel());

    // Escape key closes panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closePanel();
      }
    });

    // Mode toggles
    panel.querySelectorAll('.a11y-option[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleMode(btn.dataset.mode);
      });
    });

    // Reset
    reset.addEventListener('click', resetAll);
  }

  /* ---- Panel Open/Close ---- */
  function openPanel() {
    document.getElementById('a11y-panel').classList.add('open');
    document.getElementById('a11y-backdrop').classList.add('visible');
    document.getElementById('a11y-toggle').style.display = 'none';
  }

  function closePanel() {
    document.getElementById('a11y-panel').classList.remove('open');
    document.getElementById('a11y-backdrop').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('a11y-toggle').style.display = '';
    }, 400);
  }

  /* ---- Toggle a Mode ---- */
  function toggleMode(modeKey) {
    const mode = MODES[modeKey];
    if (!mode) return;

    // If this mode has a group, deactivate others in the group first
    if (mode.group) {
      Object.entries(MODES).forEach(([key, m]) => {
        if (m.group === mode.group && key !== modeKey && activeSettings[key]) {
          activeSettings[key] = false;
          document.documentElement.classList.remove(m.cssClass);
          updateButtonState(key, false);
        }
      });
    }

    // Toggle this mode
    const isActive = !activeSettings[modeKey];
    activeSettings[modeKey] = isActive;

    if (isActive) {
      document.documentElement.classList.add(mode.cssClass);
    } else {
      document.documentElement.classList.remove(mode.cssClass);
    }

    updateButtonState(modeKey, isActive);
    saveSettings();
  }

  /* ---- Update Button Visual State ---- */
  function updateButtonState(modeKey, isActive) {
    const btn = document.getElementById('a11y-' + modeKey);
    if (!btn) return;
    if (isActive) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }

  /* ---- Apply All Saved Settings ---- */
  function applyAllSettings() {
    Object.entries(activeSettings).forEach(([key, isActive]) => {
      const mode = MODES[key];
      if (!mode) return;
      if (isActive) {
        document.documentElement.classList.add(mode.cssClass);
      }
      updateButtonState(key, isActive);
    });
  }

  /* ---- Reset All ---- */
  function resetAll() {
    Object.entries(MODES).forEach(([key, mode]) => {
      document.documentElement.classList.remove(mode.cssClass);
      updateButtonState(key, false);
    });
    activeSettings = {};
    saveSettings();
  }

  /* ---- LocalStorage Persistence ---- */
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSettings));
    } catch (e) { /* silent */ }
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        activeSettings = JSON.parse(saved);
      }
    } catch (e) {
      activeSettings = {};
    }
  }

  /* ---- Boot ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
