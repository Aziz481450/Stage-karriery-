# Cahier de travail — Karriery

> Journal d'organisation du projet : architecture, démarrage, fonctionnalités, travaux
> réalisés, tests, conventions et pistes. Mettre à jour au fil de l'eau (section **Journal**).

Dernière mise à jour : **2026-10-11**

---

## 1. Objectif du projet

**Karriery** est une plateforme de mise en relation **candidat ↔ rédacteur CV** :

1. Un **candidat** dépose son CV (PDF) → une analyse IA calcule un **score (0-100)** + forces / faiblesses / recommandations.
2. Un **rédacteur** disponible **accepte** le dossier → il devient son rédacteur attitré.
3. Candidat et rédacteur **échangent en messagerie temps réel** (texte + fichiers).
4. Un **admin** supervise (comptes, dossiers, statuts).
5. Un **assistant IA** (Ollama) répond aux questions depuis la barre de navigation.

---

## 2. Stack & architecture

| Couche    | Techno |
|-----------|--------|
| Front     | React 18 + Vite 5 + react-router-dom 6, Socket.IO client, Axios |
| Back      | Node (ESM) + Express 4, Socket.IO 4, JWT, multer |
| Base      | MySQL (XAMPP) via `mysql2/promise` |
| IA        | Ollama (compatible OpenAI) — analyse CV + assistant ; repli local déterministe |
| PDF       | `pdfjs-dist` (extraction), `pdfkit` + `@napi-rs/canvas` (génération) |

Deux serveurs en dev : **client `http://localhost:5173`** (Vite) et **API `http://localhost:5000`**.
Le dev server Vite **proxy** `/api` et `/socket.io` vers `:5000` (voir §9).

---

## 3. Arborescence

```
projet-karriery/
├─ README.md
├─ cahier.md                 ← ce fichier
├─ client/                   (Vite + React)
│  ├─ vite.config.js         (proxy /api + /socket.io vers :5000)
│  └─ src/
│     ├─ api.js              (axios + API_BASE + photoUrl + download + WS_URL)
│     ├─ App.jsx  AuthContext.jsx  main.jsx
│     ├─ theme.css  styles.css  premium.css
│     ├─ layout/AppShell.jsx  layout/shell.css
│     ├─ components/  (Assistant, Bell, CommandPalette, Icon, OllamaLogo,
│     │                Metric, charts/*, UploadModal, CvForm, Sollicitation, …)
│     └─ pages/  (Auth, Home, Admin, Dashboard, dash/Candidat, dash/Redacteur,
│                 Demandes, DemandeDetail, Conversations, Messagerie,
│                 ProfilCandidat, ProfilRedacteur, ProfileForm,
│                 dashboard.css, messaging.css, home.css)
└─ server/
   ├─ database.sql
   ├─ .env / .env.example
   └─ src/
      ├─ server.js  app.js
      ├─ config/db.js
      ├─ routes/       (demandes, notifications, admin)
      ├─ controllers/  (auth, profile, assistant, demandes, messages,
      │                 fichiers, notifications, newsletter, admin)
      ├─ services/     (chat, socket, matching, llm, cvExtract, cvPdf,
      │                 notifications)
      ├─ middlewares/  (auth, limit, upload)
      └─ utils/        (ApiError, storage)
```

---

## 4. Démarrage rapide (dev)

1. **MySQL (XAMPP)** — démarrer MySQL puis créer la base :
   ```
   C:\xampp\mysql\bin\mysql.exe -u root < server/database.sql
   ```
2. **API** (port 5000) :
   ```
   cd server
   copy .env.example .env      # puis adapter si besoin
   npm install
   npm run dev                 # node --watch src/server.js
   ```
3. **Client** (port 5173) :
   ```
   cd client
   npm install
   npm run dev
   ```
   → http://localhost:5173

**Compte admin** : `npm run admin -- admin@karriery.tn "Nom Admin" MotDePasse123` (espace `/admin`).

---

