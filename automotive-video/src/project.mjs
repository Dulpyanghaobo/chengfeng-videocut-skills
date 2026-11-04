import fs from 'node:fs';
import path from 'node:path';
import {ROOT,readJson,writeJson,hashFile,probe,findAsset,libraryPath,particlePoints} from './library.mjs';
import {SCENES,MOTIONS,THEMES} from './catalog-data.mjs';

export function parseSrt(text){
 const stamp=s=>{const m=s.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})$/);if(!m)throw Error(`字幕时间格式错误 ${s}`);return Number(m[1])*3600+Number(m[2])*60+Number(m[3])+Number(m[4])/1000;};
 return text.replace(/^\uFEFF/,'').replace(/\r/g,'').trim().split(/\n\s*\n/).filter(Boolean).map((block,i)=>{const lines=block.split('\n');const n=lines.findIndex(l=>l.includes('-->'));if(n<0)throw Error(`第 ${i+1} 段缺少字幕时间`);const [a,b]=lines[n].split('-->');const start=stamp(a),end=stamp(b.trim().split(/\s+/)[0]);if(end<=start)throw Error('字幕结束时间必须晚于开始');return {id:`cue-${String(i+1).padStart(4,'0')}`,start,end,text:lines.slice(n+1).join(' ').replace(/<[^>]*>/g,'')};});
}
export function validateProject(p){
 const errors=[];const warnings=[];const finite=x=>typeof x==='number'&&Number.isFinite(x);
 if(p.schemaVersion!==1)errors.push('schemaVersion 需要为 1');
 if(!finite(p.duration)||p.duration<=0)errors.push('duration 无效');
 if(!finite(p.fps)||p.fps<=0||p.fps>120)errors.push('fps 无效');
 for(const k of ['width','height'])if(!Number.isInteger(p[k])||p[k]<64||p[k]>7680||p[k]%2)errors.push(`${k} 需要是 64–7680 内的偶数`);
 if(p.master&&p.preserveMaster!==true)errors.push('粗剪项目必须明确 preserveMaster=true');
 const ids=new Set();
 for(const c of p.clips||[]){
  if(!c.id||ids.has(c.id))errors.push(`片段 ID 缺失或重复 ${c.id}`);ids.add(c.id);
  if(!finite(c.start)||!finite(c.end)||c.start<0||c.end<=c.start||c.end>p.duration+1/p.fps)errors.push(`片段越界 ${c.id}`);
  if(!['scene','image','video'].includes(c.kind))errors.push(`未知片段类型 ${c.id}`);
  if(c.kind==='scene'&&!SCENES.some(s=>s.id===c.type))errors.push(`未知场景 ${c.type}`);
  if(c.motion&&!MOTIONS.some(s=>s.id===c.motion))errors.push(`未知动效 ${c.motion}`);
  if(c.theme&&!THEMES[c.theme])errors.push(`未知主题 ${c.theme}`);
  if(c.transition&&!['cut','fade','wipe'].includes(c.transition))errors.push(`未知转场 ${c.transition}`);
  if(c.params?.color&&!/^#[\da-f]{6}$/i.test(c.params.color))errors.push('color 需要六位十六进制颜色');
  if(c.kind==='video'&&(!finite(c.sourceIn)||!finite(c.sourceOut)||c.sourceIn<0||c.sourceOut<=c.sourceIn||c.sourceOut-c.sourceIn+1/p.fps<c.end-c.start))errors.push(`视频素材选段短于覆盖时长 ${c.id}`);
  if(c.params?.density!==undefined&&(!finite(c.params.density)||c.params.density<8||c.params.density>200))errors.push('density 需要在 8–200');
  for(const [key,min,max] of [['speed',.05,10],['intensity',0,1],['amplitude',0,100]])if(c.params?.[key]!==undefined&&(!finite(c.params[key])||c.params[key]<min||c.params[key]>max))errors.push(`${key} 超出支持范围 ${min}–${max}`);
 }
 const sorted=[...(p.clips||[])].sort((a,b)=>a.start-b.start);
 for(let i=1;i<sorted.length;i++)if(sorted[i].start<sorted[i-1].end)warnings.push(`覆盖层重叠：${sorted[i-1].id} / ${sorted[i].id}，后者在上层`);
 for(const c of p.captions||[]){if(!finite(c.start)||!finite(c.end)||c.start<0||c.end<=c.start||c.end>p.duration+.15)errors.push(`字幕越界 ${c.id}`);if(c.text.length/(c.end-c.start)>12)warnings.push(`字幕可能过快 ${c.id}`);}
 return {ok:!errors.length,errors,warnings};
}
export function initProject({video,srt,out,title='',width,height}){
 const dir=path.resolve(out);if(fs.existsSync(path.join(dir,'project.json')))throw Error('工程已存在，请复用，不覆盖');
 const file=path.resolve(video);const media=probe(file);const sha256=hashFile(file);const ext=path.extname(file).toLowerCase();
 const captions=srt?parseSrt(fs.readFileSync(srt,'utf8')):[];
 const p={schemaVersion:1,id:path.basename(dir),title:title||path.basename(file,ext),width:width||media.width,height:height||media.height,fps:media.fps,duration:media.duration,preserveMaster:true,master:{file:`master${ext}`,sha256,...media},captions,captionStyle:{fontSize:4.1,bottom:8,maxWidth:86},clips:[],soundEffects:[],status:captions.length?'ready-for-scenes':'needs-transcript'};
 const check=validateProject(p);if(!check.ok)throw Error(check.errors.join('\n'));
 fs.mkdirSync(path.join(dir,'media'),{recursive:true});fs.copyFileSync(file,path.join(dir,'media',p.master.file),fs.constants.COPYFILE_EXCL);
 if(srt)fs.copyFileSync(srt,path.join(dir,'source.srt'));
 writeJson(path.join(dir,'project.json'),p);return {project:path.join(dir,'project.json'),...check,status:p.status,masterUnchanged:true};
}
export function sceneAssets(clip){
 const base=SCENES.find(s=>s.id===clip.type)?.assetIds||[];
 return [...new Set([...base,...(clip.assetIds||[]),...(clip.assetId?[clip.assetId]:[])])];
}
export function prepareProject(file,{refreshLock=false}={}){
 const absolute=path.resolve(file),dir=path.dirname(absolute),p=readJson(absolute),check=validateProject(p);if(!check.ok)throw Error(check.errors.join('\n'));
 if(p.master&&hashFile(path.join(dir,'media',p.master.file))!==p.master.sha256)throw Error('粗剪母版摘要已变化，拒绝使用旧字幕时间线');
 const lockFile=path.join(dir,'assets.lock.json');const previous=fs.existsSync(lockFile)?readJson(lockFile):{assets:[]};const resolved={};const locked=[];
 function load(id,version){
  if(resolved[id]){if(version&&resolved[id].version!==version)throw Error(`同一工程的 rig 部件版本冲突 ${id}`);return resolved[id];}
  const old=!refreshLock&&previous.assets.find(x=>x.id===id);
  let asset,source;
  if(old){asset=old;source=path.join(dir,old.snapshot);if(hashFile(source)!==old.sha256)throw Error(`项目素材快照损坏 ${id}`);}
  else{asset=findAsset(id,version);source=libraryPath(asset.file);if(hashFile(source)!==asset.sha256)throw Error(`素材摘要不一致 ${id}`);}
  const ext=path.extname(source),snapshot=old?.snapshot||`assets/${id}-${asset.version}-${asset.sha256.slice(0,10)}${ext}`;
  if(!old){fs.mkdirSync(path.dirname(path.join(dir,snapshot)),{recursive:true});if(!fs.existsSync(path.join(dir,snapshot)))fs.copyFileSync(source,path.join(dir,snapshot));}
  const entry={...asset,snapshot};locked.push(entry);
  let data;
  if(asset.kind==='video'){
   const name=`asset-${asset.sha256.slice(0,16)}${ext}`;const dest=path.join(dir,'media',name);fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.copyFileSync(source,dest);else if(hashFile(dest)!==asset.sha256)throw Error(`媒体快照摘要不一致 ${id}`);data=name;
  }else{const mime=asset.kind==='svg'?'image/svg+xml':`image/${ext==='.jpg'? 'jpeg':ext.slice(1)}`;data=`data:${mime};base64,${fs.readFileSync(source).toString('base64')}`;}
  resolved[id]={...entry,data};
  if(asset.rig){load(asset.rig.body,asset.rig.bodyVersion);load(asset.rig.wheel,asset.rig.wheelVersion);}
  return resolved[id];
 }
 for(const c of p.clips){for(const id of c.kind==='scene'?sceneAssets(c):[c.assetId])load(id);if(c.kind==='video'){const a=resolved[c.assetId];if(a.kind!=='video'||c.sourceOut>a.duration+1/p.fps)throw Error(`视频素材选段越界 ${c.id}`);}if(c.kind==='image'&&resolved[c.assetId].kind==='video')throw Error('image 片段不能引用视频');if(c.kind==='scene'&&c.assetId&&['dissolve','outline'].includes(c.motion)){const a=resolved[c.assetId];if(a.kind==='video')throw Error('粒子目标需要透明图片或 SVG');a.particlePoints={...a.particlePoints,[c.motion]:particlePoints(a,{edge:c.motion==='outline'})};}}
 const props={project:p,assets:resolved};writeJson(lockFile,{schemaVersion:1,assets:locked});writeJson(path.join(dir,'resolved-props.json'),props);
 return {props,dir,file:absolute,check};
}
export function demoProject(out){
 const dir=path.resolve(out);const p={schemaVersion:1,id:'component-showcase',title:'汽车视觉组件库',width:1280,height:720,fps:30,duration:24,preserveMaster:true,captions:[],clips:[
  {id:'suspension-demo',kind:'scene',type:'suspension',start:0,end:6,title:'车轮运动，车身响应',subtitle:'分层部件 · 连续动作 · 通用原理示意',motion:'ambient',theme:'graphite',transition:'cut'},
  {id:'energy-demo',kind:'scene',type:'energy',start:6,end:12,title:'让能量路径看得见',subtitle:'对象与粒子共享同一时间轴',motion:'grid',theme:'graphite',transition:'wipe'},
  {id:'sensor-demo',kind:'scene',type:'sensor',start:12,end:18,title:'从对象到感知范围',subtitle:'二维扫描 · 可调整速度与颜色',motion:'network',theme:'ice',transition:'fade'},
  {id:'compare-demo',kind:'scene',type:'compare',start:18,end:24,title:'换素材，复用场景',subtitle:'同一构图 · 不同车型素材',motion:'ambient',theme:'graphite',labels:['通用轿车示意','通用 SUV 示意'],transition:'fade'},
 ],soundEffects:[]};writeJson(path.join(dir,'project.json'),p);return path.join(dir,'project.json');
}
