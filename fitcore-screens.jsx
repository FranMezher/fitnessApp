// FITCORE — Hi-fi screen components
// Exported to window for use in main mockup file

const C = {
  bg: '#080808',
  surface: 'rgba(255,255,255,0.05)',
  surfaceHover: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.09)',
  borderAccent: 'rgba(204,255,0,0.35)',
  neon: '#CCFF00',
  orange: '#FF6B35',
  teal: '#3DFFA0',
  purple: '#B388FF',
  text: '#F2F2F2',
  muted: '#888',
  dim: '#444',
};

const glass = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

const glassNeon = {
  ...glass,
  background: 'rgba(204,255,0,0.07)',
  border: `1px solid ${C.borderAccent}`,
};

const glassOrange = {
  ...glass,
  background: 'rgba(255,107,53,0.08)',
  border: '1px solid rgba(255,107,53,0.3)',
};

// ─── Shared primitives ──────────────────────────────────────────────────────

function HiPhone({ children, width = 320 }) {
  return (
    <div style={{
      width, background: '#0e0e0e',
      borderRadius: 44, border: '1.5px solid #1e1e1e',
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 0 0 1px #1a1a1a, 0 24px 60px rgba(0,0,0,0.8), 0 0 80px rgba(204,255,0,0.04)',
    }}>
      {/* Notch */}
      <div style={{ width: 90, height: 26, background: '#0e0e0e', borderRadius: '0 0 18px 18px', margin: '0 auto', position: 'relative', zIndex: 10 }} />
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 22px 6px', fontSize: 11, color: '#555', fontWeight: 600 }}>
        <span>9:41</span><span>●●● 100%</span>
      </div>
      <div style={{ padding: '0 18px 28px', minHeight: 560 }}>{children}</div>
    </div>
  );
}

function Ring({ pct = 72, size = 80, color = C.neon, label = '', sub = '' }) {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: size * 0.21, fontWeight: 700, color, lineHeight: 1 }}>{label}</div>
        <div style={{ fontSize: size * 0.14, color: C.muted }}>{sub}</div>
      </div>
    </div>
  );
}

function Pill({ children, color = C.neon, bg }) {
  return <span style={{
    display: 'inline-block',
    background: bg || `${color}18`,
    border: `1px solid ${color}44`,
    borderRadius: 20, padding: '2px 9px',
    fontSize: 11, color, fontWeight: 600,
    letterSpacing: 0.4,
  }}>{children}</span>;
}

function BottomNav({ active = 'home' }) {
  const items = [
    { id: 'home', icon: '⌂', label: 'Inicio' },
    { id: 'train', icon: '◈', label: 'Entrena' },
    { id: 'food', icon: '◎', label: 'Nutri' },
    { id: 'prog', icon: '▣', label: 'Progreso' },
    { id: 'me', icon: '◉', label: 'Yo' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around',
      background: 'rgba(8,8,8,0.95)', borderTop: `1px solid ${C.border}`,
      backdropFilter: 'blur(20px)',
      padding: '10px 0 16px', margin: '12px -18px -28px',
    }}>
      {items.map(i => (
        <div key={i.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ fontSize: 20, color: active === i.id ? C.neon : '#444', filter: active === i.id ? `drop-shadow(0 0 6px ${C.neon})` : 'none' }}>{i.icon}</div>
          <span style={{ fontSize: 10, color: active === i.id ? C.neon : '#444', fontWeight: active === i.id ? 700 : 400 }}>{i.label}</span>
        </div>
      ))}
    </div>
  );
}

function Btn({ children, variant = 'primary', style: s = {} }) {
  const base = {
    display: 'block', width: '100%', border: 'none', borderRadius: 50,
    padding: '13px', fontSize: 16, fontWeight: 700,
    fontFamily: 'inherit', textAlign: 'center', cursor: 'pointer',
    letterSpacing: 0.3, transition: 'opacity 0.15s',
  };
  if (variant === 'primary') return <button style={{ ...base, background: C.neon, color: '#111', boxShadow: `0 0 20px ${C.neon}44`, ...s }}>{children}</button>;
  if (variant === 'ghost') return <button style={{ ...base, background: 'transparent', color: C.neon, border: `1px solid ${C.borderAccent}`, ...s }}>{children}</button>;
  if (variant === 'orange') return <button style={{ ...base, background: C.orange, color: '#fff', boxShadow: `0 0 20px ${C.orange}44`, ...s }}>{children}</button>;
  return <button style={{ ...base, ...s }}>{children}</button>;
}