## 5. Variables d'environnement (`server/.env`)

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=karriery
JWT_SECRET=karriery_dev_secret_change_me_9f3a7c2b1e
CLIENT_URL=http://localhost:5173
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=llama3.2                 # analyse CV
LLM_ASSISTANT_MODEL=qwen2.5:1.5b   # assistant conversationnel (rapide)
```

- `LLM_BASE_URL` **vide** ⇒ analyse locale déterministe (aucune donnée ne sort).
- **Redémarrer l'API après toute modif backend.** Redémarrer **Vite** après toute modif de `vite.config.js`.

---

## 6. Comptes de référence

| Rôle      | Identifiant            | Remarque |
|-----------|------------------------|----------|
| Admin     | `admin@karriery.tn`    | `#4` |
| Candidat  | `mohamed@gmail.com`    | `#2` (profil existant) |
| Rédacteur | `fawzi@gmail.com`      | `#87` |

> Comptes de test créés par les scripts de vérif : préfixe `…@karriery.tmp`, nettoyés après coup.

---

## 7. Fonctionnalités par rôle

- **Candidat** : dépôt CV (PDF), tableau de bord (score, progression, graphes), mes dossiers, détail + analyse IA, messagerie, profil + **photo**, amélioration CV.
- **Rédacteur** : tableau de bord, file d'attente de sollicitations (accepter/refuser), dossiers confiés, interrupteur *disponibilité*, messagerie, profil + photo.
- **Admin** : vue d'ensemble, gestion des statuts, activation/désactivation de comptes.
- **Transverse** : cloche de notifications temps réel, **palette de commandes (⌘K)**, **assistant IA** (Ollama), thème clair/sombre.

---

## 8. Travaux réalisés (résumé)

- [x] Design **TailAdmin** rouge Karriery pour les dashboards **candidat & rédacteur** (sidebar blanche 280px, header 72px, cartes blanches, grille 12 col, dark + responsive). Scope `.app .content .dash`.
- [x] **Palette ⌘K** réparée (styles `.cp-*`) ; items `mailto:` via `window.location`.
- [x] **Assistant IA Ollama** dans la navbar : API `POST /api/assistant/chat`, modèle `qwen2.5:1.5b`, panneau premium (en-tête dégradé, filigrane, composer) — **intro + suggestions supprimées**.
- [x] **Photo de profil** : colonne `users.photo`, endpoints upload/delete/public, avatars navbar.
- [x] **Messagerie type Messenger** : liste `.ms-*` + chat `.msc-*` (bulles groupées, séparateurs de jour, indicateur de frappe, badge non-lu, composer attach/send). Anciens styles `.conv*`/`.chat*`/`.bubble*` retirés.
- [x] **Proxy Vite** `/api` + `/socket.io` → un seul port public pour le partage distant.
- [x] Corrections : cache Vite vide sur `dashboard.css` (redémarrage Vite), participants exposés avec `id`/`photo` dans `conversations` + détail.

---

## 9. Proxy Vite & partage distant

`client/vite.config.js` :
```js
server: {
  host: true,
  allowedHosts: true,
  proxy: {
    '/api':       { target: 'http://localhost:5000', changeOrigin: true },
    '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true }
  }
}
```
En dev, `api.js` utilise des URLs **relatives** (`/api`), le WebSocket se connecte à l'origine courante → **un seul port (5173) suffit**.

**Partager avec des amis :**
- **VS Code** : onglet **PORTS** → forward `5173` → clic-droit **Port Visibility → Public** → copier l'adresse. (Nécessite Remote-SSH / WSL / Dev Container / Codespaces + compte GitHub.)
- **cloudflared** (secours, un lien) : `cloudflared tunnel --url http://localhost:5173` → URL `https://…trycloudflare.com`.
- ⚠️ Lien **public** = n'importe qui peut s'inscrire et taper dans la base locale + l'assistant. Couper quand c'est fini.

---

## 10. API (principales routes — base `/api`)

