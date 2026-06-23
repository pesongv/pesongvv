// ── 탭 ──
const TAB_IDS=['t-se','t-ch','t-student','t-combine','t-setting'];
function showTab(id){
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-tab')[TAB_IDS.indexOf(id)]?.classList.add('active');
  if(id==='t-combine')refreshCombineClass();
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
function showToast(msg){
  const t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:24px;right:24px;background:#2dd4bf;color:#0f172a;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(45,212,191,0.4);animation:fadeIn 0.2s ease';
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2200);
}
const style=document.createElement('style');
style.textContent='@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
document.head.appendChild(style);

// ══════════════════════
// 세특
// ══════════════════════
let activeSeSubject=null;

function addSeSubject(){
  const input=document.getElementById('se-subject-input');
  const name=input.value.trim();
  if(!name)return showToast('과목명을 입력해주세요!');
  const subjects=S.get('se-subjects',[]);
  if(subjects.includes(name))return showToast('이미 있는 과목이에요!');
  subjects.push(name);
  S.set('se-subjects',subjects);
  input.value='';
  renderSeSubjects();
  switchSeSubject(name);
}

function renderSeSubjects(){
  const subjects=S.get('se-subjects',[]);
  const tabsEl=document.getElementById('seSubTabs');
  const panelsEl=document.getElementById('seSubPanels');
  tabsEl.innerHTML='';panelsEl.innerHTML='';
  if(!subjects.length){
    tabsEl.innerHTML='<span style="font-size:12px;color:var(--text-muted);">과목을 추가해주세요.</span>';
    return;
  }
  subjects.forEach(s=>{
    const btn=document.createElement('button');
    btn.className='sub-tab'+(s===activeSeSubject?' active':'');
    btn.textContent=s;btn.onclick=()=>switchSeSubject(s);
    tabsEl.appendChild(btn);
    const data=S.get('se-data-'+s,{achievement:'',activity:'',phrases:''});
    const panel=document.createElement('div');
    panel.className='sub-panel'+(s===activeSeSubject?' active':'');
    panel.id='se-panel-'+s;
    panel.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style="font-size:14px;font-weight:700;color:var(--text);">${esc(s)}</span>
        <button class="btn btn-danger" style="font-size:11px;padding:4px 10px;" onclick="deleteSeSubject('${esc(s)}')">삭제</button>
      </div>
      <div class="grid-2" style="margin-bottom:16px;">
        <div><label>성취기준</label><textarea id="se-ach-${s}" placeholder="예: 운동 수행 능력을 향상시키고 체력을 기른다." oninput="saveSeData('${s}')">${esc(data.achievement)}</textarea></div>
        <div><label>활동 내용</label><textarea id="se-act-${s}" placeholder="예: 배드민턴 기초기술 수행평가, 모둠별 경기 진행" oninput="saveSeData('${s}')">${esc(data.activity)}</textarea></div>
      </div>
      <div class="ai-box">
        <div class="ai-box-title">🤖 AI용 텍스트</div>
        <div class="ai-prompt-preview" id="se-preview-${s}">미리보기 업데이트 버튼을 눌러주세요.</div>
        <div class="btn-row">
          <button class="btn btn-ghost" style="font-size:12px;" onclick="updateSePreview('${s}')">미리보기</button>
          <button class="btn btn-mint" style="font-size:12px;" onclick="copySeAiText('${s}')">📋 AI용 텍스트 복사</button>
        </div>
        <div class="ai-hint">💡 복사 후 AI 채팅창에 붙여넣으면 카테고리별 문구를 받을 수 있어요!</div>
      </div>
      <div class="divider"></div>
      <div class="phrase-bank">
        <div class="phrase-bank-header">
          <span class="phrase-bank-title">📝 문구 뱅크</span>
          <span class="phrase-count-badge" id="se-count-${s}">0개</span>
        </div>
        <div class="phrase-hint">형식: <code>[카테고리] 문장내용</code> 으로 한 줄씩 입력<br>예) <code>[적극적참여]</code> 수업 활동에 적극적으로 참여하는 모습을 보임.</div>
        <textarea id="se-phrases-${s}" placeholder="AI에게 받은 문구를 여기에 붙여넣으세요..." oninput="saveSeData('${s}')" style="min-height:160px;">${esc(data.phrases)}</textarea>
      </div>`;
    panelsEl.appendChild(panel);
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
    activity:document.getElementById('se-act-'+s)?.value||'',
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
}

function updateSePreview(s){
  const ach=document.getElementById('se-ach-'+s)?.value||'';
  const act=document.getElementById('se-act-'+s)?.value||'';
  document.getElementById('se-preview-'+s).textContent=`[세특 문구 생성 요청] 과목: ${s}
성취기준: ${ach||'(미입력)'}
활동내용: ${act||'(미입력)'}

위 내용 바탕으로 중학교 생활기록부 세특 문구를 카테고리별 5개씩 작성해주세요.
원칙: 관찰자 시점 / 개조식(~함.~보임.) / 주어 없이 / 긍정적 표현만

카테고리:
[적극적참여] [차분한참여] [주도적역할] [협력적역할] [열정적태도] [성실한태도] [창의적태도] [탐구적학습]`;
}

function copySeAiText(s){
  updateSePreview(s);
  navigator.clipboard.writeText(document.getElementById('se-preview-'+s).textContent)
    .then(()=>showToast('복사됐어요! AI에 붙여넣으세요 😊'));
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
  const data=S.get('ch-data-'+type,{activities:'',phrases:''});
  panelsEl.innerHTML=`
    <div style="margin-bottom:14px;">
      <label>활동 목록 (날짜 + 활동명, 한 줄씩)</label>
      <textarea id="ch-acts-${type}" placeholder="예:&#10;4/15 학급 자치회의&#10;5/20 환경 캠페인&#10;6/3 독서의날&#10;6/17 학급 특색활동" oninput="saveChData('${type}')">${esc(data.activities)}</textarea>
    </div>
    <div class="ai-box">
      <div class="ai-box-title">🤖 AI용 텍스트</div>
      <div class="ai-prompt-preview" id="ch-preview-${type}">미리보기 버튼을 눌러주세요.</div>
      <div class="btn-row">
        <button class="btn btn-ghost" style="font-size:12px;" onclick="updateChPreview('${type}')">미리보기</button>
        <button class="btn btn-mint" style="font-size:12px;" onclick="copyChAiText('${type}')">📋 AI용 텍스트 복사</button>
      </div>
      <div class="ai-hint">💡 복사 후 AI 채팅창에 붙여넣으면 카테고리별 문구를 받을 수 있어요!</div>
    </div>
    <div class="divider"></div>
    <div class="phrase-bank">
      <div class="phrase-bank-header">
        <span class="phrase-bank-title">📝 문구 뱅크</span>
        <span class="phrase-count-badge" id="ch-count-${type}">0개</span>
      </div>
      <div class="phrase-hint">형식: <code>[카테고리] 문장내용</code> 으로 한 줄씩</div>
      <textarea id="ch-phrases-${type}" placeholder="AI에게 받은 문구를 붙여넣으세요..." oninput="saveChData('${type}')" style="min-height:160px;">${esc(data.phrases)}</textarea>
    </div>`;
  updateCount('ch-phrases-'+type,'ch-count-'+type);
}

function saveChData(type){
  S.set('ch-data-'+type,{activities:document.getElementById('ch-acts-'+type)?.value||'',phrases:document.getElementById('ch-phrases-'+type)?.value||''});
  updateCount('ch-phrases-'+type,'ch-count-'+type);
}

function updateChPreview(type){
  const acts=document.getElementById('ch-acts-'+type)?.value||'';
  document.getElementById('ch-preview-'+type).textContent=`[창체 ${type}활동 문구 생성 요청]
활동 목록:\n${acts||'(미입력)'}

위 활동 바탕으로 창체 특기사항 문구를 카테고리별 5개씩 작성해주세요.
원칙: 관찰자 시점 / 개조식(~함.~보임.) / 주어 없이 / 긍정적 / 2~3문장

카테고리:
[적극적참여] [차분한참여] [주도적역할] [협력적역할] [성실한태도] [창의적태도]`;
}

function copyChAiText(type){
  updateChPreview(type);
  navigator.clipboard.writeText(document.getElementById('ch-preview-'+type).textContent)
    .then(()=>showToast('복사됐어요! AI에 붙여넣으세요 😊'));
}

// ══════════════════════
// 학생관리
// ══════════════════════
let classCount=0,activeClassId=null;

function addClass(name){
  classCount++;
  const id='cls_'+classCount;
  const cn=name||(classCount+'반');
  const tabBar=document.getElementById('classTabBar');
  const btn=document.createElement('button');
  btn.className='class-tab-btn';btn.id='ctab_'+id;
  btn.textContent=cn;btn.onclick=()=>switchClass(id);
  tabBar.appendChild(btn);
  const panelsEl=document.getElementById('classPanels');
  const panel=document.createElement('div');
  panel.className='class-panel';panel.id='cpanel_'+id;
  panel.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <input class="class-name-input" id="cname_${id}" value="${esc(cn)}" onchange="updateClassName('${id}')">
      </div>
      <button class="btn btn-danger" style="font-size:11px;padding:4px 10px;" onclick="deleteClass('${id}')">반 삭제</button>
    </div>
    <div class="student-list" id="srows_${id}"></div>
    <button class="add-student-btn" onclick="addStudent('${id}')">+ 학생 추가</button>`;
  panelsEl.appendChild(panel);
  switchClass(id);
  for(let i=0;i<5;i++)addStudent(id);
  saveClasses();
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
}

function deleteClass(id){
  if(!confirm('이 반을 삭제할까요?'))return;
  document.getElementById('ctab_'+id)?.remove();
  document.getElementById('cpanel_'+id)?.remove();
  document.querySelector('.class-tab-btn')?.click();
  saveClasses();
}

let sCount=0;
function addStudent(cid){
  const id2=cid||activeClassId;
  if(!id2)return;
  const rows=document.getElementById('srows_'+id2);
  if(!rows)return;
  const n=++sCount,sid='s_'+n;
  const rn=rows.children.length+1;
  const div=document.createElement('div');
  div.className='student-row';div.id=sid;
  div.innerHTML=`
    <span class="s-num">${rn}</span>
    <div><input type="text" placeholder="학번 (예: 30101)" id="${sid}_id" onblur="saveClasses()"></div>
    <div><select id="${sid}_g" onchange="saveClasses()"><option value="남학생">남학생</option><option value="여학생">여학생</option></select></div>
    <div class="s-pnum"><input type="text" placeholder="학생개인번호 (선택)" id="${sid}_pnum" onblur="saveClasses()"></div>
    <button class="btn btn-danger" style="font-size:11px;padding:4px 8px;" onclick="removeStudent('${sid}','${id2}')">삭제</button>`;
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
        gender:r.querySelector('[id$="_g"]')?.value||'남학생',
        pnum:r.querySelector('[id$="_pnum"]')?.value.trim()||''
      });
    });
    cls.push({cid,name:document.getElementById('cname_'+cid)?.value||'반',students});
  });
  S.set('classes',cls);
}

