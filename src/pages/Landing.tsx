import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ── Custom Cursor ─────────────────────────────────────────────────────────────
function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const followerPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', move);
    let raf: number;
    const follow = () => {
      followerPos.current.x += (pos.current.x - followerPos.current.x) * 0.12;
      followerPos.current.y += (pos.current.y - followerPos.current.y) * 0.12;
      if (followerRef.current) {
        followerRef.current.style.left = followerPos.current.x + 'px';
        followerRef.current.style.top = followerPos.current.y + 'px';
      }
      raf = requestAnimationFrame(follow);
    };
    follow();
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="cursor" />
      <div ref={followerRef} className="cursor-follower" />
    </>
  );
}

// ── Canvas Particle System ────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.35 + 0.05,
      });
    }

    let mouse = { x: W / 2, y: H / 2 };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,208,132,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        // mouse attraction
        const mdx = mouse.x - particles[i].x;
        const mdy = mouse.y - particles[i].y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 160) {
          particles[i].vx += (mdx / md) * 0.008;
          particles[i].vy += (mdy / md) * 0.008;
        }
        particles[i].vx *= 0.99;
        particles[i].vy *= 0.99;
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        if (particles[i].x < 0 || particles[i].x > W) particles[i].vx *= -1;
        if (particles[i].y < 0 || particles[i].y > H) particles[i].vy *= -1;
        ctx.beginPath();
        ctx.arc(particles[i].x, particles[i].y, particles[i].size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,208,132,${particles[i].alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

// ── Aurora Orbs ───────────────────────────────────────────────────────────────
function Aurora() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Large background gradient */}
      <div style={{
        position: 'absolute', top: '-30%', left: '20%',
        width: '800px', height: '800px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,100,60,0.12) 0%, transparent 65%)',
        animation: 'aurora 25s linear infinite',
        filter: 'blur(0px)',
      }} />
      <div style={{
        position: 'absolute', top: '30%', right: '-20%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)',
        animation: 'aurora 32s linear infinite reverse',
        filter: 'blur(0px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)',
        animation: 'aurora 20s linear infinite',
        filter: 'blur(0px)',
      }} />
    </div>
  );
}

// ── Animated Number ───────────────────────────────────────────────────────────
function AnimNumber({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const dur = 1800;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.floor(ease * to));
        if (p < 1) requestAnimationFrame(step);
        else setVal(to);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{val.toLocaleString('fr-FR')}{suffix}</span>;
}

// ── Reveal on scroll ──────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...style
    }}>
      {children}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ scrolled }: { scrolled: boolean }) {
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      height: '60px',
      display: 'flex', alignItems: 'center',
      padding: '0 clamp(24px, 5%, 100px)',
      background: scrolled ? 'rgba(0,0,0,0.80)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px) saturate(200%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(200%)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
      transition: 'background 0.4s, border-color 0.4s, backdrop-filter 0.4s',
    }}>
      {/* Logo */}
      <button onClick={() => scroll('hero')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: 0, flexShrink: 0 }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '7px',
          background: 'linear-gradient(135deg, #00D084, #3B82F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 7L7 13M1 7H13" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff', letterSpacing: '-0.3px' }}>FacturaPro</span>
      </button>

      {/* Links */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '4px' }}>
        {[['Fonctionnalités', 'features'], ['Tarifs', 'pricing'], ['À Propos', 'about'], ['Contact', 'contact']].map(([l, id]) => (
          <button key={id} onClick={() => scroll(id)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
            fontSize: '13.5px', fontWeight: 500, padding: '7px 12px', borderRadius: '8px',
            fontFamily: 'Inter, sans-serif', letterSpacing: '-0.1px', transition: 'color 0.15s, background 0.15s',
          }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = '#fff'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.target as HTMLElement).style.background = 'transparent'; }}
          >{l}</button>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        <Link to="/login" className="btn btn-outline" style={{ fontSize: '13px', padding: '9px 20px' }}>Connexion</Link>
        <Link to="/register" className="btn btn-cta" style={{ fontSize: '13px', padding: '9px 20px' }}>
          Commencer
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><path d="M1 6H11M7 2L11 6L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </div>
    </nav>
  );
}

