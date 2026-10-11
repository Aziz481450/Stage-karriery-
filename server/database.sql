CREATE DATABASE IF NOT EXISTS karriery CHARACTER SET utf8mb4;
USE karriery;
CREATE TABLE users(
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('candidat','redacteur','admin') NOT NULL,
  statut ENUM('actif','annule') NOT NULL DEFAULT 'actif',
  photo VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE candidats(
  user_id INT PRIMARY KEY,
  telephone VARCHAR(30), ville VARCHAR(80), titre_poste VARCHAR(120),
  niveau_etudes VARCHAR(80), competences TEXT, bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE redacteurs(
  user_id INT PRIMARY KEY,
  specialite VARCHAR(120), annees_experience INT DEFAULT 0, langues VARCHAR(160),
  bio TEXT, disponible TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE newsletter(
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== Sprint 2/3/4 =====
CREATE TABLE demandes(
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidat_id INT NOT NULL,
  redacteur_id INT NULL,
  cv_path VARCHAR(255) NOT NULL,
  titre_poste VARCHAR(255),
  score DECIMAL(5,2) NULL,
  analyse_json JSON NULL,
  statut ENUM('en_attente','en_cours','terminee','annulee','refusee') NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidat_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (redacteur_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_demandes_candidat (candidat_id),
  INDEX idx_demandes_redacteur (redacteur_id),
  INDEX idx_demandes_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS demande_refus(
  id INT AUTO_INCREMENT PRIMARY KEY,
  demande_id INT NOT NULL,
  redacteur_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_demande_refus (demande_id, redacteur_id),
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (redacteur_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refus_redacteur (redacteur_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE notifications(
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(30) NOT NULL,
  titre VARCHAR(160) NOT NULL,
  message TEXT,
  demande_id INT NULL,
  lue TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, lue)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE messages(
  id INT AUTO_INCREMENT PRIMARY KEY,
  demande_id INT NOT NULL,
  expediteur_id INT NOT NULL,
  contenu VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (expediteur_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_demande (demande_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE fichiers(
  id INT AUTO_INCREMENT PRIMARY KEY,
  demande_id INT NOT NULL,
  message_id INT NULL,
  expediteur_id INT NOT NULL,
  nom_original VARCHAR(255) NOT NULL,
  stockage VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  taille INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (expediteur_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_fichiers_demande (demande_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
