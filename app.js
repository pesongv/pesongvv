// ── 탭 ──
const TAB_IDS=['t-se','t-ch','t-student','t-setting'];
function showTab(id){
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-tab')[TAB_IDS.indexOf(id)]?.classList.add('active');
  if(id==='t-se'||id==='t-ch') refreshClassSelects();
}

// ── 스토리지 ──
const S={
  set:(k,v)=>localStorage.setItem('sgb_'+k,JSON.stringify(v)),
  get:(k,d)=>{try{const v=localStorage.getItem('sgb_'+k);return v?JSON.parse(v):d;}catch{return d;}},
  del:(k)=>localStorage.removeItem('sgb_'+k)
};

// ── 설정 ──
function saveSetting(){
  S.set('cfg',{year:document.getElementById('set-year').value||'2026',semester:document.getElementById('set-semester').value,grade:document.getElementById('set-grade').value});
  showToast('설정이 저장됐어요!');
}
function loadSetting(){
  const c=S.get('cfg',{year:'2026',semester:'1',grade:'1'});
  document.getElementById('set-year').value=c.year;
  document.getElementById('set-semester').value=c.semester;
  document.getElementById('set-grade').value=c.grade;
  return c;
}

// ── 토스트 ──
function showToast(msg,type='ok'){
  const t=document.createElement('div');
  const bg=type==='err'?'#d44':'#1a1a18';
  t.style.cssText=`position:fixed;bottom:24px;right:24px;background:${bg};color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:fadeInUp 0.2s ease`;
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2400);
}
const _sty=document.createElement('style');
_sty.textContent='@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
document.head.appendChild(_sty);

// ── 유틸 ──
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function calcBytes(s){let b=0;for(let i=0;i<s.length;i++)b+=s.charCodeAt(i)>127?3:1;return b;}
function updateCount(inputId,countId){
  const el=document.getElementById(inputId);
  const cl=document.getElementById(countId);
  if(!el||!cl)return;
  const n=el.value.split('\n').filter(l=>l.match(/^\[[^\]]+\]/)).length;
  cl.textContent=n+'개';
}
function getPhrasesByActivity(txt){
  // 반환: {actName: [문장, ...], ...}
  const map={};
  txt.split('\n').forEach(l=>{
    const m=l.match(/^\[([^\]]+)\]\s*(.+)/);
    if(m&&m[2].trim()){
      if(!map[m[1]])map[m[1]]=[];
      map[m[1]].push(m[2].trim());
    }
  });
  return map;
}
function actDateVal(a){
  return (parseInt(a.year)||0)*10000+(parseInt(a.month)||0)*100+(parseInt(a.day)||0);
}

// ══════════════════════
// 반 선택 드롭다운 새로고침
// ══════════════════════
function refreshClassSelects(){
  ['se-result-class','ch-result-class'].forEach(id=>{
    const sel=document.getElementById(id);
    if(!sel)return;
    const prev=sel.value;
    sel.innerHTML='<option value="">반 선택</option>';
    document.querySelectorAll('.class-panel').forEach(p=>{
      const cid=p.id.replace('cpanel_','');
      const name=document.getElementById('cname_'+cid)?.value||'반';
      const opt=document.createElement('option');
      opt.value=cid; opt.textContent=name;
      if(cid===prev)opt.selected=true;
      sel.appendChild(opt);
    });
  });
  // 세특 과목 선택도 새로고침
  const subSel=document.getElementById('se-result-subject');
  if(subSel){
    const prev=subSel.value;
    subSel.innerHTML='<option value="">과목 선택</option>';
    S.get('se-subjects',[]).forEach(s=>{
      const opt=document.createElement('option');
      opt.value=s; opt.textContent=s;
      if(s===prev)opt.selected=true;
      subSel.appendChild(opt);
    });
  }
}

// ══════════════════════
// 세특
// ══════════════════════
let activeSeSubject=null;

function addSeSubject(){
  const input=document.getElementById('se-subject-input');
  const name=input.value.trim();
  if(!name)return showToast('과목명을 입력해주세요!','err');
  const subjects=S.get('se-subjects',[]);
  if(subjects.includes(name))return showToast('이미 있는 과목이에요!','err');
  subjects.push(name);
  S.set('se-subjects',subjects);
  input.value='';
  renderSeSubjects();
  switchSeSubject(name);
  refreshClassSelects();
}

