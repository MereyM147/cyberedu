
(function(){
const STORAGE_KEY = 'cyberedu_v3_public_ready';
const modalRoot = document.getElementById('modalRoot');
const app = document.getElementById('app');
const headerActions = document.getElementById('headerActions');

const config = window.CYBEREDU_CONFIG || {
  mode: 'demo',
  firebase: { enabled:false },
  ai: { enabled:false, endpoint:'', apiKey:'' }
};

const engineCatalog = {
  maze: { name:'Code Maze', icon:'🧭', topic:'Python / Алгоритм', difficulty:['Бастапқы','Орта','Жоғары'] },
  packet: { name:'Packet Defender', icon:'📡', topic:'Желі', difficulty:['Бастапқы','Орта','Жоғары'] },
  phishing: { name:'Phishing Hunter', icon:'✉️', topic:'Киберқауіпсіздік', difficulty:['Бастапқы','Орта','Жоғары'] },
  logic: { name:'Logic Forge', icon:'🧠', topic:'Логика', difficulty:['Бастапқы','Орта','Жоғары'] },
  sql: { name:'SQL Shield', icon:'🛡️', topic:'Деректер қауіпсіздігі', difficulty:['Бастапқы','Орта','Жоғары'] }
};

const missionThemes = [
  { topic:'Алгоритмдеу', templates:['Лабиринттен шығу','Маршрутты қысқарту','Кілт жинау','Қақпаны айналып өту']},
  { topic:'Python негіздері', templates:['Команда тізбегі','Функциямен басқару','Айнымалыны қолдану','Қайталау блогы']},
  { topic:'Циклдер', templates:['repeat циклі','while күзетші','Қадам санын басқару','Қайталау арқылы жинау']},
  { topic:'Шарт операторлары', templates:['if арқылы таңдау','Қауіп болса бұрылу','Екі есік логикасы','Түс бойынша сүзу']},
  { topic:'Киберқауіпсіздік', templates:['Фишингті тану','Қауіпті сілтемені тоқтату','Хаттарды сүзу','Қауіп деңгейін анықтау']},
  { topic:'Желі және пакеттер', templates:['Пакет маршруты','Gateway таңдау','Firewall айналып өту','Қауіпсіз арна']},
  { topic:'SQL қауіпсіздігі', templates:['Prepared statement','Input validation','Error handling','Sanitization']},
  { topic:'Debug', templates:['Қате кодты түзету','Артық команданы алу','Маршрутты оңтайландыру','Қате айнымалыны табу']},
  { topic:'Логика', templates:['AND/OR қақпасы','Логикалық тізбек','True/False ядросы','Сигналдарды сәйкестендіру']},
  { topic:'Фишингтен қорғану', templates:['Хатқа сенбеу','URL тексеру','Сенімді домен','Қос факторды таңдау']}
];

function uid(prefix='id'){ return `${prefix}_${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`; }
function clone(v){ return JSON.parse(JSON.stringify(v)); }
function escapeHtml(str){ return (str||'').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s])); }
function toast(msg){
  const el = document.createElement('div');
  el.className='toast';
  el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 2600);
}
function pct(n,d){ return d ? Math.round((n/d)*100) : 0; }

function seedMissions(){
  const list = [];
  let count = 1;
  missionThemes.forEach((block, blockIndex)=>{
    block.templates.forEach((template, i)=>{
      const engines = ['maze','packet','phishing','logic','sql'];
      const engine = engines[(blockIndex + i) % engines.length];
      const difficulty = ['Бастапқы','Орта','Жоғары'][(blockIndex + i) % 3];
      list.push({
        id:`mission_${count}`,
        title:`${template} ${count}`,
        topic:block.topic,
        difficulty,
        engine,
        grade:[7,8,9][count % 3],
        duration: [12,15,18,20][count % 4],
        points: [80,90,100,110][count % 4],
        objective:`${block.topic} тақырыбы бойынша ойын ішіндегі сценарийді орындап, ${template.toLowerCase()} міндетін аяқтау.`,
        scenario:`Оқушы интерактивті картада кейіпкерді басқарып, деңгей ережесіне сай шешім қабылдайды. ${difficulty} деңгейі үшін тапсырмалар саны мен кедергілер өзгереді.`,
        winRule: engine === 'maze'
          ? 'Кілттерді жинап, порталға жету керек.'
          : engine === 'packet'
          ? 'Пакетті қауіпсіз gateway арқылы серверге жеткізу керек.'
          : engine === 'phishing'
          ? 'Кемінде 80% қауіпті хатты дәл анықтау керек.'
          : engine === 'logic'
          ? 'Барлық логикалық түйіндерді дұрыс күйге келтіру керек.'
          : 'Қорғаныс стратегиясын толық дұрыс таңдау керек.',
        createdBy:'system',
        editable:true
      });
      count++;
    });
  });
  while(list.length < 52){
    list.push({
      id:`mission_${count}`,
      title:`Cyber Mission ${count}`,
      topic:['Алгоритмдеу','Киберқауіпсіздік','Python негіздері','Желі және пакеттер'][count % 4],
      difficulty:['Бастапқы','Орта','Жоғары'][count % 3],
      engine:['maze','packet','phishing','logic','sql'][count % 5],
      grade:[7,8,9][count % 3],
      duration:[10,12,15,20][count % 4],
      points:[70,80,90,100][count % 4],
      objective:'Интерактивті киберойын сценарийін аяқтау.',
      scenario:'Мұғалім қажетіне қарай өзгерте алатын авторлық миссия.',
      winRule:'Берілген механика ережесін сақтап миссияны аяқтау.',
      createdBy:'system',
      editable:true
    });
    count++;
  }
  return list;
}



function seedDemoCohort(teacherId, classA, classB){
  const names = ['Аружан','Нұрасыл','Динара','Ерсұлтан','Айша','Дәулет','Қазына','Ұлнұр','Нұрсая','Қымбат','Каусар','Рахия','Айкерім','Румиса','Серік','Жанерке','Алихан','Бекзат','Мадина','Санжар','Әмина','Томирис','Нұрдәулет','Аяулым','Ерасыл','Мерей','Әли','Асылым','Дамир','Сезім','Алима','Еркеназ','Нұрбек','Жансая','Әділет','Мирас','Назерке','Ислам','Аяла','Нұрай','Раяна','Азамат','Саят','Диас','Арман','Аружан Б.','Елнұр','Айзере','Мұхаммед','Іңкәр','Әлия','Жасұлан','Сұлтан','Маржан','Әсел','Наргиз','Аян','Расул'];
  const students = names.slice(0,58).map((name, i)=>({
    id:`demo_student_${String(i+1).padStart(2,'0')}`,
    role:'student',
    name,
    email:`student${String(i+1).padStart(2,'0')}@cyberedu.kz`,
    password:'123456',
    school:'Б. Момышұлы атындағы №22 ЖОББМ',
    gradeFocus: i < 29 ? '7A эксперименттік топ' : '7B бақылау тобы'
  }));
  const classStudentsA = students.slice(0,29).map(s=>s.id);
  const classStudentsB = students.slice(29,58).map(s=>s.id);
  return { students, classStudentsA, classStudentsB };
}

function seedDemoResults(missions, classA, classB){
  const results = [];
  const dates = ['2026-04-08','2026-04-15','2026-04-22','2026-04-29','2026-05-06','2026-05-13'];
  const expMissions = [missions[0], missions[5], missions[10], missions[17], missions[24], missions[31]];
  const ctrlMissions = [missions[1], missions[6], missions[11], missions[18], missions[25], missions[32]];
  const expMeans = [60.8, 64.1, 68.5, 72.4, 75.9, 78.6];
  const ctrlMeans = [61.4, 62.6, 64.0, 65.3, 66.7, 68.2];
  const platformPlan = [
    'CyberEdu + CodeCombat',
    'CodeCombat',
    'CodeCombat + CyberEdu',
    'CyberEdu',
    'CyberEdu сценарийлері',
    'CyberEdu + CodeCombat'
  ];
  function push(studentId, classId, mission, score, idx, week){
    const success = score >= 70;
    results.push({
      id:`demo_result_${studentId}_${mission.id}_${week}`,
      assignmentId:`demo_assign_${mission.id}_${classId}`,
      classId,
      missionId: mission.id,
      studentId,
      platform: platformPlan[week],
      score,
      steps: Math.max(7, 28 - Math.round(score/6) + (idx%4)),
      keysCollected: score >= 70 ? (mission.difficulty === 'Жоғары' ? 3 : mission.difficulty === 'Орта' ? 2 : 1) : Math.max(0, (idx%2)),
      totalKeys: mission.difficulty === 'Жоғары' ? 3 : mission.difficulty === 'Орта' ? 2 : 1,
      success,
      createdAt: `${dates[week]}T10:${String((idx*3)%60).padStart(2,'0')}:00.000Z`,
      group: classId === classA ? 'Эксперименттік топ' : 'Бақылау тобы'
    });
  }
  for(let i=1;i<=58;i++){
    const sid = `demo_student_${String(i).padStart(2,'0')}`;
    const isExp = i <= 29;
    const classId = isExp ? classA : classB;
    const mset = isExp ? expMissions : ctrlMissions;
    const means = isExp ? expMeans : ctrlMeans;
    mset.forEach((m, week)=>{
      const variance = ((i*7 + week*5) % 9) - 4; // -4...+4, орташа мән сақталады
      const score = Math.max(45, Math.min(95, Math.round(means[week] + variance)));
      push(sid, classId, m, score, i, week);
    });
  }
  return results;
}

function researchSummary(){
  return {
    school:'Б. Момышұлы атындағы №22 жалпы орта білім беретін мектеп',
    participants:58,
    experimentalN:29,
    controlN:29,
    controlPre:61.4,
    controlPost:68.2,
    experimentalPre:60.8,
    experimentalPost:78.6,
    betweenDifference:10.4,
    tBetween:'t(56)=3,81; p<0,001',
    cohensD:1.00,
    controlPaired:'t(28)=4,41; d=0,82',
    experimentalPaired:'t(28)=13,31; d=2,47',
    cronbach:0.85,
    platforms:'CyberEdu, CodeCombat және CyberEdu киберқауіпсіздік сценарийлері'
  };
}