function Label({ children }) {
  return <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, fontWeight: 600 }}>{children}</div>;
}

function Input({ placeholder }) {
  return <input readOnly placeholder={placeholder} style={{
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '11px 14px', color: C.text, fontSize: 15,
    fontFamily: 'inherit', width: '100%', marginBottom: 10,
    outline: 'none',
  }} />;
}

function ProgressBar({ pct, color = C.neon, h = 6 }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, height: h, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 10, boxShadow: `0 0 8px ${color}88` }} />
    </div>
  );
}

// ─── SCREEN: LOGIN ──────────────────────────────────────────────────────────

function ScreenLogin() {
  return <HiPhone>
    <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
      <div style={{ fontSize: 13, letterSpacing: 6, color: C.neon, fontWeight: 700, marginBottom: 4 }}>FITCORE</div>
      <div style={{ fontSize: 11, color: C.muted }}>Tu cuerpo. Tu ritmo. Tu meta.</div>
    </div>

    {[
      { icon: 'G', label: 'Continuar con Google' },
      { icon: '🍎', label: 'Continuar con Apple' },
    ].map(s => (
      <div key={s.label} style={{ ...glass, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 8, cursor: 'pointer' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: C.text }}>{s.icon}</div>
        <span style={{ fontSize: 15, color: C.text }}>{s.label}</span>
      </div>
    ))}

    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0' }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 12, color: C.dim }}>o con email</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>

    <Label>Email</Label>
    <Input placeholder="carlos@email.com" />
    <Label>Contraseña</Label>
    <div style={{ position: 'relative', marginBottom: 6 }}>
      <Input placeholder="••••••••" />
    </div>
    <div style={{ textAlign: 'right', marginBottom: 18 }}>
      <span style={{ fontSize: 13, color: C.neon }}>¿Olvidaste tu contraseña?</span>
    </div>

    <Btn>Iniciar sesión</Btn>
    <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: C.muted }}>
      ¿Sin cuenta? <span style={{ color: C.neon }}>Regístrate gratis</span>
    </div>
  </HiPhone>;
}

// ─── SCREEN: ONBOARDING GOAL ────────────────────────────────────────────────

function ScreenOnboardGoal() {
  const goals = [
    { icon: '🔥', title: 'Perder grasa', sub: 'Déficit calórico inteligente', active: true },
    { icon: '💪', title: 'Ganar músculo', sub: 'Superávit + proteína alta' },
    { icon: '⚡', title: 'Rendimiento', sub: 'Fuerza y resistencia' },
    { icon: '🧘', title: 'Bienestar', sub: 'Equilibrio y salud general' },
  ];
  return <HiPhone>
    {/* progress dots */}
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 24 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ height: 4, width: i===1?22:8, borderRadius: 2, background: i===1?C.neon:'rgba(255,255,255,0.12)' }} />
      ))}
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 4 }}>¿Cuál es tu meta?</div>
    <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>Tu plan se adapta automáticamente</div>
    {goals.map(g => (
      <div key={g.title} style={{ ...( g.active ? glassNeon : glass ), display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}>
        <div style={{ fontSize: 26 }}>{g.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: g.active ? C.neon : C.text }}>{g.title}</div>
          <div style={{ fontSize: 13, color: C.muted }}>{g.sub}</div>
        </div>
        {g.active && <div style={{ color: C.neon, fontSize: 18, filter: `drop-shadow(0 0 6px ${C.neon})` }}>✓</div>}
      </div>
    ))}
    <div style={{ marginTop: 8 }}><Btn>Continuar</Btn></div>
  </HiPhone>;
}

// ─── SCREEN: DASHBOARD ──────────────────────────────────────────────────────

