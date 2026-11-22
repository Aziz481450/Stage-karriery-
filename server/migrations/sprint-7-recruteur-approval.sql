-- Sprint 7 : validation des comptes rédacteurs par l'administrateur
-- Les nouveaux rédacteurs sont créés avec le statut 'en_attente' (voir controllers/auth.js)
-- et ne peuvent pas se connecter tant qu'un admin ne les a pas approuvés.
ALTER TABLE users
  MODIFY COLUMN statut ENUM('en_attente','actif','annule') NOT NULL DEFAULT 'actif';