// ── Dashboard Preview ─────────────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div style={{
      borderRadius: '16px', overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      background: '#0D1117',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 60px 120px rgba(0,0,0,0.8), 0 0 100px rgba(0,208,132,0.06)',
      animation: 'float-y 6s ease-in-out infinite',
    }}>
      {/* Title bar */}
      <div style={{ height: '38px', background: '#161B22', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '7px' }}>
        {['#FF5F56', '#FFBD2E', '#27C93F'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, height: '18px', background: 'rgba(255,255,255,0.04)', borderRadius: '5px', margin: '0 20px' }} />
        <div style={{ width: '60px', height: '18px', background: 'rgba(0,208,132,0.08)', borderRadius: '5px', border: '1px solid rgba(0,208,132,0.15)' }} />
      </div>
      <div style={{ display: 'flex', height: '360px' }}>
        {/* Sidebar */}
        <div style={{ width: '180px', background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
          {[
            { l: 'Dashboard', active: false }, { l: 'Clients', active: false },
            { l: 'Factures', active: true }, { l: 'Reçus', active: false },
            { l: 'ARIA IA', active: false }, { l: 'Paramètres', active: false },
          ].map(item => (
            <div key={item.l} style={{ padding: '7px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: item.active ? 600 : 400, background: item.active ? 'rgba(0,208,132,0.1)' : 'transparent', color: item.active ? '#00D084' : 'rgba(255,255,255,0.25)', border: item.active ? '1px solid rgba(0,208,132,0.12)' : '1px solid transparent' }}>{item.l}</div>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'hidden' }}>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '14px' }}>
            {[{ l: 'CA ce mois', v: '4 250 000 GNF', c: '#00D084' }, { l: 'Factures', v: '32 émises', c: '#3B82F6' }, { l: 'Impayés', v: '820 000 GNF', c: '#F59E0B' }].map(k => (
              <div key={k.l} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.l}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: k.c }}>{k.v}</div>
              </div>
            ))}
          </div>
          {/* Table header */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 70px', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: '10px' }}>
              {['Client', 'Montant', 'Statut', 'Date'].map(h => (
                <div key={h} style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{h}</div>
              ))}
            </div>
            {[
              { c: 'SARL Kadi Invest', m: '850 000', s: 'Payée', d: '19/04', sc: '#00D084' },
              { c: 'BNS Group', m: '1 200 000', s: 'En attente', d: '18/04', sc: '#F59E0B' },
              { c: 'MinDev Guinée', m: '450 000', s: 'Partielle', d: '17/04', sc: '#3B82F6' },
              { c: 'Orange Guinée', m: '3 100 000', s: 'Payée', d: '15/04', sc: '#00D084' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 70px', padding: '10px 14px', alignItems: 'center', gap: '10px', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{r.c}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>{r.m}</span>
                <span style={{ fontSize: '9px', fontWeight: 700, color: r.sc, background: `${r.sc}14`, borderRadius: '5px', padding: '2px 7px', textAlign: 'center' }}>{r.s}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{r.d}</span>
              </div>
            ))}
          </div>
          {/* AI Chat preview */}
          <div style={{ marginTop: '12px', background: 'rgba(0,208,132,0.04)', border: '1px solid rgba(0,208,132,0.1)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00D084', boxShadow: '0 0 6px #00D084' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>ARIA: "Facture créée pour BNS Group — 1 200 000 GNF"_</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature Card (premium) ────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  const [hover, setHover] = useState(false);
  return (
    <Reveal delay={delay} style={{ height: '100%' }}>
      <div className="card" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ padding: '28px', height: '100%', transition: 'all 0.25s ease' }}>
        {/* Top glow line */}
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: hover ? 'linear-gradient(90deg, transparent, rgba(0,208,132,0.5), transparent)' : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', transition: 'background 0.3s' }} />
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: hover ? 'rgba(0,208,132,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${hover ? 'rgba(0,208,132,0.2)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', transition: 'all 0.25s', color: hover ? '#00D084' : 'rgba(255,255,255,0.5)' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: hover ? '#EDEFF5' : 'rgba(237,239,245,0.85)', marginBottom: '8px', lineHeight: 1.3, letterSpacing: '-0.3px', transition: 'color 0.25s' }}>{title}</h3>
        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, transition: 'color 0.25s' }}>{desc}</p>
      </div>
    </Reveal>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const icons = {
  bot:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M12 11V7M9 7h6M9 3l3 4 3-4"/></svg>,
  doc:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  receipt: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2H6L4 8l8 14 8-14-2-6z"/><line x1="4" y1="8" x2="20" y2="8"/></svg>,
  users:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  chart:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  globe:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>,
  shield:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  arrow:   <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M1 6H11M7 2L11 6L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  mail:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.92 1.18C.91.605 1.404.08 1.98.08h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.82 6.82l1.21-1.21a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  map:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  link:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
};

// ── Landing Page ──────────────────────────────────────────────────────────────
export function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="landing-page" style={{ background: '#000', minHeight: '100vh', color: '#EDEFF5', overflowX: 'hidden' }}>
      <CustomCursor />
      <Aurora />
      <ParticleCanvas />
      <Navbar scrolled={scrolled} />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section id="hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px clamp(24px,5%,100px) 80px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* Badge */}
        <div className="badge anim-fade" style={{ marginBottom: '32px' }}>
          <div className="badge-dot" />
          Solution ERP · Conçu pour l'Afrique
        </div>

        {/* Headline */}
        <h1 className="display-xl anim-slide-up" style={{ maxWidth: '900px', marginBottom: '24px' }}>
          La facturation<br />
          <span className="text-gradient">professionnelle,</span><br />
          <span style={{ color: 'rgba(237,239,245,0.6)' }}>enfin accessible.</span>
        </h1>

        <p className="anim-fade" style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'rgba(237,239,245,0.45)', maxWidth: '560px', lineHeight: 1.75, marginBottom: '44px', animationDelay: '0.2s', animationFillMode: 'both' }}>
          FacturaPro centralise votre facturation, gestion clients, et paiements — avec un assistant IA natif qui comprend vos instructions en français.
        </p>

        {/* CTAs */}
        <div className="anim-fade" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.35s', animationFillMode: 'both' }}>
          <button className="btn btn-cta" onClick={() => navigate('/register')} style={{ fontSize: '14px', padding: '13px 26px' }}>
            Créer mon espace gratuit {icons.arrow}
          </button>
          <button className="btn btn-outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: '14px', padding: '13px 26px' }}>
            Voir les fonctionnalités
          </button>
        </div>

        {/* Trusted by */}
        <div className="anim-fade" style={{ marginTop: '52px', display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', animationDelay: '0.5s', animationFillMode: 'both' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: 500, letterSpacing: '0.3px' }}>Déjà adopté par</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['SG', 'BK', 'MT', 'NG'].map(i => (
              <div key={i} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.3px' }}>{i}</div>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>500+ entreprises</span>
        </div>

        {/* Dashboard */}
        <div className="anim-scale" style={{ width: '100%', maxWidth: '900px', marginTop: '70px', animationDelay: '0.4s', animationFillMode: 'both' }}>
          <DashboardPreview />
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px clamp(24px,5%,100px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { v: 500, suf: '+', label: 'Entreprises actives' },
                { v: 10000, suf: '+', label: 'Documents générés' },
                { v: 99, suf: '%', label: 'Satisfaction client' },
                { v: 24, suf: '/7', label: 'Support disponible' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#0D1117', padding: '36px 28px', textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: '-2px', color: '#00D084', marginBottom: '6px' }}>
                    <AnimNumber to={s.v} suffix={s.suf} />
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px clamp(24px,5%,100px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: '60px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '100px', padding: '5px 14px', marginBottom: '20px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3B82F6' }} />
                <span style={{ fontSize: '11.5px', color: '#3B82F6', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Fonctionnalités</span>
              </div>
              <h2 className="display-lg" style={{ maxWidth: '600px', marginBottom: '16px' }}>
                Un seul outil.<br />
                <span className="text-gradient">Toutes les fonctions.</span>
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.38)', maxWidth: '480px', lineHeight: 1.8 }}>
                Construit pour les entreprises qui n'acceptent pas la médiocrité. Chaque détail a été pensé pour vous faire gagner du temps et de la crédibilité.
              </p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: '14px' }}>
            <FeatureCard delay={0} icon={icons.bot} title="Assistant ARIA" desc="Créez des factures et reçus par commande en langue naturelle. ARIA connaît vos clients et votre catalogue en temps réel." />
            <FeatureCard delay={80} icon={icons.doc} title="Factures Professionnelles" desc="Modèles PDF d'une précision vectorielle. Votre logo, signature et couleurs intégrés automatiquement." />
            <FeatureCard delay={160} icon={icons.receipt} title="Gestion des Paiements" desc="Suivez chaque franc encaissé. Reçus de paiement avec mise à jour automatique des soldes et statuts." />
            <FeatureCard delay={240} icon={icons.users} title="Base Clients Centralisée" desc="Fiches clients complètes avec historique de facturation, soldes et indicateurs de performance." />
            <FeatureCard delay={320} icon={icons.chart} title="Analytiques en Temps Réel" desc="Tableau de bord avec CA, tendances, impayés et top clients. Visualisez votre croissance instantanément." />
            <FeatureCard delay={400} icon={icons.globe} title="Multi-devises Nativement" desc="GNF, FCFA, USD, EUR. Paramétrez votre devise principale et switching instantané entre les unités." />
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '100px clamp(24px,5%,100px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(0,208,132,0.07)', border: '1px solid rgba(0,208,132,0.15)', borderRadius: '100px', padding: '5px 14px', marginBottom: '20px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00D084' }} />
              <span style={{ fontSize: '11.5px', color: '#00D084', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Tarification</span>
            </div>
            <h2 className="display-lg" style={{ marginBottom: '14px' }}>Simple. Transparent.<br /><span className="text-gradient">Tout inclus.</span></h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.38)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.8 }}>Un forfait unique. Pas de surprise. Tout ce dont votre entreprise a besoin, pour un an.</p>
          </Reveal>

          <Reveal delay={100}>
            <div style={{ maxWidth: '560px', margin: '0 auto', position: 'relative' }}>
              {/* Glow effect behind card */}
              <div style={{ position: 'absolute', inset: '-30px', background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,208,132,0.1), transparent)', filter: 'blur(20px)', pointerEvents: 'none' }} />

              <div style={{
                background: 'linear-gradient(145deg, #0D1117, #0A0F18)',
                border: '1px solid rgba(0,208,132,0.2)',
                borderRadius: '24px', padding: '48px', position: 'relative', overflow: 'hidden'
              }}>
                {/* Top shimmer line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(0,208,132,0.6) 50%, transparent 100%)' }} />

                {/* Popular badge */}
                <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.2)', borderRadius: '7px', padding: '4px 12px', fontSize: '11px', color: '#00D084', fontWeight: 700, letterSpacing: '0.5px' }}>
                  POPULAIRE
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Forfait Unique (Annuel)</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>GNF</span>
                    <span style={{ fontSize: '60px', fontWeight: 900, letterSpacing: '-3px', background: 'linear-gradient(135deg, #00FFB0, #00D084)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>1 000</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ textDecoration: 'line-through' }}>1 000 000 GNF</span>
                    <span style={{ background: 'rgba(0,208,132,0.1)', color: '#00D084', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>−50 %</span>
                  </div>
                </div>

                {/* Features list */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '36px' }}>
                  {[
                    'Factures illimitées', 'Reçus illimités', 'Clients illimités',
                    'Catalogue de services', 'Assistant ARIA (Bientôt)', 'Export PDF vectoriel',
                    'Tableau de bord live', 'Multi-devises', 'Logo & Signature', 'Support EINSOFT'
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
                      <div style={{ color: '#00D084', flexShrink: 0 }}>{icons.check}</div>
                      {f}
                    </div>
                  ))}
                </div>

                <button className="btn btn-cta" onClick={() => navigate('/register')} style={{ width: '100%', justifyContent: 'center', fontSize: '14.5px', padding: '15px', borderRadius: '12px', fontWeight: 700 }}>
                  Commencer maintenant {icons.arrow}
                </button>
                <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
                  Accès immédiat · Sans renouvellement automatique
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────────────── */}
      <section id="about" style={{ padding: '100px clamp(24px,5%,100px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <Reveal>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '100px', padding: '5px 14px', marginBottom: '24px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8B5CF6' }} />
                <span style={{ fontSize: '11.5px', color: '#8B5CF6', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>À propos</span>
              </div>
              <h2 className="display-md" style={{ marginBottom: '20px' }}>
                Construit par<br />
                <span className="text-gradient">EINSOFT DIGIT</span>
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.85, marginBottom: '16px' }}>
                EINSOFT DIGIT est une entreprise technologique africaine basée à Conakry, Guinée, spécialisée dans le développement de solutions numériques de haute performance.
              </p>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.85, marginBottom: '36px' }}>
                Notre mission : démocratiser les outils professionnels en Afrique. FacturaPro est le résultat de cette ambition — un ERP fait sur mesure pour les réalités du marché africain.
              </p>
              <a href="https://einsofdigit.com" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ gap: '8px' }}>
                {icons.link} Visiter einsofdigit.com
              </a>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Fondée en', val: '2024', sub: 'Conakry, Guinée' },
                { label: 'Technologie', val: '100%', sub: 'Made in Africa' },
                { label: 'Marché cible', val: 'PME', sub: 'Africaines' },
                { label: 'Support', val: '24/7', sub: 'Disponible' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: '24px 20px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{s.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-1px', color: '#00D084', marginBottom: '4px' }}>{s.val}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CONTACT ─────────────────────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '100px clamp(24px,5%,100px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal style={{ marginBottom: '60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '100px', padding: '5px 14px', marginBottom: '20px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3B82F6' }} />
              <span style={{ fontSize: '11.5px', color: '#3B82F6', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Contact</span>
            </div>
            <h2 className="display-lg" style={{ marginBottom: '14px' }}>Discutons de<br /><span className="text-gradient">votre projet.</span></h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px' }}>
            {/* Info */}
            <Reveal style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
              {[
                { icon: icons.link, label: 'Site Web', val: 'einsofdigit.com', href: 'https://einsofdigit.com' },
                { icon: icons.mail, label: 'Email', val: 'contacts@einsofdigit.com', href: 'mailto:contacts@einsofdigit.com' },
                { icon: icons.phone, label: 'Téléphone', val: '+224 624 77 06 18', href: 'tel:+224624770618' },
                { icon: icons.map, label: 'Localisation', val: 'Conakry, République de Guinée', href: '#' },
              ].map(c => (
                <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(0,208,132,0.06)', border: '1px solid rgba(0,208,132,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D084', flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{c.label}</div>
                    <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{c.val}</div>
                  </div>
                </a>
              ))}
            </Reveal>

            {/* Form */}
            <Reveal delay={120}>
              <form onSubmit={e => { e.preventDefault(); alert('Message envoyé. Nous vous répondrons sous 24h.'); }} className="card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[['Prénom', 'Jean'], ['Nom', 'Diallo']].map(([l, ph]) => (
                    <div key={l}>
                      <label style={{ display: 'block', fontSize: '11.5px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{l}</label>
                      <input className="input-field" type="text" placeholder={ph} required />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Email professionnel</label>
                  <input className="input-field" type="email" placeholder="vous@entreprise.com" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Message</label>
                  <textarea className="input-field" placeholder="Décrivez votre besoin..." rows={4} style={{ resize: 'vertical' }} required />
                </div>
                <button type="submit" className="btn btn-cta" style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }}>
                  Envoyer le message {icons.arrow}
                </button>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px clamp(24px,5%,100px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #00D084, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 7L7 13M1 7H13" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.3px' }}>FacturaPro</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>by EINSOFT DIGIT</span>
          </div>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)' }}>
            © {new Date().getFullYear()} EINSOFT DIGIT · Conakry, Guinée ·{' '}
            <a href="https://einsofdigit.com" target="_blank" rel="noreferrer" style={{ color: 'rgba(0,208,132,0.5)', textDecoration: 'none' }}>einsofdigit.com</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
