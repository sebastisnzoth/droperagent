import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const social=readFileSync(new URL('../src/SocialMarketing.tsx',import.meta.url),'utf8');
test('Marketing Social has its own navigation entry',()=>{
  assert.match(app,/page: 'social', icon: Megaphone/);
  assert.match(app,/page==='social'&&<SocialMarketing\/>/);
});
test('Meta controls are transparently disconnected and have no direct posting call',()=>{
  assert.match(social,/NÃO CONECTADA|não conectadas/);
  assert.match(social,/PUBLICAÇÃO BLOQUEADA/);
  assert.doesNotMatch(social,/graph\.facebook\.com|media_publish|\/feed['"`]/);
});
test('Preview content does not claim a real post',()=>{
  assert.match(social,/Prévia editorial/);
  assert.match(social,/não persistido/);
  assert.match(social,/Sem anúncios pagos/);
});