function ScreenDashboard() {
  return <HiPhone>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 13, color: C.muted }}>Buenos días,</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Carlos 👋</div>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>C</div>
        <div style={{ position: 'absolute', top: -3, right: -3, background: C.orange, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>3</div>
      </div>
    </div>

    {/* Streak */}
    <div style={{ ...glass, padding: '12px 16px', marginBottom: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.neon, marginBottom: 8 }}>🔥 5 días de racha</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {['L','M','X','J','V','S','D'].map((d, i) => (
          <div key={d} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: i<5 ? C.neon : 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${i<5 ? C.neon : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: i<5 ? '#111' : C.dim, fontWeight: 700,
            boxShadow: i<5 ? `0 0 8px ${C.neon}66` : 'none',
          }}>{i<5 ? '✓' : d}</div>
        ))}
      </div>
    </div>

    {/* Rings */}
    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
      {[
        { pct: 72, color: C.neon, label: '72%', sub: 'mov', name: 'Movimiento' },
        { pct: 50, color: C.orange, label: '50%', sub: 'eje', name: 'Ejercicio' },
        { pct: 88, color: C.teal, label: '88%', sub: 'H₂O', name: 'Hidrat.' },
      ].map(r => (
        <div key={r.name} style={{ ...glass, flex: 1, padding: '12px 8px', textAlign: 'center' }}>
          <Ring pct={r.pct} size={64} color={r.color} label={r.label} sub={r.sub} />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{r.name}</div>
        </div>
      ))}
    </div>

    {/* Macros */}
    <div style={{ ...glass, padding: '12px 16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Label>Calorías de hoy</Label>
        <span style={{ fontSize: 13, color: C.neon, fontWeight: 700 }}>1,240 / 1,840</span>
      </div>
      <ProgressBar pct={67} />
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {[
          { l: 'Proteína', v: '87g', c: C.neon },
          { l: 'Carbos', v: '134g', c: C.teal },
          { l: 'Grasas', v: '32g', c: C.orange },
        ].map(m => (
          <div key={m.l} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.c }}>{m.v}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{m.l}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Workout CTA */}
    <div style={{ ...glassOrange, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <Pill color={C.orange}>HOY · DÍA 3</Pill>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginTop: 5 }}>Upper Body Power</div>
        <div style={{ fontSize: 13, color: C.muted }}>6 ejercicios · ~38 min</div>
      </div>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: `0 0 16px ${C.orange}66`, cursor: 'pointer' }}>▶</div>
    </div>

    <BottomNav active="home" />
  </HiPhone>;
}

// ─── SCREEN: WORKOUT ACTIVE + AI ────────────────────────────────────────────

