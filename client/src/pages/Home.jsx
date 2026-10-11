import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Typewriter from '../components/Typewriter';
import {
  IconUsers, IconFileUp, IconSparkles, IconUserCheck, IconChat, IconBell,
  IconUserPlus, IconUpload, IconCheckCircle, IconMail, IconPhone,
  IconArrowRight, IconPlay, IconChevronRight,
} from '../components/icons';
import './home.css';

/* À personnaliser */
const CEO = { nom: 'Halim Boussada', role: 'Fondateur et CEO de Karriery' };

const features = [
  { I: IconUsers, t: 'Espace dédié à chaque rôle', d: 'Candidats et rédacteurs ont chacun leur profil, avec les informations qui comptent pour leur travail.' },
  { I: IconFileUp, t: 'Dépôt de CV en PDF', d: 'Importez votre CV une fois : il est rattaché à votre dossier et visible par votre rédacteur.' },
  { I: IconSparkles, t: 'Analyse par intelligence artificielle', d: 'Un score sur 100 et des recommandations concrètes pour renforcer chaque partie de votre CV.' },
  { I: IconUserCheck, t: 'Rédacteur attribué automatiquement', d: 'Votre dossier est confié à un rédacteur selon sa spécialité et sa disponibilité.' },
  { I: IconChat, t: 'Messagerie et partage de fichiers', d: 'Échangez avec votre rédacteur et envoyez vos documents sans quitter la plateforme.' },
  { I: IconBell, t: 'Notifications en temps réel', d: 'Vous êtes prévenu à chaque nouveau message ou changement de statut de votre dossier.' },
];

const steps = [
  { I: IconUserPlus, t: 'Créez votre compte', d: 'Choisissez votre rôle et complétez votre profil.' },
  { I: IconUpload, t: 'Déposez votre CV', d: 'Importez votre CV au format PDF.' },
  { I: IconSparkles, t: 'Recevez l’analyse', d: 'L’IA note votre CV et un rédacteur est assigné.' },
  { I: IconCheckCircle, t: 'Finalisez ensemble', d: 'Échangez avec votre rédacteur jusqu’au CV final.' },
];

const conseils = [
  'Chiffrez vos réalisations dans chaque expérience.',
  'Ajoutez une section compétences techniques.',
  'Raccourcissez le résumé à 3 lignes.',
];

const anchors = ['fonctionnalites', 'parcours', 'ceo', 'apropos', 'contact'];

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const slides = [
  {
    k: 'Plateforme de CV',
    img: '/slide-1.jpeg',
    t: <>We lead your <em>professional path</em>.</>,
    d: 'Déposez votre CV. Une analyse par IA vous dit quoi améliorer, et un rédacteur expert le retravaille avec vous.',
    cta: { label: 'Commencer gratuitement', to: '/inscription' },
    ghost: { label: 'Voir la vidéo', href: '#ceo', play: true },
  },
  {
    k: 'Analyse par IA',
    img: '/slide-2.jpeg',
    t: <>Un score sur 100, <em>des pistes concrètes</em>.</>,
    d: 'Chaque section de votre CV est notée et commentée : ce qu’il faut renforcer, raccourcir ou chiffir.',
    cta: { label: 'Voir le parcours', href: '#parcours' },
    ghost: { label: 'Fonctionnalités', href: '#fonctionnalites' },
  },
  {
    k: 'Rédacteurs experts',
    img: '/slide-3.jpeg',
    t: <>Un rédacteur dédié, <em>jusqu’au CV final</em>.</>,
    d: 'Votre dossier est confié à un rédacteur selon sa spécialité. Vous échangez jusqu’à obtenir le CV qui vous ressemble.',
    cta: { label: 'Créer un compte', to: '/inscription' },
    ghost: { label: 'Nous contacter', href: '#contact' },
  },
];

