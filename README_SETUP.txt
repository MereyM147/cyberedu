CyberEdu — public ready нұсқа

1) Кіру/тіркелу логикасы
- Мұғалім бөлек тіркеледі: аты-жөні, мектеп атауы, email, құпиясөз.
- Мұғалім тіркелгенде Firestore ішінде users және classes құжаттары құрылады.
- Сыныпқа автоматты join code беріледі.
- Оқушы бөлек тіркеледі: аты-жөні, мұғалім берген код, email, құпиясөз.
- Оқушы код арқылы мұғалім сыныбына қосылады.

2) Firebase
- app-config.js ішінде Firebase config қосылған.
- firebase-bridge.js Firebase Auth + Firestore арқылы нақты тіркеу/кіру/сыныпқа қосылуды орындайды.
- firestore.rules файлында users, classes, missions, assignments, results, snapshots ережелері бар.

3) OpenAI
- ЖИ көмекші /api/ai.js арқылы Vercel backend-пен жұмыс істейді.
- OPENAI_API_KEY тек Vercel Environment Variables ішінде тұруы керек.

4) Deploy
- Vercel: vercel --prod
- Firebase Hosting: firebase deploy --only hosting

5) Демо аккаунттар local/offline режим үшін ғана:
- teacher@cyberedu.kz / 123456
- student01@cyberedu.kz / 123456
