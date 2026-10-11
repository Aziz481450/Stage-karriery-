-- Sprint 5 — Workflow demande → acceptation/refus par le rédacteur.
-- Exécution idempotente sur la base karriery.
USE karriery;

ALTER TABLE demandes
  MODIFY COLUMN statut ENUM('en_attente','en_cours','terminee','annulee','refusee') NOT NULL DEFAULT 'en_attente';

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