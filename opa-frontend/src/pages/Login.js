import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────
   THEME TOKENS
───────────────────────────────────────── */
const THEMES = {
  dark: {
    bg: '#0B1E38',
    gridColor: 'rgba(37,99,235,0.045)',
    orbColors: [[37,99,235],[79,70,229],[29,78,216],[16,185,129]],
    particleColors: [
      [37,99,235],[29,78,216],[79,70,229],
      [96,165,250],[59,130,246],[147,197,253],
      [16,185,129],[245,158,11],
    ],
    constellationColor: 'rgba(96,165,250,',
    shootingStarColor: 'rgba(148,189,255,',
    shootingStarTip: 'rgba(200,220,255,',
    card: {
      bg: 'rgba(255,255,255,0.04)',
      border: 'rgba(148,189,255,0.18)',
      shadow: '0 0 60px rgba(37,99,235,0.15), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
      glowBorder: 'linear-gradient(135deg, rgba(37,99,235,0.4), transparent 40%, rgba(79,70,229,0.3))',
    },
    text: {
      headline: '#E0EDFF',
      accent: '#60A5FA',
      accentGlow: 'rgba(96,165,250,0.6)',
      sub: '#4A7CAF',
      authLabel: '#4A7CAF',
      divider: 'rgba(148,189,255,0.12)',
      statSep: 'rgba(148,189,255,0.1)',
      statsDivider: 'rgba(148,189,255,0.1)',
      lockNote: '#2A4A6B',
    },
    iconGlow: '0 0 20px rgba(37,99,235,0.4), 0 4px 12px rgba(0,0,0,0.3)',
    iconGlowPulse: '0 0 35px rgba(37,99,235,0.8), 0 4px 12px rgba(0,0,0,0.3)',
    statColors: { total:'#3B82F6', available:'#10B981', assigned:'#818CF8', conflicts:'#F59E0B' },
    statGlows: {
      total:'rgba(59,130,246,.5)',
      available:'rgba(16,185,129,.4)',
      assigned:'rgba(129,140,248,.4)',
      conflicts:'rgba(245,158,11,.4)',
    },
    toggleBg: 'rgba(255,255,255,0.08)',
    toggleBorder: 'rgba(148,189,255,0.2)',
    toggleText: '#60A5FA',
    scanlines: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)',
  },
  light: {
    bg: '#DCE9F5',
    gridColor: 'rgba(37,99,235,0.06)',
    orbColors: [[37,99,235],[79,70,229],[29,78,216],[5,150,105]],
    particleColors: [
      [37,99,235],[29,78,216],[79,70,229],
      [14,116,144],[5,150,105],[99,102,241],
      [217,119,6],[59,130,246],
    ],
    constellationColor: 'rgba(37,99,235,',
    shootingStarColor: 'rgba(37,99,235,',
    shootingStarTip: 'rgba(59,130,246,',
    card: {
      bg: '#ffffff',
      border: '#C2D8EF',
      shadow: '0 4px 24px rgba(15,60,120,0.1), 0 1px 3px rgba(15,60,120,0.06)',
      glowBorder: 'linear-gradient(135deg, rgba(37,99,235,0.15), transparent 40%, rgba(79,70,229,0.1))',
    },
    text: {
      headline: '#0D2D52',
      accent: '#2563EB',
      accentGlow: 'transparent',
      sub: '#8AAAC8',
      authLabel: '#8AAAC8',
      divider: '#E8F0F9',
      statSep: '#E8F0F9',
      statsDivider: '#E8F0F9',
      lockNote: '#B8CCE0',
    },
    iconGlow: '0 4px 14px rgba(37,99,235,0.3)',
    iconGlowPulse: '0 4px 20px rgba(37,99,235,0.5)',
    statColors: { total:'#1D4ED8', available:'#059669', assigned:'#4F46E5', conflicts:'#D97706' },
    statGlows: { total:'transparent', available:'transparent', assigned:'transparent', conflicts:'transparent' },
    toggleBg: 'rgba(37,99,235,0.08)',
    toggleBorder: 'rgba(37,99,235,0.2)',
    toggleText: '#2563EB',
    scanlines: 'none',
  },
};

