// ── 탭 ──
const TAB_IDS=['t-se','t-ch','t-sports','t-student','t-letter','t-convert','t-setting'];
function showTab(id){
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-tab')[TAB_IDS.indexOf(id)]?.classList.add('active');
  if(id==='t-se'||id==='t-ch'||id==='t-sports') refreshClassSelects();
}

const S={
  set:(k,v)=>localStorage.setItem('sgb_'+k,JSON.stringify(v)),
  get:(k,d)=>{try{const v=localStorage.getItem('sgb_'+k);return v?JSON.parse(v):d;}catch{return d;}},
  del:(k)=>localStorage.removeItem('sgb_'+k)
};

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

function showToast(msg,type='ok'){
  const t=document.createElement('div');
  const bg=type==='err'?'#d44':'#1a1a18';
  t.style.cssText=`position:fixed;bottom:24px;right:24px;background:${bg};color:#fff;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:fadeInUp 0.2s ease`;
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2400);
}
const _sty=document.createElement('style');
_sty.textContent='@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
document.head.appendChild(_sty);

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

function getPhrasesByActivityGrade(txt){
  const map={};
  txt.split('\n').forEach(l=>{
    const m=l.match(/^\[([^\]]+)-([ABCD])\]\s*(.+)/i);
    if(m&&m[3].trim()){
      const act=m[1].trim();
      const grade=m[2].toUpperCase();
      if(!map[act])map[act]={A:[],B:[],C:[],D:[]};
      if(!map[act][grade])map[act][grade]=[];
      map[act][grade].push(m[3].trim());
    }
  });
  return map;
}

function actDateVal(a){
  return (parseInt(a.year)||0)*10000+(parseInt(a.month)||0)*100+(parseInt(a.day)||0);
}

function correctText(text){
  let t=text;
  t=t.replace(/(\S+)\s+\1/g,'$1');
  const fixes=[
    [/이며이며/g,'이며'],[/하며하며/g,'하며'],[/보임보임/g,'보임'],
    [/하고하고/g,'하고'],[/\.\s*\./g,'.'],[/,\s*,/g,','],
    [/\s{2,}/g,' '],[/\s+\./g,'.'],[/\s+,/g,','],
  ];
  fixes.forEach(([re,rep])=>{t=t.replace(re,rep);});
  return t.trim();
}

