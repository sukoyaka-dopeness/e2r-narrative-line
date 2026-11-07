import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createServer } from 'vite';
import { createDomTestEnvironment } from './helpers/dom-test-environment.js';

test('bilingual locale choices have fixed order, saved initial focus and temporary callbacks', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { LocaleConflictDialog } = await server.ssrLoadModule('/src/components/LocaleConflictDialog.tsx');
    for (const savedLanguage of ['en', 'ja']) {
      const env = createDomTestEnvironment();
      env.installGlobal("IS_REACT_ACT_ENVIRONMENT", true);
      env.window.requestAnimationFrame = callback => { callback(0); return 0; };
      const container = env.document.createElement('div'); env.document.body.append(container);
      const root = createRoot(container), choices = [];
      try {
        await act(async () => root.render(React.createElement(LocaleConflictDialog, {
          savedLanguage, requestedLanguage: savedLanguage === 'en' ? 'ja' : 'en',
          onUseSavedLanguage: () => choices.push(savedLanguage),
          onUseRequestedLanguage: () => choices.push(savedLanguage === 'en' ? 'ja' : 'en'),
        })));
        const dialog = container.querySelector('[role=alertdialog]'), buttons = [...dialog.querySelectorAll('button')];
        assert.deepEqual(buttons.map(b => [b.lang, b.textContent]), [['en', 'English'], ['ja', '日本語']]);
        assert.deepEqual([...dialog.querySelectorAll('h2 span')].map(s => [s.lang, s.textContent]), [['en', 'Which language would you like to use?'], ['ja', 'どちらの言語で表示しますか？']]);
        assert.equal(dialog.getAttribute('aria-modal'), 'true');
        assert.equal(dialog.getAttribute('aria-describedby'), 'locale-conflict-detail');
        assert.equal(env.document.activeElement, buttons[savedLanguage === 'en' ? 0 : 1]);
        await act(async () => { buttons[0].click(); buttons[1].click(); });
        assert.deepEqual(choices, ['en', 'ja']);
        await act(async () => env.document.dispatchEvent(new env.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
        await act(async () => container.querySelector('.modal-backdrop').click());
        assert.deepEqual(choices.slice(2), [savedLanguage, savedLanguage]);
      } finally { await act(async () => root.unmount()); env.cleanup(); }
    }
  } finally { await server.close(); }
});


test('locale dismissal restores the brand after the resolving commit, including delayed choices', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { LocaleConflictDialog } = await server.ssrLoadModule('/src/components/LocaleConflictDialog.tsx');
    for (const saved of ['en', 'ja']) for (const action of ['en', 'ja', 'escape', 'backdrop']) {
      const env = createDomTestEnvironment();
      env.installGlobal("IS_REACT_ACT_ENVIRONMENT", true);
      const container = env.document.createElement('div'); env.document.body.append(container);
      const root = createRoot(container), frames = [], choices = [];
      env.window.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
      const drainFrames = () => { for (const frame of frames.splice(0)) frame(0); };
      const header = () => React.createElement('header', null, React.createElement('a', { className: 'app-brand', href: '/' }, 'App'), React.createElement('button', null, 'Locale'));
      const requested = saved === 'en' ? 'ja' : 'en';
      const props = { savedLanguage: saved, requestedLanguage: requested, onUseSavedLanguage: () => choices.push(saved), onUseRequestedLanguage: () => choices.push(requested) };
      try {
        await act(async () => root.render(React.createElement(React.StrictMode, null, header(), React.createElement(LocaleConflictDialog, props))));
        drainFrames();
        assert.equal(env.document.activeElement.lang, saved);
        const buttons = [...container.querySelectorAll('[role=alertdialog] button')];
        buttons[1].focus();
        env.document.dispatchEvent(new env.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
        assert.equal(env.document.activeElement, buttons[0]);
        env.document.dispatchEvent(new env.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
        assert.equal(env.document.activeElement, buttons[1]);
        await act(async () => {
          if (action === 'escape') env.document.dispatchEvent(new env.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          else if (action === 'backdrop') container.querySelector('.modal-backdrop').click();
          else buttons[action === 'en' ? 0 : 1].click();
        });
        assert.deepEqual(choices, [action === 'en' || action === 'ja' ? action : saved]);
        // The language render may be delayed: an early frame must not be the only restoration chance.
        drainFrames();
        await act(async () => root.render(React.createElement(React.StrictMode, null, header())));
        drainFrames();
        assert.equal(env.document.activeElement, container.querySelector('header a.app-brand'));
      } finally { await act(async () => root.unmount()); drainFrames(); await env.cleanup(); }
    }
  } finally { await server.close(); }
});