function renderSeSubjects(){
  const subjects=S.get('se-subjects',[]);
  const tabsEl=document.getElementById('seSubTabs');
  const panelsEl=document.getElementById('seSubPanels');
  tabsEl.innerHTML=''; panelsEl.innerHTML='';
  if(!subjects.length){
    tabsEl.innerHTML='<span style="font-size:12px;color:var(--text-3);">과목을 추가해주세요.</span>';
    return;
  }
  subjects.forEach(s=>{
    const btn=document.createElement('button');
    btn.className='sub-tab'+(s===activeSeSubject?' active':'');
    btn.textContent=s; btn.onclick=()=>switchSeSubject(s);
    tabsEl.appendChild(btn);

    const data=S.get('se-data-'+s,{achievement:'',activities:[],phrases:''});
    const panel=document.createElement('div');
    panel.className='sub-panel'+(s===activeSeSubject?' active':'');
    panel.id='se-panel-'+s;
    panel.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span style="font-size:14px;font-weight:700;color:var(--text);">${esc(s)}</span>
        <button class="btn btn-danger" style="font-size:11px;padding:4px 9px;" onclick="deleteSeSubject('${esc(s)}')">삭제</button>
      </div>
      <div style="margin-bottom:14px;">
        <label>성취기준</label>
        <textarea id="se-ach-${s}" placeholder="예: 운동 수행 능력을 향상시키고 체력을 기른다." oninput="saveSeData('${s}')">${esc(data.achievement)}</textarea>
      </div>
      <div style="margin-bottom:8px;">
        <label style="margin-bottom:7px;display:block;">활동 목록</label>
        <div class="activity-list" id="se-acts-${s}"></div>
        <button class="add-row-btn" onclick="addSeActivity('${s}')">+ 활동 추가</button>
      </div>
      <div class="ai-box" style="margin-top:14px;">
        <div class="ai-box-title">🤖 AI용 텍스트</div>
        <div class="ai-preview" id="se-preview-${s}">미리보기 버튼을 눌러주세요.</div>
        <div class="btn-row">
          <button class="btn" style="font-size:11px;" onclick="updateSePreview('${s}')">미리보기</button>
          <button class="btn btn-dark" style="font-size:11px;" onclick="copySeAiText('${s}')">📋 AI용 텍스트 복사</button>
        </div>
        <div style="font-size:11px;color:var(--text-3);margin-top:8px;">💡 복사 후 AI 채팅창에 붙여넣으면 문구를 받을 수 있어요!</div>
      </div>
      <div class="divider"></div>
      <div class="phrase-bank">
        <div class="phrase-bank-hd">
          <span class="phrase-bank-title">📝 문구 뱅크</span>
          <div style="display:flex;gap:5px;align-items:center;">
            <span class="phrase-badge" id="se-count-${s}">0개</span>
            <button class="btn btn-danger" style="font-size:10px;padding:2px 8px;" onclick="clearPhrases('se-phrases-${s}','se-count-${s}','${s}','se')">전체 삭제</button>
          </div>
        </div>
        <div class="phrase-hint">형식: <code>[활동명] 문장</code> 으로 한 줄씩<br>예) <code>[배드민턴수행평가]</code> 기초 기술을 꾸준히 익히며 향상된 수행 능력을 보임.</div>
        <div class="format-row">
          <button class="btn" style="font-size:11px;" onclick="formatPhrases('se-phrases-${s}','se-count-${s}','${s}','se')">✨ 형식 정리</button>
          <span style="font-size:11px;color:var(--text-3);">AI 문구를 붙여넣고 클릭하세요</span>
        </div>
        <textarea id="se-phrases-${s}" placeholder="AI에게 받은 문구를 여기에 붙여넣으세요..." oninput="saveSeData('${s}')" style="min-height:150px;">${esc(data.phrases)}</textarea>
      </div>`;
    panelsEl.appendChild(panel);
    renderSeActivities(s, data.activities||[]);
    updateCount('se-phrases-'+s,'se-count-'+s);
  });
}

function switchSeSubject(s){
  activeSeSubject=s;
  document.querySelectorAll('#seSubTabs .sub-tab').forEach(b=>b.classList.toggle('active',b.textContent===s));
  document.querySelectorAll('#seSubPanels .sub-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('se-panel-'+s)?.classList.add('active');
}

function saveSeData(s){
  S.set('se-data-'+s,{
    achievement:document.getElementById('se-ach-'+s)?.value||'',
    activities:getSeActivities(s),
    phrases:document.getElementById('se-phrases-'+s)?.value||''
  });
  updateCount('se-phrases-'+s,'se-count-'+s);
}

function deleteSeSubject(s){
  if(!confirm(`"${s}" 과목을 삭제할까요?`))return;
  const subjects=S.get('se-subjects',[]).filter(x=>x!==s);
  S.set('se-subjects',subjects);
  S.del('se-data-'+s);
  activeSeSubject=subjects[0]||null;
  renderSeSubjects();
  refreshClassSelects();
}

// ── 세특 활동 행 (날짜 없음) ──
let seActCount=0;
function makeSeActRow(uid,act){
  return `<div class="se-act-row" id="se-act-row-${uid}">
    <div>
      <label>활동명</label>
      <input type="text" id="se-act-name-${uid}" value="${esc(act.name||'')}" placeholder="예: 배드민턴 수행평가" oninput="saveSeFromRow(this)">
    </div>
    <div>
      <label>활동설명 <span style="font-size:10px;color:var(--text-3);text-transform:none;font-weight:400;">(선택, AI 맥락용)</span></label>
      <textarea id="se-act-desc-${uid}" placeholder="AI가 맥락을 파악할 수 있게 간단히 적어주세요..." oninput="saveSeFromRow(this)">${esc(act.desc||'')}</textarea>
    </div>
    <div style="padding-top:18px;">
      <button class="btn btn-danger" style="font-size:11px;padding:4px 8px;white-space:nowrap;" onclick="removeSeActivity(this,'${uid}')">삭제</button>
    </div>
  </div>`;
}

function getSeSubjectFromRow(el){
  let node=el;
  while(node&&!node.id?.startsWith('se-panel-'))node=node.parentElement;
  return node?.id?.replace('se-panel-','');
}

function saveSeFromRow(el){
  const s=getSeSubjectFromRow(el);
  if(s)saveSeData(s);
}

function renderSeActivities(s,acts){
  const container=document.getElementById('se-acts-'+s);
  if(!container)return;
  container.innerHTML='';
  (acts||[]).forEach(act=>{
    seActCount++;
    const uid='seact_'+seActCount;
    container.insertAdjacentHTML('beforeend',makeSeActRow(uid,act));
  });
}

function addSeActivity(s){
  seActCount++;
  const uid='seact_'+seActCount;
  const container=document.getElementById('se-acts-'+s);
  if(!container)return;
  container.insertAdjacentHTML('beforeend',makeSeActRow(uid,{name:'',desc:''}));
  saveSeData(s);
}

function removeSeActivity(btn,uid){
  document.getElementById('se-act-row-'+uid)?.remove();
  const s=getSeSubjectFromRow(btn);
  if(s)saveSeData(s);
}

function getSeActivities(s){
  const container=document.getElementById('se-acts-'+s);
  if(!container)return[];
  return Array.from(container.querySelectorAll('.se-act-row')).map(row=>{
    const uid=row.id.replace('se-act-row-','');
    return{name:document.getElementById('se-act-name-'+uid)?.value||'',desc:document.getElementById('se-act-desc-'+uid)?.value||''};
  });
}

function updateSePreview(s){
  const ach=document.getElementById('se-ach-'+s)?.value||'';
  const acts=getSeActivities(s);
  const actText=acts.length?acts.map(a=>`  - ${a.name||'(활동명 없음)'}${a.desc?' | '+a.desc:''}`).join('\n'):'(활동 없음)';
  document.getElementById('se-preview-'+s).textContent=`[세특 문구 생성 요청] 과목: ${s}
성취기준: ${ach||'(미입력)'}
활동 목록:
${actText}

위 내용을 바탕으로 중학교 생활기록부 세특 문구를 활동별로 작성해주세요.
원칙: 관찰자 시점 / 개조식(~함. ~보임.) / 주어 없이 / 긍정적 표현

각 활동마다 [활동명] 형식으로 시작하여 해당 활동에서 나올 수 있는
다양한 교육적 요소를 담은 문구를 15개씩 작성해주세요.
예시) [배드민턴수행평가] 기초 기술을 꾸준히 익히며 향상된 수행 능력을 보임.`;
}

function copySeAiText(s){
  updateSePreview(s);
  navigator.clipboard.writeText(document.getElementById('se-preview-'+s).textContent)
    .then(()=>showToast('복사됐어요! AI에 붙여넣으세요 😊'));
}

// ── 활동명 연결어 ──
const ACT_CONNECTORS=['에서','을 통해','를 통해','에 참여하여','활동에서','을 마치며','를 마치며','시간을 통해'];
function actPrefix(name){
  const c=ACT_CONNECTORS[Math.floor(Math.random()*ACT_CONNECTORS.length)];
  return name+c+' ';
}


function seRenderCombine(){}

function seCombine(){
  const cid=document.getElementById('se-result-class')?.value;
  const subj=document.getElementById('se-result-subject')?.value;
  if(!cid)return showToast('반을 선택해주세요!','err');
  if(!subj)return showToast('과목을 선택해주세요!','err');
  const phrases=S.get('se-data-'+subj,{phrases:''}).phrases;
  const actMap=getPhrasesByActivity(phrases);
  const actNames=Object.keys(actMap);
  if(!actNames.length)return showToast('문구 뱅크에 문구를 먼저 등록해주세요!','err');
  const students=getStudentsOfClass(cid);
  if(!students.length)return showToast('학생을 먼저 등록해주세요!','err');

  // 활동별 사용된 문장 인덱스 추적
  const seUsedMap={};
  actNames.forEach(act=>{seUsedMap[act]=[];});

  const results=students.map(s=>{
    const shuffled=[...actNames].sort(()=>Math.random()-0.5);
    const chosen=shuffled.slice(0,Math.min(2,shuffled.length));
    const parts=chosen.map(act=>{
      const ps=actMap[act];
      let avail=ps.map((_,i)=>i).filter(i=>!seUsedMap[act].includes(i));
      if(avail.length<2){seUsedMap[act]=[];avail=ps.map((_,i)=>i);}
      const shuffledAvail=[...avail].sort(()=>Math.random()-0.5);
      const picked=shuffledAvail.slice(0,Math.min(2,shuffledAvail.length));
      picked.forEach(i=>seUsedMap[act].push(i));
      return actPrefix(act)+picked.map(i=>ps[i]).join(' ');
    });
    return{studentId:s.id,gender:s.gender,text:parts.join('\n')};
  });

  window._seResults=results;
  S.set('se-last-results',results);
  renderCombineResults(results,'se-combine-results');
  document.getElementById('se-export-box').style.display='block';
  showToast('조합 완료!');
}

// ══════════════════════
// 창체
// ══════════════════════
let activeChTab='자율';
const CH=['자율','진로','동아리'];

function switchChTab(type){
  activeChTab=type;
  document.querySelectorAll('#t-ch .sub-tab').forEach((b,i)=>b.classList.toggle('active',CH[i]===type));
  renderChPanel(type);
}

function renderChPanel(type){
  const panelsEl=document.getElementById('chPanels');
  const data=S.get('ch-data-'+type,{activities:[],phrases:''});
  panelsEl.innerHTML=`
    <div style="margin-bottom:8px;">
      <label style="margin-bottom:7px;display:block;">활동 목록 <span style="font-size:10px;color:var(--text-3);font-weight:400;text-transform:none;letter-spacing:0;">날짜순 자동 정렬</span></label>
      <div class="activity-list" id="ch-acts-${type}"></div>
      <button class="add-row-btn" onclick="addChActivity('${type}')">+ 활동 추가</button>
    </div>
    <div class="ai-box" style="margin-top:14px;">
      <div class="ai-box-title">🤖 AI용 텍스트</div>
      <div class="ai-preview" id="ch-preview-${type}">미리보기 버튼을 눌러주세요.</div>
      <div class="btn-row">
        <button class="btn" style="font-size:11px;" onclick="updateChPreview('${type}')">미리보기</button>
        <button class="btn btn-dark" style="font-size:11px;" onclick="copyChAiText('${type}')">📋 AI용 텍스트 복사</button>
      </div>
      <div style="font-size:11px;color:var(--text-3);margin-top:8px;">💡 복사 후 AI 채팅창에 붙여넣으면 문구를 받을 수 있어요!</div>
    </div>
    <div class="divider"></div>
    <div class="phrase-bank">
      <div class="phrase-bank-hd">
        <span class="phrase-bank-title">📝 문구 뱅크</span>
        <div style="display:flex;gap:5px;align-items:center;">
          <span class="phrase-badge" id="ch-count-${type}">0개</span>
          <button class="btn btn-danger" style="font-size:10px;padding:2px 8px;" onclick="clearPhrases('ch-phrases-${type}','ch-count-${type}','${type}','ch')">전체 삭제</button>
        </div>
      </div>
      <div class="phrase-hint">형식: <code>[활동명] 문장</code> 으로 한 줄씩<br>예) <code>[학교폭력예방교육]</code> 공감 능력의 중요성을 인식하며 경청하는 태도를 보임.</div>
      <div class="format-row">
        <button class="btn" style="font-size:11px;" onclick="formatPhrases('ch-phrases-${type}','ch-count-${type}','${type}','ch')">✨ 형식 정리</button>
        <span style="font-size:11px;color:var(--text-3);">AI 문구를 붙여넣고 클릭하세요</span>
      </div>
      <textarea id="ch-phrases-${type}" placeholder="AI에게 받은 문구를 붙여넣으세요..." oninput="saveChData('${type}')" style="min-height:150px;">${esc(data.phrases)}</textarea>
    </div>`;
  renderChActivities(type, data.activities||[]);
  updateCount('ch-phrases-'+type,'ch-count-'+type);
}

function saveChData(type){
  S.set('ch-data-'+type,{activities:getChActivities(type),phrases:document.getElementById('ch-phrases-'+type)?.value||''});
  updateCount('ch-phrases-'+type,'ch-count-'+type);
}

// ── 창체 활동 행 (날짜 있음) ──
let chActCount=0;
function makeChActRow(uid,act){
  const cfg=S.get('cfg',{year:'2026'});
  const cy=parseInt(cfg.year)||2026;
  const yOpts=[cy-1,cy,cy+1].map(y=>`<option value="${y}" ${act.year==y?'selected':''}>${y}년</option>`).join('');
  const mOpts=Array.from({length:12},(_,i)=>i+1).map(m=>`<option value="${m}" ${act.month==m?'selected':''}>${m}월</option>`).join('');
  const dOpts=Array.from({length:31},(_,i)=>i+1).map(d=>`<option value="${d}" ${act.day==d?'selected':''}>${d}일</option>`).join('');
  return `<div class="ch-act-row" id="ch-act-row-${uid}">
    <div>
      <label>날짜</label>
      <div class="date-selects">
        <select id="ch-act-y-${uid}" onchange="sortAndSaveChActs(this)">${yOpts}</select>
        <select id="ch-act-m-${uid}" onchange="sortAndSaveChActs(this)">${mOpts}</select>
        <select id="ch-act-d-${uid}" onchange="sortAndSaveChActs(this)">${dOpts}</select>
      </div>
    </div>
    <div>
      <label>활동명</label>
      <input type="text" id="ch-act-name-${uid}" value="${esc(act.name||'')}" placeholder="예: 학교폭력예방교육" oninput="saveChFromRow(this)">
    </div>
    <div>
      <label>활동설명 <span style="font-size:10px;color:var(--text-3);text-transform:none;font-weight:400;">(선택)</span></label>
      <textarea id="ch-act-desc-${uid}" placeholder="AI 맥락 파악용..." oninput="saveChFromRow(this)">${esc(act.desc||'')}</textarea>
    </div>
    <div style="padding-top:18px;">
      <button class="btn btn-danger" style="font-size:11px;padding:4px 8px;white-space:nowrap;" onclick="removeChActivity(this,'${uid}')">삭제</button>
    </div>
  </div>`;
}

function getChTypeFromRow(el){
  let node=el;
  while(node&&!node.id?.startsWith('ch-acts-'))node=node.parentElement;
  return node?.id?.replace('ch-acts-','');
}

function saveChFromRow(el){
  const type=getChTypeFromRow(el);
  if(type)saveChData(type);
}

function sortAndSaveChActs(el){
  const type=getChTypeFromRow(el);
  if(!type)return;
  saveChData(type);
  const acts=getChActivities(type);
  acts.sort((a,b)=>actDateVal(a)-actDateVal(b));
  S.set('ch-data-'+type,{activities:acts,phrases:document.getElementById('ch-phrases-'+type)?.value||''});
  renderChActivities(type,acts);
}

function renderChActivities(type,acts){
  const container=document.getElementById('ch-acts-'+type);
  if(!container)return;
  container.innerHTML='';
  // 불러올 때도 날짜순 정렬
  const sorted=[...(acts||[])].sort((a,b)=>actDateVal(a)-actDateVal(b));
  sorted.forEach(act=>{
    chActCount++;
    const uid='chact_'+chActCount;
    container.insertAdjacentHTML('beforeend',makeChActRow(uid,act));
  });
}

function addChActivity(type){
  const cfg=S.get('cfg',{year:'2026'});
  const y=parseInt(cfg.year)||2026;
  chActCount++;
  const uid='chact_'+chActCount;
  const container=document.getElementById('ch-acts-'+type);
  if(!container)return;
  container.insertAdjacentHTML('beforeend',makeChActRow(uid,{year:y,month:3,day:1,name:'',desc:''}));
  saveChData(type);
}

function removeChActivity(btn,uid){
  document.getElementById('ch-act-row-'+uid)?.remove();
  const type=getChTypeFromRow(btn);
  if(type)saveChData(type);
}

function getChActivities(type){
  const container=document.getElementById('ch-acts-'+type);
  if(!container)return[];
  return Array.from(container.querySelectorAll('.ch-act-row')).map(row=>{
    const uid=row.id.replace('ch-act-row-','');
    return{
      year:document.getElementById('ch-act-y-'+uid)?.value||'',
      month:document.getElementById('ch-act-m-'+uid)?.value||'',
      day:document.getElementById('ch-act-d-'+uid)?.value||'',
      name:document.getElementById('ch-act-name-'+uid)?.value||'',
      desc:document.getElementById('ch-act-desc-'+uid)?.value||''
    };
  });
}

function updateChPreview(type){
  const acts=getChActivities(type);
  const sorted=[...acts].sort((a,b)=>actDateVal(a)-actDateVal(b));
  const actText=sorted.length?sorted.map(a=>`  - ${a.year}년 ${a.month}월 ${a.day}일 | ${a.name||'(활동명 없음)'}${a.desc?' | '+a.desc:''}`).join('\n'):'(활동 없음)';
  document.getElementById('ch-preview-'+type).textContent=`[창체 ${type}활동 문구 생성 요청]
