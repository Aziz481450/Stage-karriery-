import { useState } from 'react';
import Icon from './Icon';

const CATEGORIES = ['frontend', 'backend', 'fullstack', 'mobile', 'ai', 'iot', 'embedded', 'autre'];
const newStory = () => ({ titre: '', texte: '' });

const EMPTY = {
  objet: 'Karriery Newsletter — nouvelles opportunités',
  intro: 'Bonjour,\n\nVoici la sélection du moment : un nouveau poste, des analyses du marché local et des parcours qui inspirent.',
  includeOffer: true,
  offreId: '',
  offreTitre: '',
  offreEntreprise: '',
  offreCategorie: '',
  offreLieu: '',
  offreSalaireMin: '',
  offreSalaireMax: '',
  offreExperience: '',
  offreDescription: '',
  offreLien: '',
  includeCareer: false,
  careerTitre: 'Career story — un parcours inspirant',
  careerTexte: '',
  includeMarket: false,
  marketTitre: 'Local market insight',
  marketTexte: '',
  marketChiffre: '',
  marketLibelle: '',
  includeSuccess: false,
  successTitre: 'Success stories',
  stories: [newStory()],
  includeWriter: false,
  writerId: '',
  writerNom: '',
  writerSpecialite: '',
  writerAvant: '',
  writerApres: '',
  writerPermission: false,
  writerCtaLabel: 'Book this writer',
  writerCtaUrl: '',
};