function initialState(){
  const missions = seedMissions();
  const classA = 'demo_class_experiment';
  const classB = 'demo_class_control';
  const teacherId = 'demo_teacher_main';
  const studentId = 'demo_student_01';
  const demo = seedDemoCohort(teacherId, classA, classB);
  const demoResults = seedDemoResults(missions, classA, classB);
  const classAssignments = [];
  [missions[0], missions[5], missions[10], missions[17]].forEach((m, idx)=>{
    classAssignments.push({
      id: uid('assign'),
      classId: idx % 2 ? classB : classA,
      missionId: m.id,
      dueDate: `2026-05-${String(10+idx).padStart(2,'0')}`,
      note: 'Оқушы ойын арқылы орындап, нәтиже автоматты түрде тіркеледі.',
      active: true
    });
  });
  return {
    ui: { screen:'landing', auth:'login', authRole:'teacher', dashboard:'overview', libraryFilter:'Барлығы', difficultyFilter:'Барлығы', search:'', selectedClassId:'', currentGameMissionId:null },
    currentUserId:null,
    users:[
      { id:teacherId, role:'teacher', name:'Mukhan Merey', email:'teacher@cyberedu.kz', password:'123456', school:'Ы. Алтынсарин мектебі', gradeFocus:'7-9 сынып' },
      ...demo.students
    ],
    classes:[
      { id:classA, name:'7A Cyber Lab — эксперименттік топ', grade:'7-сынып', code:'CYB7A', teacherId, students:demo.classStudentsA, description:'Киберойын арқылы алгоритмдеу, Python және киберқауіпсіздік тақырыптарын меңгеру тобы' },
      { id:classB, name:'7B Secure Code — бақылау тобы', grade:'7-сынып', code:'CYB7B', teacherId, students:demo.classStudentsB, description:'Дәстүрлі тапсырмалармен салыстыруға арналған бақылау тобы' }
    ],
    missions,
    assignments: classAssignments,
    results:demoResults,
    assistant:[
      { role:'bot', content:'Сәлем! Мен CyberEdu ЖИ көмекші. Мен сабақ тақырыбына сай миссия сценарийін, бағалау критерийін, деңгейге бөлу жоспарын және қысқа түсіндіруді ұсына аламын.'}
    ]
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : initialState();
  }catch(e){
    return initialState();
  }
}
let db = loadState();
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  if(window.CyberEduCloud && window.CyberEduCloud.enabled){
    window.CyberEduCloud.saveState(db).catch(()=>{});
  }
}

function currentUser(){ return db.users.find(u=>u.id===db.currentUserId) || null; }
function teacherClasses(teacherId){ return db.classes.filter(c=>c.teacherId===teacherId); }
function studentClasses(studentId){ return db.classes.filter(c=>c.students.includes(studentId)); }
function classAssignments(classId){ return db.assignments.filter(a=>a.classId===classId && a.active); }
function getMission(id){ return db.missions.find(m=>m.id===id); }
function getClass(id){ return db.classes.find(c=>c.id===id); }

function renderHeader(){
  const user = currentUser();
  if(!user){
    headerActions.innerHTML = db.ui.screen === 'auth' ? `
      <button class="btn btn-secondary btn-pill" data-action="logout">Басты бет</button>
      <button class="btn btn-ghost btn-pill" data-action="demo-teacher">Демо</button>
    ` : `
      <button class="btn btn-primary btn-pill" data-action="go-login">Кіру</button>
      <button class="btn btn-ghost btn-pill" data-action="demo-teacher">Демо</button>
    `;
  }else{
    headerActions.innerHTML = `
      <span class="pill">${user.role === 'teacher' ? 'Мұғалім аккаунты' : 'Оқушы аккаунты'}</span>
      <button class="btn btn-secondary btn-pill" data-action="go-dashboard">Панель</button>
      <button class="btn btn-ghost btn-pill" data-action="logout">Шығу</button>
    `;
  }
}

function render(){
  renderHeader();
  const user = currentUser();
  if(!user){
    if(db.ui.screen === 'auth') renderAuth();
    else renderLanding();
  }else{
    renderDashboard(user);
  }
  bindGlobalEvents();
}

function renderLanding(){
  app.innerHTML = `
    <section class="landing-grid public-landing">
      <article class="panel glass hero-copy">
        <div class="pill">Информатика · киберойын · жасанды интеллект</div>
        <h2>Киберойын арқылы информатиканы үйрену</h2>
        <p>
          CyberEdu — алгоритмдеу, Python және киберқауіпсіздік тақырыптарын ойын миссиялары арқылы меңгеруге арналған оқу платформасы.
          Мұғалім тапсырма береді, оқушы интерактивті ортада шешім қабылдайды, нәтиже автоматты түрде аналитикаға түседі.
        </p>
        <div class="feature-grid clean-features">
          <div class="feature-card">
            <h3>Ойын миссиялары</h3>
            <p>CodeCombat стиліндегі карта, командалар, деңгейлер және киберқауіпсіздік жағдайлары.</p>
          </div>
          <div class="feature-card">
            <h3>ЖИ көмекші</h3>
            <p>Сабақ сценарийін, hint, бағалау критерийін және рефлексия сұрақтарын ұсынады.</p>
          </div>
          <div class="feature-card">
            <h3>Оқу аналитикасы</h3>
            <p>Мұғалім панелінде сынып, тапсырма және прогресс бойынша нәтиже көрсетіледі.</p>
          </div>
        </div>
      </article>

      <aside class="panel glass hero-stage public-stage">
        <div class="stage-shell">
          <div class="orbit orbit-a"></div>
          <div class="orbit orbit-b"></div>
          <div class="holo-card">
            <div class="stage-top">
              <div>
                <div class="pill">Game preview</div>
                <h3 style="margin:12px 0 0;font-size:30px;">Cyber Maze</h3>
              </div>
              <div class="legend">
                <span><i style="background:#ff9f43"></i>Агент</span>
                <span><i style="background:#67e8f9"></i>Кілт</span>
                <span><i style="background:#ffd76b"></i>Портал</span>
                <span><i style="background:#ff6b6b"></i>Қауіп</span>
              </div>
            </div>

            <div class="map-mini">
              ${Array.from({length:25}, (_,i)=>{
                const classes = i===0?'mini-tile agent':i===7||i===16?'mini-tile key':i===24?'mini-tile goal':i===12||i===18?'mini-tile fire':'mini-tile';
                return `<div class="${classes}"></div>`;
              }).join('')}
            </div>

            <div class="console compact-console">
              <div>moveRight()</div>
              <div>repeat(2){ moveDown() }</div>
              <div>collectKey()</div>
              <div>enterPortal()</div>
            </div>
          </div>
        </div>
      </aside>
    </section>
  `;
}

function renderAuth(){
  const isLogin = db.ui.auth === 'login';
  const role = db.ui.authRole || 'teacher';
  const isTeacher = role === 'teacher';
  app.innerHTML = `
    <section class="auth-shell clean-auth">
      <article class="glass auth-side compact-auth-info">
        <div class="pill">CyberEdu access</div>
        <h2>${isTeacher ? 'Мұғалім кабинеті' : 'Оқушы кабинеті'}</h2>
        <p>${isTeacher
          ? 'Мұғалім сынып құрады, оқушыларға қосылу кодын береді және нәтижені аналитикадан көреді.'
          : 'Оқушы мұғалім берген код арқылы сыныпқа қосылып, ойын миссияларын орындайды.'}</p>

        <div class="role-switch">
          <button class="role-btn ${isTeacher?'active':''}" data-action="auth-role" data-role="teacher">Мұғалім</button>
          <button class="role-btn ${!isTeacher?'active':''}" data-action="auth-role" data-role="student">Оқушы</button>
        </div>

        <div class="auth-mini-note">
          ${isTeacher ? 'Тіркелген соң жүйе автоматты түрде сынып кодын жасайды.' : 'Кодты мұғалім өз кабинетіндегі сынып карточкасынан береді.'}
        </div>

        <div class="auth-nav-row">
          <button class="btn btn-ghost btn-sm" data-action="go-home">← Артқа</button>
          <button class="btn btn-secondary btn-sm" data-action="demo-${isTeacher?'teacher':'student'}">Демо көру</button>
        </div>
      </article>

      <article class="glass auth-form clean-auth-form">
        <div class="pill">${isLogin ? 'Кіру' : 'Тіркелу'}</div>
        <h2>${isLogin ? (isTeacher ? 'Мұғалім болып кіру' : 'Оқушы болып кіру') : (isTeacher ? 'Мұғалім тіркелуі' : 'Оқушы тіркелуі')}</h2>
        <form id="authForm">
          <input type="hidden" name="role" value="${role}" />
          ${!isLogin ? `
            <div class="field">
              <label>Аты-жөні</label>
              <input class="input" name="name" placeholder="Аты-жөніңіз" required />
            </div>
            ${isTeacher ? `
              <div class="field">
                <label>Мектеп атауы</label>
                <input class="input" name="school" placeholder="Мысалы: №22 жалпы орта білім беретін мектеп" required />
              </div>` : `
              <div class="field">
                <label>Мұғалім берген код</label>
                <input class="input code-input" name="joinCode" placeholder="Мысалы: CYB7A" required />
              </div>`}
          ` : ''}
          <div class="field">
            <label>Email</label>
            <input class="input" type="email" name="email" placeholder="name@cyberedu.kz" required />
          </div>
          <div class="field">
            <label>Құпиясөз</label>
            <input class="input" type="password" name="password" placeholder="******" required />
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%">${isLogin ? 'Кіру' : 'Тіркелу'}</button>
        </form>
        ${isLogin ? `
          <button class="btn btn-secondary auth-main-switch" data-action="switch-register">Тіркелу</button>
          <div class="auth-help-line">Аккаунтыңыз жоқ па? Мұғалім немесе оқушы ретінде тіркеліңіз.</div>
        ` : `
          <button class="btn btn-secondary auth-main-switch" data-action="switch-login">Кіру бетіне өту</button>
          <div class="auth-help-line">Email бұрын тіркелген болса, тіркелмей кіру бетіне өтіңіз.</div>
        `}
      </article>
    </section>
  `;
}

