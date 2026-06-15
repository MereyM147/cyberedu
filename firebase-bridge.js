(function(){
  const cfg = window.CYBEREDU_CONFIG || {};
  const fb = cfg.firebase || {};

  function joinCode(){ return ('CYB' + Math.random().toString(36).slice(2,6)).toUpperCase(); }

  const bridge = {
    enabled:false,
    app:null,
    db:null,
    auth:null,
    analytics:null,
    async init(){
      if(!fb.enabled || !fb.apiKey || !fb.projectId) return false;
      if(!window.firebase){
        await new Promise((resolve, reject)=>{
          const load = (src, ok, fail=reject)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=fail; document.head.appendChild(s); };
          load('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js', ()=>{
            load('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js', ()=>{
              load('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js', ()=>{
                load('https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics-compat.js', resolve, resolve);
              });
            });
          });
        });
      }
      if(!window.firebase.apps.length){ window.firebase.initializeApp(fb); }
      this.app = window.firebase.app();
      this.auth = window.firebase.auth();
      this.db = window.firebase.firestore();
      if(fb.measurementId && window.firebase.analytics){ try{ this.analytics = window.firebase.analytics(); }catch(e){} }
      this.enabled = true;
      return true;
    },
    async login({email, password}){
      await this.init();
      const cred = await this.auth.signInWithEmailAndPassword(email, password);
      const uid = cred.user.uid;
      const snap = await this.db.collection('users').doc(uid).get();
      if(!snap.exists) throw new Error('Профиль табылмады. Алдымен тіркеліңіз.');
      const profile = { id:uid, ...snap.data() };
      const classes = await this.loadClassesForUser(profile);
      const results = await this.loadResultsForUser(profile, classes);
      return { profile, classes, results };
    },
    async registerTeacher({name, email, password, school}){
      await this.init();
      const cred = await this.auth.createUserWithEmailAndPassword(email, password);
      const uid = cred.user.uid;
      const profile = { id:uid, role:'teacher', name, email, school, gradeFocus:'7-9 сынып', createdAt:new Date().toISOString() };
      const code = joinCode();
      const classId = 'class_' + uid.slice(0,8);
      const classData = { id:classId, name:`${school || 'CyberEdu'} сыныбы`, grade:'7-сынып', code, teacherId:uid, students:[], description:'CyberEdu мұғалім сыныбы', createdAt:new Date().toISOString() };
      await this.db.collection('users').doc(uid).set(profile, {merge:true});
      await this.db.collection('classes').doc(classId).set(classData, {merge:true});
      this.logEvent('teacher_register', { school });
      return { profile, classes:[classData], results:[] };
    },
    async registerStudent({name, email, password, joinCode}){
      await this.init();
      const code = String(joinCode || '').trim().toUpperCase();
      const cred = await this.auth.createUserWithEmailAndPassword(email, password);
      const uid = cred.user.uid;
      const qs = await this.db.collection('classes').where('code','==',code).limit(1).get();
      if(qs.empty){
        try{ await cred.user.delete(); }catch(e){}
        const err = new Error('Мұғалім берген код табылмады');
        err.code = 'cyberedu/join-code-not-found';
        throw err;
      }
      const classDoc = qs.docs[0];
      const classData = { id:classDoc.id, ...classDoc.data() };
      const profile = { id:uid, role:'student', name, email, school:classData.name, gradeFocus:classData.grade, classCode:code, createdAt:new Date().toISOString() };
      await this.db.collection('users').doc(uid).set(profile, {merge:true});
      await this.db.collection('classes').doc(classDoc.id).update({ students: window.firebase.firestore.FieldValue.arrayUnion(uid) });
      classData.students = Array.from(new Set([...(classData.students || []), uid]));
      this.logEvent('student_register', { classCode:code });
      return { profile, classes:[classData], results:[] };
    },
    async loadClassesForUser(profile){
      await this.init();
      let qs;
      if(profile.role === 'teacher') qs = await this.db.collection('classes').where('teacherId','==',profile.id).get();
      else qs = await this.db.collection('classes').where('students','array-contains',profile.id).get();
      return qs.docs.map(d=>({id:d.id, ...d.data()}));
    },
    async loadResultsForUser(profile, classes){
      await this.init();
      if(profile.role === 'student'){
        const qs = await this.db.collection('results').where('studentId','==',profile.id).get();
        return qs.docs.map(d=>({id:d.id, ...d.data()}));
      }
      const classIds = (classes || []).map(c=>c.id).filter(Boolean).slice(0,10);
      if(!classIds.length) return [];
      const qs = await this.db.collection('results').where('classId','in',classIds).get();
      return qs.docs.map(d=>({id:d.id, ...d.data()}));
    },
    async saveState(state){
      if(!this.enabled){ await this.init(); }
      if(!this.enabled || !this.db) return;
      const currentUserId = state.currentUserId || 'guest';
      await this.db.collection('snapshots').doc(currentUserId).set({ updatedAt:new Date().toISOString(), state }, { merge:true });
    },
    async saveResult(result){
      if(!this.enabled){ await this.init(); }
      if(!this.enabled || !this.db) return;
      await this.db.collection('results').doc(result.id).set(result, { merge:true });
      this.logEvent('mission_result_saved', { score: result.score, missionId: result.missionId });
    },
    logEvent(name, params){ try{ if(this.analytics){ this.analytics.logEvent(name, params || {}); } }catch(e){} }
  };
  window.CyberEduCloud = bridge;
  bridge.init().catch(()=>{});
})();
