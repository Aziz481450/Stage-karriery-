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

Base déjà existante : appliquer les migrations (offres + candidatures + validation des rédacteurs + dossiers/email + profil admin) :
```powershell
C:\xampp\mysql\bin\mysql.exe -u root karriery < server/migrations/sprint-6-offres.sql
C:\xampp\mysql\bin\mysql.exe -u root karriery < server/migrations/sprint-6-candidatures.sql
C:\xampp\mysql\bin\mysql.exe -u root karriery < server/migrations/sprint-7-recruteur-approval.sql
C:\xampp\mysql\bin\mysql.exe -u root karriery < server/migrations/sprint-8-dossier-email.sql
C:\xampp\mysql\bin\mysql.exe -u root karriery < server/migrations/sprint-9-admin-profil.sql
```

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
| Rédacteur | `redacteur.test@karriery.tn` | `Test_123456` |
| Candidat | `candidat.test@karriery.tn` | `Test_123456` |
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
# Envoi du CV amélioré (SMTP). SMTP_HOST vide = mode journal local (test).
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=Karriery <no-reply@karriery.tn>
NEWSLETTER_FROM=Karriery Newsletter <newsletter@karriery.tn>
```

Sans `SMTP_HOST`, l'envoi du CV amélioré est simulé : le serveur journalise l'email
(`[MAIL:LOG]`) et l'endpoint renvoie `"mode": "log"`. Renseigner les variables SMTP
pour une vraie livraison (`"mode": "smtp"`).

Le bouton **Envoyer par la newsletter** (dans le widget d’analyse IA du rédacteur)
utilise `NEWSLETTER_FROM` comme expéditeur ; les envois depuis l’admin utilisent `MAIL_FROM`.

## Fonctionnalités

### Candidat
- Inscription, profil (poste recherché, compétences), photo de profil.
- Dépôt d'un CV (PDF, 5 Mo max) → analyse IA + attribution d'un rédacteur.
- Suivi des dossiers, messagerie temps réel, notifications.
- Consultation des offres d'emploi ouvertes (recherche et filtre par spécialité).
- Candidature à une offre : message de motivation + choix d'un dossier avec CV, suivi du statut.

### Rédacteur
- Inscription soumise à validation administrative : le compte est créé en attente et
  la connexion est bloquée jusqu'à approbation (aucun jeton n'est délivré à l'inscription).
- Profil (spécialité, disponibilité), dossiers attribués, traitement.
- Bouton **Voir le profil** sur chaque dossier : fiche complète du candidat
  (coordonnées, compétences, bio, photo) sans quitter la liste (`GET /api/demandes/:id/profil`).
- Messagerie avec les candidats, fichier de travail joints.
- CRUD complet de ses offres d'emploi : Front-end, Back-end, Full-stack, Mobile, AI, IoT, Systèmes embarqués.
- Réception des candidatures sur ses offres : lecture du message et du CV, accepter / refuser.
- Widget d’analyse IA : **Envoyer par la newsletter** génère le CV amélioré si besoin et
  l’envoie au candidat avec l’expéditeur « Karriery Newsletter »
  (`POST /api/demandes/:id/envoyer-cv`).

### Admin
- Profil administrateur modifiable depuis la sidebar ou le menu avatar
  (nom, photo, téléphone, ville, fonction, présentation) : `/admin/profil`
  (`GET` et `PUT /api/admin/profil`).
- Vue d'ensemble (comptes, dossiers, score moyen).
- Validation des nouveaux rédacteurs : liste filtrée « En attente », boutons **Approuver** / **Refuser**
  (`PUT /api/admin/users/:id/approve` et `PUT /api/admin/users/:id/reject`).
- Gestion des utilisateurs avec filtres par rôle, statut et recherche textuelle (nom / email).
- **Dossiers candidats** : consultation du profil complet, du CV d'origine, du CV amélioré
  et des recommandations IA (`GET /api/admin/demandes/:id/dossier`).
- Génération du CV amélioré depuis l'admin, puis envoi par email au candidat avec le PDF
  en pièce jointe (`POST /api/admin/demandes/:id/envoyer-cv`). La date d'envoi est enregistrée
  et une notification est créée pour le candidat.
- Gestion des statuts de dossiers, annulation / réactivation de comptes.
- Accès à **toutes** les offres (création, modification, suppression, attribution à un rédacteur).
- Accès à **toutes** les candidatures et décision acceptée / refusée.

### Offres d'emploi (Sprint 6)
- Table `offres` (voir `server/migrations/sprint-6-offres.sql` à appliquer sur une base existante).
- Routes : `GET /api/offres` (consultation), `GET /api/offres/gestion/mine` (gestion),
  `POST /api/offres`, `PUT /api/offres/:id`, `DELETE /api/offres/:id`.
- Champs : titre, entreprise, spécialité, lieu, salaire min/max, niveau d'expérience,
  description, exigences, statut (ouverte/fermée), dates de création et mise à jour.

### Candidatures (Sprint 6)
- Table `candidatures` (`server/migrations/sprint-6-candidatures.sql`), une candidature par offre et par candidat.
- Le candidat choisit un de ses dossiers existants (avec CV) et écrit un message de motivation.
- Routes : `POST /api/offres/:id/candidatures`, `GET /api/candidatures`,
  `GET /api/offres/:id/candidatures`, `PUT /api/candidatures/:id/statut`,
  `GET /api/candidatures/:id/cv`.
- Le rédacteur propriétaire de l'offre (ou l'admin) accepte ou refuse ; le CV reste
  accessible uniquement au candidat, au rédacteur concerné et à l'admin.
- Le bouton **Voir le CV** télécharge le PDF via l'API authentifiée (le JWT ne peut pas
  être envoyé par un simple lien) et l'affiche dans un lecteur intégré à la page.

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
