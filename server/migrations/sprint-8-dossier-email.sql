-- Sprint 8 : dossier administrateur + envoi du CV amélioré par email
-- Stocke la version améliorée générée par l'IA et la date de son envoi au candidat.
ALTER TABLE demandes
  ADD COLUMN IF NOT EXISTS cv_ameliorer LONGTEXT NULL AFTER analyse_json,
  ADD COLUMN IF NOT EXISTS cv_ameliorer_path VARCHAR(255) NULL AFTER cv_ameliorer,
  ADD COLUMN IF NOT EXISTS cv_ameliorer_at TIMESTAMP NULL AFTER cv_ameliorer_path,
  ADD COLUMN IF NOT EXISTS cv_envoye_at TIMESTAMP NULL AFTER cv_ameliorer_at;
