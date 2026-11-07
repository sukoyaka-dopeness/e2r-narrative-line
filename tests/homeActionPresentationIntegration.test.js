import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createServer } from 'vite';
import { createDomTestEnvironment } from './helpers/dom-test-environment.js';

test('Home action order and routes remain stable with and without a resumable Dataset in both languages', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { HomeScreen } = await server.ssrLoadModule('/src/screens/HomeScreen.tsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/i18n/LanguageContext.tsx');
    for (const locale of ['en', 'ja']) for (const hasResumeDataset of [false, true]) {
      const env = createDomTestEnvironment();
      env.window.localStorage.setItem('narrativeline.language', locale);
      const container = env.document.createElement('div'); env.document.body.append(container);
      const root = createRoot(container), calls = [];
      try {
        const props = {
          hasResumeDataset,
          onResumeDataset: () => calls.push('resume'),
          onCreateDataset: () => calls.push('create'),
          onOpenTimeline: () => calls.push('berlin'),
          onOpenShowcase: () => calls.push('showcase'),
          onImportDataset: () => { throw new Error('Opening the picker must not import or replace a Dataset'); },
        };
        const render = async extra => act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(HomeScreen, { ...props, ...extra }))));
        await render({});
        const expected = locale === 'ja'
          ? ['新しいDataset', 'E2R Datasetを開く', 'ベルリンの壁の例を開く', 'シダー天文台の例を開く']
          : ['New Dataset', 'Open E2R Dataset', 'Open Berlin Wall example', 'Open Cedar Observatory example'];
        if (hasResumeDataset) expected.unshift(locale === 'ja' ? '編集を続ける' : 'Continue Editing');
        const buttons = [...container.querySelectorAll('.home-actions button')];
        assert.deepEqual(buttons.map(b => b.textContent.trim()), expected);
        container.querySelector('input[type=file]').click = () => calls.push('picker');
        await act(async () => buttons.forEach(b => b.click()));
        assert.deepEqual(calls, [...(hasResumeDataset ? ['resume'] : []), 'create', 'picker', 'berlin', 'showcase']);
        assert.equal(container.querySelector('.home-ecosystem a').getAttribute('href'), `https://sukoyaka-dopeness.github.io/e2r-hub/#locale=${locale}`);
        assert.equal(env.window.localStorage.getItem('narrativeline.language'), locale);
        await render({ handoffLoading: true });
        assert.ok([...container.querySelectorAll('.home-actions button')].every(b => b.disabled));
        assert.deepEqual([...container.querySelectorAll('.home-actions button')].map(b => b.textContent.trim()), expected);
      } finally { await act(async () => root.unmount()); env.cleanup(); }
    }
  } finally { await server.close(); }
});