function refreshClassSelects(){
  ['se-result-class','ch-result-class','sports-result-class'].forEach(id=>{
    const sel=document.getElementById(id);
    if(!sel)return;
    const prev=sel.value;
    sel.innerHTML='<option value="">반 선택</option>';
    const seen=new Set();
    const tabs=Array.from(document.querySelectorAll('.class-tab-btn'));
    tabs.sort((a,b)=>(parseInt(a.textContent)||999)-(parseInt(b.textContent)||999));
    tabs.forEach(btn=>{
      const cid=btn.id.replace('ctab_','');
      if(seen.has(cid))return;
      seen.add(cid);
      const name=document.getElementById('cname_'+cid)?.value||btn.textContent||'반';
      const opt=document.createElement('option');
      opt.value=cid; opt.textContent=name;
      if(cid===prev)opt.selected=true;
      sel.appendChild(opt);
    });
  });
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
    tabsEl.innerHTML='<span style="font-size:13px;color:var(--text-3);">과목을 추가해주세요.</span>';
    return;
  }
  subjects.forEach(s=>{
    const btn=document.createElement('button');
    btn.className='sub-tab'+(s===activeSeSubject?' active':'');
    btn.textContent=s; btn.onclick=()=>switchSeSubject(s);
    tabsEl.appendChild(btn);
    const data=S.get('se-data-'+s,{achievements:[],activities:[],phrases:''});
    if(data.achievement!==undefined&&!data.achievements){
      data.achievements=data.achievement?[data.achievement]:[];
      delete data.achievement;
    }
    const panel=document.createElement('div');
    panel.className='sub-panel'+(s===activeSeSubject?' active':'');
    panel.id='se-panel-'+s;
    panel.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style="font-size:15px;font-weight:700;color:var(--text);">${esc(s)}</span>
        <button class="btn btn-danger" style="font-size:12px;padding:5px 10px;" onclick="deleteSeSubject('${esc(s)}')">삭제</button>
      </div>
      <div style="margin-bottom:16px;">
        <label style="margin-bottom:8px;display:block;">성취기준</label>
        <div class="activity-list" id="se-ach-list-${s}"></div>
        <button class="add-row-btn" onclick="addSeAch('${s}')">+ 성취기준 추가</button>
      </div>
      <div style="margin-bottom:10px;">
        <label style="margin-bottom:8px;display:block;">활동 목록</label>
        <div class="activity-list" id="se-acts-${s}"></div>
        <button class="add-row-btn" onclick="addSeActivity('${s}')">+ 활동 추가</button>
      </div>
      <div class="ai-box" style="margin-top:16px;">
        <div class="ai-box-title">🤖 AI용 텍스트</div>
        <div class="ai-preview" id="se-preview-${s}">미리보기 버튼을 눌러주세요.</div>
        <div class="btn-row">
          <button class="btn" style="font-size:12px;" onclick="updateSePreview('${s}')">미리보기</button>
          <button class="btn btn-dark" style="font-size:12px;" onclick="copySeAiText('${s}')">📋 AI용 텍스트 복사</button>
        </div>
        <div style="font-size:12px;color:var(--text-3);margin-top:8px;">💡 복사 후 AI 채팅창에 붙여넣으면 문구를 받을 수 있어요!</div>
      </div>
      <div class="divider"></div>
      <div class="phrase-bank">
        <div class="phrase-bank-hd">
          <span class="phrase-bank-title">📝 문구 뱅크</span>
          <div style="display:flex;gap:5px;align-items:center;">
            <span class="phrase-badge" id="se-count-${s}">0개</span>
            <button class="btn btn-danger" style="font-size:11px;padding:2px 8px;" onclick="clearPhrases('se-phrases-${s}','se-count-${s}','${s}','se')">전체 삭제</button>
          </div>
        </div>
        <div class="phrase-hint">등급별 형식: <code>[활동명-A] 문장</code> / <code>[활동명-B] 문장</code></div>
        <div class="format-row">
          <button class="btn" style="font-size:12px;" onclick="formatPhrases('se-phrases-${s}','se-count-${s}','${s}','se')">✨ 형식 정리</button>
          <span style="font-size:12px;color:var(--text-3);">AI 문구를 붙여넣고 클릭하세요</span>
        </div>
        <textarea id="se-phrases-${s}" placeholder="AI에게 받은 문구를 여기에 붙여넣으세요..." oninput="saveSeData('${s}')" style="min-height:160px;">${esc(data.phrases)}</textarea>
      </div>`;
    panelsEl.appendChild(panel);
    renderSeAchievements(s, data.achievements||[]);
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
  S.set('se-data-'+s,{achievements:getSeAchievements(s),activities:getSeActivities(s),phrases:document.getElementById('se-phrases-'+s)?.value||''});
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

let seAchCount=0;
function makeSeAchRow(uid,val){
  return `<div class="se-act-row" id="se-ach-row-${uid}" style="grid-template-columns:1fr auto;">
    <input type="text" id="se-ach-${uid}" value="${esc(val||'')}" placeholder="예: 운동 수행 능력을 향상시키고 체력을 기른다." oninput="saveSeFromAchRow(this)">
    <button class="btn btn-danger" style="font-size:12px;padding:5px 9px;" onclick="removeSeAch('${uid}',this)">삭제</button>
  </div>`;
}
function getSeSubjectFromAchRow(el){let node=el;while(node&&!node.id?.startsWith('se-panel-'))node=node.parentElement;return node?.id?.replace('se-panel-','');}
function saveSeFromAchRow(el){const s=getSeSubjectFromAchRow(el);if(s)saveSeData(s);}
function addSeAch(s){seAchCount++;const uid='seach_'+seAchCount;const container=document.getElementById('se-ach-list-'+s);if(!container)return;container.insertAdjacentHTML('beforeend',makeSeAchRow(uid,''));saveSeData(s);}
function removeSeAch(uid,btn){document.getElementById('se-ach-row-'+uid)?.remove();const s=getSeSubjectFromAchRow(btn);if(s)saveSeData(s);}
function renderSeAchievements(s,achs){const container=document.getElementById('se-ach-list-'+s);if(!container)return;container.innerHTML='';if(!achs||!achs.length){seAchCount++;container.insertAdjacentHTML('beforeend',makeSeAchRow('seach_'+seAchCount,''));return;}achs.forEach(v=>{seAchCount++;container.insertAdjacentHTML('beforeend',makeSeAchRow('seach_'+seAchCount,v));});}
function getSeAchievements(s){const container=document.getElementById('se-ach-list-'+s);if(!container)return[];return Array.from(container.querySelectorAll('.se-act-row')).map(row=>{const uid=row.id.replace('se-ach-row-','');return document.getElementById('se-ach-'+uid)?.value.trim()||'';}).filter(Boolean);}

let seActCount=0;
function makeSeActRow(uid,act){
  return `<div class="se-act-row" id="se-act-row-${uid}">
    <div><label>활동명</label><input type="text" id="se-act-name-${uid}" value="${esc(act.name||'')}" placeholder="예: 배드민턴 수행평가" oninput="saveSeFromRow(this)"></div>
    <div><label>활동설명 <span style="font-size:11px;color:var(--text-3);text-transform:none;font-weight:400;">(선택)</span></label><textarea id="se-act-desc-${uid}" placeholder="AI가 맥락을 파악할 수 있게..." oninput="saveSeFromRow(this)">${esc(act.desc||'')}</textarea></div>
    <div style="padding-top:20px;"><button class="btn btn-danger" style="font-size:12px;padding:5px 9px;white-space:nowrap;" onclick="removeSeActivity(this,'${uid}')">삭제</button></div>
  </div>`;
}
function getSeSubjectFromRow(el){let node=el;while(node&&!node.id?.startsWith('se-panel-'))node=node.parentElement;return node?.id?.replace('se-panel-','');}
function saveSeFromRow(el){const s=getSeSubjectFromRow(el);if(s)saveSeData(s);}
function renderSeActivities(s,acts){const container=document.getElementById('se-acts-'+s);if(!container)return;container.innerHTML='';(acts||[]).forEach(act=>{seActCount++;const uid='seact_'+seActCount;container.insertAdjacentHTML('beforeend',makeSeActRow(uid,act));});}
function addSeActivity(s){seActCount++;const uid='seact_'+seActCount;const container=document.getElementById('se-acts-'+s);if(!container)return;container.insertAdjacentHTML('beforeend',makeSeActRow(uid,{name:'',desc:''}));saveSeData(s);}
function removeSeActivity(btn,uid){document.getElementById('se-act-row-'+uid)?.remove();const s=getSeSubjectFromRow(btn);if(s)saveSeData(s);}
function getSeActivities(s){const container=document.getElementById('se-acts-'+s);if(!container)return[];return Array.from(container.querySelectorAll('.se-act-row')).map(row=>{const uid=row.id.replace('se-act-row-','');return{name:document.getElementById('se-act-name-'+uid)?.value||'',desc:document.getElementById('se-act-desc-'+uid)?.value||''};});}

function updateSePreview(s){
  const achs=getSeAchievements(s);
  const achText=achs.length?achs.map((a,i)=>`${i+1}. ${a}`).join('\n'):'(미입력)';
  const acts=getSeActivities(s);
  const actText=acts.length?acts.map(a=>`  - ${a.name||'(활동명 없음)'}${a.desc?' | '+a.desc:''}`).join('\n'):'(활동 없음)';
  document.getElementById('se-preview-'+s).textContent=`[세특 문구 생성 요청] 과목: ${s}
성취기준:
${achText}
활동 목록:
${actText}

위 내용을 바탕으로 중학교 생활기록부 세특 문구를 활동별·등급별로 작성해주세요.

원칙:
- 관찰자 시점 / 주어 없이 / 긍정적 표현
- 단순히 ~보임.으로 끝내지 말고 ~고, ~며, ~다 등 연결어미를 활용해 풍부하게 작성
- 구체적인 행동과 교육적 성취를 2~3문장으로 표현
- 추상적인 표현 절대 금지, 반드시 관찰 가능한 구체적 행동으로 서술

지양 표현 (절대 사용 금지):
~라고 느낌, ~이해함, ~생각함, ~생각해 봄, ~다짐함, ~배움, ~알게 됨, ~나타냄, ~드러냄,
~노력함, ~노력하고 있음, ~하려고 함, ~하고자 함, ~할 수 있음, ~인 것 같음

절대 사용 금지 단어 (생활기록부 기재 불가 항목):
수행평가, 평가, 시험, 모의고사, 전국연합평가, 인증시험
대회, 수상, 자격증, 논문, 소논문
해외활동, 해외봉사, 도서출간, 특허, 장학생, 장학금
부모, 친인척, 가족
네이버, EBS, Zoom, 구글, 유튜브, 페이스북, 인스타그램, 에버랜드, 레고, 패들렛, 띵커벨, 트위터, 커리어넷, 미리캔버스, KTX
학교명, 재단명, 기관명, 단체명, 조직명

대체 표현 (반드시 아래 표현을 적극 활용):
~활동지를 작성함, ~발표함, ~기록함, ~표현함, ~하는 모습을 보임,
~능력이 뛰어남, ~대해 토의함, ~비교함, ~대안을 제시함,
~두각을 보임, ~한 모습이 인상적임, ~한 모습이 돋보임,
~심도 있게 탐색함, ~포부를 밝힘, ~하여 학생들에게 좋은 반응을 얻음,
~활동 중, ~기능 연습 중, ~과정에서, ~활동을 통해, ~연습 과정에서, ~기술 습득 과정에서
- A등급: 탁월한 성취와 주도적 역할 중심
- B등급: 우수한 참여와 성실한 수행 중심
- C등급: 꾸준한 노력과 성장 가능성 중심
- D등급: 발전 가능성과 긍정적 변화 중심 (부정적 표현 절대 금지)

각 활동마다 반드시 아래 형식으로 작성해주세요.
⚠️ 활동명은 위 활동 목록에 입력된 그대로 사용하세요. 띄어쓰기, 맞춤법, 글자 하나도 절대 바꾸지 마세요.
⚠️ 문구 안에 활동명을 자연스럽게 포함하여 작성하세요. 문구만 단독으로 쓰지 말고 활동명이 문장 안에 녹아들도록 작성해주세요.
등급별로 각 20개씩 작성해주세요. (A등급 20개, B등급 20개, C등급 20개, D등급 20개)
형식: [활동명-A], [활동명-B], [활동명-C], [활동명-D]
예시) 활동명이 "준비 운동 만들기" 이라면:
[준비 운동 만들기-A] 준비 운동 만들기 활동에서 루틴을 체계적으로 설계하며 신체 효율을 높이는 탁월한 구성 능력을 보임.
[준비 운동 만들기-B] 준비 운동 만들기 활동에서 수업 목표에 맞는 동작을 선별하며 성실하게 루틴을 완성하는 모습이 돋보임.
[준비 운동 만들기-C] 준비 운동 만들기 활동에서 기본 동작을 반복하며 점진적으로 루틴을 발전시키는 모습이 인상적임.
[준비 운동 만들기-D] 준비 운동 만들기 활동에서 기초 동작을 익히며 자신만의 루틴을 구성하려는 긍정적인 태도를 보임.

추가 질문 없이 바로 작성해주세요.
작성된 문구 전체를 코드블록 없이 깔끔하게 출력해주세요.`;
}

function copySeAiText(s){
  updateSePreview(s);
  navigator.clipboard.writeText(document.getElementById('se-preview-'+s).textContent)
    .then(()=>showToast('복사됐어요! AI에 붙여넣으세요 😊'));
}

function hasBatchim(str){const code=str.charCodeAt(str.length-1);if(code<0xAC00||code>0xD7A3)return false;return (code-0xAC00)%28!==0;}
function actPrefix(name,dateStr){
  const displayName=dateStr?`${name}(${dateStr})`:name;
  const batchim=hasBatchim(name);
  const connectors=batchim?['에서','을 통해','에 참여하여','활동에서','을 마치며','활동 중','기능 연습 중','과정에서']:['에서','를 통해','에 참여하여','활동에서','를 마치며','활동 중','기능 연습 중','과정에서'];
  const c=connectors[Math.floor(Math.random()*connectors.length)];
  return displayName+c+' ';
}

function seLoadGradeList(){
  const cid=document.getElementById('se-result-class')?.value;
  const subj=document.getElementById('se-result-subject')?.value;
  const container=document.getElementById('se-grade-list');
  if(!container)return;
  if(!cid){container.innerHTML='';return;}
  const students=getStudentsOfClass(cid);
  if(!students.length){container.innerHTML='<div style="font-size:13px;color:var(--text-3);">학생이 없어요.</div>';return;}
  const actNames=subj?getSeActivities(subj).map(a=>a.name).filter(Boolean):[];
  if(subj){const phrases=S.get('se-data-'+subj,{phrases:''}).phrases;const gradeMap=getPhrasesByActivityGrade(phrases);Object.keys(gradeMap).forEach(n=>{if(!actNames.includes(n))actNames.push(n);});}
  let html='<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">학생별 활동별 등급 설정</div>';
  html+='<div style="display:flex;flex-direction:column;gap:8px;max-height:380px;overflow-y:auto;">';
  students.forEach(s=>{
    html+=`<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 12px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text);">${esc(s.id)} <span style="font-size:11px;color:var(--text-3);font-weight:400;">${esc(s.gender)}</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">`;
    if(actNames.length){
      actNames.forEach(act=>{
        html+=`<div style="display:flex;flex-direction:column;gap:3px;flex:1;min-width:90px;">
          <label style="font-size:10px;color:var(--text-3);font-weight:600;">${esc(act)}</label>
          <select id="se-grade-${esc(s.id)}-${esc(act)}" style="font-size:12px;font-weight:700;padding:4px 6px;">
            <option value="A">A</option><option value="B" selected>B</option><option value="C">C</option><option value="D">D</option><option value="미작성">미작성</option>
          </select></div>`;
      });
    } else {html+=`<span style="font-size:12px;color:var(--text-3);">활동을 먼저 등록해주세요.</span>`;}
    html+=`</div></div>`;
  });
  html+='</div>';
  container.innerHTML=html;
}

function seRenderCombine(){seLoadGradeList();}

function seCombine(){
  const cid=document.getElementById('se-result-class')?.value;
  const subj=document.getElementById('se-result-subject')?.value;
  if(!cid)return showToast('반을 선택해주세요!','err');
  if(!subj)return showToast('과목을 선택해주세요!','err');
  const phrases=S.get('se-data-'+subj,{phrases:''}).phrases;
  const gradeMap=getPhrasesByActivityGrade(phrases);
  const actNames=Object.keys(gradeMap);
  if(!actNames.length)return showToast('등급별 문구가 없어요! [활동명-A] 형식으로 등록해주세요.','err');
  const students=getStudentsOfClass(cid);
  if(!students.length)return showToast('학생을 먼저 등록해주세요!','err');
  const usedMap={};
  actNames.forEach(act=>{usedMap[act]={A:[],B:[],C:[],D:[]};});
  const results=students.map(s=>{
    const actGrades={};
    actNames.forEach(act=>{actGrades[act]=document.getElementById(`se-grade-${s.id}-${act}`)?.value||'B';});
    const allSkipped=actNames.every(act=>actGrades[act]==='미작성');
    if(allSkipped)return{studentId:s.id,gender:s.gender,grade:'미작성',text:''};
    const parts=actNames.map(act=>{
      const grade=actGrades[act];
      if(grade==='미작성')return '';
      const ps=gradeMap[act][grade]||gradeMap[act]['B']||[];
      if(!ps.length)return '';
      let avail=ps.map((_,i)=>i).filter(i=>!usedMap[act][grade].includes(i));
      if(avail.length<1){usedMap[act][grade]=[];avail=ps.map((_,i)=>i);}
      const shuffled=[...avail].sort(()=>Math.random()-0.5);
      const idx=shuffled[0];
      usedMap[act][grade].push(idx);
      return ps[idx];
    }).filter(Boolean);
    const raw=parts.join(' ');
    return{studentId:s.id,gender:s.gender,grade:Object.values(actGrades).filter(g=>g!=='미작성').join('/'),text:correctText(raw)};
  });
  window._seResults=results;
  S.set('se-last-results',results);
  renderCombineResults(results,'se-combine-results',true);
  document.getElementById('se-export-box').style.display='block';
  showToast('조합 완료!');
}

// ══════════════════════
// 스포츠
// ══════════════════════
let activeSportsItem=null;

function addSportsItem(){
  const input=document.getElementById('sports-input');
  const name=input.value.trim();
  if(!name)return showToast('종목명을 입력해주세요!','err');
  const list=S.get('sports-list',[]);
  if(list.includes(name))return showToast('이미 있는 종목이에요!','err');
  list.push(name);
  S.set('sports-list',list);
  input.value='';
  renderSportsList();
  switchSportsItem(name);
  refreshClassSelects();
}

function renderSportsList(){
  const list=S.get('sports-list',[]);
  const tabsEl=document.getElementById('sportsSubTabs');
  const panelsEl=document.getElementById('sportsSubPanels');
  if(!tabsEl||!panelsEl)return;
  tabsEl.innerHTML=''; panelsEl.innerHTML='';
  if(!list.length){tabsEl.innerHTML='<span style="font-size:13px;color:var(--text-3);">종목을 추가해주세요.</span>';return;}
  list.forEach(sp=>{
    const btn=document.createElement('button');
    btn.className='sub-tab'+(sp===activeSportsItem?' active':'');
    btn.textContent=sp; btn.onclick=()=>switchSportsItem(sp);
    tabsEl.appendChild(btn);
    const data=S.get('sports-data-'+sp,{phrases:''});
    const panel=document.createElement('div');
    panel.className='sub-panel'+(sp===activeSportsItem?' active':'');
    panel.id='sports-panel-'+sp;
    panel.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style="font-size:15px;font-weight:700;color:var(--text);">${esc(sp)}</span>
        <button class="btn btn-danger" style="font-size:12px;padding:5px 10px;" onclick="deleteSportsItem('${esc(sp)}')">삭제</button>
      </div>
      <div class="ai-box">
        <div class="ai-box-title">🤖 AI용 텍스트</div>
        <div class="ai-preview" id="sports-preview-${sp}">미리보기 버튼을 눌러주세요.</div>
        <div class="btn-row">
          <button class="btn" style="font-size:12px;" onclick="updateSportsPreview('${sp}')">미리보기</button>
          <button class="btn btn-dark" style="font-size:12px;" onclick="copySportsAiText('${sp}')">📋 AI용 텍스트 복사</button>
        </div>
        <div style="font-size:12px;color:var(--text-3);margin-top:8px;">💡 복사 후 AI 채팅창에 붙여넣으면 기초 기능 문구 30개를 받을 수 있어요!</div>
      </div>
      <div class="divider"></div>
      <div class="phrase-bank">
        <div class="phrase-bank-hd">
          <span class="phrase-bank-title">📝 문구 뱅크</span>
          <div style="display:flex;gap:5px;align-items:center;">
            <span class="phrase-badge" id="sports-count-${sp}">0개</span>
            <button class="btn btn-danger" style="font-size:11px;padding:2px 8px;" onclick="clearPhrases('sports-phrases-${sp}','sports-count-${sp}','${sp}','sports')">전체 삭제</button>
          </div>
        </div>
        <div class="phrase-hint">형식: <code>[종목명] 문장</code> 으로 한 줄씩</div>
        <div class="format-row">
          <button class="btn" style="font-size:12px;" onclick="formatPhrases('sports-phrases-${sp}','sports-count-${sp}','${sp}','sports')">✨ 형식 정리</button>
          <span style="font-size:12px;color:var(--text-3);">AI 문구를 붙여넣고 클릭하세요</span>
        </div>
        <textarea id="sports-phrases-${sp}" placeholder="AI에게 받은 문구를 여기에 붙여넣으세요..." oninput="saveSportsData('${sp}')" style="min-height:160px;">${esc(data.phrases)}</textarea>
      </div>`;
    panelsEl.appendChild(panel);
    updateCount('sports-phrases-'+sp,'sports-count-'+sp);
  });
}

