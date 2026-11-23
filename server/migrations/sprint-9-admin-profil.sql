-- Sprint 9 : profil administrateur, au même format que les profils candidat/rédacteur.
CREATE TABLE IF NOT EXISTS admins(
  user_id INT PRIMARY KEY,
  telephone VARCHAR(30),
  ville VARCHAR(80),
  fonction VARCHAR(120),
  bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Les comptes admin créés avant cette migration récupèrent une ligne de profil vide.
INSERT IGNORE INTO admins(user_id) SELECT id FROM users WHERE role = 'admin';