/* ─────────────────────────────────────────
   CANVAS ANIMATION
───────────────────────────────────────── */
function useCanvasAnimation(canvasRef, rootRef, theme) {
  const animRef = useRef(null);
  const stateRef = useRef(null);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    canvas.width  = root.offsetWidth;
    canvas.height = root.offsetHeight;
    const ctx = canvas.getContext('2d');
    const W = () => canvas.width;
    const H = () => canvas.height;

    const T = THEMES[theme];
    const r = (a,b) => a + Math.random() * (b - a);

    /* Particles */
    class Particle {
      constructor(initial) { this.reset(initial); }
      reset(initial) {
        this.x = r(0, W()); this.y = initial ? r(0, H()) : H() + 10;
        this.radius = r(1, 3.5);
        this.vx = r(-0.4, 0.4); this.vy = r(-0.5, -1.6);
        this.life = 0; this.maxLife = r(120, 260);
        this.color = T.particleColors[Math.floor(Math.random() * T.particleColors.length)];
        this.type = Math.random() < 0.2 ? 'ring' : 'dot';
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = r(0.02, 0.06);
      }
      update() {
        this.x += this.vx + Math.sin(this.life * 0.03) * 0.3;
        this.y += this.vy;
        this.life++; this.pulse += this.pulseSpeed;
        if (this.life > this.maxLife) this.reset(false);
      }
      draw() {
        const p = this.life / this.maxLife;
        const alpha = p < 0.1 ? p / 0.1 : p > 0.85 ? (1 - p) / 0.15 : 1;
        const glow = 0.5 + 0.5 * Math.sin(this.pulse);
        const [cr,cg,cb] = this.color;
        if (this.type === 'ring') {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI*2);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha * (theme === 'dark' ? 0.6 : 0.4)})`;
          ctx.lineWidth = 0.8; ctx.stroke();
        } else {
          const grad = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius*(3+glow*2));
          grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha*(theme==='dark'?0.4:0.25)})`);
          grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          ctx.beginPath(); ctx.arc(this.x,this.y,this.radius*(3+glow*2),0,Math.PI*2);
          ctx.fillStyle = grad; ctx.fill();
          ctx.beginPath(); ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha*(theme==='dark'?1:0.7)})`;
          ctx.fill();
        }
      }
    }

    /* Orbs */
    class Orb {
      constructor(bx,by,radius,color,speed,phase) {
        this.bx=bx; this.by=by; this.x=bx; this.y=by;
        this.radius=radius; this.color=color; this.speed=speed; this.t=phase;
      }
      update() {
        this.t += this.speed;
        this.x = this.bx + Math.sin(this.t)*60 + Math.cos(this.t*0.7)*30;
        this.y = this.by + Math.cos(this.t*0.8)*40 + Math.sin(this.t*1.1)*25;
      }
      draw() {
        const [cr,cg,cb] = this.color;
        const alpha = theme === 'dark' ? 0.18 : 0.12;
        const grad = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
        grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},${alpha*0.35})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.beginPath(); ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
        ctx.fillStyle=grad; ctx.fill();
      }
    }

    /* Shooting stars */
    class ShootingStar {
      constructor() { this.reset(); }
      reset() {
        this.x = r(W()*0.2, W()); this.y = r(0, H()*0.4);
        this.len = r(60, 180); this.speed = r(8, 18); this.alpha = 0;
        this.alive = false; this.delay = r(0, 400); this.timer = 0;
        this.angle = r(Math.PI*0.9, Math.PI*1.1);
        this.life = 0; this.maxLife = r(30, 60);
      }
      update() {
        this.timer++;
        if (this.timer < this.delay) return;
        this.alive = true; this.life++;
        const p = this.life / this.maxLife;
        this.alpha = p < 0.2 ? p/0.2 : p > 0.7 ? (1-p)/0.3 : 1;
        this.x += Math.cos(this.angle)*this.speed;
        this.y += Math.sin(this.angle)*this.speed;
        if (this.life > this.maxLife) this.reset();
      }
      draw() {
        if (!this.alive) return;
        const tx = this.x - Math.cos(this.angle)*this.len;
        const ty = this.y - Math.sin(this.angle)*this.len;
        const grad = ctx.createLinearGradient(tx,ty,this.x,this.y);
        const base = T.shootingStarColor;
        grad.addColorStop(0, base + '0)');
        grad.addColorStop(1, base + this.alpha + ')');
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(this.x,this.y);
        ctx.strokeStyle=grad; ctx.lineWidth=1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(this.x,this.y,2,0,Math.PI*2);
        ctx.fillStyle = T.shootingStarTip + this.alpha + ')';
        ctx.fill();
      }
    }

    const particles = Array.from({length:90}, (_,i) => new Particle(true));
    const orbs = [
      new Orb(W()*0.15, H()*0.25, 160, T.orbColors[0], 0.008, 0),
      new Orb(W()*0.85, H()*0.2,  180, T.orbColors[1], 0.006, 1.5),
      new Orb(W()*0.5,  H()*0.75, 200, T.orbColors[2], 0.007, 3),
      new Orb(W()*0.1,  H()*0.8,  120, T.orbColors[3], 0.010, 0.8),
    ];
    const stars = Array.from({length:4}, () => new ShootingStar());

    stateRef.current = { particles, orbs, stars, ctx, W, H };

    function loop() {
      animRef.current = requestAnimationFrame(loop);
      ctx.clearRect(0,0,W(),H());

      // bg
      ctx.fillStyle = T.bg;
      ctx.fillRect(0,0,W(),H());

      // grid
      ctx.strokeStyle = T.gridColor;
      ctx.lineWidth = 0.5;
      for(let x=0;x<W();x+=30){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H());ctx.stroke(); }
      for(let y=0;y<H();y+=30){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W(),y);ctx.stroke(); }

      orbs.forEach(o=>{o.update();o.draw();});
      stars.forEach(s=>{s.update();s.draw();});
      particles.forEach(p=>p.update());

      // constellation
      const maxDist = 80;
      for(let i=0;i<particles.length;i++){
        for(let j=i+1;j<particles.length;j++){
          const a=particles[i],b=particles[j];
          const dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);
          if(d<maxDist){
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
            ctx.strokeStyle=T.constellationColor+(1-d/maxDist)*0.18+')';
            ctx.lineWidth=0.5; ctx.stroke();
          }
        }
      }
      particles.forEach(p=>p.draw());
    }
    loop();
  }, [theme]);

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    init();
    const handleResize = () => {
      const canvas = canvasRef.current;
      const root = rootRef.current;
      if (canvas && root) { canvas.width=root.offsetWidth; canvas.height=root.offsetHeight; }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [init]);
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('ivy.anderson');
  const [password, setPassword] = useState('testpass123');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [theme, setTheme]     = useState('dark'); // 'dark' | 'light'

  const canvasRef = useRef(null);
  const rootRef   = useRef(null);

  useCanvasAnimation(canvasRef, rootRef, theme);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const result = await login(username, password);
    
    if (result.success) {
      setDone(true);
      // AuthContext handles navigate('/dashboard') on success, but we can keep the animation
    } else {
      setErrorMsg(result.error || 'Failed to login');
      setLoading(false);
    }
  };

  const T = THEMES[theme];

  const stats = [
    { label:'Total Offices', value:48,  color: T.statColors.total,     glow: T.statGlows.total },
    { label:'Available',     value:10,  color: T.statColors.available, glow: T.statGlows.available },
    { label:'Assigned',      value:35,  color: T.statColors.assigned,  glow: T.statGlows.assigned },
    { label:'Conflicts',     value:3,   color: T.statColors.conflicts, glow: T.statGlows.conflicts },
  ];

  /* ── styles ── */
  const s = {
    root: {
      minHeight: '100vh',
      background: T.bg,
      fontFamily: "'Nunito', 'Sora', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
      transition: 'background 0.4s ease',
    },
    canvas: { position:'absolute', inset:0, pointerEvents:'none' },
    scanlines: {
      position:'absolute', inset:0, pointerEvents:'none',
      background: T.scanlines, zIndex:0,
    },
    vignette: {
      position:'absolute', inset:0, pointerEvents:'none',
      background: theme==='dark'
        ? 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(5,12,28,0.7) 100%)'
        : 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, rgba(180,210,235,0.4) 100%)',
      zIndex:1,
    },
    card: {
      background: T.card.bg,
      borderRadius: '22px',
      border: `1.5px solid ${T.card.border}`,
      boxShadow: T.card.shadow,
      width: '100%', maxWidth: '420px',
      padding: '40px 36px',
      position: 'relative', zIndex:10,
      backdropFilter: theme==='dark' ? 'blur(18px)' : 'none',
      WebkitBackdropFilter: theme==='dark' ? 'blur(18px)' : 'none',
      transition: 'background 0.4s, border 0.4s, box-shadow 0.4s',
    },
    toggleBtn: {
      position: 'absolute', top:'14px', right:'14px',
      background: T.toggleBg,
      border: `1px solid ${T.toggleBorder}`,
      borderRadius: '8px', padding: '5px 10px',
      cursor:'pointer', display:'flex', alignItems:'center', gap:'5px',
      fontSize:'11px', fontWeight:800, color: T.toggleText,
      fontFamily:'inherit', transition:'all 0.2s',
      letterSpacing: '0.5px',
    },
  };

  return (
    <div ref={rootRef} style={s.root}>
      <canvas ref={canvasRef} style={s.canvas} />
      <div style={s.scanlines} />
      <div style={s.vignette} />

      {/* Card */}
      <div style={s.card}>
        {/* Glowing border overlay */}
        <div style={{
          position:'absolute', inset:'-1px', borderRadius:'23px',
          background: T.card.glowBorder, zIndex:-1,
          animation: 'borderPulse 3s ease-in-out infinite',
          pointerEvents:'none',
        }} />

        {/* Theme Toggle */}
        <button style={s.toggleBtn} onClick={() => setTheme(t => t==='dark'?'light':'dark')}>
          {theme === 'dark' ? (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>Light</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>Dark</>
          )}
        </button>

        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'28px'}}>
          <div style={{
            width:'38px',height:'38px',borderRadius:'10px',
            background:'linear-gradient(135deg,#2563EB,#1D4ED8)',
            display:'flex',alignItems:'center',justifyContent:'center',
            flexShrink:0, boxShadow: T.iconGlow,
            animation:'iconGlow 2.5s ease-in-out infinite',
          }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".95"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".45"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".45"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".95"/>
            </svg>
          </div>
          <div>
            <div style={{color:T.text.headline,fontWeight:900,fontSize:'15px',letterSpacing:'-.4px',lineHeight:1}}>OPA</div>
            <div style={{color:T.text.sub,fontSize:'9.5px',letterSpacing:'1.1px',textTransform:'uppercase',marginTop:'3px',fontWeight:700}}>Office Placement Application</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{height:'1.5px',background:T.text.divider,marginBottom:'26px'}} />

        {/* Headline */}
        <h1 style={{fontSize:'27px',fontWeight:900,color:T.text.headline,letterSpacing:'-1px',lineHeight:1.15,margin:'0 0 8px'}}>
          Welcome{' '}
          <span style={{color:T.text.accent,textShadow:`0 0 20px ${T.text.accentGlow}`}}>back.</span>
        </h1>
        <p style={{fontSize:'13.5px',color:T.text.sub,lineHeight:1.75,margin:'0 0 26px',fontWeight:600}}>
          Manage faculty office assignments, track equipment, and resolve conflicts — all in one place.
        </p>

        {/* Auth label */}
        <div style={{fontSize:'10.5px',fontWeight:800,color:T.text.authLabel,letterSpacing:'1.4px',textTransform:'uppercase',marginBottom:'12px'}}>
          University Authentication
        </div>

        {errorMsg && (
          <div style={{background:'rgba(239,68,68,0.1)', color:'#EF4444', padding:'10px', borderRadius:'8px', fontSize:'12px', marginBottom:'16px', fontWeight:600, border:'1px solid rgba(239,68,68,0.3)'}}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{marginBottom:'12px'}}>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{width:'100%', padding:'12px 16px', borderRadius:'10px', background:theme==='dark'?'rgba(255,255,255,0.06)':'#F5F9FF', border:`1.5px solid ${theme==='dark'?'rgba(255,255,255,0.1)':'#C2D8EF'}`, color:T.text.headline, fontSize:'14px', outline:'none'}}
            />
          </div>
          <div style={{marginBottom:'20px'}}>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{width:'100%', padding:'12px 16px', borderRadius:'10px', background:theme==='dark'?'rgba(255,255,255,0.06)':'#F5F9FF', border:`1.5px solid ${theme==='dark'?'rgba(255,255,255,0.1)':'#C2D8EF'}`, color:T.text.headline, fontSize:'14px', outline:'none'}}
            />
          </div>

          {/* SSO Button */}
          <button
            type="submit"
            disabled={loading || done}
            style={{
              width:'100%', padding:'14px 20px',
              background: done
                ? 'linear-gradient(135deg,#10B981,#059669)'
                : 'linear-gradient(135deg,#2563EB,#1D4ED8)',
              color:'#fff', border:'none', borderRadius:'12px',
              fontSize:'14px', fontFamily:'inherit', fontWeight:800,
              cursor: loading||done ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'9px',
              boxShadow: done
                ? '0 4px 14px rgba(16,185,129,0.3)'
                : theme==='dark'
                  ? '0 0 24px rgba(37,99,235,0.5), 0 4px 16px rgba(0,0,0,0.3)'
                  : '0 4px 16px rgba(37,99,235,0.35)',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.3s, box-shadow 0.3s, opacity 0.2s',
              position:'relative', overflow:'hidden',
            }}
          >
            {/* Shimmer */}
            {!done && !loading && (
              <div style={{
                position:'absolute', inset:0,
                background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)',
                animation:'shimmer 2.5s ease-in-out infinite',
                pointerEvents:'none',
              }} />
            )}
            {done ? (
              <><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>Redirecting…</>
            ) : loading ? (
              <><span style={{width:'14px',height:'14px',border:'2.5px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block',flexShrink:0}}/>Authenticating…</>
            ) : (
              <><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 100 8A4 4 0 008 1zM2 13.5c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>Continue with University SSO</>
            )}
          </button>
        </form>

        <p style={{fontSize:'11.5px',color:T.text.lockNote,textAlign:'center',margin:'12px 0 0',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',fontWeight:600}}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 5V4a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Restricted to authorized university personnel
        </p>

        {/* Stats */}
        <div style={{display:'flex',marginTop:'24px',paddingTop:'20px',borderTop:`1.5px solid ${T.text.statsDivider}`}}>
          {stats.map((stat,i) => (
            <React.Fragment key={i}>
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px'}}>
                <span style={{fontSize:'17px',fontWeight:900,letterSpacing:'-.5px',lineHeight:1,color:stat.color,textShadow:`0 0 10px ${stat.glow}`}}>
                  {stat.value}
                </span>
                <span style={{fontSize:'10px',color:T.text.sub,fontWeight:700,textAlign:'center',whiteSpace:'nowrap'}}>{stat.label}</span>
              </div>
              {i < stats.length-1 && <div style={{width:'1.5px',background:T.text.statSep,alignSelf:'stretch',margin:'0 4px'}}/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes borderPulse{ 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes iconGlow   { 0%,100%{opacity:.85} 50%{opacity:1} }
        @keyframes shimmer    { 0%{transform:translateX(-100%)} 60%,100%{transform:translateX(100%)} }
      `}</style>
    </div>
  );
}