function switchSportsItem(sp){
  activeSportsItem=sp;
  document.querySelectorAll('#sportsSubTabs .sub-tab').forEach(b=>b.classList.toggle('active',b.textContent===sp));
  document.querySelectorAll('#sportsSubPanels .sub-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('sports-panel-'+sp)?.classList.add('active');
}

function saveSportsData(sp){S.set('sports-data-'+sp,{phrases:document.getElementById('sports-phrases-'+sp)?.value||''});updateCount('sports-phrases-'+sp,'sports-count-'+sp);}
function deleteSportsItem(sp){if(!confirm(`"${sp}" 종목을 삭제할까요?`))return;const list=S.get('sports-list',[]).filter(x=>x!==sp);S.set('sports-list',list);S.del('sports-data-'+sp);activeSportsItem=list[0]||null;renderSportsList();refreshClassSelects();}

function updateSportsPreview(sp){
  document.getElementById('sports-preview-'+sp).textContent=`[스포츠 기초 기능 세특 문구 생성 요청]
종목: ${sp}

별도의 성취기준이나 활동 설명은 없습니다. "${sp}" 종목의 일반적인 기초 기능(그립/자세, 스텝, 기본 기술, 규칙 이해 등 해당 종목의 실제 기초 기능과 용어)을 기준으로, 중학교 생활기록부 세특 문구를 작성해주세요.

원칙:
- 관찰자 시점 / 주어 없이 / 긍정적 표현
- 단순히 ~보임.으로 끝내지 말고 ~고, ~며, ~다 등 연결어미를 활용해 풍부하게 작성
- 구체적인 행동과 교육적 성취를 2~3문장으로 표현
- 추상적인 표현 절대 금지, 반드시 관찰 가능한 구체적 행동으로 서술
- "${sp}"의 실제 기초 기능·용어를 다양하게 활용
- 등급 구분 없이 하나의 수준(고르게 우수한 수행)으로 작성

지양 표현 (절대 사용 금지):
~라고 느낌, ~이해함, ~생각함, ~생각해 봄, ~다짐함, ~배움, ~알게 됨, ~나타냄, ~드러냄,
~노력함, ~노력하고 있음, ~하려고 함, ~하고자 함, ~할 수 있음, ~인 것 같음

절대 사용 금지 단어: 수행평가, 평가, 시험, 대회, 수상, 부모, 친인척, 학교명

대체 표현 (반드시 아래 표현을 적극 활용):
~하는 모습을 보임, ~두각을 보임, ~한 모습이 인상적임, ~한 모습이 돋보임,
~활동 중, ~기능 연습 중, ~과정에서, ~활동을 통해

반드시 아래 형식으로 작성해주세요.
⚠️ 종목명은 위에 입력된 그대로 사용하세요. 띄어쓰기, 맞춤법, 글자 하나도 절대 바꾸지 마세요.
⚠️ 문구 안에 종목명을 자연스럽게 포함하여 작성하세요.
⚠️ 등급 구분(A/B/C/D) 없이 총 30개를 작성해주세요.
형식: [종목명] 문장
예시) 종목이 "배드민턴" 이라면:
[배드민턴] 배드민턴 활동에서 정확한 그립과 안정된 스탠스를 바탕으로 셔틀콕을 정교하게 컨트롤하는 모습을 보임.

추가 질문 없이 바로 작성해주세요.
작성된 문구 전체를 코드블록 없이 깔끔하게 출력해주세요.`;
}

function copySportsAiText(sp){updateSportsPreview(sp);navigator.clipboard.writeText(document.getElementById('sports-preview-'+sp).textContent).then(()=>showToast('복사됐어요! AI에 붙여넣으세요 😊'));}

function sportsCombine(){
  const cid=document.getElementById('sports-result-class')?.value;
  if(!cid)return showToast('반을 선택해주세요!','err');
  const list=S.get('sports-list',[]);
  if(!list.length)return showToast('종목을 먼저 추가해주세요!','err');
  const map={};
  list.forEach(sp=>{const phrases=S.get('sports-data-'+sp,{phrases:''}).phrases;const parsed=getPhrasesByActivity(phrases);map[sp]=parsed[sp]||[];});
  const activeSports=list.filter(sp=>map[sp].length);
  if(!activeSports.length)return showToast('문구 뱅크에 문구를 먼저 등록해주세요!','err');
  const students=getStudentsOfClass(cid);
  if(!students.length)return showToast('학생을 먼저 등록해주세요!','err');
  const usedMap={};
  activeSports.forEach(sp=>{usedMap[sp]=[];});
  const results=students.map(s=>{
    const parts=activeSports.map(sp=>{
      const ps=map[sp];
      let avail=ps.map((_,i)=>i).filter(i=>!usedMap[sp].includes(i));
      if(avail.length<1){usedMap[sp]=[];avail=ps.map((_,i)=>i);}
      const shuffled=[...avail].sort(()=>Math.random()-0.5);
      const idx=shuffled[0];
      usedMap[sp].push(idx);
      return ps[idx];
    }).filter(Boolean);
    return{studentId:s.id,gender:s.gender,text:correctText(parts.join(' '))};
  });
  window._sportsResults=results;
  S.set('sports-last-results',results);
  renderCombineResults(results,'sports-combine-results',false);
  document.getElementById('sports-export-box').style.display='block';
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
    <div style="margin-bottom:10px;">
      <label style="margin-bottom:8px;display:block;">활동 목록 <span style="font-size:11px;color:var(--text-3);font-weight:400;text-transform:none;letter-spacing:0;">날짜순 자동 정렬</span></label>
      <div class="activity-list" id="ch-acts-${type}"></div>
      <button class="add-row-btn" onclick="addChActivity('${type}')">+ 활동 추가</button>
    </div>
    <div class="ai-box" style="margin-top:16px;">
      <div class="ai-box-title">🤖 AI용 텍스트</div>
      <div class="ai-preview" id="ch-preview-${type}">미리보기 버튼을 눌러주세요.</div>
      <div class="btn-row">
        <button class="btn" style="font-size:12px;" onclick="updateChPreview('${type}')">미리보기</button>
        <button class="btn btn-dark" style="font-size:12px;" onclick="copyChAiText('${type}')">📋 AI용 텍스트 복사</button>
      </div>
      <div style="font-size:12px;color:var(--text-3);margin-top:8px;">💡 복사 후 AI 채팅창에 붙여넣으면 문구를 받을 수 있어요!</div>
    </div>
    <div class="divider"></div>
    <div class="phrase-bank">
      <div class="phrase-bank-hd">
        <span class="phrase-bank-title">📝 문구 뱅크</span>
        <div style="display:flex;gap:5px;align-items:center;">
          <span class="phrase-badge" id="ch-count-${type}">0개</span>
          <button class="btn btn-danger" style="font-size:11px;padding:2px 8px;" onclick="clearPhrases('ch-phrases-${type}','ch-count-${type}','${type}','ch')">전체 삭제</button>
        </div>
      </div>
      <div class="phrase-hint">형식: <code>[활동명] 문장</code> 으로 한 줄씩</div>
      <div class="format-row">
        <button class="btn" style="font-size:12px;" onclick="formatPhrases('ch-phrases-${type}','ch-count-${type}','${type}','ch')">✨ 형식 정리</button>
        <span style="font-size:12px;color:var(--text-3);">AI 문구를 붙여넣고 클릭하세요</span>
      </div>
      <textarea id="ch-phrases-${type}" placeholder="AI에게 받은 문구를 붙여넣으세요..." oninput="saveChData('${type}')" style="min-height:160px;">${esc(data.phrases)}</textarea>
    </div>`;
  renderChActivities(type, data.activities||[]);
  updateCount('ch-phrases-'+type,'ch-count-'+type);
}

function saveChData(type){S.set('ch-data-'+type,{activities:getChActivities(type),phrases:document.getElementById('ch-phrases-'+type)?.value||''});updateCount('ch-phrases-'+type,'ch-count-'+type);}

let chActCount=0;
function makeChActRow(uid,act){
  const cfg=S.get('cfg',{year:'2026'});
  const cy=parseInt(cfg.year)||2026;
  const yOpts=[cy-1,cy,cy+1].map(y=>`<option value="${y}" ${act.year==y?'selected':''}>${y}년</option>`).join('');
  const mOpts=Array.from({length:12},(_,i)=>i+1).map(m=>`<option value="${m}" ${act.month==m?'selected':''}>${m}월</option>`).join('');
  const dOpts=Array.from({length:31},(_,i)=>i+1).map(d=>`<option value="${d}" ${act.day==d?'selected':''}>${d}일</option>`).join('');
  return `<div class="ch-act-row" id="ch-act-row-${uid}">
    <div><label>날짜</label><div class="date-selects"><select id="ch-act-y-${uid}" onchange="sortAndSaveChActs(this)">${yOpts}</select><select id="ch-act-m-${uid}" onchange="sortAndSaveChActs(this)">${mOpts}</select><select id="ch-act-d-${uid}" onchange="sortAndSaveChActs(this)">${dOpts}</select></div></div>
    <div><label>활동명</label><input type="text" id="ch-act-name-${uid}" value="${esc(act.name||'')}" placeholder="예: 학교폭력예방교육" oninput="saveChFromRow(this)"></div>
    <div><label>활동설명 <span style="font-size:11px;color:var(--text-3);text-transform:none;font-weight:400;">(선택)</span></label><textarea id="ch-act-desc-${uid}" placeholder="AI 맥락 파악용..." oninput="saveChFromRow(this)">${esc(act.desc||'')}</textarea></div>
    <div style="padding-top:20px;"><button class="btn btn-danger" style="font-size:12px;padding:5px 9px;white-space:nowrap;" onclick="removeChActivity(this,'${uid}')">삭제</button></div>
  </div>`;
}
function getChTypeFromRow(el){let node=el;while(node&&!node.id?.startsWith('ch-acts-'))node=node.parentElement;return node?.id?.replace('ch-acts-','');}
function saveChFromRow(el){const type=getChTypeFromRow(el);if(type)saveChData(type);}
function sortAndSaveChActs(el){const type=getChTypeFromRow(el);if(!type)return;saveChData(type);const acts=getChActivities(type);acts.sort((a,b)=>actDateVal(a)-actDateVal(b));S.set('ch-data-'+type,{activities:acts,phrases:document.getElementById('ch-phrases-'+type)?.value||''});renderChActivities(type,acts);}
function renderChActivities(type,acts){const container=document.getElementById('ch-acts-'+type);if(!container)return;container.innerHTML='';const sorted=[...(acts||[])].sort((a,b)=>actDateVal(a)-actDateVal(b));sorted.forEach(act=>{chActCount++;const uid='chact_'+chActCount;container.insertAdjacentHTML('beforeend',makeChActRow(uid,act));});}
function addChActivity(type){const cfg=S.get('cfg',{year:'2026'});const y=parseInt(cfg.year)||2026;chActCount++;const uid='chact_'+chActCount;const container=document.getElementById('ch-acts-'+type);if(!container)return;container.insertAdjacentHTML('beforeend',makeChActRow(uid,{year:y,month:3,day:1,name:'',desc:''}));saveChData(type);}
function removeChActivity(btn,uid){document.getElementById('ch-act-row-'+uid)?.remove();const type=getChTypeFromRow(btn);if(type)saveChData(type);}
function getChActivities(type){const container=document.getElementById('ch-acts-'+type);if(!container)return[];return Array.from(container.querySelectorAll('.ch-act-row')).map(row=>{const uid=row.id.replace('ch-act-row-','');return{year:document.getElementById('ch-act-y-'+uid)?.value||'',month:document.getElementById('ch-act-m-'+uid)?.value||'',day:document.getElementById('ch-act-d-'+uid)?.value||'',name:document.getElementById('ch-act-name-'+uid)?.value||'',desc:document.getElementById('ch-act-desc-'+uid)?.value||''};});}

function updateChPreview(type){
  const acts=getChActivities(type);
  const sorted=[...acts].sort((a,b)=>actDateVal(a)-actDateVal(b));
  const actText=sorted.length?sorted.map(a=>`  - ${a.year}년 ${a.month}월 ${a.day}일 | ${a.name||'(활동명 없음)'}${a.desc?' | '+a.desc:''}`).join('\n'):'(활동 없음)';
  document.getElementById('ch-preview-'+type).textContent=`[창체 ${type}활동 문구 생성 요청]
활동 목록 (날짜순):
${actText}

위 활동을 바탕으로 창체 특기사항 문구를 활동별로 작성해주세요.

원칙:
- 관찰자 시점 / 주어 없이 / 긍정적 표현
- 1~2문장으로 간결하게 작성, 내용은 구체적이고 탄탄하게, 길이는 짧게
- 추상적인 표현 절대 금지, 반드시 관찰 가능한 구체적 행동으로 서술

지양 표현 (절대 사용 금지):
~라고 느낌, ~이해함, ~생각함, ~생각해 봄, ~다짐함, ~배움, ~알게 됨, ~나타냄, ~드러냄,
~노력함, ~노력하고 있음, ~하려고 함, ~하고자 함, ~할 수 있음, ~인 것 같음

절대 사용 금지 단어 (생활기록부 기재 불가 항목):
수행평가, 평가, 시험, 모의고사, 전국연합평가, 인증시험
대회, 수상, 자격증, 논문, 소논문
해외활동, 해외봉사, 도서출간, 특허, 장학생, 장학금
부모, 친인척, 가족
네이버, EBS, Zoom, 구글, 유튜브, 페이스북, 인스타그램, 에버랜드, 레고, 패들렛, 띵커벨, 트위터, 커리어넷, 미리캔버스, KTX
학교명, 재단명, 기관명, 단체명, 조직명

대체 표현 (반드시 아래 표현을 적극 활용):
~활동지를 작성함, ~발표함, ~기록함, ~표현함, ~하는 모습을 보임,
~능력이 뛰어남, ~대해 토의함, ~비교함, ~대안을 제시함,
~두각을 보임, ~한 모습이 인상적임, ~한 모습이 돋보임,
~심도 있게 탐색함, ~포부를 밝힘, ~하여 학생들에게 좋은 반응을 얻음,
~활동 중, ~과정에서, ~활동을 통해, ~시간을 통해, ~활동에 참여하여

각 활동마다 반드시 아래 형식으로 작성해주세요.
⚠️ 활동명은 위 활동 목록에 입력된 그대로 사용하세요. 띄어쓰기, 맞춤법, 글자 하나도 절대 바꾸지 마세요.
활동별로 다양한 교육적 요소(공감, 협력, 참여태도, 책임감, 창의성 등)를 담은 문구를 15개씩 작성해주세요.
형식: [활동명] 문장
예시) 활동명이 "학교폭력예방교육" 이라면:
[학교폭력예방교육] 공감 능력의 중요성을 인식하며 타인의 감정을 존중하는 태도를 꾸준히 보임.

추가 질문 없이 바로 작성해주세요.
작성된 문구 전체를 코드블록 없이 깔끔하게 출력해주세요.`;
}

function copyChAiText(type){updateChPreview(type);navigator.clipboard.writeText(document.getElementById('ch-preview-'+type).textContent).then(()=>showToast('복사됐어요! AI에 붙여넣으세요 😊'));}

function chRenderCombine(){}

function chCombine(){
  const cid=document.getElementById('ch-result-class')?.value;
  if(!cid)return showToast('반을 선택해주세요!','err');
  const type=activeChTab;
  const showDate=document.getElementById('ch-date-format')?.value==='with-date';
  const phrases=S.get('ch-data-'+type,{phrases:''}).phrases;
  const actMap=getPhrasesByActivity(phrases);
  const actNames=Object.keys(actMap);
  if(!actNames.length)return showToast('문구 뱅크에 문구를 먼저 등록해주세요!','err');
  const storedActs=S.get('ch-data-'+type,{activities:[]}).activities;
  const sortedActNames=[...storedActs].sort((a,b)=>actDateVal(a)-actDateVal(b)).map(a=>a.name).filter(n=>actMap[n]);
  actNames.forEach(n=>{if(!sortedActNames.includes(n))sortedActNames.push(n);});
  const actDateMap={};
  storedActs.forEach(a=>{if(a.name)actDateMap[a.name]=`${a.year}.${String(a.month).padStart(2,'0')}.${String(a.day).padStart(2,'0')}`;});
  const students=getStudentsOfClass(cid);
  if(!students.length)return showToast('학생을 먼저 등록해주세요!','err');
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
      const dateStr=showDate?actDateMap[act]:null;
      return actPrefix(act,dateStr)+picked.map(i=>ps[i]).join(' ');
    });
    return{studentId:s.id,gender:s.gender,text:correctText(parts.join('\n'))};
  });
  window._chResults=results;
  S.set('ch-last-results',results);
  renderCombineResults(results,'ch-combine-results',false);
  document.getElementById('ch-export-box').style.display='block';
  showToast('조합 완료!');
}

// ── 공통 결과 렌더 ──
function renderCombineResults(results,containerId,showGrade){
  const container=document.getElementById(containerId);
  if(!results.length){container.innerHTML='';return;}
  let html='';
  results.forEach(r=>{
    const b=calcBytes(r.text);
    const bc=b>2000?'byte-over':b>1500?'byte-warn':'byte-ok';
    const rid=containerId+'_'+r.studentId;
    const gradeBadge=showGrade&&r.grade?`<span style="font-size:11px;font-weight:700;background:${r.grade==='미작성'?'var(--border-strong)':'var(--accent)'};color:${r.grade==='미작성'?'var(--text-3)':'#fff'};padding:2px 7px;border-radius:10px;">${r.grade}</span>`:'';
    const isEmpty=r.grade==='미작성'||!r.text;
    html+=`<div class="result-card" style="${isEmpty?'opacity:0.5;':''}">
      <div class="result-card-hd">
        <div class="result-sid">학번 ${esc(r.studentId)} ${gradeBadge} ${!isEmpty?`<span class="byte-chip ${bc}">${b.toLocaleString()} B</span>`:''}</div>
      </div>
      <div class="result-text" id="${rid}" contenteditable="false">${isEmpty?'<span style="color:var(--text-3);font-size:13px;">미작성</span>':esc(r.text)}</div>
      ${!isEmpty?`<div class="result-actions">
        <button class="btn" style="font-size:12px;padding:5px 10px;" onclick="copyResult('${rid}')">복사</button>
        <button class="btn" style="font-size:12px;padding:5px 10px;" onclick="toggleEdit('${rid}','${containerId}','${esc(r.studentId)}')">수정</button>
      </div>`:''}
    </div>`;
  });
  container.innerHTML=html;
}

function copyResult(rid){const el=document.getElementById(rid);if(!el)return;navigator.clipboard.writeText(el.innerText).then(()=>showToast('복사됐어요!'));}

function toggleEdit(rid,containerId,studentId){
  const el=document.getElementById(rid);
  if(!el)return;
  const isEditing=el.contentEditable==='true';
  if(isEditing){
    el.contentEditable='false';
    const newText=el.innerText;
    const arr=containerId.startsWith('se')?window._seResults:containerId.startsWith('sports')?window._sportsResults:window._chResults;
    const r=arr?.find(x=>x.studentId===studentId);
    if(r){r.text=newText;S.set(containerId.startsWith('se')?'se-last-results':containerId.startsWith('sports')?'sports-last-results':'ch-last-results',arr);}
    const card=el.closest('.result-card');
    const chip=card?.querySelector('.byte-chip');
    if(chip){const b=calcBytes(newText);chip.textContent=b.toLocaleString()+' B';chip.className='byte-chip '+(b>2000?'byte-over':b>1500?'byte-warn':'byte-ok');}
    el.parentElement.querySelector('button:last-child').textContent='수정';
    showToast('저장됐어요!');
  } else {
    el.contentEditable='true';el.focus();
    el.parentElement.querySelector('button:last-child').textContent='저장';
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
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <input class="class-name-input" id="cname_${id}" value="${esc(cn)}" onchange="updateClassName('${id}')">
      <button class="btn btn-danger" style="font-size:12px;padding:5px 10px;" onclick="deleteClass('${id}')">반 삭제</button>
    </div>
    <div class="student-list" id="srows_${id}"></div>
    <button class="add-student-btn" onclick="addStudent('${id}')">+ 학생 추가</button>`;
  panelsEl.appendChild(panel);
  switchClass(id);
  sortClassTabs();
  saveClasses();
  refreshClassSelects();
  return id;
}

