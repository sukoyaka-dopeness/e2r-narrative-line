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