function loadClasses(){
  const cls=S.get('classes',[]);
  if(!cls.length){addClass('1반');addClass('2반');return;}
  cls.forEach(c=>{
    classCount++;
    const id=c.cid||'cls_'+classCount;
    const tabBar=document.getElementById('classTabBar');
    const btn=document.createElement('button');
    btn.className='class-tab-btn';btn.id='ctab_'+id;
    btn.textContent=c.name;btn.onclick=()=>switchClass(id);
    tabBar.appendChild(btn);
    const panelsEl=document.getElementById('classPanels');
    const panel=document.createElement('div');
    panel.className='class-panel';panel.id='cpanel_'+id;
    panel.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <input class="class-name-input" id="cname_${id}" value="${esc(c.name)}" onchange="updateClassName('${id}')">
        <button class="btn btn-danger" style="font-size:11px;padding:4px 10px;" onclick="deleteClass('${id}')">반 삭제</button>
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
      div.className='student-row';div.id=sid;
      div.innerHTML=`
        <span class="s-num">${rn}</span>
        <div><input type="text" placeholder="학번" id="${sid}_id" value="${esc(s.id)}" onblur="saveClasses()"></div>
        <div><select id="${sid}_g" onchange="saveClasses()"><option value="남학생" ${s.gender==='남학생'?'selected':''}>남학생</option><option value="여학생" ${s.gender==='여학생'?'selected':''}>여학생</option></select></div>
        <div class="s-pnum"><input type="text" placeholder="학생개인번호" id="${sid}_pnum" value="${esc(s.pnum||'')}" onblur="saveClasses()"></div>
        <button class="btn btn-danger" style="font-size:11px;padding:4px 8px;" onclick="removeStudent('${sid}','${id}')">삭제</button>`;
      rows.appendChild(div);
    });
  });
  document.querySelector('.class-tab-btn')?.click();
}

