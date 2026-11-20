-- Sprint 6 : offres d'emploi CRUD (rédacteurs, admin, consultation candidat)
CREATE TABLE IF NOT EXISTS offres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  redacteur_id INT NOT NULL,
  titre VARCHAR(180) NOT NULL,
  entreprise VARCHAR(160) NOT NULL,
  categorie ENUM('frontend','backend','fullstack','mobile','ai','iot','embedded') NOT NULL,
  lieu VARCHAR(160) NOT NULL DEFAULT '',
  salaire_min INT NULL,
  salaire_max INT NULL,
  niveau_experience VARCHAR(80) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  exigences TEXT NOT NULL,
  statut ENUM('ouverte','fermee') NOT NULL DEFAULT 'ouverte',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (redacteur_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_offres_categorie (categorie),
  INDEX idx_offres_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