활동 목록 (날짜순):
${actText}

위 활동을 바탕으로 창체 특기사항 문구를 활동별로 작성해주세요.
원칙: 관찰자 시점 / 개조식(~함. ~보임.) / 주어 없이 / 긍정적

각 활동마다 [활동명] 형식으로 시작하여 해당 활동에서 나올 수 있는
다양한 교육적 요소(공감, 협력, 참여태도, 책임감, 창의성 등)를 담은 문구를 15개씩 작성해주세요.
예시) [학교폭력예방교육] 공감 능력의 중요성을 인식하며 경청하는 태도를 보임.`;
}

function copyChAiText(type){
  updateChPreview(type);
  navigator.clipboard.writeText(document.getElementById('ch-preview-'+type).textContent)
    .then(()=>showToast('복사됐어요! AI에 붙여넣으세요 😊'));
}

// ── 창체 조합 ──
function chRenderCombine(){}

function chCombine(){
  const cid=document.getElementById('ch-result-class')?.value;
  if(!cid)return showToast('반을 선택해주세요!','err');
  const type=activeChTab;
  const phrases=S.get('ch-data-'+type,{phrases:''}).phrases;
  const actMap=getPhrasesByActivity(phrases);
  const actNames=Object.keys(actMap);
  if(!actNames.length)return showToast('문구 뱅크에 문구를 먼저 등록해주세요!','err');

  // 활동 날짜 순서 가져오기 (창체는 날짜순)
  const storedActs=S.get('ch-data-'+type,{activities:[]}).activities;
  const sortedActNames=[...storedActs].sort((a,b)=>actDateVal(a)-actDateVal(b)).map(a=>a.name).filter(n=>actMap[n]);
  // 문구 뱅크에만 있는 것도 포함
  actNames.forEach(n=>{if(!sortedActNames.includes(n))sortedActNames.push(n);});

  const students=getStudentsOfClass(cid);
  if(!students.length)return showToast('학생을 먼저 등록해주세요!','err');

  // 활동별 사용된 문장 인덱스 추적
  const chUsedMap={};
  actNames.forEach(act=>{chUsedMap[act]=[];});

  const results=students.map(s=>{
    const shuffled=[...sortedActNames].sort(()=>Math.random()-0.5);
    const chosen=shuffled.slice(0,Math.min(2,shuffled.length));
    chosen.sort((a,b)=>sortedActNames.indexOf(a)-sortedActNames.indexOf(b));
    const parts=chosen.map(act=>{
      const ps=actMap[act];
      let avail=ps.map((_,i)=>i).filter(i=>!chUsedMap[act].includes(i));
      if(avail.length<2){chUsedMap[act]=[];avail=ps.map((_,i)=>i);}
      const shuffledAvail=[...avail].sort(()=>Math.random()-0.5);
      const picked=shuffledAvail.slice(0,Math.min(2,shuffledAvail.length));
      picked.forEach(i=>chUsedMap[act].push(i));
      return actPrefix(act)+picked.map(i=>ps[i]).join(' ');
    });
    return{studentId:s.id,gender:s.gender,text:parts.join('\n')};
  });

  window._chResults=results;
  S.set('ch-last-results',results);
  renderCombineResults(results,'ch-combine-results');
  document.getElementById('ch-export-box').style.display='block';
  showToast('조합 완료!');
}

// ── 공통 결과 렌더 ──
function renderCombineResults(results,containerId){
  const container=document.getElementById(containerId);
  if(!results.length){container.innerHTML='';return;}
  let html='';
  results.forEach(r=>{
    const b=calcBytes(r.text);
    const bc=b>2000?'byte-over':b>1500?'byte-warn':'byte-ok';
    const rid=containerId+'_'+r.studentId;
    html+=`<div class="result-card">
      <div class="result-card-hd">
        <div class="result-sid">학번 ${esc(r.studentId)} <span class="byte-chip ${bc}">${b.toLocaleString()} B</span></div>
      </div>
      <div class="result-text" id="${rid}" contenteditable="false">${esc(r.text)}</div>
      <div class="result-actions">
        <button class="btn" style="font-size:11px;padding:4px 9px;" onclick="copyResult('${rid}')">복사</button>
        <button class="btn" style="font-size:11px;padding:4px 9px;" onclick="toggleEdit('${rid}','${containerId}','${esc(r.studentId)}')">수정</button>
      </div>
    </div>`;
  });
  container.innerHTML=html;
}

function copyResult(rid){
  const el=document.getElementById(rid);
  if(!el)return;
  navigator.clipboard.writeText(el.innerText).then(()=>showToast('복사됐어요!'));
}

function toggleEdit(rid,containerId,studentId){
  const el=document.getElementById(rid);
  if(!el)return;
  const isEditing=el.contentEditable==='true';
  if(isEditing){
    el.contentEditable='false';
    // 저장
    const newText=el.innerText;
    const arr=containerId.startsWith('se')?window._seResults:window._chResults;
    const r=arr?.find(x=>x.studentId===studentId);
    if(r){
      r.text=newText;
      const key=containerId.startsWith('se')?'se-last-results':'ch-last-results';
      S.set(key,arr);
    }
    // 바이트 업데이트
    const card=el.closest('.result-card');
    const chip=card?.querySelector('.byte-chip');
    if(chip){
      const b=calcBytes(newText);
      chip.textContent=b.toLocaleString()+' B';
      chip.className='byte-chip '+(b>2000?'byte-over':b>1500?'byte-warn':'byte-ok');
    }
    const btn=el.parentElement.querySelector('button:last-child');
    if(btn)btn.textContent='수정';
    showToast('저장됐어요!');
  } else {
    el.contentEditable='true';
    el.focus();
    const btn=el.parentElement.querySelector('button:last-child');
    if(btn)btn.textContent='저장';
  }
}

// ══════════════════════
// 학생관리
// ══════════════════════
let classCount=0, activeClassId=null;

function addClass(name){
  classCount++;
  const id='cls_'+classCount;
  const cn=name||(classCount+'반');
  const tabBar=document.getElementById('classTabBar');
  const btn=document.createElement('button');
  btn.className='class-tab-btn'; btn.id='ctab_'+id;
  btn.textContent=cn; btn.onclick=()=>switchClass(id);
  tabBar.appendChild(btn);
  const panelsEl=document.getElementById('classPanels');
  const panel=document.createElement('div');
  panel.className='class-panel'; panel.id='cpanel_'+id;
  panel.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <input class="class-name-input" id="cname_${id}" value="${esc(cn)}" onchange="updateClassName('${id}')">
      <button class="btn btn-danger" style="font-size:11px;padding:4px 9px;" onclick="deleteClass('${id}')">반 삭제</button>
    </div>
    <div class="student-list" id="srows_${id}"></div>
    <button class="add-student-btn" onclick="addStudent('${id}')">+ 학생 추가</button>`;
  panelsEl.appendChild(panel);
  switchClass(id);
  saveClasses();
  refreshClassSelects();
  return id;
}