function renderDashboard(user){
  const tabs = user.role === 'teacher'
    ? [
        ['overview','Басты панель'],
        ['library','Миссия кітапханасы'],
        ['builder','Миссия құрастыру'],
        ['classes','Сыныптар'],
        ['analytics','Аналитика'],
        ['assistant','ЖИ көмекші'],
      ]
    : [
        ['overview','Менің панелім'],
        ['assignments','Миссиялар'],
        ['progress','Прогресс'],
        ['assistant','ЖИ көмекші'],
      ];

  app.innerHTML = `
    <section class="dashboard">
      <aside class="sidebar glass">
        <div class="user-card">
          <img src="assets/logo.png" alt="CyberEdu" class="sidebar-logo">
          <div>
            <strong>${escapeHtml(user.name)}</strong>
            <div class="small">${user.role === 'teacher' ? 'Мұғалім панелі' : 'Оқушы панелі'}</div>
            <div class="small">${user.role === 'teacher' ? 'CyberEdu жетекшісі' : 'CyberEdu қатысушысы'}</div>
          </div>
        </div>
        <div class="nav-list">
          ${tabs.map(([key, label])=>`
            <button class="nav-btn ${db.ui.dashboard===key?'active':''}" data-tab="${key}">${label}</button>
          `).join('')}
        </div>
        <small>
          ${user.role === 'teacher'
            ? 'Мұғалім миссияны өзгертіп, сыныпқа бекітіп, нәтижені бір жерден көре алады.'
            : 'Оқушы ойын ойнап, тапсырманы орындап, ұпайы мен ілгерілеуін бақылайды.'}
        </small>
      </aside>

      <section class="content-col">
        ${user.role === 'teacher' ? teacherView(user) : studentView(user)}
      </section>
    </section>
  `;
}

function teacherView(user){
  switch(db.ui.dashboard){
    case 'library': return teacherLibrary(user);
    case 'builder': return teacherBuilder(user);
    case 'classes': return teacherClassesView(user);
    case 'analytics': return teacherAnalytics(user);
    case 'assistant': return assistantView(user);
    default: return teacherOverview(user);
  }
}

function studentView(user){
  switch(db.ui.dashboard){
    case 'assignments': return studentAssignments(user);
    case 'progress': return studentProgress(user);
    case 'assistant': return assistantView(user);
    default: return studentOverview(user);
  }
}

function teacherOverview(user){
  const classes = teacherClasses(user.id);
  const assignments = db.assignments.filter(a=>classes.some(c=>c.id===a.classId));
  const results = db.results.filter(r=>classes.some(c=>c.id===r.classId));
  const avg = results.length ? Math.round(results.reduce((s,r)=>s+r.score,0)/results.length) : 0;
  const latest = db.missions.slice(0,6);
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Teacher command center</div>
          <h2>Мұғалімнің басқару панелі</h2>
          <p>Сыныптарды, миссияларды, тағайындауларды және ойын нәтижелерін бір жүйеде басқаруға арналған толық орта.</p>
        </div>
        <div class="legend">
          <span><i style="background:#ff9f43"></i>Orange design сақталды</span>
          <span><i style="background:#67e8f9"></i>ЖИ дайын</span>
        </div>
      </div>

      <div class="grid-4">
        <div class="stat-card"><span>Барлық миссия</span><strong>${db.missions.length}</strong></div>
        <div class="stat-card"><span>Сынып саны</span><strong>${classes.length}</strong></div>
        <div class="stat-card"><span>Белсенді бекіту</span><strong>${assignments.length}</strong></div>
        <div class="stat-card"><span>Орташа нәтиже</span><strong>${avg || 0}%</strong></div>
      </div>
    </section>

    <section class="grid-2">
      <article class="glass content-panel">
        <div class="panel-head">
          <div>
            <div class="pill">Quick library</div>
            <h2>Соңғы миссиялар</h2>
          </div>
          <button class="btn btn-secondary btn-sm" data-tab-switch="library">Толық кітапхана</button>
        </div>
        <div class="mission-list">
          ${latest.map(m=>missionCard(m, true)).join('')}
        </div>
      </article>

      <aside class="glass content-panel">
        <div class="panel-head">
          <div>
            <div class="pill">Қысқа статистика</div>
            <h2>Орындалу көрінісі</h2>
          </div>
        </div>
        <div class="bar-list">
          ${['maze','packet','phishing','logic','sql'].map(engine=>{
            const count = db.missions.filter(m=>m.engine===engine).length;
            return `<div class="bar-item">
              <div>${engineCatalog[engine].name}</div>
              <div class="bar-track"><i style="width:${pct(count,db.missions.length)}%"></i></div>
              <strong>${count}</strong>
            </div>`;
          }).join('')}
        </div>
        <div class="helper-note" style="margin-top:16px;">
          Бұл платформадағы басты артықшылық — мұғалім ойынды өзі бейімдей алады. Яғни дайын жаттығу емес,
          сабақ мақсатына сай құрастырылатын киберойын ортасы.
        </div>
      </aside>
    </section>
  `;
}

function missionCard(m, compact=false){
  const engine = engineCatalog[m.engine];
  return `
    <article class="mission-card mission-card-pro">
      <div class="mission-icon">${engine.icon}</div>
      <div class="mission-meta">
        <span class="tag engine">${engine.name}</span>
        <span class="tag">${m.difficulty}</span>
        <span class="tag">${m.grade}-сынып</span>
      </div>
      <h3>${escapeHtml(m.title)}</h3>
      <p>${escapeHtml(m.objective)}</p>
      <div class="mission-footer-line"><span>${escapeHtml(m.topic)}</span><strong>${m.points || 100} ұпай</strong></div>
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" data-action="preview-mission" data-id="${m.id}">Қарау</button>
        <button class="btn btn-primary btn-sm" data-action="clone-mission" data-id="${m.id}">Көшіру</button>
        <button class="btn btn-ghost btn-sm" data-action="use-builder" data-id="${m.id}">Өңдеу</button>
      </div>
    </article>
  `;
}

function teacherLibrary(user){
  const topicFilter = db.ui.libraryFilter || 'Барлығы';
  const diffFilter = db.ui.difficultyFilter || 'Барлығы';
  const search = (db.ui.search || '').trim().toLowerCase();

  const topics = ['Барлығы', ...Array.from(new Set(db.missions.map(m=>m.topic)))];
  const diffs = ['Барлығы','Бастапқы','Орта','Жоғары'];

  const filtered = db.missions.filter(m=>{
    return (topicFilter==='Барлығы' || m.topic===topicFilter) &&
           (diffFilter==='Барлығы' || m.difficulty===diffFilter) &&
           (!search || `${m.title} ${m.objective} ${m.topic}`.toLowerCase().includes(search));
  });

  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Миссиялар</div>
          <h2>Миссия кітапханасы</h2>
          <p>Ойын миссияларын тақырып, деңгей және қозғалтқыш бойынша таңдаңыз. Қажет миссияны көшіріп, сыныпқа бейімдеуге болады.</p>
        </div>
        <button class="btn btn-primary btn-sm" data-tab-switch="builder">Жаңа миссия құру</button>
      </div>

      <div class="mission-toolbar">
        <div class="toolbar-left">
          <select class="select" id="topicFilter">${topics.map(t=>`<option ${topicFilter===t?'selected':''}>${t}</option>`).join('')}</select>
          <select class="select" id="difficultyFilter">${diffs.map(t=>`<option ${diffFilter===t?'selected':''}>${t}</option>`).join('')}</select>
        </div>
        <div class="toolbar-right">
          <input class="input" id="searchInput" placeholder="Тапсырманы іздеу..." value="${escapeHtml(db.ui.search||'')}" />
        </div>
      </div>

      <div class="mission-list">
        ${filtered.map(m=>missionCard(m)).join('') || '<div class="empty">Сәйкес миссия табылмады.</div>'}
      </div>
    </section>
  `;
}