**Auth** : `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
**Profil** : `GET|PUT /{candidat|redacteur}/profil` · `POST|DELETE /profil/photo` · `GET /users/:id/photo` (public)
**Newsletter** : `POST /newsletter`
**Assistant** : `POST /assistant/chat`
**Demandes** : `POST /demandes` (CV) · `GET /candidat/demandes` · `GET /candidat/demandes/:id` · `GET /redacteur/demandes` · `GET /redacteur/demandes/en-attente` · `PUT /redacteur/demandes/:id/{accepte|refuse|statut}` · `GET|PATCH /demandes/:id` · `GET /demandes/:id/cv` · `POST /demandes/:id/ameliorer-cv` · `GET /demandes/:id/cv-ameliorer`
**Messagerie** : `GET|POST /demandes/:id/messages` · `GET /conversations` · `GET /fichiers/:id` · `GET /messages/:id/fichier`
**Notifications** : `GET /notifications` · `GET /notifications/unread-count` · `PUT /notifications/:id/read` · `PUT /notifications/read-all` · `PUT /notifications/demande/:id/lues`
**Admin** : voir `server/src/routes/admin.js`

**Socket.IO** : rooms `user:<id>`, `redacteurs`, `demande:<id>`.
Client → serveur : `join_demande`, `leave_demande`, `typing`, `stop_typing`, `send_message`.
Serveur → client : `new_message`, `typing`, `message_sent`, `user_online`, `user_offline`, `demande_disponible`, `new_notification`, `notifications_maj`.

---

## 11. Base de données (tables)

`users` (dont `photo`) · `candidats` · `redacteurs` · `demandes` · `demande_refus` ·
`messages` · `fichiers` · `notifications` · `newsletter`

---

## 12. Vérifications / tests

- **Backend** : `cd server && node test-backend.mjs` (60 vérifs) · `node test-socket.mjs` (11 vérifs).
- **UI via CDP** (Chrome `--remote-debugging-port=9222`) — scripts dans `%TEMP%\opencode\` :
  - `cdp-tailadmin.mjs` — dashboards (32) ✅
  - `cdp-pages.mjs` — dossiers/détail/profil/messagerie (13) ✅
  - `cdp-assistant.mjs` — assistant IA (18) ✅
  - `cdp-messaging.mjs` — messagerie Messenger (33) ✅
  - `cdp-photo.mjs` — photo de profil (14) ✅
  - `cdp-responsive.mjs` — **audit responsive** : 14 routes × 6 largeurs (320/360/390/414/768/1024), 0 débordement horizontal ✅
- **Santé API** : `curl http://localhost:5000/api/health` (ou via proxy : `http://localhost:5173/api/health`).
- **Build** : `cd client && npm run build`.

---

## 12bis. Responsive (100%)

Objectif : aucun débordement horizontal ni layout cassé de **320px à ≥1024px**.

| Breakpoint | Rôle |
|-----------|------|
| ≤ 1000px  | Sidebar → **tiroir** off-canvas (`.side` fixed + `.burger` + `.scrim`) |
| ≤ 860px   | Tableaux (`.dtable`/`.tbl`) → **scroll horizontal** (`display:block; overflow-x:auto`) |
| ≤ 800px   | Landing/Auth : `.split`/`.grid` en 1 colonne ; `.analyse` 1 colonne |
| ≤ 700px   | Dashboards : `.metrics` 1 colonne, `.detail` 1 colonne |
| ≤ 640px   | Header compact (nom masqué, `kbd` masqué, recherche réduite) |
| ≤ 420px   | `.roles` (auth) 1 colonne, `.hero` padding réduit |

Règles clés (à respecter) :
- **Grid/flex items** qui contiennent du contenu large (tableaux, titres longs) : `min-width:0`.
- **Jamais** `width:max-content` sur un conteneur large (utiliser `width:fit-content; max-width:100%`).
- Ne pas imposer `grid-template-columns` **hors media query** sur `.app`/`.split` (sinon ça écrase le responsive du shell).
- Le contenu scrollable (tableau) ne doit pas compter comme débordement : vérifier `document.documentElement.scrollWidth`. 

---

## 12ter. Déploiement en ligne (lien permanent, PC éteint)

Objectif : un lien public fixe, 24h/24, indépendant du PC. Voir **`DEPLOIEMENT.md`** (guide pas à pas).

| Élément | Service | Remplace |
|--------|---------|----------|
| Site + API + Socket.IO | **Render** (free) | Vite + Node locaux |
| Base MySQL | **Aiven** (free) | XAMPP MySQL |
| IA | **Groq** (free, API OpenAI-compatible) | Ollama |
| Code | **GitHub** | — |