function switchClass(id){
  activeClassId=id;
  document.querySelectorAll('.class-tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.class-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('ctab_'+id)?.classList.add('active');
  document.getElementById('cpanel_'+id)?.classList.add('active');
}

function updateClassName(id){
  const name=document.getElementById('cname_'+id)?.value.trim()||'반';
  document.getElementById('ctab_'+id).textContent=name;
  saveClasses();
  refreshClassSelects();
}

function deleteClass(id){
  if(!confirm('이 반을 삭제할까요?'))return;
  document.getElementById('ctab_'+id)?.remove();
  document.getElementById('cpanel_'+id)?.remove();
  document.querySelector('.class-tab-btn')?.click();
  saveClasses();
  refreshClassSelects();
}

let sCount=0;
function addStudent(cid){
  const id2=cid||activeClassId;
  if(!id2)return;
  const rows=document.getElementById('srows_'+id2);
  if(!rows)return;
  const n=++sCount, sid='s_'+n;
  const rn=rows.children.length+1;
  const div=document.createElement('div');
  div.className='student-row'; div.id=sid;
  div.innerHTML=`
    <span class="s-num">${rn}</span>
    <div><input type="text" placeholder="학번 (예: 10101)" id="${sid}_id" onblur="saveClasses()"></div>
    <div><select id="${sid}_g" onchange="saveClasses()"><option value="남학생">남학생</option><option value="여학생">여학생</option></select></div>
    <button class="btn btn-danger" style="font-size:11px;padding:4px 7px;" onclick="removeStudent('${sid}','${id2}')">삭제</button>`;
  rows.appendChild(div);
}

function removeStudent(sid,cid){
  document.getElementById(sid)?.remove();
  document.querySelectorAll('#srows_'+cid+' .s-num').forEach((el,i)=>el.textContent=i+1);
  saveClasses();
}

function saveClasses(){
  const cls=[];
  document.querySelectorAll('.class-panel').forEach(p=>{
    const cid=p.id.replace('cpanel_','');
    const students=[];
    document.querySelectorAll('#srows_'+cid+' .student-row').forEach(r=>{
      students.push({
        id:r.querySelector('[id$="_id"]')?.value.trim()||'',
        gender:r.querySelector('[id$="_g"]')?.value||'남학생'
      });
    });
    cls.push({cid,name:document.getElementById('cname_'+cid)?.value||'반',students});
  });
  S.set('classes',cls);
}

function loadClasses(){
  const cls=S.get('classes',[]);
  if(!cls.length){addClass('1반');return;}
  cls.forEach(c=>{
    classCount++;
    const id=c.cid||'cls_'+classCount;
    const tabBar=document.getElementById('classTabBar');
    const btn=document.createElement('button');
    btn.className='class-tab-btn'; btn.id='ctab_'+id;
    btn.textContent=c.name; btn.onclick=()=>switchClass(id);
    tabBar.appendChild(btn);
    const panelsEl=document.getElementById('classPanels');
    const panel=document.createElement('div');
    panel.className='class-panel'; panel.id='cpanel_'+id;
    panel.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <input class="class-name-input" id="cname_${id}" value="${esc(c.name)}" onchange="updateClassName('${id}')">
        <button class="btn btn-danger" style="font-size:11px;padding:4px 9px;" onclick="deleteClass('${id}')">반 삭제</button>
      </div>
      <div class="student-list" id="srows_${id}"></div>
      <button class="add-student-btn" onclick="addStudent('${id}')">+ 학생 추가</button>`;
    panelsEl.appendChild(panel);
    c.students.forEach(s=>{
      sCount++;
      const sid='s_'+sCount;
      const rows=document.getElementById('srows_'+id);
      const rn=rows.children.length+1;
      const div=document.createElement('div');
      div.className='student-row'; div.id=sid;
      div.innerHTML=`
        <span class="s-num">${rn}</span>
        <div><input type="text" placeholder="학번" id="${sid}_id" value="${esc(s.id)}" onblur="saveClasses()"></div>
        <div><select id="${sid}_g" onchange="saveClasses()"><option value="남학생" ${s.gender==='남학생'?'selected':''}>남학생</option><option value="여학생" ${s.gender==='여학생'?'selected':''}>여학생</option></select></div>
        <button class="btn btn-danger" style="font-size:11px;padding:4px 7px;" onclick="removeStudent('${sid}','${id}')">삭제</button>`;
      rows.appendChild(div);
    });
  });
  document.querySelector('.class-tab-btn')?.click();
}

function getStudentsOfClass(cid){
  return Array.from(document.querySelectorAll('#srows_'+cid+' .student-row')).map(r=>({
    id:r.querySelector('[id$="_id"]')?.value.trim()||'',
    gender:r.querySelector('[id$="_g"]')?.value||'남학생'
  })).filter(s=>s.id);
}

// ── 학생 자동 생성 ──
function autoGenStudents(){
  const classNum=parseInt(document.getElementById('autogen-classnum')?.value)||0;
  const count=parseInt(document.getElementById('autogen-count')?.value)||0;
  if(!classNum||classNum<1||classNum>20)return showToast('반 번호를 1~20으로 입력해주세요!','err');
  if(!count||count<1||count>50)return showToast('인원수를 1~50으로 입력해주세요!','err');
  const cfg=S.get('cfg',{grade:'1'});
  const grade=parseInt(cfg.grade)||1;
  let targetId=null;
  document.querySelectorAll('.class-panel').forEach(p=>{
    const cid=p.id.replace('cpanel_','');
    if(document.getElementById('cname_'+cid)?.value===classNum+'반')targetId=cid;
  });
  if(!targetId){
    targetId=addClass(classNum+'반');
  } else {
    switchClass(targetId);
    if(!confirm(`기존 "${classNum}반" 목록을 초기화하고 자동생성할까요?`))return;
  }
  const rows=document.getElementById('srows_'+targetId);
  if(rows)rows.innerHTML='';
  for(let i=1;i<=count;i++){
    const studentId=`${grade}${String(classNum).padStart(2,'0')}${String(i).padStart(2,'0')}`;
    sCount++;
    const sid='s_'+sCount;
    const div=document.createElement('div');
    div.className='student-row'; div.id=sid;
    const rn=i;
    div.innerHTML=`
      <span class="s-num">${rn}</span>
      <div><input type="text" placeholder="학번" id="${sid}_id" value="${studentId}" onblur="saveClasses()"></div>
      <div><select id="${sid}_g" onchange="saveClasses()"><option value="남학생">남학생</option><option value="여학생">여학생</option></select></div>
      <button class="btn btn-danger" style="font-size:11px;padding:4px 7px;" onclick="removeStudent('${sid}','${targetId}')">삭제</button>`;
    rows.appendChild(div);
  }
  saveClasses();
  refreshClassSelects();
  showToast(`${classNum}반 ${count}명 생성 완료!`);
}

// ── 붙여넣기 생성 ──
function pasteGenStudents(){
  const classNum=parseInt(document.getElementById('paste-classnum')?.value)||0;
  const raw=document.getElementById('paste-students')?.value||'';
  if(!classNum||classNum<1||classNum>20)return showToast('반 번호를 1~20으로 입력해주세요!','err');
  if(!raw.trim())return showToast('번호+성별 내용을 입력해주세요!','err');
  const cfg=S.get('cfg',{grade:'1'});
  const grade=parseInt(cfg.grade)||1;
  const lines=raw.trim().split('\n').map(l=>l.trim()).filter(Boolean);
  const parsed=lines.map(l=>{
    const parts=l.split(/\s+/);
    const num=parseInt(parts[0]);
    const gRaw=parts[1]||'남';
    const gender=gRaw.includes('여')?'여학생':'남학생';
    if(!num||isNaN(num))return null;
    return{num,gender};
  }).filter(Boolean);
  if(!parsed.length)return showToast('형식을 확인해주세요! (예: 1 남)','err');

  let targetId=null;
  document.querySelectorAll('.class-panel').forEach(p=>{
    const cid=p.id.replace('cpanel_','');
    if(document.getElementById('cname_'+cid)?.value===classNum+'반')targetId=cid;
  });
  if(!targetId){
    targetId=addClass(classNum+'반');
  } else {
    switchClass(targetId);
    if(!confirm(`기존 "${classNum}반" 목록을 초기화하고 생성할까요?`))return;
  }
  const rows=document.getElementById('srows_'+targetId);
  if(rows)rows.innerHTML='';
  parsed.forEach((p,i)=>{
    const studentId=`${grade}${String(classNum).padStart(2,'0')}${String(p.num).padStart(2,'0')}`;
    sCount++;
    const sid='s_'+sCount;
    const div=document.createElement('div');
    div.className='student-row'; div.id=sid;
    div.innerHTML=`
      <span class="s-num">${i+1}</span>
      <div><input type="text" placeholder="학번" id="${sid}_id" value="${studentId}" onblur="saveClasses()"></div>
      <div><select id="${sid}_g" onchange="saveClasses()"><option value="${p.gender}" selected>${p.gender}</option><option value="${p.gender==='남학생'?'여학생':'남학생'}">${p.gender==='남학생'?'여학생':'남학생'}</option></select></div>
      <button class="btn btn-danger" style="font-size:11px;padding:4px 7px;" onclick="removeStudent('${sid}','${targetId}')">삭제</button>`;
    rows.appendChild(div);
  });
  document.getElementById('paste-students').value='';
  saveClasses();
  refreshClassSelects();
  showToast(`${parsed.length}명 생성 완료!`);
}

// ══════════════════════
// 문구 형식 정리
// ══════════════════════
function formatPhrases(textareaId, countId, key, type){
  const ta=document.getElementById(textareaId);
  if(!ta)return;
  const raw=ta.value;
  if(!raw.trim())return showToast('문구를 먼저 붙여넣어 주세요!','err');
  const lines=raw.split('\n');
  const result=[];
  let currentCat=null;
  lines.forEach(line=>{
    const trimmed=line.trim();
    if(!trimmed)return;
    const catOnly=/^\[([^\]]+)\]\s*$/.exec(trimmed);
    const catWith=/^\[([^\]]+)\]\s+(.+)$/.exec(trimmed);
    if(catOnly){ currentCat=catOnly[1]; }
    else if(catWith){ currentCat=catWith[1]; result.push(`[${currentCat}] ${catWith[2]}`); }
    else if(currentCat&&trimmed){ result.push(`[${currentCat}] ${trimmed}`); }
  });
  if(!result.length)return showToast('정리할 문구를 찾지 못했어요.','err');
  ta.value=result.join('\n');
  if(type==='se')saveSeData(key);
  else saveChData(key);
  updateCount(textareaId,countId);
  showToast(`${result.length}개 문구 정리 완료!`);
}

// ── 문구 전체 삭제 ──
function clearPhrases(textareaId, countId, key, type){
  const ta=document.getElementById(textareaId);
  if(!ta||!ta.value.trim())return showToast('삭제할 문구가 없어요!','err');
  if(!confirm('문구 뱅크를 전체 삭제할까요? 되돌릴 수 없어요!'))return;
  ta.value='';
  if(type==='se')saveSeData(key);
  else saveChData(key);
  updateCount(textareaId,countId);
  showToast('문구 뱅크가 삭제됐어요!');
}


function exportExcel(tab){
  const cfg=loadSetting();
  let results, type, subject, activity;
  if(tab==='se'){
    results=window._seResults||S.get('se-last-results',[]);
    type=document.getElementById('se-export-type')?.value||'se';
    subject=document.getElementById('se-export-subject')?.value.trim()||'';
  } else {
    results=window._chResults||S.get('ch-last-results',[]);
    type=document.getElementById('ch-export-type')?.value||'simple';
    activity=document.getElementById('ch-export-activity')?.value.trim()||'';
  }
  if(!results.length)return showToast('조합된 결과가 없어요!','err');
  let csv='';
  if(type==='se'){
    csv='학년도,학기,학년,반/번호,성명,과목명,세부능력 및 특기사항\n';
    results.forEach(r=>{csv+=`${cfg.year},${cfg.semester},${cfg.grade},"${r.studentId}",,"${subject}","${r.text.replace(/"/g,'""')}"\n`;});
  } else if(type==='jinro'){
    csv='학년도,학기,학년,반,번호,성명,영역,활동명,특기사항\n';
    results.forEach(r=>{csv+=`${cfg.year},${cfg.semester},${cfg.grade},,,"",진로탐색활동,"${activity}","${r.text.replace(/"/g,'""')}"\n`;});
  } else {
    csv='학년,반,번호,특기사항\n';
    results.forEach(r=>{csv+=`${cfg.grade},,"${r.studentId}","${r.text.replace(/"/g,'""')}"\n`;});
  }
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='생활기록부_'+new Date().toLocaleDateString('ko-KR').replace(/\.\s*/g,'-').replace(/-$/,'')+'.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast('다운로드 시작!');
}