export default function Home() {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [videoOk, setVideoOk] = useState(true);
  const [prog, setProg] = useState(0);
  const [active, setActive] = useState('');
  const [slide, setSlide] = useState(0);
  const [hold, setHold] = useState(false);
  const play = () => { videoRef.current?.play().catch(() => {}); setPlaying(true); };

  useEffect(() => {
    const onScroll = () => {
      const d = document.documentElement;
      const max = d.scrollHeight - d.clientHeight;
      setProg(max > 0 ? Math.min(1, d.scrollTop / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const reveals = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('is-in'));
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    }

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    anchors.forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

    const rev = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        rev.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => rev.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      spy.disconnect();
      rev.disconnect();
    };
  }, []);

  useEffect(() => {
    // Scroll vers les ancres quand on arrive depuis un lien interne (ex. footer via react-router)
    const onHash = () => {
      const id = window.location.hash.slice(1);
      if (id && anchors.includes(id))
        document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (hold || prefersReduced) return undefined;
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [hold]);

  const goto = (i) => setSlide((i + slides.length) % slides.length);

  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className="hnav" aria-label="Navigation principale">
        <Link to="/" aria-label="Karriery, accueil"><img src="/logo.png" alt="Karriery" className="logo" /></Link>
        <div className="hlinks">
          {anchors.map((id) => (
            <a key={id} href={`#${id}`} className={active === id ? 'on' : ''}>
              {{ fonctionnalites: 'Fonctionnalités', parcours: 'Parcours', ceo: 'Notre CEO', apropos: 'À propos', contact: 'Contact' }[id]}
            </a>
          ))}
        </div>
        <div className="hbtns">
          <Link to="/connexion" className="ghost">Se connecter</Link>
          <Link to="/inscription" className="cta">Créer un compte</Link>
        </div>
        <span className="hprog" style={{ transform: `scaleX(${prog})` }} aria-hidden="true" />
      </nav>

      {/* HERO */}
      <header className="h-hero">
        <div className="h-hero-text"
          onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
          onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
          <div className="h-slides">
            {slides.map((s, i) => (
              <div key={s.k} className={`h-slide${i === slide ? ' on' : ''}`} aria-hidden={i !== slide}>
                <span className="h-kicker">{s.k}</span>
                <h1>{s.t}</h1>
                <p>{s.d}</p>
                <div className="h-actions">
                  {s.cta.to
                    ? <Link className="cta" to={s.cta.to} tabIndex={i === slide ? 0 : -1}>{s.cta.label} <IconArrowRight size={17} /></Link>
                    : <a className="cta" href={s.cta.href} tabIndex={i === slide ? 0 : -1}>{s.cta.label} <IconArrowRight size={17} /></a>}
                  <a className="ghost" href={s.ghost.href} tabIndex={i === slide ? 0 : -1}>
                    {s.ghost.play && <IconPlay size={14} />} {s.ghost.label}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="h-ctrl">
            <span className="h-count"><b>{String(slide + 1).padStart(2, '0')}</b> / {String(slides.length).padStart(2, '0')}</span>
            <div className="h-dots">
              {slides.map((s, i) => (
                <button key={s.k} type="button" className={`h-dot${i === slide ? ' on' : ''}`}
                  onClick={() => goto(i)} aria-label={`Aller à : ${s.k}`} aria-current={i === slide}>
                  <span />
                </button>
              ))}
            </div>
            <div className="h-arrows">
              <button type="button" className="h-arrow prev" onClick={() => goto(slide - 1)} aria-label="Précédent">
                <IconChevronRight size={17} />
              </button>
              <button type="button" className="h-arrow" onClick={() => goto(slide + 1)} aria-label="Suivant">
                <IconChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>

        <div className="h-visual">
          {slides.map((s, i) => (
            <img key={s.img} src={s.img} alt="" decoding="async"
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`h-img${i === slide ? ' on' : ''}`} aria-hidden={i !== slide} />
          ))}
        </div>
      </header>

      {/* FONCTIONNALITÉS */}
      <section id="fonctionnalites" className="sec feat-wrap">
        <div className="feat-side" data-reveal>
          <h2 className="sec-title">Tout ce qu’il faut pour un CV qui convainc.</h2>
          <div className="mock" role="img" aria-label="Exemple d'analyse de CV : score de 78 sur 100">
            <div className="mock-head"><b>Analyse de votre CV</b><small>Exemple</small></div>
            <div className="score">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="52" className="ring-bg" />
                <circle cx="60" cy="60" r="52" className="ring" />
              </svg>
              <div><strong>78</strong><span>/100</span></div>
            </div>
            <ul>
              {conseils.map((c) => (
                <li key={c}><IconChevronRight size={18} />{c}</li>
              ))}
            </ul>
          </div>
        </div>
        <ul className="feat">
          {features.map(({ I, t, d }, i) => (
            <li key={t} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="feat-head"><span className="ico"><I /></span><h3>{t}</h3></div>
              <p>{d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* PARCOURS */}
      <section id="parcours" className="sec">
        <h2 className="sec-title" data-reveal>Du premier clic au CV final.</h2>
        <ol className="steps" data-reveal>
          {steps.map(({ I, t, d }, i) => (
            <li key={t}>
              <span className="num">{i + 1}</span>
              <span className="ico"><I size={20} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* VIDÉO CEO */}
      <section id="ceo" className="ceo">
        <div className="ceo-in">
          <div className="ceo-text" data-reveal>
            <span className="ceo-quote" aria-hidden="true">“</span>
            <h2 className="sec-title light">Le mot de notre CEO</h2>
            <p>Découvrez la vision de Karriery et la façon dont nous accompagnons chaque candidat.</p>
            <p className="who"><b>{CEO.nom}</b><br />{CEO.role}</p>
          </div>
          <div className="video" data-reveal>
            <video ref={videoRef} src="/ceo.mp4" controls={playing} preload="metadata"
              playsInline onError={() => { setVideoOk(false); setPlaying(false); }}
              onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
            {!playing && videoOk && (
              <button className="play" onClick={play} aria-label="Lire la vidéo du CEO">
                <IconPlay size={34} />
              </button>
            )}
            {!videoOk && <p className="video-soon">La vidéo sera bientôt disponible.</p>}
          </div>
        </div>
      </section>

      {/* À PROPOS + LOGO */}
      <section id="apropos" className="sec about">
        <div className="about-logo" data-reveal><img src="/logo.png" alt="Logo Karriery" loading="lazy" /></div>
        <div data-reveal>
          <h2 className="sec-title">À propos de Karriery</h2>
          <p className="lede">Karriery accompagne les candidats dans la construction de leur parcours professionnel, en réunissant l’analyse par IA et l’expertise de rédacteurs humains.</p>
          <p className="muted">Notre promesse tient en une phrase : <Typewriter words={['we lead your professional path', 'un CV, entre de bonnes mains', 'une analyse qui parle pour vous']} /></p>
          <ul className="about-list">
            <li><span className="ico"><IconSparkles size={20} /></span>Analyse automatisée de votre CV</li>
            <li><span className="ico"><IconUserCheck size={20} /></span>Rédacteurs humains dédiés</li>
            <li><span className="ico"><IconChat size={20} /></span>Échanges jusqu’au CV final</li>
          </ul>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="band" data-reveal>
        <h2>Prêt à faire avancer votre carrière ?</h2>
        <div className="band-actions">
          <Link to="/inscription" className="cta-w">Créer mon compte <IconArrowRight size={18} /></Link>
          <a href="mailto:info@karriery.com" className="band-link"><IconMail size={17} /> info@karriery.com</a>
          <a href="tel:+21658065605" className="band-link"><IconPhone size={17} /> +216 58 065 605</a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
