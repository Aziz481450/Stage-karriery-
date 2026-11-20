-- Sprint 6 : candidatures aux offres d'emploi
CREATE TABLE IF NOT EXISTS candidatures(
  id INT AUTO_INCREMENT PRIMARY KEY,
  offre_id INT NOT NULL,
  candidat_id INT NOT NULL,
  demande_id INT NOT NULL,
  message VARCHAR(2000) NOT NULL DEFAULT '',
  statut ENUM('en_attente','acceptee','refusee') NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_candidature (offre_id, candidat_id),
  FOREIGN KEY (offre_id) REFERENCES offres(id) ON DELETE CASCADE,
  FOREIGN KEY (candidat_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  INDEX idx_candidatures_candidat (candidat_id),
  INDEX idx_candidatures_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