function switchClass(id){activeClassId=id;document.querySelectorAll('.class-tab-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.class-panel').forEach(p=>p.classList.remove('active'));document.getElementById('ctab_'+id)?.classList.add('active');document.getElementById('cpanel_'+id)?.classList.add('active');}
function updateClassName(id){const name=document.getElementById('cname_'+id)?.value.trim()||'반';document.getElementById('ctab_'+id).textContent=name;saveClasses();refreshClassSelects();}
function deleteClass(id){if(!confirm('이 반을 삭제할까요?'))return;document.getElementById('ctab_'+id)?.remove();document.getElementById('cpanel_'+id)?.remove();document.querySelector('.class-tab-btn')?.click();saveClasses();refreshClassSelects();}

let sCount=0;
function makeStudentRow(sid,cid,rn,id,gender){
  return `<div class="student-row" id="${sid}">
    <span class="s-num">${rn}</span>
    <div><input type="text" placeholder="학번 (예: 10101)" id="${sid}_id" value="${esc(id)}" onblur="saveClasses()"></div>
    <div><select id="${sid}_g" onchange="saveClasses()"><option value="남학생" ${gender==='남학생'?'selected':''}>남학생</option><option value="여학생" ${gender==='여학생'?'selected':''}>여학생</option></select></div>
    <button class="btn btn-danger" style="font-size:12px;padding:5px 8px;" onclick="removeStudent('${sid}','${cid}')">삭제</button>
  </div>`;
}