function ScreenWorkoutAI() {
  return <HiPhone>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 15, color: C.muted }}>✕ Salir</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Serie 2 / 3</span>
      <span style={{ fontSize: 15, color: C.neon }}>⏸</span>
    </div>

    {/* Timer */}
    <div style={{ textAlign: 'center', marginBottom: 14 }}>
      <div style={{ fontSize: 64, fontWeight: 700, color: C.neon, lineHeight: 1, letterSpacing: -2, textShadow: `0 0 30px ${C.neon}66` }}>00:32</div>
      <div style={{ fontSize: 15, color: C.muted }}>Flexiones Diamante</div>
    </div>

    {/* Camera */}
    <div style={{ background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: 16, height: 155, marginBottom: 10, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(204,255,0,0.03), transparent)' }} />
      <div style={{ color: '#333', fontSize: 13, textAlign: 'center' }}>[ cámara + overlay<br/>esqueleto IA ]</div>
      {/* Corner markers */}
      {[['topleft','0,0'],['topright','0,auto'],['bottomleft','auto,0'],['bottomright','auto,auto']].map(([k,_], i) => {
        const pos = { position:'absolute', width:16, height:16 };
        if (i===0) { pos.top=10; pos.left=10; }
        if (i===1) { pos.top=10; pos.right=10; }
        if (i===2) { pos.bottom=10; pos.left=10; }
        if (i===3) { pos.bottom=10; pos.right=10; }
        return <div key={k} style={{ ...pos, border: `2px solid ${C.neon}`, borderRadius: 3,
          borderRight: i%2===0?'none':'2px solid '+C.neon, borderBottom: i<2?'none':'2px solid '+C.neon,
          borderLeft: i%2===1?'none':'2px solid '+C.neon, borderTop: i>=2?'none':'2px solid '+C.neon,
        }} />;
      })}
      {/* AI badge */}
      <div style={{ position: 'absolute', top: 10, left: 10 }}><Pill color={C.neon}>IA activa</Pill></div>
      {/* Alert */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'rgba(255,107,53,0.15)', border: `1px solid ${C.orange}66`, borderRadius: 8, padding: '5px 10px', fontSize: 12, color: C.orange, textAlign: 'center' }}>
        ⚠ Codos demasiado abiertos → ciérralos
      </div>
    </div>

    {/* Rep counter */}
    <div style={{ ...glass, padding: '12px 14px', marginBottom: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Repeticiones detectadas</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
        {Array.from({length: 12}, (_,i) => (
          <div key={i} style={{
            width: 26, height: 26, borderRadius: '50%',
            background: i < 6 ? C.neon : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${i < 6 ? C.neon : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: i < 6 ? '#111' : C.dim, fontWeight: 700,
            boxShadow: i < 6 ? `0 0 6px ${C.neon}66` : 'none',
          }}>{i+1}</div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>6 / 12 · Precisión: <span style={{ color: C.neon }}>85%</span></div>
    </div>

    <Btn variant="orange">DESCANSO →</Btn>
    <BottomNav active="train" />
  </HiPhone>;
}

// ─── SCREEN: NUTRITION ──────────────────────────────────────────────────────

function ScreenNutrition() {
  return <HiPhone>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Nutrición</div>
      <div style={{ ...glass, padding: '4px 12px', fontSize: 13, color: C.muted }}>Hoy ▾</div>
    </div>

    {/* Calorie ring + macros */}
    <div style={{ ...glass, padding: '16px', marginBottom: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
      <Ring pct={67} size={90} color={C.neon} label="1240" sub="kcal" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Restantes: <span style={{ color: C.neon, fontWeight: 700 }}>600 kcal</span></div>
        {[
          { name: 'Proteína', pct: 60, color: C.neon },
          { name: 'Carbos', pct: 67, color: C.teal },
          { name: 'Grasas', pct: 58, color: C.orange },
        ].map(m => (
          <div key={m.name} style={{ marginBottom: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, marginBottom: 3 }}>
              <span>{m.name}</span><span style={{ color: m.color }}>{m.pct}%</span>
            </div>
            <ProgressBar pct={m.pct} color={m.color} h={4} />
          </div>
        ))}
      </div>
    </div>

    {/* Meals */}
    {[
      { meal: 'Desayuno', kcal: 420, items: ['Avena + plátano', 'Café c/ leche'], done: true },
      { meal: 'Almuerzo', kcal: 580, items: ['Arroz + pollo', 'Ensalada verde'], done: true },
      { meal: 'Merienda', kcal: 240, items: [], done: false },
      { meal: 'Cena', kcal: null, items: [], done: false },
    ].map(m => (
      <div key={m.meal} style={{ ...(m.done ? glass : { ...glass, opacity: 0.65 }), padding: '12px 14px', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: m.done ? 5 : 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: m.done ? C.text : C.muted }}>{m.meal}</div>
          {m.kcal && <div style={{ fontSize: 14, color: C.neon, fontWeight: 700 }}>{m.kcal} kcal</div>}
          {!m.done && <div style={{ fontSize: 13, color: C.orange }}>+ Añadir</div>}
        </div>
        {m.items.map(it => <div key={it} style={{ fontSize: 13, color: C.muted }}>· {it}</div>)}
      </div>
    ))}
    <BottomNav active="food" />
  </HiPhone>;
}

// ─── SCREEN: PANTRY MODE ────────────────────────────────────────────────────

function ScreenPantry() {
  return <HiPhone>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 15, color: C.muted }}>←</span>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.neon }}>Modo Despensa</div>
        <div style={{ fontSize: 13, color: C.muted }}>¿Qué tienes en casa?</div>
      </div>
    </div>

    {[
      { name: 'Huevos', qty: '6 uds', p: '36g', c: '2g', g: '30g' },
      { name: 'Pechuga de pollo', qty: '300g', p: '63g', c: '0g', g: '6g' },
      { name: 'Arroz integral', qty: '200g', p: '7g', c: '76g', g: '2g' },
      { name: 'Espinacas', qty: '100g', p: '2g', c: '1g', g: '0g' },
    ].map(item => (
      <div key={item.name} style={{ ...glass, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 15, color: C.text }}>{item.name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{item.qty}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, lineHeight: 1.8 }}>
          <span style={{ color: C.neon }}>{item.p}P </span>
          <span style={{ color: C.teal }}>{item.c}C </span>
          <span style={{ color: C.orange }}>{item.g}G</span>
        </div>
      </div>
    ))}

    <div style={{ ...glass, border: `1px dashed ${C.dim}`, padding: '10px', textAlign: 'center', marginBottom: 12, marginTop: 4 }}>
      <div style={{ fontSize: 13, color: C.dim }}>+ Escanear o añadir ingrediente</div>
    </div>

    <Btn>✦ Generar recetas con IA</Btn>

    <div style={{ ...glassNeon, padding: '14px', marginTop: 10 }}>
      <div style={{ marginBottom: 4 }}><Pill color={C.neon}>RECETA · 520 KCAL</Pill></div>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 3 }}>Bowl Proteico Pollo + Arroz</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>35g P · 60g C · 8g G · ~20 min</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px', fontSize: 13, color: C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Ver receta</button>
        <button style={{ flex: 1, background: C.neon, border: 'none', borderRadius: 10, padding: '8px', fontSize: 13, color: '#111', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Registrar</button>
      </div>
    </div>
    <BottomNav active="food" />
  </HiPhone>;
}

// ─── SCREEN: POST-WORKOUT SUMMARY ───────────────────────────────────────────

function ScreenPostSummary() {
  return <HiPhone>
    <div style={{ textAlign: 'center', paddingTop: 8, marginBottom: 18 }}>
      <div style={{ fontSize: 48, marginBottom: 6 }}>🎉</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.neon, textShadow: `0 0 20px ${C.neon}66` }}>¡Entreno completado!</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>Upper Body Power · Día 3</div>
    </div>

    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {[{v:'38',l:'min',c:C.neon},{v:'312',l:'kcal',c:C.orange},{v:'6/6',l:'ejerc.',c:C.teal}].map(s => (
        <div key={s.l} style={{ ...glass, flex: 1, textAlign: 'center', padding: '12px 4px' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: s.c, textShadow: `0 0 12px ${s.c}66` }}>{s.v}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{s.l}</div>
        </div>
      ))}
    </div>

    <div style={{ ...glassNeon, padding: '14px 16px', marginBottom: 12 }}>
      <Label>Rendimiento IA</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 44, fontWeight: 700, color: C.neon, textShadow: `0 0 20px ${C.neon}66` }}>85%</div>
        <div>
          <div style={{ fontSize: 15, color: C.text }}>Precisión de forma</div>
          <div style={{ fontSize: 13, color: C.muted }}>+7% vs sesión anterior</div>
        </div>
      </div>
      <ProgressBar pct={85} h={6} />
    </div>

    <div style={{ background: 'linear-gradient(135deg, rgba(204,255,0,0.08), rgba(204,255,0,0.03))', border: `1px solid ${C.borderAccent}`, borderRadius: 14, padding: '12px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.neon }}>+180 XP ganados</div>
        <div style={{ fontSize: 12, color: C.muted }}>Racha +20 · Precisión +30</div>
      </div>
      <div style={{ fontSize: 28 }}>⭐</div>
    </div>

    <Btn style={{ marginBottom: 8 }}>Elongación guiada (5 min)</Btn>
    <Btn variant="ghost">Saltar por ahora</Btn>
    <BottomNav active="train" />
  </HiPhone>;
}

// ─── SCREEN: STRETCH ────────────────────────────────────────────────────────

function ScreenStretch() {
  const items = [
    { name: 'Pecho en pared', muscle: 'Pectoral', done: true },
    { name: 'Tríceps sobre cabeza', muscle: 'Tríceps', done: true },
    { name: 'Hombro cruzado', muscle: 'Deltoides', active: true },
    { name: 'Apertura torácica', muscle: 'Espalda' },
    { name: 'Cuello lateral', muscle: 'Cuello' },
  ];
  return <HiPhone>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Elongación</div>
        <div style={{ fontSize: 13, color: C.muted }}>5 estiramientos · ~5 min</div>
      </div>
      <div style={{ ...glass, padding: '4px 12px', fontSize: 13, color: C.muted, cursor: 'pointer' }}>Saltar</div>
    </div>

    {/* Camera placeholder */}
    <div style={{ background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: 16, height: 148, marginBottom: 10, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ color: '#333', fontSize: 13, textAlign: 'center' }}>[ ilustración: hombro cruzado ]</div>
      <div style={{ position: 'absolute', top: 10, left: 10 }}><Pill>3 de 5</Pill></div>
      <div style={{ position: 'absolute', bottom: 10, right: 10, background: `${C.neon}22`, border: `1px solid ${C.neon}66`, borderRadius: 8, padding: '3px 10px', fontSize: 13, color: C.neon, fontWeight: 700 }}>00:18</div>
    </div>

    <div style={{ ...glassNeon, padding: '12px 14px', marginBottom: 10 }}>
      <Pill color={C.neon}>AHORA · DELTOIDES</Pill>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginTop: 5 }}>Hombro cruzado</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>30 seg cada lado · Respira profundo</div>
      <ProgressBar pct={60} />
    </div>

    {items.map(s => (
      <div key={s.name} style={{
        ...( s.active ? glassNeon : glass ),
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', marginBottom: 6,
        opacity: s.done ? 0.45 : 1,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: s.active ? `${C.neon}22` : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: s.done ? C.neon : s.active ? C.neon : C.dim }}>
          {s.done ? '✓' : s.active ? '▶' : '○'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: s.done ? C.muted : C.text, textDecoration: s.done ? 'line-through' : 'none' }}>{s.name}</div>
          <div style={{ fontSize: 11, color: C.dim }}>{s.muscle}</div>
        </div>
      </div>
    ))}
    <div style={{ marginTop: 8 }}><Btn>Siguiente →</Btn></div>
    <BottomNav active="train" />
  </HiPhone>;
}

