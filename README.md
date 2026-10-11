# Karriery — Plateforme de rédaction et d'analyse de CV

Karriery accompagne les candidats dans la construction de leur parcours professionnel :
analyse de CV par IA, mise en relation avec des rédacteurs experts, messagerie temps réel
et suivi de dossiers — le tout dans une interface React moderne.

## Sommaire

- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Démarrage rapide (développement)](#démarrage-rapide-développement)
- [Comptes de test](#comptes-de-test)
- [Variables d'environnement](#variables-denvironnement)
- [Fonctionnalités](#fonctionnalités)
- [Analyse IA](#analyse-ia-optionnelle)
- [Tests](#tests)
- [Déploiement en ligne](#déploiement-en-ligne)
- [Conventions](#conventions)

## Stack technique

| Couche | Technologies |
|-------|--------------|
| Front | React 18, Vite, React Router, Axios, Socket.IO client |
| Back | Node.js (ESM), Express, Socket.IO, JWT, Multer, bcrypt |
| Base de données | MySQL (mysql2) |
| IA | Fournisseur compatible OpenAI (Groq en ligne / Ollama en local) |

## Structure du projet

```
projet-karriery/
├─ client/                 # Application React (Vite)
│  └─ src/
│     ├─ layout/           # AppShell, sidebar, header
│     ├─ pages/            # Landing, Auth, Dashboards, Admin, Messagerie...
│     ├─ components/       # UI réutilisable (icônes, charts, footer...)
│     └─ api.js            # Client HTTP + WebSocket
├─ server/                 # API Node + Socket.IO
│  ├─ src/
│  │  ├─ controllers/      # Logique métier par domaine
│  │  ├─ routes/           # Définition des routes REST
│  │  ├─ services/         # IA, matching, socket, extraction CV
│  │  ├─ middlewares/      # Auth, upload, rate-limit
│  │  └─ config/           # Connexion base de données
│  ├─ migrations/          # Évolutions du schéma
│  ├─ database.sql         # Schéma initial
│  └─ uploads/             # Fichiers déposés (CV, avatars, pièces jointes)
├─ deploy/                 # Export SQL prêt pour l'hébergement
├─ render.yaml             # Blueprint de déploiement (Render)
├─ DEPLOIEMENT.md          # Guide de mise en ligne
└─ cahier.md               # Cahier de travail / suivi du projet
```

## Démarrage rapide (développement)

Prérequis : Node.js 20+, MySQL (XAMPP), npm.

### 1. Base de données

```powershell
C:\xampp\mysql\bin\mysql.exe -u root < server/database.sql
```
(ou importer `server/database.sql` via phpMyAdmin dans la base `karriery`)

### 2. API (port 5000)

```powershell
cd server
copy .env.example .env      # puis personnaliser
npm install
npm run dev
```

### 3. Client (port 5173)

```powershell
cd client
npm install
npm run dev
```

Ouvrir http://localhost:5173

## Comptes de test

| Rôle | Identifiant | Mot de passe |
|------|-------------|--------------|
| Admin | `admin@karriery.tn` | `Admin_123456` |
| Candidat | `mohamed@gmail.com` | (compte existant) |

Créer un administrateur :

```powershell
cd server
npm run admin -- admin@karriery.tn "Nom Admin" MotDePasse123
```

## Variables d'environnement

Fichier `server/.env` (voir `server/.env.example`) :

```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=karriery
DB_SSL=false
JWT_SECRET=change_me_long_random
CLIENT_URL=http://localhost:5173
LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
LLM_ASSISTANT_MODEL=
```

## Fonctionnalités

### Candidat
- Inscription, profil (poste recherché, compétences), photo de profil.
- Dépôt d'un CV (PDF, 5 Mo max) → analyse IA + attribution d'un rédacteur.
- Suivi des dossiers, messagerie temps réel, notifications.

### Rédacteur
- Profil (spécialité, disponibilité), dossiers attribués, traitement.
- Messagerie avec les candidats, fichier de travail joints.

### Admin
- Vue d'ensemble (comptes, dossiers, score moyen).
- Gestion des statuts de dossiers, annulation / réactivation de comptes.

### Temps réel
- Socket.IO : messages, présence en ligne, notifications, indicateur de frappe.

## Analyse IA (optionnelle)

Par défaut, l'analyse est **locale et déterministe** (aucun appel réseau). Pour un modèle
type Groq/Ollama (format OpenAI), compléter `server/.env` :

```
LLM_BASE_URL=https://api.groq.com/openai/v1     # ou http://localhost:11434/v1 (Ollama)
LLM_API_KEY=votre-cle
LLM_MODEL=llama-3.1-8b-instant                  # ou llama3.2
LLM_ASSISTANT_MODEL=llama-3.1-8b-instant
```

Sans clé, le service bascule automatiquement sur l'analyse locale (même schéma de réponse).

## Tests

```powershell
cd server
node test-backend.mjs     # API : ~60 vérifications (auth, uploads, matching, messagerie, fichiers, notifications, admin)
node test-socket.mjs      # Socket.IO : ~11 vérifications (salles, messages, notifications, présence)
```

## Déploiement en ligne

Guide complet : **[DEPLOIEMENT.md](DEPLOIEMENT.md)** (Render + Aiven + Groq, lien permanent 24h/24).

Le serveur Express sert le front (build Vite) **et** l'API sur une même origine en production.

## Conventions

- Aucun `!important` ; un seul emplacement par style, correctifs à la source.
- Pas de commentaires superflus ; ESM côté serveur.
- Design system : police Outfit, rayon cartes 16px / boutons 8px / badges 99px.
- Responsive garanti de 320px à ≥1024px (sidebar en tiroir sur mobile).

## Licence

Projet pédagogique — © 2026 Karriery.