// ══════════════════════
// JSON 백업/복원
// ══════════════════════
function exportJSON(){
  const data={};
  Object.keys(localStorage).filter(k=>k.startsWith('sgb_')).forEach(k=>{
    data[k.replace('sgb_','')]=JSON.parse(localStorage.getItem(k));
  });
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='생활기록부_백업_'+new Date().toLocaleDateString('ko-KR').replace(/\.\s*/g,'-').replace(/-$/,'')+'.json';
  a.click(); URL.revokeObjectURL(url);
  showToast('백업 파일 다운로드!');
}

function importJSON(e){
  const file=e.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const data=JSON.parse(ev.target.result);
      if(!confirm('현재 데이터를 덮어쓰고 불러올까요?'))return;
      Object.keys(data).forEach(k=>localStorage.setItem('sgb_'+k,JSON.stringify(data[k])));
      showToast('불러오기 완료! 새로고침합니다.');
      setTimeout(()=>location.reload(),1000);
    }catch{showToast('파일을 읽을 수 없어요. JSON 파일인지 확인해주세요.','err');}
  };
  reader.readAsText(file);
  e.target.value='';
}

// ══════════════════════
// 초기화
// ══════════════════════
function clearAll(){
  if(!confirm('모든 데이터를 초기화할까요? 되돌릴 수 없어요!'))return;
  Object.keys(localStorage).filter(k=>k.startsWith('sgb_')).forEach(k=>localStorage.removeItem(k));
  showToast('초기화됐어요!');
  setTimeout(()=>location.reload(),800);
}

