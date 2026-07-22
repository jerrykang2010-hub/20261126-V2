/* ========================================================
   DECORATIVE GINGKO LEAF (original inline SVG)
   ======================================================== */
function gingkoSVG(size, color){
  return `<span class="leaf"><svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none">
    <path d="M20 4 C10 8 4 16 6 26 C7.5 33 14 37 20 37 C26 37 32.5 33 34 26 C36 16 30 8 20 4 Z M20 4 L20 12"
      stroke="${color}" stroke-width="2" fill="${color}" fill-opacity="0.85" stroke-linejoin="round"/>
    <path d="M20 14 L20 34 M20 20 L14 26 M20 20 L26 26" stroke="${color}" stroke-width="1.2" opacity="0.5"/>
  </svg></span>`;
}
const mapIconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`;
const checkIconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="#F1CD82" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

/* ========================================================
   CATEGORY MAP
   ======================================================== */
const CAT = {
  transport:{label:'交通', icon:'🚃', color:'var(--cat-transport)'},
  sight:{label:'景點', icon:'🍁', color:'var(--cat-sight)'},
  food:{label:'餐飲', icon:'🍜', color:'var(--cat-food)'},
  shop:{label:'購物', icon:'🛍️', color:'var(--cat-shop)'},
  rest:{label:'休息', icon:'☕', color:'var(--cat-rest)'}
};

/* ========================================================
   DATA LOADING (fetch external JSON files)
   ======================================================== */
let CONFIG = null, DAYS = null, BUDGET_DEFAULT = null, NOTES = null, BACKUP = null, TODO_DEFAULT = null;

async function loadAllData(){
  const [config, days, budget, notes, backup, todo] = await Promise.all([
    fetch('data/config.json').then(r=>r.json()),
    fetch('data/itinerary.json').then(r=>r.json()),
    fetch('data/budget.json').then(r=>r.json()),
    fetch('data/notes.json').then(r=>r.json()),
    fetch('data/backup.json').then(r=>r.json()),
    fetch('data/todo-default.json').then(r=>r.json()),
  ]);
  CONFIG = config; DAYS = days; BUDGET_DEFAULT = budget; NOTES = notes; BACKUP = backup; TODO_DEFAULT = todo;
}

function applyConfigToLockAndHeader(){
  document.getElementById('lockLeaves').innerHTML =
    gingkoSVG(26,'#D9A441') + gingkoSVG(34,'#7A2E1F') + gingkoSVG(26,'#D9A441');
  document.getElementById('lockEyebrow').textContent = CONFIG.tripEyebrowLock;
  document.getElementById('lockTitle').innerHTML = CONFIG.tripTitleLock;
  document.getElementById('lockHint').textContent = CONFIG.tripHint;
  document.getElementById('headerEyebrow').textContent = CONFIG.headerEyebrow;
  document.getElementById('headerTitle').textContent = CONFIG.headerTitle;
  document.getElementById('headerDates').textContent = CONFIG.headerDates;
}

/* ========================================================
   HELPERS
   ======================================================== */
function mapUrl(q){ return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }
function yen(n){ return '¥' + Number(n||0).toLocaleString('en-US'); }
function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ========================================================
   RENDER: DAY SELECTOR + TIMELINE
   ======================================================== */
let currentDay = 0;

function renderDaySelector(){
  const wrap = document.getElementById('daySelector');
  wrap.innerHTML = DAYS.map((d,i)=>`
    <button class="day-btn ${i===currentDay?'active':''}" data-i="${i}">
      <span class="dnum">${d.day}</span>
      <span class="dlabel">DAY</span>
      <span class="ddate">${d.date}</span>
    </button>`).join('');
  wrap.querySelectorAll('.day-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{ currentDay = parseInt(btn.dataset.i); renderDay(); });
  });
}

function renderDay(){
  renderDaySelector();
  const d = DAYS[currentDay];
  document.getElementById('dayThemeWrap').innerHTML = `
    <div class="day-theme-card">
      <div class="day-theme-eyebrow">DAY ${d.day} · ${d.date}（${d.weekday}）</div>
      <div class="day-theme-title">${d.theme}</div>
    </div>`;
  document.getElementById('dayTimeline').innerHTML = d.items.map(it=>{
    const c = CAT[it.cat];
    return `
    <div class="tl-item">
      <div class="tl-dot"></div>
      <div class="card">
        <div class="card-top">
          <div class="card-time">${it.t}</div>
          <span class="cat-chip" style="background:${c.color}">${c.icon} ${c.label}</span>
        </div>
        <div class="card-title">${it.title}</div>
        ${it.detail?`<div class="card-detail">${it.detail}</div>`:''}
        <a class="map-btn" href="${mapUrl(it.map)}" target="_blank" rel="noopener">${mapIconSVG} 在 Google 地圖開啟</a>
      </div>
    </div>`;
  }).join('');
}

/* ========================================================
   RENDER: BUDGET  (estimates from data/budget.json,
   actuals editable + persisted in localStorage,
   exportable/importable as JSON file)
   ======================================================== */
function loadBudgetState(){
  const savedRows = localStorage.getItem('tokyo_budget_rows');
  const actuals = JSON.parse(localStorage.getItem('tokyo_budget_actuals')||'{}');
  const rows = savedRows ? JSON.parse(savedRows) : BUDGET_DEFAULT.map(r=>({...r}));
  return {rows, actuals};
}
function saveBudgetState(rows, actuals){
  localStorage.setItem('tokyo_budget_rows', JSON.stringify(rows));
  localStorage.setItem('tokyo_budget_actuals', JSON.stringify(actuals));
}
let BUDGET_STATE;

function renderBudget(){
  const {rows, actuals} = BUDGET_STATE;
  const wrap = document.getElementById('budgetRows');
  wrap.innerHTML = rows.map(r=>`
    <div class="budget-row" data-id="${r.id}">
      <div class="budget-row-top">
        <div class="budget-cat">${r.cat}</div>
        <div class="budget-est">預估 ${yen(r.est)}</div>
      </div>
      ${r.detail?`<div class="budget-detail">${r.detail}</div>`:''}
      <div class="budget-actual-wrap">
        <label>實際花費</label>
        <input type="number" inputmode="numeric" placeholder="0" value="${actuals[r.id]??''}" data-id="${r.id}">
        <button class="budget-remove" data-remove="${r.id}">✕</button>
      </div>
    </div>`).join('');

  wrap.querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      actuals[inp.dataset.id] = inp.value===''? '' : Number(inp.value);
      saveBudgetState(rows, actuals);
      updateBudgetTotals();
    });
  });
  wrap.querySelectorAll('[data-remove]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.remove;
      BUDGET_STATE.rows = rows.filter(r=>r.id!==id);
      delete actuals[id];
      saveBudgetState(BUDGET_STATE.rows, actuals);
      renderBudget();
    });
  });
  updateBudgetTotals();
}
function updateBudgetTotals(){
  const {rows, actuals} = BUDGET_STATE;
  const est = rows.reduce((s,r)=>s+Number(r.est||0),0);
  const act = rows.reduce((s,r)=>s+Number(actuals[r.id]||0),0);
  document.getElementById('estTotal').textContent = yen(est);
  document.getElementById('actTotal').textContent = yen(act);
}

function wireBudgetIO(){
  document.getElementById('addBudgetRow').addEventListener('click', ()=>{
    const name = prompt('新增花費項目名稱：', '其他雜支');
    if(!name) return;
    const id = 'custom_'+Date.now();
    BUDGET_STATE.rows.push({id, cat:name, est:0, detail:''});
    saveBudgetState(BUDGET_STATE.rows, BUDGET_STATE.actuals);
    renderBudget();
  });
  document.getElementById('exportBudget').addEventListener('click', ()=>{
    downloadJSON({rows:BUDGET_STATE.rows, actuals:BUDGET_STATE.actuals}, 'my-budget.json');
  });
  document.getElementById('importBudgetFile').addEventListener('change', (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        if(!data.rows || !data.actuals) throw new Error('格式不正確');
        BUDGET_STATE = {rows:data.rows, actuals:data.actuals};
        saveBudgetState(BUDGET_STATE.rows, BUDGET_STATE.actuals);
        renderBudget();
        alert('花費資料已匯入！');
      }catch(err){ alert('匯入失敗，請確認是先前匯出的 JSON 檔'); }
      e.target.value = '';
    };
    reader.readAsText(file);
  });
}

/* ========================================================
   RENDER: NOTES  (from data/notes.json)
   ======================================================== */
function renderNotes(){
  document.getElementById('notesWrap').innerHTML = NOTES.map(block => `
    <div class="note-block">
      <h3>${block.icon} ${block.title}</h3>
      <ul>${block.items.map(it=>`<li>${it}</li>`).join('')}</ul>
    </div>`).join('');
}

/* ========================================================
   RENDER: BACKUP  (from data/backup.json)
   ======================================================== */
function renderBackup(){
  document.getElementById('backupWrap').innerHTML = BACKUP.map(b=>`
    <div class="backup-card">
      <span class="backup-tag">${b.tag}</span>
      <h3>${b.title}</h3>
      <p>${b.body}</p>
      <div class="backup-transit">${b.transit}</div>
      <a class="map-btn" href="${mapUrl(b.map)}" target="_blank" rel="noopener">${mapIconSVG} 在 Google 地圖開啟</a>
    </div>`).join('');
}

/* ========================================================
   RENDER: TODO  (editable, persisted in localStorage,
   exportable/importable as JSON file)
   ======================================================== */
function loadTodos(){
  const saved = localStorage.getItem('tokyo_todos');
  return saved ? JSON.parse(saved) : TODO_DEFAULT.map((t,i)=>({id:'d'+i, text:t, done:false}));
}
function saveTodos(list){ localStorage.setItem('tokyo_todos', JSON.stringify(list)); }
let TODOS;

function renderTodo(){
  const wrap = document.getElementById('todoList');
  if(TODOS.length===0){ wrap.innerHTML = '<div class="todo-empty">目前沒有待辦事項 🍃</div>'; return; }
  wrap.innerHTML = TODOS.map(t=>`
    <div class="todo-item" data-id="${t.id}">
      <button class="todo-check ${t.done?'checked':''}" data-toggle="${t.id}">${checkIconSVG}</button>
      <div class="todo-text ${t.done?'done':''}">${t.text}</div>
      <button class="todo-del" data-del="${t.id}">✕</button>
    </div>`).join('');
  wrap.querySelectorAll('[data-toggle]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const item = TODOS.find(x=>x.id===b.dataset.toggle);
      item.done = !item.done;
      saveTodos(TODOS); renderTodo();
    });
  });
  wrap.querySelectorAll('[data-del]').forEach(b=>{
    b.addEventListener('click', ()=>{
      TODOS = TODOS.filter(x=>x.id!==b.dataset.del);
      saveTodos(TODOS); renderTodo();
    });
  });
}
function addTodo(){
  const inp = document.getElementById('todoInput');
  const val = inp.value.trim();
  if(!val) return;
  TODOS.push({id:'t'+Date.now(), text:val, done:false});
  saveTodos(TODOS); inp.value=''; renderTodo();
}
function wireTodoIO(){
  document.getElementById('todoAddBtn').addEventListener('click', addTodo);
  document.getElementById('todoInput').addEventListener('keydown', e=>{ if(e.key==='Enter') addTodo(); });
  document.getElementById('exportTodo').addEventListener('click', ()=>{
    downloadJSON(TODOS, 'my-todo.json');
  });
  document.getElementById('importTodoFile').addEventListener('change', (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        if(!Array.isArray(data)) throw new Error('格式不正確');
        TODOS = data;
        saveTodos(TODOS);
        renderTodo();
        alert('待辦事項已匯入！');
      }catch(err){ alert('匯入失敗，請確認是先前匯出的 JSON 檔'); }
      e.target.value = '';
    };
    reader.readAsText(file);
  });
}

/* ========================================================
   TAB SWITCHING
   ======================================================== */
function wireTabs(){
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      document.getElementById('panel-'+btn.dataset.panel).classList.add('active');
      window.scrollTo({top:0, behavior:'instant'});
    });
  });
}

/* ========================================================
   PASSWORD LOCK
   ======================================================== */
function tryUnlock(){
  const val = document.getElementById('pwInput').value;
  if(val === CONFIG.password){
    sessionStorage.setItem('tokyo_unlocked','1');
    document.getElementById('lockScreen').style.display='none';
    document.getElementById('app').classList.add('unlocked');
    document.getElementById('bottomNav').style.display='flex';
    initApp();
  } else {
    document.getElementById('lockError').textContent = '密碼錯誤，請再試一次';
    const card = document.querySelector('.lock-card');
    card.style.animation='none'; void card.offsetWidth; card.style.animation='shake .4s';
  }
}

const styleShake = document.createElement('style');
styleShake.textContent = `@keyframes shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(8px);}60%{transform:translateX(-6px);}80%{transform:translateX(6px);}}`;
document.head.appendChild(styleShake);

/* ========================================================
   INIT
   ======================================================== */
function initApp(){
  BUDGET_STATE = loadBudgetState();
  TODOS = loadTodos();
  renderDay();
  renderBudget();
  renderNotes();
  renderBackup();
  renderTodo();
  wireBudgetIO();
  wireTodoIO();
}

(async function boot(){
  try{
    await loadAllData();
  }catch(err){
    document.getElementById('loadingMsg').style.display='none';
    const e = document.getElementById('loadErr');
    e.classList.add('show');
    e.querySelector('p').textContent =
      '資料檔案載入失敗。這個網頁需要透過網頁伺服器開啟（例如 GitHub Pages），不能用「直接雙擊開啟 HTML 檔」的方式，瀏覽器會擋掉本機的 fetch 讀取。請將整個資料夾部署到 GitHub Pages 後再開啟。';
    console.error(err);
    return;
  }
  document.getElementById('loadingMsg').style.display='none';
  applyConfigToLockAndHeader();
  wireTabs();
  document.getElementById('unlockBtn').addEventListener('click', tryUnlock);
  document.getElementById('pwInput').addEventListener('keydown', e=>{ if(e.key==='Enter') tryUnlock(); });

  if(sessionStorage.getItem('tokyo_unlocked')==='1'){
    document.getElementById('lockScreen').style.display='none';
    document.getElementById('app').classList.add('unlocked');
    document.getElementById('bottomNav').style.display='flex';
    initApp();
  } else {
    document.getElementById('lockScreen').style.display='flex';
  }
})();
