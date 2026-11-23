import { useState } from 'react';
import api, { errMsg } from '../api';
import Icon from './Icon';
import Loader from './Loader';
import { initials } from '../layout/AppShell';

// Bouton « Voir le profil » des dossiers rédacteur : ouvre une fiche lisible
// du candidat (profil complet + photo), sans quitter la page des dossiers.
export default function VoirProfil({ demandeId }) {
  const [open, setOpen] = useState(false);
  const [profil, setProfil] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const show = async () => {
    setOpen(true); setBusy(true); setErr(''); setProfil(null);
    try {
      const r = await api.get(`/demandes/${demandeId}/profil`);
      setProfil(r.data);
    } catch (e) { setErr(errMsg(e)); }
    finally { setBusy(false); }
  };

  const close = () => { setOpen(false); setProfil(null); setErr(''); };

  const field = (label, value) => (
    <div className="profil-field"><small>{label}</small><b>{value || '—'}</b></div>
  );

  return (
    <>
      <button type="button" className="ghost sm" onClick={show} title="Voir le profil complet du candidat">
        <Icon name="user" size={14} /> Voir le profil
      </button>

      {open && (
        <div className="profil-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className="profil-modal" role="dialog" aria-modal="true" aria-label="Profil du candidat">
            <div className="profil-modal-head">
              <h2>Profil du candidat</h2>
              <button type="button" className="profil-close" onClick={close} aria-label="Fermer">
                <Icon name="x" size={17} />
              </button>
            </div>

            {busy && <div className="profil-body"><Loader size={44} /></div>}
            {!busy && err && <p className="err" role="alert" style={{ padding: 20 }}>{err}</p>}
            {!busy && profil && (
              <div className="profil-body">
                <div className="profil-identity">
                  <span className="profil-avatar">
                    {profil.photo && <img src={`/api/users/${profil.id}/photo`} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                    <span>{initials(profil.nom)}</span>
                  </span>
                  <div>
                    <h3>{profil.nom}</h3>
                    <p>{profil.titre_poste || profil.dossier_titre || 'Poste non précisé'}</p>
                    <span className="chip"><Icon name="mail" size={13} /> {profil.email}</span>
                  </div>
                </div>

                <div className="profil-grid">
                  {field('Téléphone', profil.telephone)}
                  {field('Ville', profil.ville)}
                  {field('Niveau d’études', profil.niveau_etudes)}
                  {field('Score IA', profil.score != null ? `${profil.score}/100` : null)}
                  {field('Inscrit le', profil.inscrit_le ? new Date(profil.inscrit_le).toLocaleDateString('fr-FR') : null)}
                  {field('Dossier', `n° ${profil.demande_id}`)}
                </div>

                {profil.competences && <div className="profil-block"><b>Compétences</b><p>{profil.competences}</p></div>}
                {profil.bio && <div className="profil-block"><b>Présentation</b><p>{profil.bio}</p></div>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