// ─── SCREEN: RECOVERY ───────────────────────────────────────────────────────

function ScreenRecovery() {
  return <HiPhone>
    <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>Recuperación</div>
    <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Basado en tu sesión de hoy</div>

    <div style={{ ...glass, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
      <Ring pct={74} size={80} color={C.teal} label="74" sub="score" />
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Recuperación buena</div>
        <div style={{ fontSize: 13, color: C.muted }}>Listo para entrenar en ~20h</div>
        <div style={{ fontSize: 12, color: C.teal, marginTop: 3 }}>Próximo: mañana 7am</div>
      </div>
    </div>

    {[
      { icon: '💧', color: C.teal, title: 'Hidratación', body: '500ml de agua en los próximos 30 min', tag: 'Ahora' },
      { icon: '🥩', color: C.neon, title: 'Ventana anabólica', body: '30-40g proteína en los próximos 45 min', tag: '45 min' },
      { icon: '🧊', color: '#66aaff', title: 'Crioterapia opcional', body: 'Ducha fría 2 min si hay fatiga alta', tag: 'Opcional' },
      { icon: '😴', color: C.purple, title: 'Sueño reparador', body: '7-8h esta noche · muscle repair peak', tag: 'Esta noche' },
    ].map(r => (
      <div key={r.title} style={{ ...glass, display: 'flex', gap: 12, padding: '12px 14px', marginBottom: 8, alignItems: 'flex-start' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${r.color}18`, border: `1px solid ${r.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{r.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.title}</div>
            <Pill color={r.color}>{r.tag}</Pill>
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>{r.body}</div>
        </div>
      </div>
    ))}
    <BottomNav active="train" />
  </HiPhone>;
}

// ─── SCREEN: PROFILE ────────────────────────────────────────────────────────

function ScreenProfile() {
  return <HiPhone>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Mi perfil</div>
      <span style={{ fontSize: 14, color: C.neon }}>Editar</span>
    </div>

    {/* Avatar */}
    <div style={{ textAlign: 'center', marginBottom: 16 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(204,255,0,0.1)', border: `2px solid ${C.neon}`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: `0 0 20px ${C.neon}33` }}>C</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Carlos Pérez</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>carlos@email.com</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        <Pill color={C.neon}>🔥 Racha 5 días</Pill>
        <Pill color={C.purple}>Nivel 3</Pill>
      </div>
    </div>

    {/* Stats */}
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {[{v:'312',l:'Kcal hoy'},{v:'38min',l:'Activo'},{v:'5',l:'Días racha'}].map(s => (
        <div key={s.l} style={{ ...glass, flex: 1, textAlign: 'center', padding: '10px 4px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.neon }}>{s.v}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{s.l}</div>
        </div>
      ))}
    </div>

    {/* Biometrics */}
    <div style={{ ...glass, padding: '12px 16px', marginBottom: 10 }}>
      <Label>Datos biométricos</Label>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {[{l:'Peso',v:'78 kg'},{l:'Altura',v:'175 cm'},{l:'IMC',v:'25.5'},{l:'Grasa',v:'18%'}].map(b => (
          <div key={b.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{b.v}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{b.l}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Goal progress */}
    <div style={{ ...glassNeon, padding: '12px 16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.neon }}>🔥 Perder grasa</div>
        <div style={{ fontSize: 13, color: C.muted }}>Faltan 6 kg</div>
      </div>
      <ProgressBar pct={35} />
      <div style={{ fontSize: 12, color: C.muted, marginTop: 5 }}>72 kg objetivo · actualmente 78 kg</div>
    </div>

    {[
      { icon: '📊', label: 'Historial de entrenamientos' },
      { icon: '🏆', label: 'Logros y medallas' },
      { icon: '⚙️', label: 'Ajustes de cuenta' },
    ].map(m => (
      <div key={m.label} style={{ ...glass, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 6, cursor: 'pointer' }}>
        <span style={{ fontSize: 17 }}>{m.icon}</span>
        <span style={{ flex: 1, fontSize: 15, color: C.text }}>{m.label}</span>
        <span style={{ color: C.dim }}>›</span>
      </div>
    ))}
    <BottomNav active="me" />
  </HiPhone>;
}

// ─── SCREEN: GAMIFICATION ───────────────────────────────────────────────────

function ScreenGamification() {
  return <HiPhone>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Tu progreso</div>
      <Pill color={C.neon}>Semana 1</Pill>
    </div>

    {/* Level */}
    <div style={{ background: 'linear-gradient(135deg, rgba(204,255,0,0.08), rgba(204,255,0,0.03))', border: `1px solid ${C.borderAccent}`, borderRadius: 16, padding: '14px 16px', textAlign: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 36, marginBottom: 4 }}>🏆</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.neon }}>Nivel 3 · Atleta Emergente</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>1,240 / 2,000 XP para nivel 4</div>
      <ProgressBar pct={62} />
    </div>

    {/* Achievements */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Logros</div>
      <span style={{ fontSize: 13, color: C.neon }}>Ver todos</span>
    </div>
    {[
      { icon: '🔥', name: 'Primera llama', desc: '5 días de racha', done: true },
      { icon: '💪', name: 'Sin excusas', desc: '3 entrenos completados', done: true },
      { icon: '🥗', name: 'Nutrido', desc: '7 días de comidas registradas', done: false, pct: 71 },
    ].map(a => (
      <div key={a.name} style={{ ...glass, display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', marginBottom: 7, opacity: a.done ? 1 : 0.7 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: a.done ? `${C.neon}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${a.done ? C.neon+'44' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{a.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: a.done ? 700 : 400, color: a.done ? C.text : C.muted }}>{a.name}</div>
          <div style={{ fontSize: 12, color: C.dim }}>{a.desc}</div>
          {!a.done && <div style={{ marginTop: 4 }}><ProgressBar pct={a.pct} color={C.dim} h={3} /></div>}
        </div>
        {a.done && <span style={{ color: C.neon, filter: `drop-shadow(0 0 6px ${C.neon})` }}>★</span>}
      </div>
    ))}

    {/* Liga */}
    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8, marginTop: 4 }}>Liga semanal</div>
    {[
      { pos: 1, name: 'MariF.', xp: '2,340 XP', you: false },
      { pos: 2, name: 'Tú', xp: '1,240 XP', you: true },
      { pos: 3, name: 'Juanp.', xp: '980 XP', you: false },
    ].map(u => (
      <div key={u.name} style={{ background: u.you ? `${C.neon}0d` : 'rgba(255,255,255,0.04)', border: `1px solid ${u.you ? C.borderAccent : C.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', marginBottom: 6 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: u.pos===1?'#FFD700':C.dim, width: 18 }}>{u.pos}</div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.muted }}>{u.name[0]}</div>
        <div style={{ flex: 1, fontSize: 15, color: u.you ? C.neon : C.text, fontWeight: u.you ? 700 : 400 }}>{u.name}</div>
        <div style={{ fontSize: 13, color: C.muted }}>{u.xp}</div>
      </div>
    ))}
    <BottomNav active="prog" />
  </HiPhone>;
}

Object.assign(window, {
  ScreenLogin, ScreenOnboardGoal, ScreenDashboard,
  ScreenWorkoutAI, ScreenNutrition, ScreenPantry,
  ScreenPostSummary, ScreenStretch, ScreenRecovery,
  ScreenProfile, ScreenGamification,
});