function addStudent(cid){const id2=cid||activeClassId;if(!id2)return;const rows=document.getElementById('srows_'+id2);if(!rows)return;sCount++;const sid='s_'+sCount;const rn=rows.children.length+1;rows.insertAdjacentHTML('beforeend',makeStudentRow(sid,id2,rn,'','남학생'));}
function removeStudent(sid,cid){document.getElementById(sid)?.remove();document.querySelectorAll('#srows_'+cid+' .s-num').forEach((el,i)=>el.textContent=i+1);saveClasses();}

function saveClasses(){
  const cls=[];
  document.querySelectorAll('.class-panel').forEach(p=>{
    const cid=p.id.replace('cpanel_','');
    const students=[];
    document.querySelectorAll('#srows_'+cid+' .student-row').forEach(r=>{students.push({id:r.querySelector('[id$="_id"]')?.value.trim()||'',gender:r.querySelector('[id$="_g"]')?.value||'남학생'});});
    cls.push({cid,name:document.getElementById('cname_'+cid)?.value||'반',students});
  });
  S.set('classes',cls);
}

function loadClasses(){
  const cls=S.get('classes',[]);
  if(!cls.length){addClass('1반');return;}
  const sorted=[...cls].sort((a,b)=>(parseInt(a.name)||999)-(parseInt(b.name)||999));
  sorted.forEach(c=>{
    classCount++;
    const id=c.cid||'cls_'+classCount;
    if(document.getElementById('ctab_'+id))return;
    const tabBar=document.getElementById('classTabBar');
    const btn=document.createElement('button');
    btn.className='class-tab-btn'; btn.id='ctab_'+id;
    btn.textContent=c.name; btn.onclick=()=>switchClass(id);
    tabBar.appendChild(btn);
    const panelsEl=document.getElementById('classPanels');
    const panel=document.createElement('div');
    panel.className='class-panel'; panel.id='cpanel_'+id;
    panel.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <input class="class-name-input" id="cname_${id}" value="${esc(c.name)}" onchange="updateClassName('${id}')">
        <button class="btn btn-danger" style="font-size:12px;padding:5px 10px;" onclick="deleteClass('${id}')">반 삭제</button>
      </div>
      <div class="student-list" id="srows_${id}"></div>
      <button class="add-student-btn" onclick="addStudent('${id}')">+ 학생 추가</button>`;
    panelsEl.appendChild(panel);
    c.students.forEach((s,i)=>{sCount++;const sid='s_'+sCount;const rows=document.getElementById('srows_'+id);rows.insertAdjacentHTML('beforeend',makeStudentRow(sid,id,i+1,s.id,s.gender||'남학생'));});
  });
  document.querySelector('.class-tab-btn')?.click();
}

function sortClassTabs(){const tabBar=document.getElementById('classTabBar');const tabs=Array.from(tabBar.querySelectorAll('.class-tab-btn'));tabs.sort((a,b)=>(parseInt(a.textContent)||999)-(parseInt(b.textContent)||999));tabs.forEach(t=>tabBar.appendChild(t));}
function getStudentsOfClass(cid){return Array.from(document.querySelectorAll('#srows_'+cid+' .student-row')).map(r=>({id:r.querySelector('[id$="_id"]')?.value.trim()||'',gender:r.querySelector('[id$="_g"]')?.value||'남학생'})).filter(s=>s.id);}

function autoGenStudents(){
  const classNum=parseInt(document.getElementById('autogen-classnum')?.value)||0;
  const count=parseInt(document.getElementById('autogen-count')?.value)||0;
  if(!classNum||classNum<1||classNum>20)return showToast('반 번호를 1~20으로 입력해주세요!','err');
  if(!count||count<1||count>50)return showToast('인원수를 1~50으로 입력해주세요!','err');
  const cfg=S.get('cfg',{grade:'1'});
  const grade=parseInt(cfg.grade)||1;
  let targetId=null;
  document.querySelectorAll('.class-panel').forEach(p=>{const cid=p.id.replace('cpanel_','');if(document.getElementById('cname_'+cid)?.value===classNum+'반')targetId=cid;});
  if(!targetId){targetId=addClass(classNum+'반');}
  else{switchClass(targetId);if(!confirm(`기존 "${classNum}반" 목록을 초기화하고 자동생성할까요?`))return;}
  const rows=document.getElementById('srows_'+targetId);
  if(rows)rows.innerHTML='';
  for(let i=1;i<=count;i++){const studentId=`${grade}${String(classNum).padStart(2,'0')}${String(i).padStart(2,'0')}`;sCount++;const sid='s_'+sCount;rows.insertAdjacentHTML('beforeend',makeStudentRow(sid,targetId,i,studentId,'남학생'));}
  saveClasses();refreshClassSelects();
  showToast(`${classNum}반 ${count}명 생성 완료!`);
}

function pasteGenStudents(){
  const classNum=parseInt(document.getElementById('paste-classnum')?.value)||0;
  const raw=document.getElementById('paste-students')?.value||'';
  if(!classNum||classNum<1||classNum>20)return showToast('반 번호를 1~20으로 입력해주세요!','err');
  if(!raw.trim())return showToast('번호+성별 내용을 입력해주세요!','err');
  const cfg=S.get('cfg',{grade:'1'});
  const grade=parseInt(cfg.grade)||1;
  const parsed=raw.trim().split('\n').map(l=>{const parts=l.trim().split(/\s+/);const num=parseInt(parts[0]);const gender=parts[1]?.includes('여')?'여학생':'남학생';return num&&!isNaN(num)?{num,gender}:null;}).filter(Boolean);
  if(!parsed.length)return showToast('형식을 확인해주세요! (예: 1 남)','err');
  let targetId=null;
  document.querySelectorAll('.class-panel').forEach(p=>{const cid=p.id.replace('cpanel_','');if(document.getElementById('cname_'+cid)?.value===classNum+'반')targetId=cid;});
  if(!targetId){targetId=addClass(classNum+'반');}
  else{switchClass(targetId);if(!confirm(`기존 "${classNum}반" 목록을 초기화하고 생성할까요?`))return;}
  const rows=document.getElementById('srows_'+targetId);
  if(rows)rows.innerHTML='';
  parsed.forEach((p,i)=>{const studentId=`${grade}${String(classNum).padStart(2,'0')}${String(p.num).padStart(2,'0')}`;sCount++;const sid='s_'+sCount;rows.insertAdjacentHTML('beforeend',makeStudentRow(sid,targetId,i+1,studentId,p.gender));});
  document.getElementById('paste-students').value='';
  saveClasses();refreshClassSelects();
  showToast(`${parsed.length}명 생성 완료!`);
}

// ── 형식 정리 ──
function formatPhrases(textareaId,countId,key,type){
  const ta=document.getElementById(textareaId);
  if(!ta)return;
  const raw=ta.value;
  if(!raw.trim())return showToast('문구를 먼저 붙여넣어 주세요!','err');
  const lines=raw.split('\n');
  const result=[];
  let currentCat=null;
  lines.forEach(line=>{
    const trimmed=line.trim().replace(/[▶▷►→•※■□●○◆◇★☆]/g,'').trim();
    if(!trimmed)return;
    const catOnly=/^\[([^\]]+)\]\s*$/.exec(trimmed);
    const catWith=/^\[([^\]]+)\]\s+(.+)$/.exec(trimmed);
    if(catOnly){currentCat=catOnly[1];}
    else if(catWith){currentCat=catWith[1];result.push(`[${currentCat}] ${catWith[2]}`);}
    else if(currentCat&&trimmed){result.push(`[${currentCat}] ${trimmed}`);}
  });
  if(!result.length)return showToast('정리할 문구를 찾지 못했어요.','err');
  ta.value=result.join('\n');
  if(type==='se')saveSeData(key);
  else if(type==='sports')saveSportsData(key);
  else saveChData(key);
  updateCount(textareaId,countId);
  showToast(`${result.length}개 문구 정리 완료!`);
}

function clearPhrases(textareaId,countId,key,type){
  const ta=document.getElementById(textareaId);
  if(!ta||!ta.value.trim())return showToast('삭제할 문구가 없어요!','err');
  if(!confirm('문구 뱅크를 전체 삭제할까요?'))return;
  ta.value='';
  if(type==='se')saveSeData(key);
  else if(type==='sports')saveSportsData(key);
  else saveChData(key);
  updateCount(textareaId,countId);
  showToast('삭제됐어요!');
}

// ── CSV 내보내기 ──
function exportExcel(tab){
  const cfg=loadSetting();
  let results,type,subject,activity;
  if(tab==='se'){results=window._seResults||S.get('se-last-results',[]);type=document.getElementById('se-export-type')?.value||'se';subject=document.getElementById('se-export-subject')?.value.trim()||'';}
  else if(tab==='sports'){results=window._sportsResults||S.get('sports-last-results',[]);type=document.getElementById('sports-export-type')?.value||'se';subject=document.getElementById('sports-export-subject')?.value.trim()||'체육';activity=subject;}
  else{results=window._chResults||S.get('ch-last-results',[]);type=document.getElementById('ch-export-type')?.value||'simple';activity=document.getElementById('ch-export-activity')?.value.trim()||'';}
  if(!results.length)return showToast('조합된 결과가 없어요!','err');
  let csv='';
  if(type==='se'){csv='학년도,학기,학년,반/번호,성명,과목명,세부능력 및 특기사항\n';results.forEach(r=>{csv+=`${cfg.year},${cfg.semester},${cfg.grade},"${r.studentId}",,"${subject}","${r.text.replace(/"/g,'""')}"\n`;});}
  else if(type==='jinro'){csv='학년도,학기,학년,반,번호,성명,영역,활동명,특기사항\n';results.forEach(r=>{csv+=`${cfg.year},${cfg.semester},${cfg.grade},,,"",진로탐색활동,"${activity}","${r.text.replace(/"/g,'""')}"\n`;});}
  else{csv='학년,반,번호,특기사항\n';results.forEach(r=>{csv+=`${cfg.grade},,"${r.studentId}","${r.text.replace(/"/g,'""')}"\n`;});}
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='생활기록부_'+new Date().toLocaleDateString('ko-KR').replace(/\.\s*/g,'-').replace(/-$/,'')+'.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast('다운로드 시작!');
}