// ══════════════════════
// 문구조합
// ══════════════════════
function refreshCombineClass(){
  const sel=document.getElementById('combine-class');
  const prev=sel.value;
  sel.innerHTML='';
  document.querySelectorAll('.class-panel').forEach(p=>{
    const cid=p.id.replace('cpanel_','');
    const name=document.getElementById('cname_'+cid)?.value||'반';
    const opt=document.createElement('option');
    opt.value=cid;opt.textContent=name;
    if(cid===prev)opt.selected=true;
    sel.appendChild(opt);
  });
  loadCombineStudents();
}

function loadCombineStudents(){
  const cid=document.getElementById('combine-class').value;
  const type=document.getElementById('combine-type').value;
  const area=document.getElementById('combineStudentArea');
  if(!cid){area.innerHTML='<div class="empty"><div class="empty-icon">👆</div>반을 선택해주세요.</div>';return;}
  const phrases=getPhrases(type);
  const cats=getCategories(phrases);
  const students=getStudentsOfClass(cid);
  if(!students.length){area.innerHTML='<div class="empty"><div class="empty-icon">👥</div>학생을 추가해주세요.</div>';return;}
  if(!cats.length){area.innerHTML='<div class="empty"><div class="empty-icon">📝</div>문구 뱅크에 문구를 먼저 등록해주세요.</div>';return;}
  let html='';
  students.forEach((s,i)=>{
    html+=`<div class="student-combine-row">
      <div class="combine-student-id">학번 ${esc(s.id)}</div>
      <div class="trait-grid">`;
    cats.forEach(cat=>{
      const ps=getPhrasesByCat(phrases,cat);
      html+=`<div><label>${esc(cat)}</label><select id="trait_${i}_${esc(cat)}">
        <option value="">랜덤</option>
        ${ps.map((p,pi)=>`<option value="${pi}">${p.substring(0,18)}…</option>`).join('')}
      </select></div>`;
    });
    html+=`</div></div>`;
  });
  area.innerHTML=html;
  area.dataset.students=JSON.stringify(students);
  area.dataset.cats=JSON.stringify(cats);
}