Adaptations faites dans le code (prod = une seule origine) :
- `server/src/app.js` : si `client/dist` existe → `express.static` + SPA fallback `app.get('*')` (site + API + socket sur le même port). En dev, Vite sert toujours le front.
- `client/src/api.js` : `baseURL = '/'+api` relatif ; `WS_URL = undefined` (même origine). Plus de `http://localhost:5000` en dur.
- `server/src/config/db.js` : `DB_PORT` + `DB_SSL=true` → `ssl:{rejectUnauthorized:false}` (requis par Aiven).
- `render.yaml` (blueprint) + `package.json` racine (`build`/`start`) + `server/.env.example` (DB_PORT/DB_SSL, Groq).
- `deploy/karriery-dump.sql` : schéma + données démo (sans `CREATE DATABASE`/`USE`) à importer dans Aiven.
- Testé en local en mode prod : `npm --prefix client run build` puis `node server/src/server.js` → `http://localhost:5000/` sert le SPA, `/api/health` OK, assets 200, **0 erreur JS**.

---

## 13. Conventions & design system

- **Interdit** : `!important`, empiler des overrides. **Un seul endroit par style**, corriger les conflits **à la source**.
- Styles dashboard préfixés `.app .content .dash`. Messagerie : `ms-` (liste) / `msc-` (chat). Assistant : `ai-*`. Palette : `cp-*`.
- **Tokens** : brand `#E0183F`, brand-600 `#C0102F`, brand-50 `#FFF1F3` ; gris `100 #F2F4F7 · 200 #E4E7EC · 400 #98A2B3 · 700 #344054` ; page `#F9FAFB`, carte `#FFFFFF`, bordure `#E4E7EC`, ink `#101828`, mute `#667085` ; ok `#12B76A`/`#ECFDF3`/`#027A48`, warn `#F79009`, bad `#F04438`/`#FEF3F2`/`#B42318`, info `#2E90FA` ; sombre fond `#0C111D`, carte `#1D2939`, bordure `#344054`, ink `#F2F4F7`.
- Police **Outfit** ; rayons cartes **16px**, boutons **8px**, badges **99px** ; ombre `0 1px 2px rgba(16,24,40,.05)`.
- **Aucun emoji** dans le code. Icônes SVG via `Icon.jsx`. Logo app = `/logo.png`.
- **Conventions de code** : pas de commentaires superflus, ESM côté serveur.

---

## 14. Pièges connus

- **Vite sert un CSS vide en cache** (ex. `dashboard.css` → `__vite__css = ""`) ⇒ styles absents. **Redémarrer Vite** (et vérifier `http://localhost:5173/src/pages/dashboard.css`). Le cache peut aussi servir une **version périmée** d'une feuille après édition → redémarrer Vite.
- **`theme.css` écrasait le responsive** : `.app{grid-template-columns:280px 1fr}` hors media query (chargé après `shell.css`) ⇒ sur mobile le contenu restait coincé à 280px. Ne pas réintroduire.
- **`width:max-content`** sur `.tabs`/`.roles.admin-tabs` (premium.css) ⇒ débordement admin. Corrigé en `fit-content; max-width:100%`.
- **CDP + auth** : après `localStorage.setItem('token', …)`, naviguer avec `location.href='…'` (pas seulement `reload`). Headless = dark par défaut → forcer `Emulation.setEmulatedMedia` light.
- **Backend** : toujours **redémarrer** `node src/server.js` après une modif.
- Uploads à ne pas casser : fichiers de `server/uploads/` (cvs/fichiers).

---

## 15. Journal