// ── JSON 백업/복원 ──
function exportJSON(){
  const data={};
  Object.keys(localStorage).filter(k=>k.startsWith('sgb_')).forEach(k=>{data[k.replace('sgb_','')]=JSON.parse(localStorage.getItem(k));});
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
  reader.onload=ev=>{try{const data=JSON.parse(ev.target.result);if(!confirm('현재 데이터를 덮어쓰고 불러올까요?'))return;Object.keys(data).forEach(k=>localStorage.setItem('sgb_'+k,JSON.stringify(data[k])));showToast('불러오기 완료! 새로고침합니다.');setTimeout(()=>location.reload(),1000);}catch{showToast('파일을 읽을 수 없어요.','err');}};
  reader.readAsText(file);
  e.target.value='';
}
function clearAll(){if(!confirm('모든 데이터를 초기화할까요?'))return;Object.keys(localStorage).filter(k=>k.startsWith('sgb_')).forEach(k=>localStorage.removeItem(k));showToast('초기화됐어요!');setTimeout(()=>location.reload(),800);}

// ══════════════════════
// 가정통신문
// ══════════════════════
const LETTER_QUESTIONS=['학교생활','친구관계','고민','학습','목표','취미/관심사','선생님께'];
let letterStudents=[];

function toggleLetterGuide(){
  const content=document.getElementById('letter-guide-content');
  const arrow=document.getElementById('letter-guide-arrow');
  if(!content)return;
  const isOpen=content.style.display!=='none';
  content.style.display=isOpen?'none':'block';
  arrow.textContent=isOpen?'›':'∨';
}

function letterLoadCSV(e){
  const file=e.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const text=ev.target.result;
      const rows=parseCSV(text);
      if(rows.length<2)return showToast('데이터가 없어요!','err');
      const data=rows.slice(1).filter(r=>r.length>1&&r[1]?.trim());
      letterStudents=data.map(r=>({nameId:r[1]?.trim()||'',q1:r[2]?.trim()||'',q2:r[3]?.trim()||'',q3:r[4]?.trim()||'',q4:r[5]?.trim()||'',q5:r[6]?.trim()||'',q6:r[7]?.trim()||'',q7:r[8]?.trim()||'',letter:''}));
      S.set('letter-students',letterStudents);
      renderLetterStudents();
      renderLetterBatchBtns();
      document.getElementById('letter-paste-box').style.display='block';
      showToast(`${letterStudents.length}명 로드 완료!`);
    }catch(err){showToast('CSV 파일을 읽을 수 없어요!','err');}
  };
  reader.readAsText(file,'UTF-8');
  e.target.value='';
}

function parseCSV(text){
  const rows=[];
  const lines=text.split('\n');
  lines.forEach(line=>{
    if(!line.trim())return;
    const cols=[];
    let cur='',inQ=false;
    for(let i=0;i<line.length;i++){
      const c=line[i];
      if(c==='"'){inQ=!inQ;}
      else if(c===','&&!inQ){cols.push(cur.trim());cur='';}
      else{cur+=c;}
    }
    cols.push(cur.trim());
    rows.push(cols);
  });
  return rows;
}

function renderLetterStudents(){
  const container=document.getElementById('letter-student-list');
  if(!letterStudents.length){container.innerHTML='<div class="empty"><div class="empty-icon">📋</div>CSV 파일을 업로드하면<br>학생 목록이 나타나요.</div>';return;}
  let html='<div style="display:flex;flex-direction:column;gap:8px;">';
  letterStudents.forEach((s,i)=>{
    html+=`<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-xs);padding:12px 14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:13px;font-weight:700;color:var(--text);">${esc(s.nameId)}</span>
        <button class="btn" style="font-size:11px;padding:4px 9px;" onclick="copyLetterAiText(${i})">📋 AI 텍스트 복사</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        ${LETTER_QUESTIONS.map((q,qi)=>`<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:7px 9px;">
          <div style="font-size:10px;color:var(--text-3);font-weight:600;margin-bottom:3px;">${esc(q)}</div>
          <div style="font-size:12px;color:var(--text-2);line-height:1.6;">${esc(s['q'+(qi+1)])||'<span style="color:var(--text-3);">미응답</span>'}</div>
        </div>`).join('')}
      </div>
    </div>`;
  });
  html+='</div>';
  container.innerHTML=html;
  renderLetterResults();
}

function renderLetterBatchBtns(){
  const box=document.getElementById('letter-batch-btns');
  const row=document.getElementById('letter-batch-row');
  if(!box||!row)return;
  if(!letterStudents.length){box.style.display='none';return;}
  box.style.display='block';
  row.innerHTML='';
  const total=letterStudents.length;
  const size=10;
  for(let i=0;i<total;i+=size){
    const end=Math.min(i+size,total);
    const btn=document.createElement('button');
    btn.className='btn btn-dark';
    btn.style.fontSize='12px';
    btn.textContent=`📋 ${i+1}~${end}번 복사`;
    btn.onclick=()=>copyLetterBatch(i,end);
    row.appendChild(btn);
  }
}

function getStudentIdOnly(nameId){
  // 학번+이름에서 학번만 추출 (숫자로 시작하는 부분)
  const match=nameId.match(/^(\d+)/);
  return match?match[1]:nameId;
}

function getLetterAiText(i){
  const s=letterStudents[i];
  if(!s)return'';
  const idOnly=getStudentIdOnly(s.nameId);
  return`[가정통신문 작성 요청]
학생 번호: ${idOnly}

학생 관련 정보 (참고용):
- 학교생활: ${s.q1||'미응답'}
- 친구관계: ${s.q2||'미응답'}
- 고민: ${s.q3||'미응답'}
- 학습: ${s.q4||'미응답'}
- 목표: ${s.q5||'미응답'}
- 취미/관심사: ${s.q6||'미응답'}
- 기타: ${s.q7||'미응답'}

위 정보를 바탕으로 담임 선생님이 학부모에게 보내는 개별 가정통신문을 작성해주세요.

원칙:
- 첫 문장은 반드시 "안녕하세요. ○학년 ○반 담임입니다." 로 시작
- 담임 선생님이 학생을 가까이서 지켜보며 학부모에게 전하는 따뜻한 편지 형식
- 존댓말 사용
- 학생 이름 자리는 반드시 ○○이로 표기
- 설문, 답변, 응답 등의 단어 절대 사용 금지
- 위 정보를 항목별로 하나하나 나열하지 말고, 학생의 전체적인 모습을 자연스럽게 녹여서 서술
- 담임 선생님이 학생을 관찰하고 느낀 것처럼 자연스럽게 서술
- 예) "수업이 이해 안 된다고 했습니다" ❌ → "수업 내용을 온전히 이해하려는 노력이 엿보이며" ✅
- 반드시 3문단으로 구성하되, 각 항목을 억지로 끼워 맞추지 말고 전체 내용이 자연스럽게 흐르도록 작성
  1문단: 학생의 전반적인 학교생활 모습 (밝고 긍정적으로)
  2문단: 학습 태도와 성장 과정 (따뜻하고 격려하는 톤으로)
  3문단: 학생에 대한 담임의 진심 + 학부모에 대한 감사 + 응원으로 자연스럽게 마무리 (항목 나열 금지, 편지 마무리처럼 따뜻하게)
- 억지로 취미나 목표를 끼워 넣지 말고, 자연스럽게 녹아들 때만 활용
- 학생의 긍정적인 면 강조
- 고민은 문제가 아닌 성장의 기회로 자연스럽게 표현
- 기타 내용은 억지로 넣지 말고 자연스럽게 녹아들 때만 활용
- 각 가정통신문 앞에 ###${idOnly} 형식으로 구분해주세요

작성된 가정통신문 전체를 코드블록 없이 깔끔하게 출력해주세요.`;
}

function copyLetterAiText(i){navigator.clipboard.writeText(getLetterAiText(i)).then(()=>showToast('복사됐어요! AI에 붙여넣으세요 😊'));}

function copyLetterBatch(start,end){
  const texts=[];
  for(let i=start;i<end;i++){texts.push(getLetterAiText(i));}
  navigator.clipboard.writeText(texts.join('\n\n')).then(()=>showToast(`${start+1}~${end}번 복사됐어요!`));
}

