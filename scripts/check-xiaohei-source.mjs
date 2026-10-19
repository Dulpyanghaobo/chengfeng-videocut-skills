/** Verify imported upstream files against the pinned snapshot and declared fork modifications. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skill=path.join(root,'.agents/skills/chengfeng-xiaohei-dark');
const source=JSON.parse(fs.readFileSync(path.join(skill,'upstream-source.json'),'utf8'));
assert.equal(source.repo,'https://github.com/Agentchengfeng/chengfeng-videocut-xiaohei');
assert.match(source.commit,/^[a-f0-9]{40}$/);
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let untouched=0,changed=0;
for(const [relative,original] of Object.entries(source.files)){
  const resolved=path.resolve(skill,relative);
  assert.ok(resolved.startsWith(skill+path.sep),'source path escapes Skill');
  const expected=source.fork_modified_files[relative]??original;
  assert.equal(sha(resolved),expected,`Imported file changed without a matching provenance entry: ${relative}`);
  if(expected===original)untouched++;else changed++;
}
for(const relative of Object.keys(source.fork_modified_files))assert.ok(relative in source.files,`Unknown upstream file: ${relative}`);
console.log(`PASS: ${untouched} unchanged upstream files and ${changed} declared fork modifications; source ${source.commit}`);