### 2026-10-11
- Vérif finale : dashboards 32/32, pages 13/13, assistant 18/18, messagerie 33/33.
- **Cause racine** dashboards « sans CSS » : Vite servait un transform **vide** de `dashboard.css` → redémarrage Vite corrigé.
- Proxy Vite `/api` + `/socket.io` ajouté ; `api.js` en URLs relatives (dev) ; tunnel cloudflared de partage validé (`/` → 200, `/api/health` → ok).
- **Passe responsive complète** (objectif 100%) :
  - **Bug majeur** : `theme.css` forçait `.app{grid-template-columns:280px 1fr}` hors media query → contenu coincé à 280px sur mobile. Retiré.
  - `premium.css` : `.tabs`/`.roles.admin-tabs` `width:max-content` → `fit-content;max-width:100%` (admin).
  - `dashboard.css` : `min-width:0` sur `.dash`/`.dash-grid` > * ; `.dtable` scrollable ≤860px.
  - Charts : `makeBuckets` initialise `count:0` (bug `NaN`) + `BarChart`/`AreaChart` durcis (données non numériques).
  - `shell.css` : `.top-search`/input `min-width:0` (header ne déborde plus).
  - `styles.css` : `.split>*,.grid>* min-width:0` ; `.roles` 1 colonne ≤420px ; `.hero` padding réduit.
  - **Vérifié** : `cdp-responsive.mjs` → 14 routes × 6 largeurs = **0 débordement** ; régressions desktop OK (tailadmin/pages/messaging/assistant/photo).
- **Préparation déploiement en ligne** (lien permanent) : `app.js` sert le SPA, `api.js` same-origin, `db.js` SSL, `render.yaml`, `deploy/karriery-dump.sql`, `DEPLOIEMENT.md`. Testé en prod local (`:5000`) : SPA + API OK, 0 erreur JS.

### 2026-10-12
- **Publication GitHub** : tout le projet poussé dans `Aziz481450/Stage-karriery-` (branche `main`).
- **Déploiement en ligne effectué** :
  - Base **Aiven MySQL** : service créé, schéma + données importés (9 tables, 5 comptes) via `deploy/karriery-dump.sql`.
  - **Groq** : clé validée ; modèles `openai/gpt-oss-20b` (le 120b échoue en mode JSON `response_format`).
  - **Render** : service `stage-karriery` créé via API (région Frankfurt, plan free), build `client` + `server`, start `node server/src/server.js`, variables d'env branchées.
- **Lien public : https://stage-karriery.onrender.com** — vérifié : `/api/health` ok, SPA rendu (footer réseaux OK), login admin `Admin_123456` ok, 0 erreur JS.
- Décision : hébergement gratuit (Render + Aiven + Groq) ; fichiers uploadés sur disque Render (peuvent être réinitialisés).
- **Correctif dépôt de CV en ligne** : Groq renvoyait par intermittence un 400 `json_validate_failed` en mode `response_format: json_object` avec `gpt-oss` (raisonnement consommant le budget `max_tokens=1000` → génération vide). Corrigé dans `server/src/services/llm.js` : `max_tokens=2048`, `reasoning_effort:'low'`, repli automatique sans mode JSON, et **repli sur l'analyse locale** si l'IA distante est saturée (429) / indisponible → le dépôt de CV aboutit toujours. Idem pour « améliorer CV ».
- **Test de bout en bout en ligne (31/31)** : inscription, profils candidat/rédacteur, dépôt CV (201, analyse score 82), téléchargement CV, file d'attente, acceptation, messagerie (2 sens), conversations, amélioration IA du CV (provider `llm`), changement de statut, notifications (`{items,nonLues}`), compteur non-lus, photo (upload/service/suppression), newsletter, assistant IA, admin (dashboard/users/demandes), auth (me/logout). Comptes de test créés puis supprimés de la base Aiven.
- **Correctif notifications mobile** : sur téléphone, la cloche ne s'ouvrait pas. Cause : en `@media(max-width:800px)` le panneau passait en `position:fixed` mais gardait `top:calc(100% + 12px)` (= 100vh + 12px) → panneau rendu **sous l'écran**. Corrigé dans `client/src/styles.css` (`top:76px`, sous le header 72px). Vérifié en CDP (390×844 et 360×780) : panneau entièrement dans l'écran (`visible:true`).

---

## 16. À faire / pistes

- [ ] Déplacer les scripts de vérif (`cdp-*.mjs`) dans `tests/` du repo (au lieu de `%TEMP%`).
- [ ] `VITE_WS_URL` / `VITE_API_URL` documentés dans un `.env.example` client.
- [ ] Déploiement : servir le build client + API derrière une même origine (reverse proxy) pour éviter CORS en prod.
  - [x] Fait : `app.js` sert `client/dist` (mono-origine) — reste à héberger (Render + Aiven + Groq, voir `DEPLOIEMENT.md`).
- [ ] Étendre la suite de tests backend (couverture messagerie/fichiers).