function letterParsePaste(){
  const raw=document.getElementById('letter-paste-input')?.value||'';
  if(!raw.trim())return showToast('AI 결과를 붙여넣어 주세요!','err');
  const parts=raw.split(/###/).filter(p=>p.trim());
  let matched=0;
  parts.forEach(part=>{
    const firstLine=part.split('\n')[0].trim();
    const content=part.split('\n').slice(1).join('\n').trim();
    if(!content)return;
    const idx=letterStudents.findIndex(s=>{
      const idOnly=getStudentIdOnly(s.nameId);
      return idOnly===firstLine||s.nameId===firstLine||firstLine.includes(idOnly);
    });
    if(idx>=0){letterStudents[idx].letter=content;matched++;}
  });
  S.set('letter-students',letterStudents);
  renderLetterResults();
  document.getElementById('letter-paste-input').value='';
  document.getElementById('letter-export-box').style.display='block';
  showToast(`${matched}명 가정통신문 적용 완료!`);
}

function renderLetterResults(){
  const container=document.getElementById('letter-results');
  if(!letterStudents.length){container.innerHTML='<div class="empty"><div class="empty-icon">✉️</div>CSV 업로드 후<br>AI 텍스트를 복사해 결과를 붙여넣으세요.</div>';return;}
  let html='<div style="display:flex;flex-direction:column;gap:8px;">';
  letterStudents.forEach((s,i)=>{
    const rid='letter_'+i;
    const hasLetter=!!s.letter;
    html+=`<div class="result-card" style="${!hasLetter?'opacity:0.5':''}">
      <div class="result-card-hd"><div class="result-sid">${esc(s.nameId)}</div></div>
      <div class="result-text" id="${rid}" contenteditable="false">${hasLetter?esc(s.letter):'<span style="color:var(--text-3);font-size:13px;">미작성</span>'}</div>
      ${hasLetter?`<div class="result-actions">
        <button class="btn" style="font-size:12px;padding:5px 10px;" onclick="copyLetterResult('${rid}')">복사</button>
        <button class="btn" style="font-size:12px;padding:5px 10px;" onclick="toggleLetterEdit('${rid}',${i})">수정</button>
        <button class="btn btn-danger" style="font-size:12px;padding:5px 10px;" onclick="deleteLetterResult(${i})">삭제</button>
      </div>`:''}
    </div>`;
  });
  html+='</div>';
  container.innerHTML=html;
}

function copyLetterResult(rid){const el=document.getElementById(rid);if(!el)return;navigator.clipboard.writeText(el.innerText).then(()=>showToast('복사됐어요!'));}

function toggleLetterEdit(rid,i){
  const el=document.getElementById(rid);
  if(!el)return;
  const isEditing=el.contentEditable==='true';
  if(isEditing){
    el.contentEditable='false';
    letterStudents[i].letter=el.innerText;
    S.set('letter-students',letterStudents);
    el.parentElement.querySelector('button:last-child').textContent='수정';
    showToast('저장됐어요!');
  } else {
    el.contentEditable='true';el.focus();
    el.parentElement.querySelector('button:last-child').textContent='저장';
  }
}

function letterReset(){
  if(!letterStudents.length)return showToast('삭제할 데이터가 없어요!','err');
  if(!confirm('가정통신문 데이터를 전체 초기화할까요? 되돌릴 수 없어요!'))return;
  letterStudents=[];
  S.del('letter-students');
  renderLetterStudents();
  renderLetterBatchBtns();
  document.getElementById('letter-paste-box').style.display='none';
  document.getElementById('letter-export-box').style.display='none';
  document.getElementById('letter-results').innerHTML='<div class="empty"><div class="empty-icon">✉️</div>CSV 업로드 후<br>AI 텍스트를 복사해 결과를 붙여넣으세요.</div>';
  showToast('초기화됐어요!');
}

function deleteLetterResult(i){
  if(!confirm('이 학생의 가정통신문을 삭제할까요?'))return;
  letterStudents[i].letter='';
  S.set('letter-students',letterStudents);
  renderLetterResults();
  showToast('삭제됐어요!');
}

function deleteAllLetterResults(){
  if(!letterStudents.some(s=>s.letter))return showToast('삭제할 결과가 없어요!','err');
  if(!confirm('전체 가정통신문 결과를 삭제할까요?'))return;
  letterStudents.forEach(s=>s.letter='');
  S.set('letter-students',letterStudents);
  renderLetterResults();
  document.getElementById('letter-export-box').style.display='none';
  showToast('전체 삭제됐어요!');
}

function letterExport(){
  if(!letterStudents.length)return showToast('데이터가 없어요!','err');
  let csv='학번이름,가정통신문\n';
  letterStudents.forEach(s=>{csv+=`"${s.nameId}","${(s.letter||'').replace(/"/g,'""')}"\n`;});
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='가정통신문_'+new Date().toLocaleDateString('ko-KR').replace(/\.\s*/g,'-').replace(/-$/,'')+'.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast('다운로드 시작!');
}

// ══════════════════════
// 통지표용 변환
// ══════════════════════
let convertData=[];
let convertCol='';
let convertFileName='';
let convertMode='auto'; // 'auto' or 'ai'

function selectConvertMode(mode){
  convertMode=mode;
  const autoBtn=document.getElementById('mode-auto-btn');
  const aiBtn=document.getElementById('mode-ai-btn');
  if(mode==='auto'){
    autoBtn.style.background='var(--accent)';autoBtn.style.borderColor='var(--accent)';
    autoBtn.querySelector('div').style.color='#fff';
    autoBtn.querySelectorAll('div')[1].style.color='rgba(255,255,255,0.8)';
    aiBtn.style.background='var(--bg)';aiBtn.style.borderColor='var(--border)';
    aiBtn.querySelector('div').style.color='var(--text)';
    aiBtn.querySelectorAll('div')[1].style.color='var(--text-3)';
  } else {
    aiBtn.style.background='var(--accent)';aiBtn.style.borderColor='var(--accent)';
    aiBtn.querySelector('div').style.color='#fff';
    aiBtn.querySelectorAll('div')[1].style.color='rgba(255,255,255,0.8)';
    autoBtn.style.background='var(--bg)';autoBtn.style.borderColor='var(--border)';
    autoBtn.querySelector('div').style.color='var(--text)';
    autoBtn.querySelectorAll('div')[1].style.color='var(--text-3)';
  }
  // 파일이 이미 로드된 경우 재처리
  if(convertData.length)reprocessConvert();
}

function reprocessConvert(){
  if(convertMode==='auto'){
    document.getElementById('convert-ai-panel').style.display='none';
    document.getElementById('convert-student-list').style.display='none';
    renderConvertResults();
    document.getElementById('convert-export-box').style.display='block';
  } else {
    document.getElementById('convert-ai-panel').style.display='block';
    document.getElementById('convert-student-list').style.display='block';
    renderConvertStudentList();
    renderConvertBatchBtns();
    document.getElementById('convert-results').innerHTML='<div class="empty"><div class="empty-icon">🔄</div>AI 텍스트를 복사해<br>결과를 붙여넣으세요.</div>';
    document.getElementById('convert-export-box').style.display='none';
  }
}

// 개조식 → 서술식 변환 (과거형)
function convertEnding(text){
  if(!text||typeof text!=='string')return text;
  const rules=[
    ['이 인상적임\\.','이 인상적이었습니다.'],
    ['이 돋보임\\.','이 돋보였습니다.'],
    ['이 뛰어남\\.','이 뛰어났습니다.'],
    ['가 뛰어남\\.','가 뛰어났습니다.'],
    ['하는 모습을 보임\\.','하는 모습을 보였습니다.'],
    ['을 보임\\.','을 보였습니다.'],
    ['를 보임\\.','를 보였습니다.'],
    ['을 탐색함\\.','을 탐색했습니다.'],
    ['를 탐색함\\.','를 탐색했습니다.'],
    ['을 발휘함\\.','을 발휘했습니다.'],
    ['를 발휘함\\.','를 발휘했습니다.'],
    ['을 작성함\\.','을 작성했습니다.'],
    ['를 작성함\\.','를 작성했습니다.'],
    ['을 제시함\\.','을 제시했습니다.'],
    ['를 제시함\\.','를 제시했습니다.'],
    ['을 밝힘\\.','을 밝혔습니다.'],
    ['를 밝힘\\.','를 밝혔습니다.'],
    ['에 참여함\\.','에 참여했습니다.'],
    ['을 얻음\\.','을 얻었습니다.'],
    ['를 얻음\\.','를 얻었습니다.'],
    ['보임\\.','보였습니다.'],
    ['않음\\.','않았습니다.'],
    ['없음\\.','없었습니다.'],
    ['있음\\.','있었습니다.'],
    ['됨\\.','되었습니다.'],
    ['임\\.','이었습니다.'],
    ['함\\.','했습니다.'],
    ['음\\.','었습니다.'],
  ];
  let result=text;
  rules.forEach(([p,r])=>{result=result.replace(new RegExp(p,'g'),r);});
  return result;
}

function convertLoadCSV(e){
  const file=e.target.files[0];
  if(!file)return;
  convertFileName=file.name;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const buf=ev.target.result;
      let text='';
      try{
        const decoded=new TextDecoder('euc-kr').decode(buf);
        if(decoded.includes('반/번호')||decoded.includes('평가결과')||decoded.includes('교육활동')){
          text=decoded;
        } else {text=new TextDecoder('utf-8').decode(buf);}
      }catch{text=new TextDecoder('utf-8').decode(buf);}

      const rows=parseCSV(text);
      if(rows.length<2)return showToast('데이터가 없어요!','err');
      const headers=rows[0].map(h=>h.trim());
      const colIdx=headers.findIndex(h=>{
        const clean=h.replace(/\s/g,'');
        return clean.includes('평가결과')||clean.includes('교육활동')||clean.includes('서술평가')||clean.includes('특기사항');
      });
      if(colIdx===-1)return showToast('평가결과 또는 교육활동 열을 찾을 수 없어요!','err');
      convertCol=headers[colIdx];

      // 원본 데이터 저장
      const rawData=rows.slice(1).map(row=>{
        const obj={};
        headers.forEach((h,i)=>obj[h]=row[i]||'');
        return obj;
      });

      // 자동 변환 모드면 즉시 변환
      if(convertMode==='auto'){
        convertData=rawData.map(row=>({...row,[convertCol]:convertEnding(row[convertCol])}));
      } else {
        // AI 모드면 원본 유지
        convertData=rawData.map(row=>({...row,_original:row[convertCol],_converted:''}));
      }

      document.getElementById('convert-info').style.display='block';
      document.getElementById('convert-file-info').textContent=
        `${convertFileName} · ${rawData.length}명 · "${convertCol}" 열`;

      reprocessConvert();
      showToast(`${rawData.length}명 로드 완료!`);
    }catch(err){
      console.error(err);
      showToast('CSV 파일을 읽을 수 없어요!','err');
    }
  };
  reader.readAsArrayBuffer(file);
  e.target.value='';
}

// AI 모드: 학생 목록 렌더
function renderConvertStudentList(){
  const container=document.getElementById('convert-student-list');
  if(!convertData.length){container.innerHTML='';return;}
  let html='<div style="display:flex;flex-direction:column;gap:6px;">';
  convertData.forEach((row,i)=>{
    const num=row['반/번호']||'';
    const name=row['성명']||'';
    const content=row._original||row[convertCol]||'';
    html+=`<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-xs);padding:10px 12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:13px;font-weight:700;">${esc(num)} ${esc(name)}</span>
        <button class="btn" style="font-size:11px;padding:3px 8px;" onclick="copyConvertAiText(${i})">📋 복사</button>
      </div>
      <div style="font-size:12px;color:var(--text-3);line-height:1.7;max-height:60px;overflow:hidden;">${esc(content.substring(0,80))}${content.length>80?'...':''}</div>
    </div>`;
  });
  html+='</div>';
  container.innerHTML=html;
}

