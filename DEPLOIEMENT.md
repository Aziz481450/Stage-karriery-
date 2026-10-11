# Déploiement en ligne — lien permanent (24h/24, PC éteint)

Objectif : obtenir un lien public fixe qui fonctionne toujours, même quand le PC est éteint.

## Architecture

| Élément | Service | Rôle |
|--------|---------|------|
| Site + API + messagerie | **Render** (gratuit) | Serveur Node qui sert le front (build Vite) **et** l'API + Socket.IO sur la même URL |
| Base de données | **Aiven for MySQL** (gratuit) | Remplace MySQL/XAMPP (toujours en ligne) |
| IA (analyse CV + assistant) | **Groq** (gratuit) | Remplace Ollama (clé API, API compatible OpenAI) |
| Code source | **GitHub** (gratuit) | Nécessaire pour que Render déploie automatiquement |

Un seul lien public au final, du type : `https://karriery.onrender.com`

> Le serveur `server/src/app.js` détecte le dossier `client/dist` : s'il existe, il sert le site.
> En local, on garde Vite (port 5173) ; en ligne, tout passe par Express.

---

## Étape 1 — GitHub

1. Créer un compte sur https://github.com (si tu n'en as pas).
2. Créer un **nouveau dépôt** nommé `karriery` (privé de préférence).
3. Y envoyer le projet (voir `git` en bas de ce fichier, ou l'assistant le fera).

## Étape 2 — Base MySQL sur Aiven

1. Créer un compte sur https://aiven.io (gratuit).
2. **Create service** → **MySQL** → plan **Free** → région proche (ex. Frankfurt) → **Create**.
3. Une fois le service démarré, onglet **Overview** : noter
   - **Host** (ex. `mysql-xxxx.aivencloud.com`)
   - **Port** (ex. `12345`)
   - **User** (ex. `avnadmin`)
   - **Password**
   - **Database** (souvent `defaultdb`)
4. Onglet **Query editor** (ou ligne de commande `mysql`) : importer le fichier
   `deploy/karriery-dump.sql` (schéma + données de démo), OU copier/coller son contenu.
   - Ce fichier ne contient **pas** `CREATE DATABASE` : il s'importe dans la base `defaultdb` d'Aiven.
5. Laisser **SSL required** activé (le code gère le SSL via `DB_SSL=true`).

## Étape 3 — Clé IA Groq

1. Créer un compte sur https://console.groq.com (gratuit).
2. **API Keys** → **Create API Key** → copier la clé (`gsk_...`).

## Étape 4 — Render

1. Créer un compte sur https://render.com (gratuit) et connecter **GitHub**.
2. **New** → **Blueprint** → sélectionner le dépôt `karriery`.
   Render lit automatiquement `render.yaml`.
3. Render demande les variables marquées `sync: false`. Renseigner :
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` → depuis Aiven (étape 2)
   - `LLM_API_KEY` → clé Groq (étape 3)
   - `CLIENT_URL` → laisser vide pour le 1er déploiement, puis mettre l'URL Render finale
     (ex. `https://karriery.onrender.com`) et redéployer.
4. **Apply** → Render installe, build le client et démarre l'API.
5. Une fois déployé : ouvrir `https://karriery.onrender.com` → le site s'affiche.

## Étape 5 — Vérifier

- `https://karriery.onrender.com/api/health` doit répondre `{"ok":true}`.
- Se connecter avec un compte de démo (données importées à l'étape 2).

---

## Mettre à jour le site

À chaque `git push` sur la branche principale, Render **redéploie automatiquement**.
Il n'y a plus rien à lancer à la main : le lien reste disponible 24h/24.

## Notes importantes

- **Veille (plan gratuit Render)** : le service s'endort après ~15 min sans visite.
  La 1re visite le réveille (le chargement peut prendre ~30-60 s). Ensuite c'est rapide.
  Pour éviter la veille : un « ping » gratuit (ex. https://uptimerobot.com) toutes les 10 min.
- **Fichiers uploadés** (CV, photos) : stockés sur le serveur Render. Ils **peuvent disparaître**
  à chaque redéploiement/redémarrage. Choisi volontairement « simple ».
  Pour les rendre permanents plus tard : brancher Cloudinary.
- **Logs** : Render → onglet **Logs** du service.
- **Secrets** : ne jamais committer `server/.env` (déjà ignoré par `.gitignore`).

---

## Git (si besoin, en local)

```powershell
cd C:\Users\HP\Desktop\projet-karriery
git init
git add .
git commit -m "Karriery - pret pour deploiement"
git branch -M main
git remote add origin https://github.com/<ton-compte>/karriery.git
git push -u origin main
```