function getStudentsOfClass(cid){
  return Array.from(document.querySelectorAll('#srows_'+cid+' .student-row')).map(r=>({
    id:r.querySelector('[id$="_id"]')?.value.trim()||'',
    pnum:r.querySelector('[id$="_pnum"]')?.value.trim()||''
  })).filter(s=>s.id);
}

function getPhrases(type){
  if(type==='se'){const subj=activeSeSubject||S.get('se-subjects',[])[0]||'';return S.get('se-data-'+subj,{phrases:''}).phrases;}
  return S.get('ch-data-'+type,{phrases:''}).phrases;
}
function getCategories(txt){const s=new Set();txt.split('\n').forEach(l=>{const m=l.match(/^\[([^\]]+)\]/);if(m)s.add(m[1]);});return[...s];}
function getPhrasesByCat(txt,cat){const r=[];txt.split('\n').forEach(l=>{const m=l.match(/^\[([^\]]+)\]\s*(.+)/);if(m&&m[1]===cat&&m[2].trim())r.push(m[2].trim());});return r;}

function combinePhrases(){
  const area=document.getElementById('combineStudentArea');
  const students=JSON.parse(area.dataset.students||'[]');
  const cats=JSON.parse(area.dataset.cats||'[]');
  const type=document.getElementById('combine-type').value;
  const phrases=getPhrases(type);
  if(!students.length)return showToast('학생 먼저 불러오세요!');
  if(!cats.length)return showToast('문구 뱅크에 문구를 등록해주세요!');
  const results=students.map((s,i)=>{
    const parts=[];
    cats.forEach(cat=>{
      const sel=document.getElementById('trait_'+i+'_'+cat);
      const ps=getPhrasesByCat(phrases,cat);
      if(!ps.length)return;
      const idx=sel&&sel.value!==''?parseInt(sel.value):Math.floor(Math.random()*ps.length);
      if(ps[idx])parts.push(ps[idx]);
    });
    return{studentId:s.id,pnum:s.pnum,text:parts.join(' ')};
  });
  window._lastResults=results;
  S.set('last-results',results);
  renderResults(results);
  document.getElementById('exportBox').style.display='block';
  showToast('문구 조합 완료!');
}