// AI 모드: 복사 버튼 생성
function renderConvertBatchBtns(){
  const row=document.getElementById('convert-batch-row');
  if(!row||!convertData.length)return;
  row.innerHTML='';
  // 개별 복사는 학생 목록에 있으니 여기선 묶음만
  [[1,'개별'],[3,'3명씩'],[5,'5명씩']].forEach(([size,label])=>{
    if(size===1){
      // 개별은 이미 각 카드에 있음
      return;
    }
    const total=convertData.length;
    for(let i=0;i<total;i+=size){
      const end=Math.min(i+size,total);
      const btn=document.createElement('button');
      btn.className='btn btn-dark';
      btn.style.fontSize='12px';
      btn.textContent=`📋 ${label} ${i+1}~${end}번`;
      btn.onclick=()=>copyConvertBatch(i,end);
      row.appendChild(btn);
    }
  });
}

function getConvertAiText(i){
  const row=convertData[i];
  if(!row)return'';
  const num=row['반/번호']||'';
  const content=row._original||row[convertCol]||'';
  return`[통지표 서술 변환 요청]
학생: ${num}

원본 세특 내용:
${content}

위 내용을 통지표용으로 변환해주세요.

원칙:
- 각 활동명은 반드시 포함하되, 활동명이 문장 속에 자연스럽게 녹아들도록 표현
- 활동마다 문장을 끊지 말고 ~하였으며, ~하고, ~를 통해 등의 연결어로 하나의 흐름으로 이어지도록 작성
- 전체를 1~2문장으로 완성 (마지막 문장만 ~했습니다. 또는 ~보였습니다. 로 마무리)
- 활동명 뒤에 ~에서, ~를 통해, ~수업에서는 등을 다양하게 활용해 반복감 없이 자연스럽게 연결
- 예시)
  ❌ "A활동에서 ~했습니다. B활동에서 ~발휘했습니다. C활동에서 ~보였습니다."
  ✅ "A활동에서 ~하였으며, B를 통해 ~분석하고, C수업에서는 ~이뤄내는 자기 주도적 학습 태도가 돋보였습니다."
- 핵심 내용만 담고 불필요한 수식어 제거
- 서술어는 반드시 과거형 (~했습니다. ~보였습니다. ~이었습니다. 등)
- 개조식 문장(~임. ~함. ~보임.) 절대 사용 금지
- 각 결과 사이에 구분선(---, ===, ***) 절대 사용 금지
- 앞에 ###${num} 형식으로 구분해주세요

코드블록 없이 깔끔하게 출력해주세요.`;
}

function copyConvertAiText(i){
  navigator.clipboard.writeText(getConvertAiText(i)).then(()=>showToast('복사됐어요!'));
}

function copyConvertBatch(start,end){
  const texts=[];
  for(let i=start;i<end;i++){texts.push(getConvertAiText(i));}
  navigator.clipboard.writeText(texts.join('\n\n')).then(()=>showToast(`${start+1}~${end}번 복사됐어요!`));
}

function convertParsePaste(){
  const raw=document.getElementById('convert-paste-input')?.value||'';
  if(!raw.trim())return showToast('AI 결과를 붙여넣어 주세요!','err');
  const parts=raw.split(/###/).filter(p=>p.trim());
  let matched=0;
  parts.forEach(part=>{
    const firstLine=part.split('\n')[0].trim();
    const content=part.split('\n').slice(1).join('\n').trim();
    if(!content)return;
    const idx=convertData.findIndex(row=>{
      const num=(row['반/번호']||'').trim();
      return num===firstLine||firstLine.includes(num)||num.includes(firstLine);
    });
    if(idx>=0){
      convertData[idx]={...convertData[idx],[convertCol]:content,_converted:content};
      matched++;
    }
  });
  document.getElementById('convert-paste-input').value='';
  renderConvertResults();
  document.getElementById('convert-export-box').style.display='block';
  showToast(`${matched}명 적용 완료!`);
}

function renderConvertResults(){
  const container=document.getElementById('convert-results');
  if(!convertData.length){
    container.innerHTML='<div class="empty"><div class="empty-icon">🔄</div>CSV 파일을 업로드하면<br>변환 결과가 나타나요.</div>';
    return;
  }
  let html='<div style="display:flex;flex-direction:column;gap:8px;">';
  convertData.forEach((row,i)=>{
    const num=row['반/번호']||'';
    const name=row['성명']||'';
    const content=row[convertCol]||'';
    if(!content){
      html+=`<div class="result-card" style="opacity:0.4;">
        <div class="result-card-hd"><div class="result-sid">${esc(num)} ${esc(name)}</div></div>
        <div style="font-size:12px;color:var(--text-3);">미작성</div>
      </div>`;
      return;
    }
    html+=`<div class="result-card">
      <div class="result-card-hd"><div class="result-sid">${esc(num)} ${esc(name)}</div></div>
      <div class="result-text" id="conv_${i}" contenteditable="false">${esc(content)}</div>
      <div class="result-actions">
        <button class="btn" style="font-size:12px;padding:5px 10px;" onclick="copyConvertResult('conv_${i}')">복사</button>
        <button class="btn" style="font-size:12px;padding:5px 10px;" onclick="toggleConvertEdit('conv_${i}',${i})">수정</button>
      </div>
    </div>`;
  });
  html+='</div>';
  container.innerHTML=html;
}

function copyConvertResult(rid){
  const el=document.getElementById(rid);
  if(!el)return;
  navigator.clipboard.writeText(el.innerText).then(()=>showToast('복사됐어요!'));
}

function toggleConvertEdit(rid,i){
  const el=document.getElementById(rid);
  if(!el)return;
  const isEditing=el.contentEditable==='true';
  if(isEditing){
    el.contentEditable='false';
    convertData[i][convertCol]=el.innerText;
    el.parentElement.querySelector('button:last-child').textContent='수정';
    showToast('저장됐어요!');
  } else {
    el.contentEditable='true';el.focus();
    el.parentElement.querySelector('button:last-child').textContent='저장';
  }
}

function convertReset(){
  if(!convertData.length)return showToast('데이터가 없어요!','err');
  if(!confirm('변환 데이터를 초기화할까요?'))return;
  convertData=[];convertCol='';convertFileName='';
  document.getElementById('convert-info').style.display='none';
  document.getElementById('convert-export-box').style.display='none';
  document.getElementById('convert-ai-panel').style.display='none';
  document.getElementById('convert-student-list').style.display='none';
  renderConvertResults();
  showToast('초기화됐어요!');
}

function convertExport(){
  if(!convertData.length)return showToast('데이터가 없어요!','err');
  const headers=Object.keys(convertData[0]).filter(k=>!k.startsWith('_'));
  let csv=headers.join(',')+'\n';
  convertData.forEach(row=>{
    csv+=headers.map(h=>`"${(row[h]||'').replace(/"/g,'""')}"`).join(',')+'\n';
  });
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='통지표변환_'+convertFileName;
  a.click();URL.revokeObjectURL(url);
  showToast('다운로드 시작!');
}



const guideState={};

function openGuide(id){
  const overlay=document.getElementById('guide-'+id);
  if(!overlay)return;
  overlay.classList.add('active');
  if(!guideState[id])guideState[id]=0;
  renderSlide(id);
  overlay.onclick=(e)=>{if(e.target===overlay)closeGuide(id);};
}
function closeGuide(id){document.getElementById('guide-'+id)?.classList.remove('active');}
function renderSlide(id){
  const slides=document.querySelectorAll(`#slides-${id} .modal-slide`);
  const dots=document.getElementById('dots-'+id);
  const cur=guideState[id]||0;
  slides.forEach((s,i)=>s.classList.toggle('active',i===cur));
  if(dots){dots.innerHTML='';slides.forEach((_,i)=>{const d=document.createElement('div');d.className='slide-dot'+(i===cur?' active':'');d.onclick=()=>{guideState[id]=i;renderSlide(id);};dots.appendChild(d);});}
  const nextBtn=document.querySelector(`#guide-${id} .modal-nav .btn-dark`);
  if(nextBtn)nextBtn.textContent=cur===slides.length-1?'완료 ✓':'다음 →';
}
function nextSlide(id){const slides=document.querySelectorAll(`#slides-${id} .modal-slide`);if(guideState[id]===slides.length-1){closeGuide(id);return;}guideState[id]=(guideState[id]||0)+1;renderSlide(id);}
function prevSlide(id){if((guideState[id]||0)===0)return;guideState[id]--;renderSlide(id);}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){['se','ch','sports','student','letter'].forEach(id=>closeGuide(id));}});

window.onload=()=>{
  loadSetting();
  loadClasses();
  const subjects=S.get('se-subjects',[]);
  if(subjects.length){
    subjects.forEach(s=>{const d=S.get('se-data-'+s,{});if(d.activity!==undefined&&!d.activities){d.activities=d.activity?d.activity.split('\n').filter(l=>l.trim()).map(l=>({name:l.trim(),desc:''})):[];delete d.activity;S.set('se-data-'+s,d);}});
    activeSeSubject=subjects[0];
    renderSeSubjects();
  }
  ['자율','진로','동아리'].forEach(type=>{const d=S.get('ch-data-'+type,{});if(typeof d.activities==='string'){d.activities=d.activities?d.activities.split('\n').filter(l=>l.trim()).map(l=>({year:'',month:'',day:'',name:l.trim(),desc:''})):[];S.set('ch-data-'+type,d);}});
  renderChPanel('자율');
  const sportsList=S.get('sports-list',[]);
  if(sportsList.length){activeSportsItem=sportsList[0];renderSportsList();}
  refreshClassSelects();
  const seRes=S.get('se-last-results',[]);
  if(seRes.length){window._seResults=seRes;renderCombineResults(seRes,'se-combine-results',true);document.getElementById('se-export-box').style.display='block';}
  const chRes=S.get('ch-last-results',[]);
  if(chRes.length){window._chResults=chRes;renderCombineResults(chRes,'ch-combine-results',false);document.getElementById('ch-export-box').style.display='block';}
  const sportsRes=S.get('sports-last-results',[]);
  if(sportsRes.length){window._sportsResults=sportsRes;renderCombineResults(sportsRes,'sports-combine-results',false);document.getElementById('sports-export-box').style.display='block';}
  const savedLetters=S.get('letter-students',[]);
  if(savedLetters.length){letterStudents=savedLetters;renderLetterStudents();renderLetterBatchBtns();document.getElementById('letter-paste-box').style.display='block';if(savedLetters.some(s=>s.letter))document.getElementById('letter-export-box').style.display='block';}
};