function teacherBuilder(user){
  const editing = db.missions.find(m=>m.id===db.ui.currentEditMissionId) || null;
  const classes = teacherClasses(user.id);
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Mission builder</div>
          <h2>Миссия құрастыру</h2>
          <p>Мұғалім ойын типін, тақырыпты, деңгейін және мәтіндік сценарийді өзгертіп, оны бірден сыныпқа бекіте алады.</p>
        </div>
      </div>

      <form id="builderForm">
        <div class="form-grid">
          <div class="field">
            <label>Миссия атауы</label>
            <input class="input" name="title" value="${escapeHtml(editing?.title || '')}" placeholder="Мысалы: Python лабиринті 1" required />
          </div>
          <div class="field">
            <label>Тақырып</label>
            <select class="select" name="topic">
              ${Array.from(new Set(db.missions.map(m=>m.topic))).map(t=>`<option ${editing?.topic===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Ойын қозғалтқышы</label>
            <select class="select" name="engine">
              ${Object.entries(engineCatalog).map(([key,val])=>`<option value="${key}" ${editing?.engine===key?'selected':''}>${val.name}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Күрделілік</label>
            <select class="select" name="difficulty">
              ${['Бастапқы','Орта','Жоғары'].map(t=>`<option ${editing?.difficulty===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Сынып</label>
            <select class="select" name="grade">
              ${[7,8,9].map(g=>`<option ${Number(editing?.grade||7)===g?'selected':''}>${g}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Ұпай</label>
            <input class="input" type="number" name="points" value="${editing?.points || 100}" />
          </div>
        </div>

        <div class="field">
          <label>Оқу мақсаты</label>
          <textarea class="textarea" name="objective" required>${escapeHtml(editing?.objective || 'Оқушы ойын арқылы оқу мақсатына жетуі керек.')}</textarea>
        </div>
        <div class="field">
          <label>Сценарий сипаттамасы</label>
          <textarea class="textarea" name="scenario" required>${escapeHtml(editing?.scenario || 'Картада агент қозғалып, киберқауіпсіздік немесе алгоритмдік міндет орындайды.')}</textarea>
        </div>
        <div class="field">
          <label>Жеңіс шарты</label>
          <textarea class="textarea" name="winRule">${escapeHtml(editing?.winRule || 'Миссияны толық аяқтау.')}</textarea>
        </div>

        <div class="demo-row">
          <button class="btn btn-primary" type="submit">${editing ? 'Миссияны сақтау' : 'Жаңа миссия қосу'}</button>
          <button class="btn btn-secondary" type="button" data-action="generate-ai-template">ЖИ көмегімен сценарий ұсыну</button>
          ${editing ? `<button class="btn btn-ghost" type="button" data-action="clear-builder">Жаңа форма</button>`:''}
        </div>
      </form>

      <div class="helper-note" style="margin-top:18px;">
        Пайдалану логикасы: мұғалім миссияны құрады → сыныпқа тағайындайды → оқушы ойнап өтеді → нәтиже автоматты түрде журналға түседі.
      </div>

      <div class="mission-toolbar" style="margin-top:18px;">
        <div class="toolbar-left">
          <select class="select" id="assignMissionSelect">
            <option value="">Миссияны сыныпқа бекіту үшін таңда</option>
            ${db.missions.slice(-20).reverse().map(m=>`<option value="${m.id}">${escapeHtml(m.title)}</option>`).join('')}
          </select>
          <select class="select" id="assignClassSelect">
            <option value="">Сынып таңда</option>
            ${classes.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
          </select>
          <input class="input" id="assignDateInput" type="date" />
        </div>
        <div class="toolbar-right">
          <button class="btn btn-secondary" data-action="assign-mission">Сыныпқа бекіту</button>
        </div>
      </div>
    </section>
  `;
}

function teacherClassesView(user){
  const classes = teacherClasses(user.id);
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Classes & join codes</div>
          <h2>Сыныптар</h2>
          <p>Жаңа сынып құру, кіру кодын шығару, бекітілген миссиялар мен оқушы құрамын көру.</p>
        </div>
      </div>

      <div class="class-grid">
        ${classes.map(c=>{
          const assigns = classAssignments(c.id);
          return `<article class="class-card">
            <div class="mission-meta">
              <span class="tag">${escapeHtml(c.grade)}</span>
              <span class="tag engine">Join code: ${escapeHtml(c.code)}</span>
            </div>
            <h3>${escapeHtml(c.name)}</h3>
            <p>${escapeHtml(c.description)}</p>
            <div class="small" style="margin-top:10px;">Оқушы саны: ${c.students.length} · Белсенді миссия: ${assigns.length}</div>
            <div class="card-actions">
              <button class="btn btn-secondary btn-sm" data-action="preview-class" data-id="${c.id}">Қарау</button>
              <button class="btn btn-ghost btn-sm" data-action="copy-code" data-code="${c.code}">Кодты көшіру</button>
            </div>
          </article>`;
        }).join('')}
      </div>

      <form id="classForm" style="margin-top:18px;">
        <div class="form-grid">
          <div class="field">
            <label>Жаңа сынып атауы</label>
            <input class="input" name="name" placeholder="Мысалы: 9A Python Squad" required />
          </div>
          <div class="field">
            <label>Сынып деңгейі</label>
            <select class="select" name="grade">
              <option>7-сынып</option>
              <option>8-сынып</option>
              <option>9-сынып</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Сипаттама</label>
          <textarea class="textarea" name="description" placeholder="Бұл сынып қандай бағытта оқиды?"></textarea>
        </div>
        <button class="btn btn-primary" type="submit">Сынып құру</button>
      </form>
    </section>
  `;
}

function analyticsDataset(user){
  const classes = teacherClasses(user.id);
  const results = db.results.filter(r=>classes.some(c=>c.id===r.classId));
  return { classes, results, synthetic:false };
}

function skillRowsFromResults(results){
  const buckets = [
    {name:'Алгоритм құру', match:['Алгоритмдеу','Логика']},
    {name:'Python командалары', match:['Python негіздері','Циклдер','Шарт операторлары','Debug']},
    {name:'Киберқауіпсіздік шешімі', match:['Киберқауіпсіздік','Фишингтен қорғану','SQL қауіпсіздігі','Желі және пакеттер']},
    {name:'Логикалық ойлау', match:['Логика','Шарт операторлары','Debug']},
    {name:'Орындау тұрақтылығы', match:['__all__']}
  ];
  return buckets.map(bucket=>{
    let rs = results.filter(r=>{
      if(bucket.match.includes('__all__')) return true;
      const m = getMission(r.missionId);
      return m && bucket.match.includes(m.topic);
    });
    if(!rs.length) return {name:bucket.name, before:0, after:0};
    const dates = [...new Set(rs.map(r=>(r.createdAt || '').slice(0,10)).filter(Boolean))].sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length-1];
    const firstItems = firstDate ? rs.filter(r=>(r.createdAt || '').startsWith(firstDate)) : rs;
    const lastItems = lastDate ? rs.filter(r=>(r.createdAt || '').startsWith(lastDate)) : rs;
    const avg = arr => arr.length ? Math.round(arr.reduce((sum,r)=>sum+(Number(r.score)||0),0)/arr.length) : 0;
    return {name:bucket.name, before:avg(firstItems), after:avg(lastItems)};
  });
}


function teacherAnalytics(user){
  const dataset = analyticsDataset(user);
  const classes = dataset.classes;
  const relevantResults = dataset.results;
  const uniqueStudents = [...new Set(classes.flatMap(c=>c.students || []))];
  const completedStudents = [...new Set(relevantResults.filter(r=>r.success || r.score>=70).map(r=>r.studentId))];
  const avgScore = relevantResults.length ? Math.round(relevantResults.reduce((s,r)=>s+r.score,0)/relevantResults.length) : 0;

  function classStats(cls){
    if(!cls) return {students:0, avg:0, success:0, first:0, last:0, progress:0};
    const rs = relevantResults.filter(r=>r.classId===cls.id);
    const studs = (cls.students || []).length;
    const avg = rs.length ? Math.round(rs.reduce((s,r)=>s+r.score,0)/rs.length) : 0;
    const good = [...new Set(rs.filter(r=>r.score>=70).map(r=>r.studentId))].length;
    const byDate = [...rs].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    const firstDate = byDate[0]?.createdAt?.slice(0,10);
    const lastDate = byDate[byDate.length-1]?.createdAt?.slice(0,10);
    const firstItems = firstDate ? rs.filter(r=>r.createdAt.startsWith(firstDate)) : [];
    const lastItems = lastDate ? rs.filter(r=>r.createdAt.startsWith(lastDate)) : [];
    const first = firstItems.length ? Math.round(firstItems.reduce((s,r)=>s+r.score,0)/firstItems.length) : 0;
    const last = lastItems.length ? Math.round(lastItems.reduce((s,r)=>s+r.score,0)/lastItems.length) : 0;
    return {students:studs, avg, success:studs ? Math.round(good/studs*100) : 0, first, last, progress:last-first};
  }
  const classRows = classes.map(c=>({ cls:c, stats:classStats(c) }));

  const missionMap = {};
  relevantResults.forEach(r=>{
    missionMap[r.missionId] = missionMap[r.missionId] || { scores:[], success:0, platform:r.platform || 'CyberEdu' };
    missionMap[r.missionId].scores.push(r.score);
    if(r.success || r.score>=70) missionMap[r.missionId].success++;
  });
  const taskRows = Object.entries(missionMap).map(([missionId, row])=>{
    const m = getMission(missionId);
    const avg = Math.round(row.scores.reduce((a,b)=>a+b,0)/row.scores.length);
    return { missionId, title:m?.title || missionId, topic:m?.topic || '-', engine:m?engineCatalog[m.engine].name:'-', platform:row.platform, avg, count:row.scores.length, success:row.success };
  }).sort((a,b)=>b.avg-a.avg);

  const skills = skillRowsFromResults(relevantResults);

  return `
    <section class="glass content-panel analytics-pro">
      <div class="panel-head">
        <div>
          <div class="pill">Learning analytics</div>
          <h2>Аналитика</h2>
          <p>Оқушылардың ойын миссияларын орындау нәтижесі, сынып динамикасы және тапсырмалар бойынша орташа ұпай.</p>
        </div>
        <div class="export-actions">
          <button class="btn btn-ghost btn-sm" data-action="refresh-analytics">Жаңарту</button>
          <button class="btn btn-secondary btn-sm" data-action="export-analytics">CSV</button>
          <button class="btn btn-primary btn-sm" data-action="export-analytics-xls">Excel</button>
        </div>
      </div>

      <div class="grid-4 analytics-kpis">
        <div class="stat-card"><span>Оқушы</span><strong>${uniqueStudents.length}</strong></div>
        <div class="stat-card"><span>Орындалған тапсырма</span><strong>${relevantResults.length}</strong></div>
        <div class="stat-card"><span>Орташа ұпай</span><strong>${avgScore}%</strong></div>
        <div class="stat-card"><span>70%+ нәтиже</span><strong>${completedStudents.length} оқушы</strong></div>
      </div>

      <div class="research-grid class-performance" style="margin-top:18px;">
        ${classRows.map(({cls,stats})=>`
          <article class="score-card class-card-pro">
            <span>${escapeHtml(cls.name)}</span>
            <strong class="big-number">${stats.students} оқушы · ${stats.avg}%</strong>
            <p class="small">Бастапқы нәтиже: ${stats.first}%. Соңғы нәтиже: ${stats.last}%. Өсім: +${stats.progress} п.п.</p>
            <div class="mini-bars"><i style="width:${stats.first}%"></i><b style="width:${stats.last}%"></b></div>
          </article>
        `).join('')}
      </div>

      <div class="analytics-card" style="margin-top:18px;">
        <div class="panel-head compact"><div><div class="pill">Skills</div><h3>Дағдылар динамикасы</h3></div></div>
        <div class="skill-chart">
          ${skills.map(sk=>`<div class="skill-row"><span>${sk.name}</span><div class="bar-stack"><i style="width:${sk.before}%"></i><b style="width:${sk.after}%"></b></div><em>${sk.before}% → ${sk.after}%</em></div>`).join('')}
        </div>
      </div>

      <div class="analytics-card task-analytics-card" style="margin-top:18px;">
        <div class="panel-head compact"><div><div class="pill">Task results</div><h3>Тапсырмалар бойынша нәтиже</h3></div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Тапсырма</th><th>Платформа</th><th>Тақырып</th><th>Орташа ұпай</th><th>Орындалуы</th><th>Баға</th></tr></thead>
            <tbody>
              ${taskRows.length ? taskRows.map(r=>`
                <tr>
                  <td>${escapeHtml(r.title)}</td>
                  <td>${escapeHtml(r.platform)}</td>
                  <td>${escapeHtml(r.topic)}</td>
                  <td><strong>${r.avg}%</strong></td>
                  <td>${r.success}/${r.count}</td>
                  <td><span class="badge ${r.avg>=80?'good':r.avg>=65?'mid':'bad'}">${r.avg>=80?'Жақсы':r.avg>=65?'Орташа':'Қолдау керек'}</span></td>
                </tr>`).join('') : '<tr><td colspan="6">Әзірге нәтиже жоқ. Оқушы миссия орындағанда осы жерде автоматты көрсетіледі.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function assistantView(user){
  const online = config.ai && config.ai.enabled && config.ai.endpoint;
  return `
    <section class="glass content-panel assistant-pro">
      <div class="panel-head">
        <div>
          <div class="pill">ЖИ ассистент</div>
          <h2>ЖИ көмекші</h2>
          <p>Сұрақ қойыңыз: сабақ жоспары, миссия идеясы, код түсіндіру, киберқауіпсіздік, бағалау немесе сайт жұмысы бойынша жауап береді.</p>
        </div>
        <span class="ai-status ${online?'online':'offline'}">${online?'OpenAI қосылған':'Жергілікті режим'}</span>
      </div>

      <section class="ai-shell ai-shell-pro">
        <article class="chat-card chat-card-main">
          <div class="chat-window chat-window-pro" id="chatWindow">
            ${db.assistant.map(msg=>`
              <div class="chat-msg ${msg.role==='user'?'user':'bot'}"><b>${msg.role==='user'?'Сіз':'CyberEdu ЖИ'}</b><br>${escapeHtml(msg.content).replace(/\n/g,'<br>')}</div>
            `).join('')}
          </div>

          <form id="assistantForm" class="assistant-form-pro">
            <textarea class="textarea" name="prompt" placeholder="Кез келген сұрақ жазыңыз: Python циклін түсіндір, фишингке тапсырма құр, 7-сыныпқа миссия дайында..."></textarea>
            <button class="btn btn-primary" type="submit">Жіберу</button>
          </form>
        </article>

        <aside class="chat-card ai-side-pro">
          <h3>Жылдам сұрақтар</h3>
          <div class="hint-list">
            ${[
              '7-сыныпқа Python цикл бойынша ойын миссиясын құр',
              'Фишинг тақырыбына 3 деңгейлі тапсырма жаса',
              'Оқушы нәтижесіне қысқа кері байланыс жаз',
              'CodeCombat стилінде киберойын сценарийін ұсын',
              'Excel аналитикасын қалай түсіндіремін?'
            ].map(text=>`<button class="hint-item" data-action="assistant-suggest" data-text="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join('')}
          </div>
          <div class="helper-note" style="margin-top:16px;">ЖИ жауабы Vercel backend арқылы OpenAI-ға жіберіледі. Кілт браузерде сақталмайды.</div>
        </aside>
      </section>
    </section>
  `;
}

function studentOverview(user){
  const classes = studentClasses(user.id);
  const assignments = db.assignments.filter(a=>classes.some(c=>c.id===a.classId));
  const results = db.results.filter(r=>r.studentId===user.id);
  const avg = results.length ? Math.round(results.reduce((s,r)=>s+r.score,0)/results.length) : 0;
  const nextMission = assignments[0] ? getMission(assignments[0].missionId) : null;
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Student mission center</div>
          <h2>Оқушы панелі</h2>
          <p>Оқушы берілген миссияларды ойнап өтеді, ұпай алады және ілгерілеуін бірден көреді.</p>
        </div>
      </div>
      <div class="grid-4">
        <div class="stat-card"><span>Белсенді миссия</span><strong>${assignments.length}</strong></div>
        <div class="stat-card"><span>Орындалған миссия</span><strong>${results.length}</strong></div>
        <div class="stat-card"><span>Орташа ұпай</span><strong>${avg}%</strong></div>
        <div class="stat-card"><span>Сынып</span><strong>${classes[0] ? escapeHtml(classes[0].grade) : '-'}</strong></div>
      </div>
      <div class="grid-2" style="margin-top:18px;">
        <article class="glass content-panel">
          <div class="pill">Келесі миссия</div>
          ${nextMission ? `
            <h2 style="margin-top:12px;">${escapeHtml(nextMission.title)}</h2>
            <p>${escapeHtml(nextMission.objective)}</p>
            <div class="card-actions">
              <button class="btn btn-primary" data-action="play-mission" data-id="${nextMission.id}" data-class="${assignments[0].classId}">Ойынды бастау</button>
            </div>` : `<div class="empty">Әзірге белсенді миссия жоқ.</div>`}
        </article>
        <aside class="glass content-panel">
          <div class="pill">Артықшылық</div>
          <p style="margin-top:16px;color:var(--muted);line-height:1.7;">
            Бұл платформада тапсырма жеке мәтін ретінде емес, ойын әрекеті ретінде беріледі: қозғалу, кілт жинау, маршрут таңдау, қауіпсіздікті қорғау, логикалық шешім қабылдау.
          </p>
        </aside>
      </div>
    </section>
  `;
}

function studentAssignments(user){
  const classes = studentClasses(user.id);
  const assignments = db.assignments.filter(a=>classes.some(c=>c.id===a.classId));
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Assigned missions</div>
          <h2>Миссиялар</h2>
          <p>Төмендегі тапсырмалар ойын түрінде орындалады. Оқушы картада ойнап, нәтижесі журналға автоматты түрде түседі.</p>
        </div>
      </div>
      <div class="assignment-grid">
        ${assignments.map(a=>{
          const m = getMission(a.missionId);
          const result = db.results.find(r=>r.assignmentId===a.id && r.studentId===user.id);
          return `<article class="assign-card">
            <div class="mission-meta">
              <span class="tag engine">${engineCatalog[m.engine].icon} ${engineCatalog[m.engine].name}</span>
              <span class="tag">${m.difficulty}</span>
              <span class="tag">${m.topic}</span>
            </div>
            <h3>${escapeHtml(m.title)}</h3>
            <p>${escapeHtml(m.objective)}</p>
            <div class="small" style="margin-top:8px;">Мерзімі: ${a.dueDate}</div>
            <div class="card-actions">
              <button class="btn btn-primary btn-sm" data-action="play-mission" data-id="${m.id}" data-class="${a.classId}" data-assignment="${a.id}">${result ? 'Қайта ойнау' : 'Ойынды бастау'}</button>
              ${result ? `<span class="badge ${result.score>=85?'good':result.score>=65?'mid':'bad'}">${result.score}%</span>` : ''}
            </div>
          </article>`;
        }).join('') || '<div class="empty">Әзірге миссия жоқ.</div>'}
      </div>
    </section>
  `;
}

function studentProgress(user){
  const results = db.results.filter(r=>r.studentId===user.id);
  return `
    <section class="glass content-panel">
      <div class="panel-head">
        <div>
          <div class="pill">Progress</div>
          <h2>Прогресс</h2>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Миссия</th><th>Ұпай</th><th>Қадам</th><th>Кілт/мақсат</th><th>Уақыты</th></tr>
          </thead>
          <tbody>
            ${results.length ? results.map(r=>{
              const m = getMission(r.missionId);
              return `<tr>
                <td>${escapeHtml(m ? m.title : r.missionId)}</td>
                <td>${r.score}%</td>
                <td>${r.steps}</td>
                <td>${r.keysCollected}/${r.totalKeys}</td>
                <td>${new Date(r.createdAt).toLocaleString('kk-KZ')}</td>
              </tr>`;
            }).join('') : '<tr><td colspan="6">Әзірге нәтиже жоқ.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function bindGlobalEvents(){
  document.querySelectorAll('[data-action]').forEach(btn=>{
    btn.onclick = handleAction;
  });
  document.querySelectorAll('[data-tab]').forEach(btn=>{
    btn.onclick = ()=>{ db.ui.dashboard = btn.dataset.tab; saveState(); render(); };
  });
  document.querySelectorAll('[data-tab-switch]').forEach(btn=>{
    btn.onclick = ()=>{ db.ui.dashboard = btn.dataset.tabSwitch; saveState(); render(); };
  });
  const authForm = document.getElementById('authForm');
  if(authForm) authForm.onsubmit = submitAuth;
  const builderForm = document.getElementById('builderForm');
  if(builderForm) builderForm.onsubmit = submitBuilder;
  const classForm = document.getElementById('classForm');
  if(classForm) classForm.onsubmit = submitClass;
  const assistantForm = document.getElementById('assistantForm');
  if(assistantForm) assistantForm.onsubmit = submitAssistant;
  const topicFilter = document.getElementById('topicFilter');
  if(topicFilter) topicFilter.onchange = () => { db.ui.libraryFilter = topicFilter.value; saveState(); render(); };
  const difficultyFilter = document.getElementById('difficultyFilter');
  if(difficultyFilter) difficultyFilter.onchange = () => { db.ui.difficultyFilter = difficultyFilter.value; saveState(); render(); };
  const searchInput = document.getElementById('searchInput');
  if(searchInput) searchInput.oninput = () => { db.ui.search = searchInput.value; saveState(); render(); };
}

function handleAction(e){
  const action = e.currentTarget.dataset.action;
  const id = e.currentTarget.dataset.id;
  switch(action){
    case 'go-login': db.ui.screen='auth'; db.ui.auth='login'; saveState(); render(); break;
    case 'go-register': db.ui.screen='auth'; db.ui.auth='register'; saveState(); render(); break;
    case 'switch-login': db.ui.auth='login'; saveState(); render(); break;
    case 'go-home': db.ui.screen='landing'; db.ui.auth='login'; saveState(); render(); break;
    case 'auth-role': db.ui.authRole=e.currentTarget.dataset.role || 'teacher'; saveState(); render(); break;
    case 'switch-register': db.ui.auth='register'; saveState(); render(); break;
    case 'demo-teacher': loginAsDemo('teacher'); break;
    case 'demo-student': loginAsDemo('student'); break;
    case 'go-dashboard': render(); break;
    case 'logout': db.currentUserId=null; db.ui.screen='landing'; saveState(); render(); break;
    case 'preview-mission': openMissionPreview(id); break;
    case 'clone-mission': cloneMission(id); break;
    case 'use-builder': db.ui.currentEditMissionId=id; db.ui.dashboard='builder'; saveState(); render(); break;
    case 'generate-ai-template': generateAiTemplate(); break;
    case 'clear-builder': delete db.ui.currentEditMissionId; saveState(); render(); break;
    case 'assign-mission': assignMissionQuick(); break;
    case 'preview-class': openClassPreview(id); break;
    case 'copy-code': navigator.clipboard?.writeText(e.currentTarget.dataset.code); toast('Join code көшірілді'); break;
    case 'export-analytics': exportAnalyticsCsv(); break;
    case 'export-analytics-xls': exportAnalyticsExcel(); break;
    case 'refresh-analytics': refreshAnalyticsFromFirebase(); break;
    case 'assistant-suggest':
      const prompt = e.currentTarget.dataset.text;
      document.querySelector('#assistantForm textarea[name="prompt"]').value = prompt;
      break;
    case 'play-mission':
      openGame({
        missionId: e.currentTarget.dataset.id,
        classId: e.currentTarget.dataset.class || null,
        assignmentId: e.currentTarget.dataset.assignment || null
      });
      break;
  }
}



async function refreshAnalyticsFromFirebase(){
  const user = currentUser();
  if(!user || !window.CyberEduCloud || !window.CyberEduCloud.enabled){ toast('Firebase қосылмаған'); return; }
  try{
    const classes = teacherClasses(user.id);
    const results = await window.CyberEduCloud.loadResultsForUser(user, classes);
    results.forEach(rec=>{
      const i = db.results.findIndex(r=>r.id===rec.id);
      if(i>=0) db.results[i]=rec; else db.results.push(rec);
    });
    saveState();
    render();
    toast('Аналитика жаңартылды');
  }catch(err){
    toast(authErrorMessage(err));
  }
}

function analyticsExportRows(){
  const user = currentUser();
  const dataset = analyticsDataset(user);
  return dataset.results.map(r=>{
    const cls = dataset.classes.find(c=>c.id===r.classId) || getClass(r.classId);
    const mission = getMission(r.missionId);
    const student = db.users.find(u=>u.id===r.studentId);
    return {
      date:r.createdAt?.slice(0,10) || '',
      className:cls?.name || '',
      student:student?.name || r.studentId,
      mission:mission?.title || r.missionId,
      platform:r.platform || 'CyberEdu',
      topic:mission?.topic || '',
      engine:mission ? engineCatalog[mission.engine].name : '',
      score:r.score,
      status:(r.success || r.score>=70) ? 'Орындалды' : 'Қайта орындау',
      steps:r.steps || ''
    };
  });
}

function exportAnalyticsCsv(){
  const rows = analyticsExportRows();
  const header = ['date','class','student','mission','platform','topic','engine','score','status','steps'];
  const csv = [header, ...rows.map(r=>[r.date,r.className,r.student,r.mission,r.platform,r.topic,r.engine,r.score,r.status,r.steps])]
    .map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'cyberedu_analytics.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('CSV файл жүктелді');
}

function exportAnalyticsExcel(){
  const rows = analyticsExportRows();
  const headers = ['Күні','Сынып','Оқушы','Тапсырма','Платформа','Тақырып','Қозғалтқыш','Ұпай','Статус','Қадам'];
  const table = `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${r.date}</td><td>${escapeHtml(r.className)}</td><td>${escapeHtml(r.student)}</td><td>${escapeHtml(r.mission)}</td><td>${escapeHtml(r.platform)}</td><td>${escapeHtml(r.topic)}</td><td>${escapeHtml(r.engine)}</td><td>${r.score}</td><td>${escapeHtml(r.status)}</td><td>${r.steps}</td></tr>`).join('')}</tbody></table>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>${table}</body></html>`;
  const blob = new Blob([html], {type:'application/vnd.ms-excel;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'cyberedu_analytics.xls'; a.click();
  URL.revokeObjectURL(url);
  toast('Excel файл жүктелді');
}

function loginAsDemo(role){
  const user = db.users.find(u=>u.role===role);
  db.currentUserId = user.id;
  db.ui.screen='dashboard';
  db.ui.dashboard='overview';
  saveState(); render();
}


function authErrorMessage(err){
  const code = err?.code || '';
  const msg = err?.message || '';
  if(code === 'cyberedu/email-not-registered') return 'Бұл email тіркелмеген. Алдымен «Тіркелу» батырмасын басып аккаунт ашыңыз.';
  if(code === 'cyberedu/email-already-registered' || code === 'auth/email-already-in-use') return 'Бұл email бұрын тіркелген. Тіркелмей, «Кіру» беті арқылы кіріңіз.';
  if(code === 'auth/user-not-found') return 'Бұл email тіркелмеген. Алдымен «Тіркелу» батырмасын басып аккаунт ашыңыз.';
  if(code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Email немесе құпиясөз қате. Егер аккаунтыңыз жоқ болса, «Тіркелу» батырмасын басыңыз.';
  if(code === 'auth/invalid-email') return 'Email форматы қате. Мысалы: name@mail.com';
  if(code === 'auth/weak-password') return 'Құпиясөз әлсіз. Кемінде 6 таңба жазыңыз.';
  if(code === 'auth/network-request-failed') return 'Интернет немесе Firebase байланысы жоқ. Қайта тексеріңіз.';
  if(code === 'permission-denied') return 'Firebase Firestore Rules рұқсат бермей тұр. Firebase Console → Firestore → Rules бөліміне осы ZIP ішіндегі firestore.rules ережесін қойыңыз.';
  if(code === 'cyberedu/join-code-not-found') return 'Мұғалім берген код табылмады. Кодты дәл енгізіңіз немесе мұғалімнен қайта сұраңыз.';
  if(msg.includes('код табылмады')) return 'Мұғалім берген код табылмады. Кодты дәл енгізіңіз.';
  return msg || 'Қате шықты. Деректерді тексеріп қайта көріңіз.';
}

async function submitAuth(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const email = String(fd.get('email') || '').trim().toLowerCase();
  const password = String(fd.get('password') || '').trim();
  const role = String(fd.get('role') || db.ui.authRole || 'teacher');
  const name = String(fd.get('name') || '').trim();
  const school = String(fd.get('school') || '').trim();
  const joinCode = String(fd.get('joinCode') || '').trim().toUpperCase();

  try{
    // Real Firebase Auth + Firestore path
    if(window.CyberEduCloud && config.firebase?.enabled){
      let result;
      if(db.ui.auth === 'login'){
        result = await window.CyberEduCloud.login({ email, password });
        if(result.profile.role !== role){
          toast(result.profile.role === 'teacher' ? 'Бұл email мұғалім ретінде тіркелген. Мұғалім рөлін таңдаңыз.' : 'Бұл email оқушы ретінде тіркелген. Оқушы рөлін таңдаңыз.');
          return;
        }
      }else if(role === 'teacher'){
        if(!name || !school){ toast('Аты-жөні мен мектеп атауын толтыр'); return; }
        result = await window.CyberEduCloud.registerTeacher({ name, email, password, school });
        toast(`Сынып коды: ${result.classes[0]?.code || ''}`);
      }else{
        if(!name || !joinCode){ toast('Аты-жөні мен мұғалім кодын толтыр'); return; }
        result = await window.CyberEduCloud.registerStudent({ name, email, password, joinCode });
      }
      const profile = result.profile;
      db.users = db.users.filter(u=>u.id!==profile.id);
      db.users.push(profile);
      (result.classes || []).forEach(cls=>{
        const i = db.classes.findIndex(c=>c.id===cls.id);
        if(i>=0) db.classes[i]=cls; else db.classes.push(cls);
      });
      (result.results || []).forEach(rec=>{
        const i = db.results.findIndex(r=>r.id===rec.id);
        if(i>=0) db.results[i]=rec; else db.results.push(rec);
      });
      db.currentUserId = profile.id;
      db.ui.screen='dashboard';
      db.ui.dashboard='overview';
      saveState();
      render();
      return;
    }
  }catch(err){
    toast(authErrorMessage(err));
    return;
  }

  // Local fallback for demo/offline
  if(db.ui.auth === 'login'){
    const user = db.users.find(u=>u.email.toLowerCase()===email && u.password===password && u.role===role);
    if(!user){ toast('Email, құпиясөз немесе рөл қате'); return; }
    db.currentUserId = user.id;
    db.ui.screen='dashboard';
    db.ui.dashboard='overview';
    saveState(); render();
  }else{
    if(db.users.some(u=>u.email.toLowerCase()===email)){ toast('Бұл email бұрын тіркелген. Кіру бетіне өтіңіз.'); return; }
    const user = { id: uid('user'), role, name: name || 'New User', email, password, school, gradeFocus:'' };
    if(role==='teacher'){
      db.users.push(user);
      db.currentUserId=user.id;
      const code=('CYB'+Math.random().toString(36).slice(2,6)).toUpperCase();
      db.classes.push({ id:uid('class'), name: school || 'Жаңа сынып', grade:'7-сынып', code, teacherId:user.id, students:[], description:'Жаңадан құрылған сынып' });
      toast(`Сынып коды: ${code}`);
    }else{
      const cls = db.classes.find(c=>c.code.toUpperCase()===joinCode);
      if(!cls){ toast('Мұғалім берген код табылмады. Кодты мұғалімнен қайта сұраңыз.'); return; }
      db.users.push(user);
      db.currentUserId=user.id;
      cls.students.push(user.id);
    }
    db.ui.screen='dashboard';
    db.ui.dashboard='overview';
    saveState(); render();
  }
}

function submitBuilder(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = {
    title:String(fd.get('title')||'').trim(),
    topic:String(fd.get('topic')||''),
    engine:String(fd.get('engine')||'maze'),
    difficulty:String(fd.get('difficulty')||'Бастапқы'),
    grade:Number(fd.get('grade')||7),
    points:Number(fd.get('points')||100),
    duration:15,
    objective:String(fd.get('objective')||'').trim(),
    scenario:String(fd.get('scenario')||'').trim(),
    winRule:String(fd.get('winRule')||'').trim(),
    createdBy:db.currentUserId,
    editable:true
  };
  if(!payload.title || !payload.objective){ toast('Міндетті жолдарды толтыр'); return; }
  const editId = db.ui.currentEditMissionId;
  if(editId){
    const target = getMission(editId);
    Object.assign(target, payload);
    toast('Миссия жаңартылды');
  }else{
    payload.id = uid('mission');
    db.missions.unshift(payload);
    toast('Жаңа миссия қосылды');
  }
  delete db.ui.currentEditMissionId;
  saveState();
  render();
}

function submitClass(e){
  e.preventDefault();
  const user = currentUser();
  const fd = new FormData(e.target);
  db.classes.unshift({
    id: uid('class'),
    name: String(fd.get('name')||'').trim(),
    grade: String(fd.get('grade')||''),
    code: ('CYB'+Math.random().toString(36).slice(2,6)).toUpperCase(),
    teacherId: user.id,
    students: [],
    description: String(fd.get('description')||'')
  });
  saveState();
  render();
  toast('Сынып құрылды');
}

function generateAiTemplate(){
  const title = document.querySelector('#builderForm [name="title"]');
  const topic = document.querySelector('#builderForm [name="topic"]');
  const objective = document.querySelector('#builderForm [name="objective"]');
  const scenario = document.querySelector('#builderForm [name="scenario"]');
  const winRule = document.querySelector('#builderForm [name="winRule"]');
  const t = topic.value;
  if(!title.value) title.value = `${t} бойынша авторлық миссия`;
  objective.value = `${t} тақырыбын ойын ішінде меңгерту, деңгейге сай тапсырмалар арқылы оқушының логикалық ойлауын және цифрлық дағдысын дамыту.`;
  scenario.value = `Оқушы картадағы агентті басқарады. Бастапқы деңгейде негізгі әрекет, орта деңгейде цикл/шарт, жоғары деңгейде қауіп элементтері қосылады. Мұғалім hint пен бағалау шартын өзгерте алады.`;
  winRule.value = 'Ойын картасын аяқтау, қателерді азайту және мақсат нүктесіне жету.';
  toast('ЖИ шаблон толтырылды');
}

function assignMissionQuick(){
  const missionId = document.getElementById('assignMissionSelect')?.value;
  const classId = document.getElementById('assignClassSelect')?.value;
  const dueDate = document.getElementById('assignDateInput')?.value || new Date().toISOString().slice(0,10);
  if(!missionId || !classId){ toast('Миссия мен сыныпты таңда'); return; }
  db.assignments.unshift({
    id: uid('assign'),
    classId,
    missionId,
    dueDate,
    note:'Миссия builder арқылы бекітілді',
    active:true
  });
  saveState(); render(); toast('Миссия сыныпқа бекітілді');
}

function cloneMission(id){
  const m = getMission(id);
  const copy = clone(m);
  copy.id = uid('mission');
  copy.title = `${m.title} (көшірме)`;
  copy.createdBy = db.currentUserId;
  db.missions.unshift(copy);
  saveState(); render(); toast('Миссия көшірілді');
}

function openMissionPreview(id){
  const m = getMission(id);
  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal glass">
        <div class="modal-head">
          <div>
            <div class="pill">${engineCatalog[m.engine].icon} ${engineCatalog[m.engine].name}</div>
            <h3>${escapeHtml(m.title)}</h3>
            <p class="small">${escapeHtml(m.topic)} · ${m.difficulty} · ${m.grade}-сынып</p>
          </div>
          <button class="close-btn" id="closeModal">×</button>
        </div>
        <div class="modal-grid">
          <div class="note"><strong>Оқу мақсаты</strong><br><br>${escapeHtml(m.objective)}</div>
          <div class="note"><strong>Сценарий</strong><br><br>${escapeHtml(m.scenario)}</div>
          <div class="note"><strong>Жеңіс шарты</strong><br><br>${escapeHtml(m.winRule)}</div>
          <div class="note"><strong>Қозғалтқыш</strong><br><br>${engineCatalog[m.engine].name} — ${engineCatalog[m.engine].topic}</div>
        </div>
        <div class="card-actions" style="margin-top:18px;">
          <button class="btn btn-primary" data-action="clone-mission" data-id="${m.id}">Көшіру</button>
          <button class="btn btn-secondary" data-action="use-builder" data-id="${m.id}">Өңдеу</button>
        </div>
      </div>
    </div>
  `;
  modalRoot.querySelector('#closeModal').onclick = closeModal;
  modalRoot.querySelectorAll('[data-action]').forEach(btn=> btn.onclick = handleAction);
}

function openClassPreview(id){
  const c = getClass(id);
  const students = c.students.map(studentId=>db.users.find(u=>u.id===studentId)).filter(Boolean);
  const assigns = classAssignments(c.id);
  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal glass">
        <div class="modal-head">
          <div>
            <div class="pill">Join code: ${escapeHtml(c.code)}</div>
            <h3>${escapeHtml(c.name)}</h3>
          </div>
          <button class="close-btn" id="closeModal">×</button>
        </div>
        <div class="modal-grid">
          <div class="note"><strong>Сипаттама</strong><br><br>${escapeHtml(c.description)}</div>
          <div class="note"><strong>Оқушылар</strong><br><br>${students.length ? students.map(s=>escapeHtml(s.name)).join('<br>') : 'Әзірге жоқ'}</div>
          <div class="note"><strong>Белсенді миссиялар</strong><br><br>${assigns.map(a=>escapeHtml(getMission(a.missionId)?.title||'')).join('<br>') || 'Жоқ'}</div>
          <div class="note"><strong>Деңгей</strong><br><br>${escapeHtml(c.grade)}</div>
        </div>
      </div>
    </div>
  `;
  modalRoot.querySelector('#closeModal').onclick = closeModal;
}

function closeModal(){ modalRoot.innerHTML = ''; }

function aiLocalReply(prompt){
  const lower = prompt.toLowerCase();
  if(lower.includes('firebase') || lower.includes('файебейс') || lower.includes('база')){
    return `Firebase қосу жоспары:\n1) Authentication — teacher/student email арқылы кіру.\n2) Cloud Firestore — users, classes, missions, assignments, results коллекциялары.\n3) Hosting — сайтты PROJECT_ID.web.app адресіне жариялау.\n4) Security Rules — оқушы тек өз нәтижесін, мұғалім өз сыныбын көреді.\nБұл ZIP ішінде firebase.json, firestore.rules және firebase-bridge.js дайын қосылды. app-config.js ішіне өз Firebase config мәндеріңді қойсаң, cloud sync іске қосылады.`;
  }
  if(lower.includes('codecombat') || lower.includes('кодкомбат') || lower.includes('ойын')){
    return `CodeCombat стиліндегі киберойын сценарийі:\nАтауы: Network Fortress: Python Agent\nМеханика: оқушы агентті код командаларымен басқарады, firewall қабырғаларынан өтеді, token/key жинайды, соңында secure portal-ға кіреді.\n3 деңгей:\n- Basic: moveRight(), moveDown(), collectKey() арқылы маршрут құру.\n- Middle: repeat(n){...} қолданып команданы қысқарту.\n- Advanced: қауіп аймағын айналып өтіп, ең аз қадаммен mission complete жасау.\nБағалау: код дұрыстығы 40%, киберқауіпсіз шешім 30%, тиімді алгоритм 20%, рефлексия 10%.`;
  }
  if(lower.includes('python') || lower.includes('цикл')){
    return `Ұсыныс:\n1) 1-деңгей — агентті repeat(2) арқылы кілтке жеткізу.\n2) 2-деңгей — цикл ішіне шартты шешім логикасын қосу.\n3) 3-деңгей — артық команданы азайтып, қауіпсіз маршрут табу.\nМиссия шарты: барлық token жиналып, порталға кіруі керек.\nБағалау: код дұрыстығы 40%, маршрут тиімділігі 30%, қате санын азайту 20%, рефлексия 10%.`;
  }
  if(lower.includes('фишинг')){
    return `Фишинг бойынша күрделі миссия:\n- Ойын механикасы: Phishing Hunter\n- 1-деңгей: URL доменін тану\n- 2-деңгей: хат мәтініндегі әлеуметтік инженерия белгісін табу\n- 3-деңгей: көпнұсқалы шабуылдан ең қауіптісін таңдау\nҚысқа hint: "Жіберуші домен, urgency сөзі және күмәнді сілтеме — негізгі индикаторлар."`;
  }
  if(lower.includes('бағалау')){
    return `Ұсынылатын бағалау критерийі:\n- Міндетті шешімнің дұрыстығы — 40%\n- Ойын ішіндегі киберқауіпсіз шешім — 30%\n- Алгоритм тиімділігі — 20%\n- Рефлексия және қатені түсіндіру — 10%`;
  }
  return `CyberEdu ЖИ көмекші жауабы:\n- Миссияны оқу мақсатына сәйкестендір.\n- Ойын механикасын таңда: Code Maze, Packet Defender, Phishing Hunter, SQL Shield.\n- 3 деңгей жаса: basic → middle → advanced.\n- Нәтижені автоматты балл, қадам саны, success status арқылы аналитикаға жібер.\nНақты prompt үлгісі: "7-сыныпқа Python цикл тақырыбы бойынша CodeCombat стиліндегі 3 деңгейлі киберойын сценарийін жаса".`;
}

async function submitAssistant(e){
  e.preventDefault();
  const textarea = e.target.querySelector('textarea[name="prompt"]');
  const prompt = textarea.value.trim();
  if(!prompt) return;
  db.assistant.push({ role:'user', content:prompt });
  textarea.value = '';
  saveState();
  render();
  let reply = '';
  if(config.ai && config.ai.enabled && config.ai.endpoint){
    try{
      const res = await fetch(config.ai.endpoint, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.error || 'OpenAI endpoint жауап бермеді');
      reply = data.reply || 'Жауап бос келді.';
    }catch(err){
      reply = `ЖИ backend қосылмай тұр: ${err.message}. Vercel-де OPENAI_API_KEY бар екенін және redeploy жасалғанын тексеріңіз.`;
    }
  }else{
    reply = aiLocalReply(prompt);
  }
  db.assistant.push({ role:'bot', content:reply });
  saveState();
  render();
}

function openGame({missionId, classId, assignmentId}){
  const mission = getMission(missionId);
  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal glass">
        <div class="modal-head">
          <div>
            <div class="pill">${engineCatalog[mission.engine].icon} ${engineCatalog[mission.engine].name}</div>
            <h3>${escapeHtml(mission.title)}</h3>
            <p class="small">${escapeHtml(mission.objective)}</p>
          </div>
          <button class="close-btn" id="closeModal">×</button>
        </div>
        <section class="game-wrap">
          <article class="game-board">
            <div class="board-top">
              <div>
                <h3>Interactive mission map</h3>
                <p>Оқушы командалар арқылы кейіпкерді басқарып, мақсатты аяқтайды.</p>
              </div>
              <div class="legend">
                <span><i style="background:#ff9f43"></i>Агент</span>
                <span><i style="background:#67e8f9"></i>Кілт</span>
                <span><i style="background:#ffd76b"></i>Портал</span>
                <span><i style="background:#ff6b6b"></i>Қауіп</span>
                <span><i style="background:#555"></i>Қабырға</span>
              </div>
            </div>
            <canvas id="gameCanvas" width="840" height="560"></canvas>
          </article>

          <aside class="editor-panel">
            <h4>Команда редакторы</h4>
            <p>Төмендегі командаларды жаз. repeat(2){ ... } форматы қолданылады.</p>
            <textarea class="textarea" id="codeInput" style="min-height:180px;">moveRight()
moveRight()
moveDown()
repeat(2){
 moveDown()
}
moveRight()
collectKey()
moveRight()
moveDown()
moveDown()</textarea>
            <div class="command-help">
              Командалар:<br>
              moveUp() · moveDown() · moveLeft() · moveRight()<br>
              collectKey() · enterPortal()<br>
              repeat(n){ ... }
            </div>
            <div class="score-strip">
              <div class="score-box"><strong id="scoreValue">0</strong><span>Ұпай</span></div>
              <div class="score-box"><strong id="stepValue">0</strong><span>Қадам</span></div>
              <div class="score-box"><strong id="keyValue">0</strong><span>Кілт</span></div>
              <div class="score-box"><strong id="goalValue">0%</strong><span>Орындау</span></div>
            </div>
            <div class="card-actions">
              <button class="btn btn-primary" id="runGameBtn">Іске қосу</button>
              <button class="btn btn-secondary" id="resetGameBtn">Қайта бастау</button>
              <button class="btn btn-ghost" id="saveResultBtn">Нәтижені сақтау</button>
            </div>
            <div class="status-log" id="statusLog">Ойын дайын. Команда енгізіп, "Іске қосу" батырмасын бас.</div>
          </aside>
        </section>
      </div>
    </div>
  `;
  modalRoot.querySelector('#closeModal').onclick = closeModal;
  const game = createGameEngine(document.getElementById('gameCanvas'), mission);
  document.getElementById('runGameBtn').onclick = ()=>{
    const code = document.getElementById('codeInput').value;
    const commands = parseCommands(code);
    if(!commands.valid){
      document.getElementById('statusLog').innerHTML = 'Синтаксис қате: ' + commands.error;
      return;
    }
    document.getElementById('statusLog').innerHTML = 'Командалар орындалып жатыр...';
    game.run(commands.list, stats=>{
      document.getElementById('scoreValue').textContent = stats.score;
      document.getElementById('stepValue').textContent = stats.steps;
      document.getElementById('keyValue').textContent = `${stats.keysCollected}/${stats.totalKeys}`;
      document.getElementById('goalValue').textContent = `${stats.completePercent}%`;
      document.getElementById('statusLog').innerHTML = stats.message;
    });
  };
  document.getElementById('resetGameBtn').onclick = ()=>{
    game.reset();
    document.getElementById('scoreValue').textContent='0';
    document.getElementById('stepValue').textContent='0';
    document.getElementById('keyValue').textContent='0';
    document.getElementById('goalValue').textContent='0%';
    document.getElementById('statusLog').innerHTML='Ойын қайта басталды.';
  };
  document.getElementById('saveResultBtn').onclick = ()=>{
    const snapshot = game.snapshot();
    const user = currentUser();
    if(!user || user.role !== 'student'){ toast('Нәтижені сақтау үшін student режимінде аш'); return; }
    const resultRecord = {
      id: uid('result'),
      assignmentId: assignmentId || uid('assignment'),
      classId: classId || (studentClasses(user.id)[0]?.id || ''),
      missionId,
      studentId: user.id,
      score: snapshot.score,
      steps: snapshot.steps,
      keysCollected: snapshot.keysCollected,
      totalKeys: snapshot.totalKeys,
      success: snapshot.completePercent === 100,
      createdAt: new Date().toISOString()
    };
    db.results.unshift(resultRecord);
    if(window.CyberEduCloud && window.CyberEduCloud.enabled){ window.CyberEduCloud.saveResult(resultRecord).catch(()=>{}); }
    saveState();
    toast('Нәтиже сақталды');
  };
}

function parseCommands(code){
  try{
    let lines = code.replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
    const out = [];
    function parseBlock(blockLines){
      for(let i=0;i<blockLines.length;i++){
        const line = blockLines[i];
        if(line.startsWith('repeat(')){
          const match = line.match(/^repeat\((\d+)\)\s*\{$/);
          if(!match) throw new Error(`repeat синтаксисі қате: ${line}`);
          let depth = 1;
          const inner = [];
          i++;
          for(; i<blockLines.length; i++){
            const l = blockLines[i];
            if(l.endsWith('{') && l.startsWith('repeat(')) depth++;
            if(l === '}'){
              depth--;
              if(depth===0) break;
            }else{
              inner.push(l);
            }
          }
          const parsedInner = [];
          parseBlock(inner).forEach(x=>parsedInner.push(x));
          const repeatCount = Number(match[1]);
          for(let r=0;r<repeatCount;r++) out.push(...parsedInner);
        }else if(line === '}'){
          continue;
        }else{
          out.push(line);
        }
      }
      return out;
    }
    parseBlock(lines);
    const validSet = new Set(['moveUp()','moveDown()','moveLeft()','moveRight()','collectKey()','enterPortal()']);
    const invalid = out.find(cmd=>!validSet.has(cmd));
    if(invalid) return { valid:false, error:`Белгісіз команда: ${invalid}` };
    return { valid:true, list:out };
  }catch(err){
    return { valid:false, error: err.message };
  }
}

function createGameEngine(canvas, mission){
  const ctx = canvas.getContext('2d');
  const size = 80;
  const cols = 10, rows = 7;
  const wallSet = new Set(['1,0','1,1','1,2','3,3','4,3','5,3','7,1','7,2','2,5','3,5','4,5']);
  const totalKeys = mission.difficulty === 'Жоғары' ? 3 : mission.difficulty === 'Орта' ? 2 : 1;
  const keys = [{x:2,y:2,collected:false},{x:6,y:2,collected:false},{x:8,y:5,collected:false}].slice(0,totalKeys);
  const fires = [{x:4,y:1,dir:1},{x:6,y:4,dir:-1}];
  const portal = {x:9,y:6};
  let player = {x:0,y:0,px:0,py:0};
  let steps = 0;
  let score = 0;
  let running = false;
  let status = 'Ойын дайын';
  let animFrame = null;

  function reset(){
    player = {x:0,y:0,px:0,py:0};
    steps = 0;
    score = 0;
    status = 'Ойын қайта басталды';
    keys.forEach(k=>k.collected=false);
    draw();
  }

  function snapshot(){
    const keysCollected = keys.filter(k=>k.collected).length;
    const atPortal = player.x===portal.x && player.y===portal.y;
    const completePercent = atPortal && keysCollected===totalKeys ? 100 : pct(keysCollected + (atPortal?1:0), totalKeys+1);
    return { score: Math.max(0,Math.min(100,score)), steps, keysCollected, totalKeys, completePercent, message: status };
  }

  function hitWall(x,y){ return x<0 || y<0 || x>=cols || y>=rows || wallSet.has(`${x},${y}`); }
  function move(dx,dy){
    const nx = player.x + dx, ny = player.y + dy;
    steps++;
    if(hitWall(nx,ny)){ score -= 6; status = 'Қабырғаға соғылды'; return; }
    player.x = nx; player.y = ny; score += 6; status = 'Қадам орындалды';
    const fireHit = fires.some(f=>f.x===player.x && f.y===player.y);
    if(fireHit){ score -= 14; status='Қауіпті аймаққа түстің'; }
  }
  function collectKey(){
    const found = keys.find(k=>!k.collected && k.x===player.x && k.y===player.y);
    if(found){ found.collected = true; score += 18; status='Кілт жиналды'; }
    else { score -= 4; status='Бұл жерде кілт жоқ'; }
  }
  function enterPortal(){
    const allKeys = keys.every(k=>k.collected);
    if(player.x===portal.x && player.y===portal.y && allKeys){
      score += 28; status='Миссия толық аяқталды';
    }else if(player.x===portal.x && player.y===portal.y){
      score -= 10; status='Портал ашылуы үшін барлық кілт керек';
    }else{
      score -= 5; status='Порталда тұрған жоқсың';
    }
  }

  function drawTile(x,y,fill,stroke){
    ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(x*size+6,y*size+6,size-12,size-12,18); ctx.fill(); ctx.stroke();
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // background stars
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        drawTile(x,y,'rgba(255,255,255,.03)','rgba(255,255,255,.04)');
      }
    }
    wallSet.forEach(coord=>{
      const [x,y] = coord.split(',').map(Number);
      drawTile(x,y,'rgba(70,70,70,.82)','rgba(255,255,255,.08)');
    });
    fires.forEach(f=>{
      drawTile(f.x,f.y,'rgba(255,107,107,.22)','rgba(255,107,107,.28)');
      ctx.fillStyle='#ff6b6b';
      ctx.beginPath(); ctx.arc(f.x*size+size/2, f.y*size+size/2, 18,0,Math.PI*2); ctx.fill();
    });
    keys.forEach(k=>{
      if(k.collected) return;
      drawTile(k.x,k.y,'rgba(103,232,249,.14)','rgba(103,232,249,.22)');
      ctx.fillStyle='#67e8f9';
      ctx.beginPath(); ctx.arc(k.x*size+size/2-8, k.y*size+size/2, 10,0,Math.PI*2); ctx.fill();
      ctx.fillRect(k.x*size+size/2, k.y*size+size/2-4, 18, 8);
    });
    drawTile(portal.x,portal.y,'rgba(255,215,107,.2)','rgba(255,215,107,.3)');
    ctx.fillStyle='#ffd76b';
    ctx.beginPath(); ctx.arc(portal.x*size+size/2, portal.y*size+size/2, 18,0,Math.PI*2); ctx.fill();

    // agent
    const cx = player.x*size+size/2, cy = player.y*size+size/2;
    ctx.fillStyle='#ff9f43';
    ctx.beginPath(); ctx.arc(cx,cy,20,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(cx-7, cy-4, 4,0,Math.PI*2); ctx.arc(cx+7, cy-4, 4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#4a2100'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(cx-7,cy+8); ctx.lineTo(cx+7,cy+8); ctx.stroke();

    // labels
    ctx.fillStyle='rgba(255,255,255,.9)';
    ctx.font='700 14px Inter';
    ctx.fillText('START', 16, 24);
    ctx.fillText('GOAL', portal.x*size+14, portal.y*size+24);
  }

  async function run(commands, onUpdate){
    if(running) return;
    running = true;
    for(const cmd of commands){
      if(cmd==='moveUp()') move(0,-1);
      if(cmd==='moveDown()') move(0,1);
      if(cmd==='moveLeft()') move(-1,0);
      if(cmd==='moveRight()') move(1,0);
      if(cmd==='collectKey()') collectKey();
      if(cmd==='enterPortal()') enterPortal();
      draw();
      const snap = snapshot();
      onUpdate(snap);
      await new Promise(r=>setTimeout(r, 460));
    }
    running = false;
    const snap = snapshot();
    if(snap.keysCollected === snap.totalKeys && player.x===portal.x && player.y===portal.y){
      status='Тамаша! Барлық шарт орындалды. Нәтижені сақтауға болады.';
      score = Math.max(score, 92 - Math.max(0, steps-10)*2);
    }else if(snap.keysCollected === snap.totalKeys){
      status='Кілттер жиналды. Енді порталға жет.';
    }else{
      status='Миссия толық аяқталмады. Маршрутты жақсарт.';
    }
    draw();
    onUpdate(snapshot());
  }

  draw();
  return { run, reset, snapshot };
}

render();
})();