function renderResults(results){
  const container=document.getElementById('combineResults');
  if(!results.length){container.innerHTML='';return;}
  let html='<div style="margin-top:16px;">';
  results.forEach(r=>{
    const b=calcBytes(r.text);
    const bc=b>2000?'byte-over':b>1500?'byte-warn':'byte-ok';
    html+=`<div class="result-card">
      <div class="result-header">
        <div class="result-student-id">학번 ${esc(r.studentId)} <span class="byte-chip ${bc}">${b.toLocaleString()} B</span></div>
      </div>
      <div class="result-text" id="rt_${esc(r.studentId)}">${esc(r.text)}</div>
      <div class="result-actions">
        <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;" onclick="copyResult('${esc(r.studentId)}')">복사</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;" onclick="editResult('${esc(r.studentId)}')">수정</button>
      </div>
    </div>`;
  });
  html+='</div>';
  container.innerHTML=html;
}

function copyResult(id){
  const el=document.getElementById('rt_'+id);
  if(!el)return;
  navigator.clipboard.writeText(el.textContent).then(()=>showToast('복사됐어요!'));
}
function editResult(id){
  const el=document.getElementById('rt_'+id);
  if(!el)return;
  const t=prompt('문구를 수정하세요:',el.textContent);
  if(t!==null){el.textContent=t;const r=window._lastResults?.find(x=>x.studentId===id);if(r)r.text=t;}
}

// ══════════════════════
// 엑셀 내보내기
// ══════════════════════
function exportExcel(){
  const type=document.getElementById('export-type').value;
  const subject=document.getElementById('export-subject').value.trim();
  const activity=document.getElementById('export-activity').value.trim();
  const cfg=loadSetting();
  const results=window._lastResults||[];
  if(!results.length)return showToast('조합된 결과가 없어요!');
  let csv='';
  if(type==='se'){
    csv='학년도,학기,학년,반/번호,학생개인번호,성명,과목명,세부능력 및 특기사항\n';
    results.forEach(r=>{csv+=`${cfg.year},${cfg.semester},${cfg.grade},"${r.studentId}","${r.pnum||''}",,"${subject||''}","${r.text.replace(/"/g,'""')}"\n`;});
  }else if(type==='jinro'){
    csv='학년도,학기,학년,반,번호,학생개인번호,성명,영역,활동명,특기사항\n';
    results.forEach(r=>{csv+=`${cfg.year},${cfg.semester},${cfg.grade},,,"${r.pnum||''}",,진로탐색활동,"${activity||''}","${r.text.replace(/"/g,'""')}"\n`;});
  }else{
    csv='학년,반,번호,특기사항\n';
    results.forEach(r=>{csv+=`${cfg.grade},,"${r.studentId}","${r.text.replace(/"/g,'""')}"\n`;});
  }
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='생활기록부_'+new Date().toLocaleDateString('ko-KR').replace(/\.\s*/g,'-').replace(/-$/,'')+'.csv';
  a.click();URL.revokeObjectURL(url);
  showToast('다운로드 시작!');
}

// ── 유틸 ──
function calcBytes(s){let b=0;for(let i=0;i<s.length;i++)b+=s.charCodeAt(i)>127?3:1;return b;}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function updateCount(inputId,countId){
  const el=document.getElementById(inputId);
  const cl=document.getElementById(countId);
  if(!el||!cl)return;
  const n=el.value.split('\n').filter(l=>l.match(/^\[[^\]]+\]/)).length;
  cl.textContent=n+'개';
}
function clearAll(){
  if(!confirm('모든 데이터를 초기화할까요? 되돌릴 수 없어요!'))return;
  Object.keys(localStorage).filter(k=>k.startsWith('sgb_')).forEach(k=>localStorage.removeItem(k));
  showToast('초기화됐어요!');
  setTimeout(()=>location.reload(),800);
}

// ── 초기화 ──
window.onload=()=>{
  loadSetting();
  loadClasses();
  const subjects=S.get('se-subjects',[]);
  if(subjects.length){activeSeSubject=subjects[0];renderSeSubjects();}
  renderChPanel('자율');
};