export default function NewsletterComposer({ offers = [], writers = [], subscriberCount = 0, busy, onSend, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    writerCtaUrl: `${window.location.origin}/candidat/dossiers`,
  }));
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const applyOffer = (id) => {
    const offer = offers.find((o) => String(o.id) === String(id));
    set('offreId', id);
    if (!offer) return;
    setForm((f) => ({
      ...f,
      offreId: id,
      offreTitre: offer.titre || '',
      offreEntreprise: offer.entreprise || '',
      offreCategorie: CATEGORIES.includes(offer.categorie) ? offer.categorie : 'autre',
      offreLieu: offer.lieu || '',
      offreSalaireMin: offer.salaire_min == null ? '' : String(offer.salaire_min),
      offreSalaireMax: offer.salaire_max == null ? '' : String(offer.salaire_max),
      offreExperience: offer.niveau_experience || '',
      offreDescription: offer.description || '',
      offreLien: `${window.location.origin}/candidat/offres?offre=${offer.id}`,
    }));
  };

  const applyWriter = (id) => {
    const writer = writers.find((w) => String(w.id) === String(id));
    set('writerId', id);
    if (!writer) return;
    setForm((f) => ({
      ...f,
      writerId: id,
      writerNom: writer.nom || '',
      writerSpecialite: writer.specialite || (writer.annees_experience ? `${writer.annees_experience} ans d’expérience` : ''),
      writerCtaUrl: `${window.location.origin}/candidat/dossiers?writer=${writer.id}`,
    }));
  };

  const updateStory = (index, key, value) =>
    setForm((f) => ({ ...f, stories: f.stories.map((s, i) => (i === index ? { ...s, [key]: value } : s)) }));
  const addStory = () => setForm((f) => ({ ...f, stories: [...f.stories, newStory()] }));
  const removeStory = (index) =>
    setForm((f) => ({ ...f, stories: f.stories.filter((_, i) => i !== index) }));

  const submit = (e) => {
    e.preventDefault();
    onSend({
      objet: form.objet,
      intro: form.intro,
      offre: {
        enabled: form.includeOffer,
        titre: form.offreTitre,
        entreprise: form.offreEntreprise,
        categorie: form.offreCategorie,
        lieu: form.offreLieu,
        salaire_min: form.offreSalaireMin,
        salaire_max: form.offreSalaireMax,
        experience: form.offreExperience,
        description: form.offreDescription,
        lien: form.offreLien,
      },
      carriere: { enabled: form.includeCareer, titre: form.careerTitre, texte: form.careerTexte },
      marche: {
        enabled: form.includeMarket,
        titre: form.marketTitre,
        texte: form.marketTexte,
        chiffre: form.marketChiffre,
        libelle: form.marketLibelle,
      },
      succes: { enabled: form.includeSuccess, titre: form.successTitre, stories: form.stories },
      ecrivain: {
        enabled: form.includeWriter,
        nom: form.writerNom,
        specialite: form.writerSpecialite,
        avant: form.writerAvant,
        apres: form.writerApres,
        permission: form.writerPermission,
        cta_label: form.writerCtaLabel,
        cta_url: form.writerCtaUrl,
      },
    });
  };

  const toggle = (key) => set(key, !form[key]);

  return (
    <form className="news-composer" onSubmit={submit}>
      <div className="news-composer-head">
        <div>
          <h2>Créer une newsletter</h2>
          <p className="muted">{subscriberCount} inscrit{subscriberCount > 1 ? 's' : ''} recevront cette campagne par email.</p>
        </div>
        <button type="button" className="admin-icon-btn" onClick={onCancel} aria-label="Fermer le composeur"><Icon name="x" size={17} /></button>
      </div>

      <div className="admin-form news-basics">
        <label className="full">Objet de l’email
          <input value={form.objet} onChange={(e) => set('objet', e.target.value)} minLength={3} maxLength={200} required />
        </label>
        <label className="full">Introduction
          <textarea rows="3" value={form.intro} onChange={(e) => set('intro', e.target.value)} maxLength={3000} />
        </label>
      </div>

      {/* 1. Nouvelle offre d'emploi */}
      <section className={`news-block ${form.includeOffer ? 'on' : ''}`}>
        <label className="news-toggle">
          <input type="checkbox" checked={form.includeOffer} onChange={() => toggle('includeOffer')} />
          <span><b>1. Nouvelle offre d’emploi</b><small>Poste, entreprise, salaire, lieu et lien de candidature</small></span>
        </label>
        {form.includeOffer && (
          <div className="admin-form-grid">
            <label className="full">Reprendre une offre existante
              <select value={form.offreId} onChange={(e) => applyOffer(e.target.value)}>
                <option value="">— Saisir manuellement —</option>
                {offers.map((o) => <option key={o.id} value={o.id}>{o.titre} · {o.entreprise}</option>)}
              </select>
            </label>
            <label>Intitulé du poste
              <input value={form.offreTitre} onChange={(e) => set('offreTitre', e.target.value)} minLength={3} maxLength={180} required />
            </label>
            <label>Entreprise
              <input value={form.offreEntreprise} onChange={(e) => set('offreEntreprise', e.target.value)} minLength={2} maxLength={160} required />
            </label>
            <label>Spécialité
              <select value={form.offreCategorie} onChange={(e) => set('offreCategorie', e.target.value)} required>
                <option value="">— Choisir —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>Lieu
              <input value={form.offreLieu} onChange={(e) => set('offreLieu', e.target.value)} maxLength={160} placeholder="Tunis, remote…" />
            </label>
            <label>Salaire minimum (€)
              <input type="number" min="0" value={form.offreSalaireMin} onChange={(e) => set('offreSalaireMin', e.target.value)} required />
            </label>
            <label>Salaire maximum (€)
              <input type="number" min="0" value={form.offreSalaireMax} onChange={(e) => set('offreSalaireMax', e.target.value)} required />
            </label>
            <label>Niveau d’expérience
              <input value={form.offreExperience} onChange={(e) => set('offreExperience', e.target.value)} maxLength={80} placeholder="Junior, 3 ans…" />
            </label>
            <label className="full">Description du poste
              <textarea rows="3" value={form.offreDescription} onChange={(e) => set('offreDescription', e.target.value)} minLength={10} maxLength={4000} required />
            </label>
            <label className="full">Lien de l’offre / candidature
              <input value={form.offreLien} onChange={(e) => set('offreLien', e.target.value)} maxLength={2000} placeholder="https://…" />
            </label>
          </div>
        )}
      </section>

      {/* 2. Career story */}
      <section className={`news-block ${form.includeCareer ? 'on' : ''}`}>
        <label className="news-toggle">
          <input type="checkbox" checked={form.includeCareer} onChange={() => toggle('includeCareer')} />
          <span><b>2. Career story</b><small>Le récit de parcours qui donnera envie de postuler</small></span>
        </label>
        {form.includeCareer && (
          <div className="admin-form-grid">
            <label className="full">Titre
              <input value={form.careerTitre} onChange={(e) => set('careerTitre', e.target.value)} maxLength={160} required />
            </label>
            <label className="full">Récit
              <textarea rows="4" value={form.careerTexte} onChange={(e) => set('careerTexte', e.target.value)} minLength={10} maxLength={6000} required />
            </label>
          </div>
        )}
      </section>

      {/* 3. Local market insight */}
      <section className={`news-block ${form.includeMarket ? 'on' : ''}`}>
        <label className="news-toggle">
          <input type="checkbox" checked={form.includeMarket} onChange={() => toggle('includeMarket')} />
          <span><b>3. Local market insight</b><small>Une donnée chiffrée et son interprétation</small></span>
        </label>
        {form.includeMarket && (
          <div className="admin-form-grid">
            <label className="full">Titre
              <input value={form.marketTitre} onChange={(e) => set('marketTitre', e.target.value)} maxLength={160} required />
            </label>
            <label>Indicateur (ex. +32 %)
              <input value={form.marketChiffre} onChange={(e) => set('marketChiffre', e.target.value)} maxLength={40} />
            </label>
            <label>Libellé de l’indicateur
              <input value={form.marketLibelle} onChange={(e) => set('marketLibelle', e.target.value)} maxLength={120} />
            </label>
            <label className="full">Analyse
              <textarea rows="3" value={form.marketTexte} onChange={(e) => set('marketTexte', e.target.value)} minLength={10} maxLength={6000} required />
            </label>
          </div>
        )}
      </section>

      {/* 4. Success stories */}
      <section className={`news-block ${form.includeSuccess ? 'on' : ''}`}>
        <label className="news-toggle">
          <input type="checkbox" checked={form.includeSuccess} onChange={() => toggle('includeSuccess')} />
          <span><b>4. Success stories</b><small>Témoignages de candidats accompagnés</small></span>
        </label>
        {form.includeSuccess && (
          <div className="admin-form">
            <label>Titre de la rubrique
              <input value={form.successTitre} onChange={(e) => set('successTitre', e.target.value)} maxLength={160} />
            </label>
            {form.stories.map((story, i) => (
              <div className="news-story" key={i}>
                <div className="news-story-head">
                  <b>Témoignage {i + 1}</b>
                  <button type="button" className="link" disabled={form.stories.length === 1} onClick={() => removeStory(i)}>Supprimer</button>
                </div>
                <label>Titre
                  <input value={story.titre} onChange={(e) => updateStory(i, 'titre', e.target.value)} maxLength={160} required />
                </label>
                <label>Récit
                  <textarea rows="3" value={story.texte} onChange={(e) => updateStory(i, 'texte', e.target.value)} minLength={10} maxLength={3000} required />
                </label>
              </div>
            ))}
            <button type="button" className="admin-btn ghost" onClick={addStory} disabled={form.stories.length >= 6}>
              <Icon name="plus" size={15} /> Ajouter un témoignage
            </button>
          </div>
        )}
      </section>

      {/* 5. Spotlight on the writers */}
      <section className={`news-block ${form.includeWriter ? 'on' : ''}`}>
        <label className="news-toggle">
          <input type="checkbox" checked={form.includeWriter} onChange={() => toggle('includeWriter')} />
          <span><b>5. Spotlight on the writers</b><small>Portrait d’un expert, exemple avant/après et bouton « Book this writer »</small></span>
        </label>
        {form.includeWriter && (
          <div className="admin-form-grid">
            <label className="full">Choisir un rédacteur actif
              <select value={form.writerId} onChange={(e) => applyWriter(e.target.value)} required>
                <option value="">— Choisir —</option>
                {writers.map((w) => <option key={w.id} value={w.id}>{w.nom}{w.specialite ? ` · ${w.specialite}` : ''}</option>)}
              </select>
            </label>
            <label>Nom du rédacteur
              <input value={form.writerNom} onChange={(e) => set('writerNom', e.target.value)} minLength={2} maxLength={160} required />
            </label>
            <label>Spécialité
              <input value={form.writerSpecialite} onChange={(e) => set('writerSpecialite', e.target.value)} maxLength={160} required />
            </label>
            <label>Exemple de CV — avant
              <textarea rows="3" value={form.writerAvant} onChange={(e) => set('writerAvant', e.target.value)} minLength={5} maxLength={3000} required />
            </label>
            <label>Exemple de CV — après
              <textarea rows="3" value={form.writerApres} onChange={(e) => set('writerApres', e.target.value)} minLength={5} maxLength={3000} required />
            </label>
            <label className="full news-permission">
              <input type="checkbox" checked={form.writerPermission} onChange={(e) => set('writerPermission', e.target.checked)} required />
              <span>J’ai l’autorisation du rédacteur et du candidat pour publier cet exemple avant/après.</span>
            </label>
            <label>Libellé du bouton
              <input value={form.writerCtaLabel} onChange={(e) => set('writerCtaLabel', e.target.value)} maxLength={80} />
            </label>
            <label>Lien du bouton
              <input value={form.writerCtaUrl} onChange={(e) => set('writerCtaUrl', e.target.value)} maxLength={2000} required />
            </label>
          </div>
        )}
      </section>

      <div className="dossier-actions news-submit">
        <button type="submit" className="admin-btn primary" disabled={busy || subscriberCount === 0}>
          <Icon name="send" size={15} /> {busy ? 'Envoi en cours…' : `Envoyer aux ${subscriberCount} inscrit${subscriberCount > 1 ? 's' : ''}`}
        </button>
        <button type="button" className="admin-btn ghost" onClick={onCancel}>Annuler</button>
        <span className="muted">L’expéditeur est « Karriery Newsletter ». Sans SMTP, l’email est journalisé en mode test.</span>
      </div>
    </form>
  );
}
