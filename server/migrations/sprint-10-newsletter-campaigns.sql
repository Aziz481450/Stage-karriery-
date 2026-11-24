-- Sprint 10 : création et historique des campagnes de newsletter envoyées
-- depuis le panneau administrateur.
CREATE TABLE IF NOT EXISTS newsletter_campagnes(
  id INT AUTO_INCREMENT PRIMARY KEY,
  objet VARCHAR(200) NOT NULL,
  contenu_json LONGTEXT NOT NULL,
  destinataires INT NOT NULL DEFAULT 0,
  succes INT NOT NULL DEFAULT 0,
  echecs INT NOT NULL DEFAULT 0,
  mode VARCHAR(10) NOT NULL,
  expediteur VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
