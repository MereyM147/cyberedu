# CyberEdu жариялау

## Vercel арқылы
```bash
npm i -g vercel
vercel login
vercel link
vercel --prod
```

Vercel Environment Variables:
```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```
Environment variable қосылғаннан кейін Redeploy жаса.

## Firebase дайындау
Firebase Console ішінде мыналарды қос:
1. Authentication → Sign-in method → Email/Password → Enable
2. Firestore Database → Create database
3. Rules бөліміне firestore.rules ішіндегі ережені қой немесе CLI арқылы deploy ет:
```bash
firebase login
firebase use cyberedu-fb748
firebase deploy --only firestore:rules
```

## Оқу логикасы
- Мұғалім тіркеледі → мектеп атауын жазады → жүйе join code жасайды.
- Оқушы тіркеледі → мұғалім берген кодты жазады → сыныпқа қосылады.
- Оқушы ойын нәтижесін сақтаса → results коллекциясына түседі.
- Мұғалім аналитикадан нәтижені көреді.

## Домен
Vercel → Project → Settings → Domains → доменді қос → DNS жазбасын домен алған сайтта көрсетілгендей енгіз.
