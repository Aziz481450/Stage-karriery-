-- Sprint 2/3/4 Karriery — tables complémentaires
-- Exécution idempotente : applicable sur une base existante.
USE karriery;

CREATE TABLE IF NOT EXISTS demandes(
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidat_id INT NOT NULL,
  redacteur_id INT NULL,
  cv_path VARCHAR(255) NOT NULL,
  titre_poste VARCHAR(255),
  score DECIMAL(5,2) NULL,
  analyse_json JSON NULL,
  statut ENUM('en_attente','en_cours','terminee','annulee') NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidat_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (redacteur_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_demandes_candidat (candidat_id),
  INDEX idx_demandes_redacteur (redacteur_id),
  INDEX idx_demandes_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications(
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

CREATE TABLE IF NOT EXISTS messages(
  id INT AUTO_INCREMENT PRIMARY KEY,
  demande_id INT NOT NULL,
  expediteur_id INT NOT NULL,
  contenu VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (expediteur_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_demande (demande_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fichiers(
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