-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: karriery
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `candidats`
--

DROP TABLE IF EXISTS `candidats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `candidats` (
  `user_id` int(11) NOT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `ville` varchar(80) DEFAULT NULL,
  `titre_poste` varchar(120) DEFAULT NULL,
  `niveau_etudes` varchar(80) DEFAULT NULL,
  `competences` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `candidats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidats`
--

LOCK TABLES `candidats` WRITE;
/*!40000 ALTER TABLE `candidats` DISABLE KEYS */;
INSERT INTO `candidats` VALUES (2,'29966826','tunis','devellopeur','bac+5',NULL,NULL),(100,NULL,NULL,'Developpeur Web',NULL,NULL,NULL),(102,NULL,NULL,NULL,NULL,NULL,NULL),(103,NULL,'Tunis','Développeur Web',NULL,'React, Node.js',NULL),(104,NULL,'Tunis','Développeur Web',NULL,'React, Node.js',NULL),(105,NULL,'Tunis','Développeur Web',NULL,'React, Node.js',NULL),(106,NULL,'Tunis','Développeur Web',NULL,'React, Node.js',NULL),(176,NULL,NULL,NULL,NULL,NULL,NULL),(178,NULL,NULL,NULL,NULL,NULL,NULL),(236,NULL,NULL,NULL,NULL,NULL,NULL),(261,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `candidats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demande_refus`
--

DROP TABLE IF EXISTS `demande_refus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `demande_refus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `demande_id` int(11) NOT NULL,
  `redacteur_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_demande_refus` (`demande_id`,`redacteur_id`),
  KEY `idx_refus_redacteur` (`redacteur_id`),
  CONSTRAINT `demande_refus_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `demande_refus_ibfk_2` FOREIGN KEY (`redacteur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demande_refus`
--

LOCK TABLES `demande_refus` WRITE;
/*!40000 ALTER TABLE `demande_refus` DISABLE KEYS */;
/*!40000 ALTER TABLE `demande_refus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demandes`
--

DROP TABLE IF EXISTS `demandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `demandes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidat_id` int(11) NOT NULL,
  `redacteur_id` int(11) DEFAULT NULL,
  `cv_path` varchar(255) NOT NULL,
  `titre_poste` varchar(255) DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `analyse_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`analyse_json`)),
  `statut` enum('en_attente','en_cours','terminee','annulee','refusee') NOT NULL DEFAULT 'en_attente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cv_ameliorer` text DEFAULT NULL,
  `cv_ameliorer_path` varchar(255) DEFAULT NULL,
  `cv_ameliorer_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_demandes_candidat` (`candidat_id`),
  KEY `idx_demandes_redacteur` (`redacteur_id`),
  KEY `idx_demandes_statut` (`statut`),
  CONSTRAINT `demandes_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `demandes_ibfk_2` FOREIGN KEY (`redacteur_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demandes`
--

LOCK TABLES `demandes` WRITE;
/*!40000 ALTER TABLE `demandes` DISABLE KEYS */;
INSERT INTO `demandes` VALUES (33,2,NULL,'cvs/cv_1791367400975_d96fe5533f53.pdf','devellopeur',88.00,'{\"score\":88,\"forces\":[\"Une expérience professionnelle est décrite dans le CV.\",\"Parcours de formation mentionné.\"],\"faiblesses\":[\"Pas de section compétences dédiée.\"],\"recommandations\":[\"Quantifiez vos réalisations (% , budgets, équipes, chiffres).\",\"Créez une section « Compétences » en adéquation avec le poste.\",\"Vérifiez que vos coordonnées sont bien visibles en tête du CV.\",\"Mettez en avant les mots-clés liés au poste visé : devellopeur.\"],\"provider\":\"local\"}','en_cours','2026-10-07 10:03:20','2026-10-07 10:03:20',NULL,NULL,NULL),(74,2,87,'cvs/cv_1791380797701_c9cd85af6863.pdf','devellopeur',88.00,'{\"score\":88,\"forces\":[\"Une expérience professionnelle est décrite dans le CV.\",\"Parcours de formation mentionné.\"],\"faiblesses\":[\"Pas de section compétences dédiée.\"],\"recommandations\":[\"Quantifiez vos réalisations (% , budgets, équipes, chiffres).\",\"Créez une section « Compétences » en adéquation avec le poste.\",\"Vérifiez que vos coordonnées sont bien visibles en tête du CV.\",\"Mettez en avant les mots-clés liés au poste visé : devellopeur.\"],\"provider\":\"local\"}','terminee','2026-10-07 13:46:37','2026-10-07 15:23:22','# MOHAMED AZIZ BEN HMIDA Développeur Full-Stack\n## Profil\nDéveloppeur Full-Stack spécialisé dans la conception d\'applications web complètes, avec une expertise croissante en intégration d\'intelligence artificielle. Auteur de plusieurs projets full-stack aboutis déployés en production.\n\n## Expérience professionnelle\n### Tunisia Heritage Intelligence\n- Conception et déploiement en production (HTTPS, PythonAnywhere) d\'une application Django complète : bibliothèque numérique de livres historiques, panneau d\'administration et API REST.\n- Développement d\'un chatbot IA bilingue (français / arabe) reposant sur Ollama en local avec bascule automatique vers l\'API Gemini.\n- Création d\'un générateur de scripts narratifs pour documentaires culturels et d\'un module de dons avec suivi de projets, statistiques et moyens de paiement multiples.\n\n### BudgetFlow\n- Développement d\'une architecture MVC maison en PHP 8.3, conteneurisée avec Docker (Nginx, PHP-FPM, Ollama) et connectée à une base PostgreSQL 16.\n- Conception d\'un tableau de bord analytique (revenus, dépenses, solde, taux d\'épargne) avec visualisations Chart.js, budgets personnels et partagés, suivi de consommation en temps réel.\n- Intégration d\'un assistant conversationnel basé sur un modèle de langage local (Ollama), exploitant les données financières réelles de l\'utilisateur, et mise en place d\'une authentification sécurisée (sessions, bcrypt, CSRF).\n\n### Souk Zitouna\n- Développement d\'un frontend React.js (Vite, Tailwind CSS) connecté à un backend ASP.NET Core 8 avec authentification JWT et base de données MongoDB.\n- Conception d\'un panneau d\'administration complet : gestion des commandes et des stocks, analyses graphiques (Recharts), suivi des livraisons.\n- Mise en valeur de cinq peintres tunisiens historiques avec cartes interactives OpenStreetMap ; conteneurisation complète (MongoDB + API + Nginx) en un seul conteneur Docker.\n\n### Plateforme de don solidaire pour la Palestine\n- Conception et développement d\'un site web de collection de dons.\n\n## Compétences\n- Développement full-stack avec Python, Django, PHP, ASP.NET Core, React.js, Node.js, Express.js\n- Intelligence artificielle : Intégration de LLM (Ollama en local, API Gemini), chatbots conversationnels contextuels\n- Déploiement cloud : PythonAnywhere, Docker, Nginx, Git/GitHub\n- Sécurité applicative : Authentification JWT, hachage bcrypt, protection CSRF, gestion des rôles utilisateurs\n- Conception web : React.js, HTML5, CSS3, Tailwind CSS, Bootstrap, design responsive\n- Bases de données : PostgreSQL, MongoDB, MySQL, SQLite\n- Langages : JavaScript, Python, PHP, Java, C#, C++, SQL\n\n## Formation\n- Cycle ingénieur informatique, [Université Tunisienne, Tunis, Tunisie] (2020-2024)\n\n## Langues et certifications\n- Français (niveau avancé)\n- Arabe (niveau avancé)\n- Certificat en développement web, [Institut des métiers de l\'information, Tunis, Tunisie] (2022)','cvs/cv_amel_1791386602977_543c96b998fd.pdf','2026-10-07 16:23:22');
/*!40000 ALTER TABLE `demandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fichiers`
--

DROP TABLE IF EXISTS `fichiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fichiers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `demande_id` int(11) NOT NULL,
  `message_id` int(11) DEFAULT NULL,
  `expediteur_id` int(11) NOT NULL,
  `nom_original` varchar(255) NOT NULL,
  `stockage` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `taille` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `message_id` (`message_id`),
  KEY `expediteur_id` (`expediteur_id`),
  KEY `idx_fichiers_demande` (`demande_id`),
  CONSTRAINT `fichiers_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fichiers_ibfk_2` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fichiers_ibfk_3` FOREIGN KEY (`expediteur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fichiers`
--

LOCK TABLES `fichiers` WRITE;
/*!40000 ALTER TABLE `fichiers` DISABLE KEYS */;
INSERT INTO `fichiers` VALUES (13,33,42,2,'CV_Mohamed_Aziz_Ben_Hmida-1 (3).pdf','fichiers/f_1791368491532_5f8a768b9309.pdf','application/pdf',66045,'2026-10-07 10:21:31');
/*!40000 ALTER TABLE `fichiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `demande_id` int(11) NOT NULL,
  `expediteur_id` int(11) NOT NULL,
  `contenu` varchar(2000) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `expediteur_id` (`expediteur_id`),
  KEY `idx_messages_demande` (`demande_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`expediteur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (42,33,2,'esque le cv est améliorer','2026-10-07 10:21:31'),(63,74,2,'bonjour mr fawzi','2026-10-11 20:09:36');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter`
--

DROP TABLE IF EXISTS `newsletter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `newsletter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(160) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter`
--

LOCK TABLES `newsletter` WRITE;
/*!40000 ALTER TABLE `newsletter` DISABLE KEYS */;
INSERT INTO `newsletter` VALUES (9,'azizb9598@gmail.com','2026-10-11 21:29:10');
/*!40000 ALTER TABLE `newsletter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` varchar(30) NOT NULL,
  `titre` varchar(160) NOT NULL,
  `message` text DEFAULT NULL,
  `demande_id` int(11) DEFAULT NULL,
  `lue` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `demande_id` (`demande_id`),
  KEY `idx_notifications_user` (`user_id`,`lue`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`demande_id`) REFERENCES `demandes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=431 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (150,2,'demande','Demande envoyée','Votre CV a été envoyé : un rédacteur a été affecté à votre dossier.',33,1,'2026-10-07 10:03:20'),(304,2,'statut','CV amélioré prêt','Le rédacteur a généré une version améliorée de votre CV (dossier n° 74).',74,1,'2026-10-07 14:40:25'),(305,2,'statut','CV amélioré prêt','Le rédacteur a généré une version améliorée de votre CV (dossier n° 74).',74,1,'2026-10-07 14:42:24'),(315,2,'statut','CV amélioré prêt','Le rédacteur a généré une version améliorée de votre CV (dossier n° 74).',74,1,'2026-10-07 14:54:45'),(316,2,'statut','CV amélioré prêt','Le rédacteur a généré une version améliorée de votre CV (dossier n° 74).',74,1,'2026-10-07 14:56:03'),(323,2,'statut','CV amélioré prêt','Le rédacteur a généré une version améliorée de votre CV (dossier n° 74).',74,1,'2026-10-07 15:20:34'),(324,2,'statut','Dossier accepté','Le rédacteur fawzi a accepté votre dossier n° 74. Vous pouvez échanger directement avec lui.',74,1,'2026-10-07 15:22:27'),(325,2,'statut','Mise à jour du dossier','Le statut de votre demande n° 74 est passé à : terminee.',74,1,'2026-10-07 15:22:34'),(326,2,'statut','CV amélioré prêt','Le rédacteur a généré une version améliorée de votre CV (dossier n° 74).',74,1,'2026-10-07 15:23:22'),(378,87,'message','Nouveau message','Vous avez reçu un message de la part de la demande n° 74.',74,1,'2026-10-11 20:09:36');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `redacteurs`
--

DROP TABLE IF EXISTS `redacteurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `redacteurs` (
  `user_id` int(11) NOT NULL,
  `specialite` varchar(120) DEFAULT NULL,
  `annees_experience` int(11) DEFAULT 0,
  `langues` varchar(160) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `disponible` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `redacteurs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `redacteurs`
--

LOCK TABLES `redacteurs` WRITE;
/*!40000 ALTER TABLE `redacteurs` DISABLE KEYS */;
INSERT INTO `redacteurs` VALUES (87,NULL,0,NULL,NULL,1);
/*!40000 ALTER TABLE `redacteurs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `role` enum('candidat','redacteur','admin') NOT NULL,
  `statut` enum('actif','annule') NOT NULL DEFAULT 'actif',
  `photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=274 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'mohamed','mohamed@gmail.com','$2b$10$Wf4a/mehSFZjYTM5QrJwre6KPKPjGkup92lSCFpGUisd/XhiSKhwi','candidat','actif','avatars/av_1791748127293_357fae640b9d.png','2026-10-06 19:07:48'),(4,'Admin Karriery','admin@karriery.tn','$2b$10$DieN7luJFRHvzrNa/z6FUuheax1OPj9vD2X36yFwfj9FS4jZV3DIu','admin','actif',NULL,'2026-10-06 19:29:15'),(87,'fawzi','fawzi@gmail.com','$2b$10$u09i.7yEzNo5D7Zf3JOa4e2gmIMZAXcNPx1Gw8ghUARbUmSFJsOE6','redacteur','actif',NULL,'2026-10-07 10:04:39'),(236,'Dbg','mv47mr7ud@karriery.tmp','$2b$10$4vlSfcxAtToW3BcKhmWvhuBkdIEAURxXBldqwaQ01USB9X7AwZlOm','candidat','actif',NULL,'2026-10-11 19:22:26'),(261,'medaziz','mohamedazizbenhamida04@gmail.com','$2b$10$Cnxg.SaI1mbIS/BDfPlhcOCCgiDZz0SsGbpTDExg8mBPGNNAlNLZ6','candidat','actif',NULL,'2026-10-11 20:45:50');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-11 22:51:55