window.onload=()=>{
  loadSetting();
  loadClasses();

  // 세특 마이그레이션 및 로드
  const subjects=S.get('se-subjects',[]);
  if(subjects.length){
    subjects.forEach(s=>{
      const d=S.get('se-data-'+s,{});
      if(d.activity!==undefined&&!d.activities){
        d.activities=d.activity?d.activity.split('\n').filter(l=>l.trim()).map(l=>({name:l.trim(),desc:''})):[];
        delete d.activity;
        S.set('se-data-'+s,d);
      }
    });
    activeSeSubject=subjects[0];
    renderSeSubjects();
  }

  // 창체 마이그레이션 및 로드
  ['자율','진로','동아리'].forEach(type=>{
    const d=S.get('ch-data-'+type,{});
    if(typeof d.activities==='string'){
      d.activities=d.activities?d.activities.split('\n').filter(l=>l.trim()).map(l=>({year:'',month:'',day:'',name:l.trim(),desc:''})):[];
      S.set('ch-data-'+type,d);
    }
  });
  renderChPanel('자율');

  refreshClassSelects();

  // 이전 결과 복원
  const seRes=S.get('se-last-results',[]);
  if(seRes.length){window._seResults=seRes;renderCombineResults(seRes,'se-combine-results');document.getElementById('se-export-box').style.display='block';}
  const chRes=S.get('ch-last-results',[]);
  if(chRes.length){window._chResults=chRes;renderCombineResults(chRes,'ch-combine-results');document.getElementById('ch-export-box').style.display='block';}
};
