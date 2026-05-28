/* ═══════════════ EcoHarmony — screens ═══════════════ */
const PASSES = {
  regular: {
    id: "regular", name: "Pase Regular", price: 4500, icon: Icon.Ticket,
    tag: "El más elegido",
    perks: ["Acceso a todas las exhibiciones", "Mapa interactivo del parque", "Horarios de alimentación"],
  },
  vip: {
    id: "vip", name: "Pase VIP", price: 7800, icon: Icon.Crown,
    tag: "Experiencia completa",
    perks: ["Todo lo del Pase Regular", "Acceso prioritario sin filas", "Show especial reservado", "Estacionamiento incluido"],
  },
};

/* ---------- pass card ---------- */
function PassCard({ pass, selected, onSelect, big }) {
  const I = pass.icon;
  const vip = pass.id === "vip";
  return (
    <button onClick={() => onSelect(pass.id)}
      className={`relative w-full text-left rounded-2xl border-2 transition-all overflow-hidden active:scale-[0.99]
        ${selected ? "border-transparent" : "border-emerald-900/10 dark:border-white/10 hover:border-emerald-500/40"}`}
      style={selected ? { boxShadow: "0 0 0 2px var(--p5), 0 14px 30px -14px var(--p6)" } : {}}>
      {big && (
        <div className="h-20 relative" style={{ background: vip
          ? "linear-gradient(120deg,var(--a6),var(--p6))"
          : "linear-gradient(120deg,var(--p4),var(--a5))" }}>
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 80% 20%,#fff 0,transparent 45%)" }} />
          <I className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 text-white/85" />
          <span className="absolute left-4 top-3 text-[10.5px] font-semibold uppercase tracking-wider text-white/90">{pass.tag}</span>
        </div>
      )}
      <div className={`p-4 ${selected ? "bg-emerald-500/[0.06]" : "bg-white/60 dark:bg-white/[0.02]"}`}>
        <div className="flex items-start gap-3">
          {!big && (
            <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0 text-white"
                  style={{ background: vip ? "linear-gradient(135deg,var(--a6),var(--p6))" : "linear-gradient(135deg,var(--p4),var(--a5))" }}>
              <I className="w-5 h-5" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-poppins font-semibold text-[15px] text-slate-800 dark:text-white">{pass.name}</h4>
              <span className={`grid place-items-center w-5 h-5 rounded-full border-2 shrink-0 transition
                ${selected ? "border-transparent text-white" : "border-slate-300 dark:border-slate-600 text-transparent"}`}
                style={selected ? { background: "linear-gradient(135deg,var(--p5),var(--a6))" } : {}}>
                <Icon.Check className="w-3 h-3" strokeWidth="3" />
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="font-poppins font-bold text-xl text-slate-900 dark:text-white">{ARS(pass.price)}</span>
              <span className="text-[12px] text-slate-400">/ persona</span>
            </div>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {pass.perks.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-slate-600 dark:text-slate-300">
              <Icon.Check className="w-[15px] h-[15px] mt-px shrink-0" style={{ color: "var(--p5)" }} strokeWidth="2.5" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

/* ---------- age rows ---------- */
function AgeRows({ qty, ages, onChange, error }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: qty }).map((_, i) => {
          const val = ages[i] ?? "";
          const bad = error && (val === "" || +val < 0 || +val > 120);
          return (
            <label key={i} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 bg-white/60 dark:bg-white/[0.03] transition
              ${bad ? "border-rose-400/70" : "border-emerald-900/10 dark:border-white/10 focus-within:border-emerald-500/60"}`}>
              <span className="grid place-items-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 text-emerald-700 dark:text-emerald-300 bg-emerald-500/12">
                {i + 1}
              </span>
              <input type="number" inputMode="numeric" min="0" max="120" placeholder="Edad"
                value={val} onChange={(e) => onChange(i, e.target.value)}
                className="w-full bg-transparent outline-none text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-normal" />
              <span className="text-[11px] text-slate-400 shrink-0">años</span>
            </label>
          );
        })}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

/* ---------- payment options ---------- */
function PayOptions({ value, onChange, error }) {
  const opts = [
    { id: "tarjeta", icon: Icon.Card, t: "Tarjeta", s: "Pago seguro vía Mercado Pago", badge: "Recomendado" },
    { id: "efectivo", icon: Icon.Cash, t: "Efectivo", s: "Abonás al ingresar, en boletería" },
  ];
  return (
    <div>
      <div className="space-y-2.5">
        {opts.map((o) => {
          const sel = value === o.id, I = o.icon;
          return (
            <button key={o.id} onClick={() => onChange(o.id)}
              className={`w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition active:scale-[0.99]
                ${sel ? "border-transparent bg-emerald-500/[0.06]" : "border-emerald-900/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] hover:border-emerald-500/40"}`}
              style={sel ? { boxShadow: "0 0 0 2px var(--p5)" } : {}}>
              <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0 text-white"
                    style={{ background: sel ? "linear-gradient(135deg,var(--p5),var(--a6))" : "linear-gradient(135deg,#94a3b8,#64748b)" }}>
                <I className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-poppins font-semibold text-[14.5px] text-slate-800 dark:text-white">{o.t}</span>
                  {o.badge && <span className="text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-emerald-700 dark:text-emerald-300 bg-emerald-500/12">{o.badge}</span>}
                </div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">{o.s}</div>
              </div>
              <span className={`grid place-items-center w-5 h-5 rounded-full border-2 shrink-0
                ${sel ? "border-transparent text-white" : "border-slate-300 dark:border-slate-600 text-transparent"}`}
                style={sel ? { background: "linear-gradient(135deg,var(--p5),var(--a6))" } : {}}>
                <Icon.Check className="w-3 h-3" strokeWidth="3" />
              </span>
            </button>
          );
        })}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

/* ════════════ PURCHASE SCREEN (3 variantes) ════════════ */
function PurchaseScreen({ f, set, errors, onConfirm, variant }) {
  const pass = f.pass ? PASSES[f.pass] : null;
  const total = pass ? pass.price * f.qty : 0;

  /* field renderers — compartidos entre variantes */
  const FldDate = (
    <>
      <SectionLabel n="1" icon={Icon.Calendar} hint={f.date ? "✓" : "requerido"}>Fecha de visita</SectionLabel>
      {f.date && (
        <div className="flex items-center gap-2 mb-3 text-[13px] font-medium px-3 py-2 rounded-xl text-emerald-800 dark:text-emerald-200 bg-emerald-500/10">
          <Icon.Check className="w-4 h-4" strokeWidth="2.5" /><span>{fmtLong(f.date)}</span>
        </div>
      )}
      <Calendar selected={f.date} onSelect={(d) => set({ date: d })} />
      <FieldError>{errors.date}</FieldError>
    </>
  );
  const FldPass = (
    <>
      <SectionLabel n="2" icon={Icon.Ticket} hint={f.pass ? "✓" : "requerido"}>Tipo de pase</SectionLabel>
      <div className={variant === "C" ? "space-y-3" : "space-y-2.5"}>
        <PassCard pass={PASSES.regular} selected={f.pass === "regular"} onSelect={(id) => set({ pass: id })} big={variant === "C"} />
        <PassCard pass={PASSES.vip} selected={f.pass === "vip"} onSelect={(id) => set({ pass: id })} big={variant === "C"} />
      </div>
      <FieldError>{errors.pass}</FieldError>
    </>
  );
  const FldQty = (
    <>
      <SectionLabel n="3" icon={Icon.Users} hint="máx. 10">Cantidad y visitantes</SectionLabel>
      <Stepper value={f.qty} min={1} max={10} onChange={(v) => set({ qty: v })} />
      <div className="mt-4">
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mb-2">Indicá la edad de cada visitante</p>
        <AgeRows qty={f.qty} ages={f.ages} error={errors.ages}
          onChange={(i, v) => { const a = [...f.ages]; a[i] = v; set({ ages: a }); }} />
      </div>
    </>
  );
  const FldPay = (
    <>
      <SectionLabel n="4" icon={Icon.Lock} hint={f.payment ? "✓" : "requerido"}>Forma de pago</SectionLabel>
      <PayOptions value={f.payment} onChange={(v) => set({ payment: v })} error={errors.payment} />
    </>
  );

  /* layout por variante */
  let body;
  if (variant === "B") {
    // Compacto — todo en una sola tarjeta con divisores
    body = (
      <Glass className="p-5 divide-y divide-emerald-900/[0.07] dark:divide-white/[0.06]">
        <div className="pb-5">{FldDate}</div>
        <div className="py-5">{FldPass}</div>
        <div className="py-5">{FldQty}</div>
        <div className="pt-5">{FldPay}</div>
      </Glass>
    );
  } else {
    // A (tarjetas) y C (visual) — tarjetas separadas
    const pad = variant === "C" ? "p-5" : "p-4";
    body = (
      <div className="space-y-3.5">
        <Glass className={pad}>{FldDate}</Glass>
        <Glass className={pad}>{FldPass}</Glass>
        <Glass className={pad}>{FldQty}</Glass>
        <Glass className={pad}>{FldPay}</Glass>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-32">
      {variant === "C" ? (
        <div className="relative rounded-[1.6rem] overflow-hidden mb-4 p-5 text-white"
             style={{ background: "linear-gradient(130deg,var(--p6),var(--a6))" }}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 85% 15%,#fff 0,transparent 40%),radial-gradient(circle at 10% 90%,#fff 0,transparent 35%)" }} />
          <div className="relative">
            <Icon.Leaf className="w-7 h-7 mb-2 text-white/90" />
            <h2 className="font-poppins font-bold text-2xl leading-tight">Reservá tu visita</h2>
            <p className="text-[13px] text-white/85 mt-1">Asegurá tu lugar en EcoHarmony Park en 4 pasos.</p>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <h2 className="font-poppins font-bold text-[22px] text-slate-900 dark:text-white leading-tight">Comprá tus entradas</h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Completá los datos y asegurá tu visita al parque.</p>
        </div>
      )}

      {body}

      {/* resumen */}
      <Glass className="p-4 mt-3.5">
        <div className="flex items-center justify-between text-[13px] text-slate-500 dark:text-slate-400">
          <span>{pass ? `${pass.name} · ${f.qty} ${f.qty === 1 ? "entrada" : "entradas"}` : "Seleccioná un pase"}</span>
          {pass && <span>{ARS(pass.price)} × {f.qty}</span>}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-900/[0.07] dark:border-white/[0.06]">
          <span className="font-poppins font-semibold text-slate-700 dark:text-slate-200">Total</span>
          <span className="font-poppins font-bold text-2xl bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg,var(--p6),var(--a6))" }}>{ARS(total)}</span>
        </div>
      </Glass>
    </div>
  );
}

/* ════════════ MERCADO PAGO (pasarela genérica segura) ════════════ */
function PaymentGateway({ amount, onPaid, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState("");
  const pay = () => { setBusy(true); setTimeout(onPaid, 1900); };
  const fmtCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  return (
    <div className="px-4 pt-4 pb-10">
      <div className="flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-400 mb-4">
        <Icon.Shield className="w-4 h-4" style={{ color: "var(--p5)" }} />
        Conexión segura · <span className="font-semibold text-slate-700 dark:text-slate-200">Mercado&nbsp;Pago</span>
      </div>

      <Glass className="overflow-hidden">
        <div className="p-5 text-white" style={{ background: "linear-gradient(120deg,var(--p6),var(--a6))" }}>
          <div className="text-[12px] text-white/80">Total a pagar</div>
          <div className="font-poppins font-bold text-3xl">{ARS(amount)}</div>
          <div className="text-[12px] text-white/80 mt-1">EcoHarmony Park · Entradas</div>
        </div>
        <div className="p-5 space-y-3">
          {busy ? (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full border-[3px] border-emerald-500/25 border-t-emerald-500 animate-spin" />
              <p className="mt-4 font-poppins font-semibold text-slate-700 dark:text-slate-200">Procesando pago…</p>
              <p className="text-[12.5px] text-slate-400 mt-1">No cierres esta pantalla</p>
            </div>
          ) : (
            <>
              <Mp label="Número de tarjeta">
                <input value={card} onChange={(e) => setCard(fmtCard(e.target.value))} inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  className="w-full bg-transparent outline-none text-[15px] tracking-wide font-medium text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-normal" />
              </Mp>
              <Mp label="Titular de la tarjeta">
                <input placeholder="Como figura en la tarjeta"
                  className="w-full bg-transparent outline-none text-[15px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-normal" />
              </Mp>
              <div className="grid grid-cols-2 gap-3">
                <Mp label="Vencimiento"><input placeholder="MM/AA" className="w-full bg-transparent outline-none text-[15px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-normal" /></Mp>
                <Mp label="CVV"><input placeholder="•••" inputMode="numeric" className="w-full bg-transparent outline-none text-[15px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-normal" /></Mp>
              </div>
              <PrimaryBtn onClick={pay} className="mt-1"><Icon.Lock className="w-4 h-4" />Pagar {ARS(amount)}</PrimaryBtn>
              <button onClick={onCancel} className="w-full text-center text-[13px] font-medium text-slate-500 dark:text-slate-400 py-2">Cancelar y volver</button>
            </>
          )}
        </div>
      </Glass>
      <p className="text-[11.5px] text-slate-400 text-center mt-4 px-6">Tus datos están protegidos. Simulación de pasarela de pago para el prototipo.</p>
    </div>
  );
}
function Mp({ label, children }) {
  return (
    <label className="block rounded-xl border border-emerald-900/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-3.5 py-2.5 focus-within:border-emerald-500/60 transition">
      <span className="block text-[11px] font-medium text-slate-400 mb-0.5">{label}</span>
      {children}
    </label>
  );
}

/* ════════════ CONFIRMACIÓN ════════════ */
function SuccessScreen({ order, onReset }) {
  const pass = PASSES[order.pass];
  const code = order.code;
  const tarjeta = order.payment === "tarjeta";
  return (
    <div className="px-4 pt-6 pb-12">
      <div className="flex flex-col items-center text-center mb-5">
        <div className="relative w-20 h-20 grid place-items-center rounded-full mb-4"
             style={{ background: "linear-gradient(135deg,var(--p5),var(--a5))", boxShadow: "0 16px 36px -12px var(--p6)" }}>
          <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: "var(--p5)" }} />
          <Icon.Check className="w-10 h-10 text-white relative" strokeWidth="2.5" />
        </div>
        <h2 className="font-poppins font-bold text-2xl text-slate-900 dark:text-white">¡Compra confirmada!</h2>
        <p className="text-[14px] text-slate-600 dark:text-slate-300 mt-1.5 px-2">
          Compraste <b>{order.qty} {order.qty === 1 ? "entrada" : "entradas"}</b> para el <b>{fmtLong(order.date)}</b>.
        </p>
        <div className="flex items-center gap-2 mt-3 text-[13px] font-medium px-3.5 py-2 rounded-full text-emerald-800 dark:text-emerald-200 bg-emerald-500/10">
          <Icon.Mail className="w-4 h-4" />Enviamos la confirmación a tu correo
        </div>
      </div>

      {/* ticket */}
      <Glass className="overflow-hidden">
        <div className="p-5 text-white relative" style={{ background: "linear-gradient(120deg,var(--p6),var(--a6))" }}>
          <div className="flex items-center gap-2">
            <Icon.Leaf className="w-5 h-5" />
            <span className="font-poppins font-bold tracking-tight">EcoHarmony Park</span>
          </div>
          <div className="mt-3 font-poppins font-semibold text-lg flex items-center gap-2">
            {pass.id === "vip" ? <Icon.Crown className="w-5 h-5" /> : <Icon.Ticket className="w-5 h-5" />}{pass.name}
          </div>
        </div>
        {/* perforación */}
        <div className="relative h-0">
          <span className="absolute -left-2.5 -top-2.5 w-5 h-5 rounded-full bg-[var(--screen-bg)]" />
          <span className="absolute -right-2.5 -top-2.5 w-5 h-5 rounded-full bg-[var(--screen-bg)]" />
          <div className="absolute left-3 right-3 top-0 border-t-2 border-dashed border-emerald-900/15 dark:border-white/15" />
        </div>
        <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-3">
          <Info label="Fecha de visita" value={fmtLong(order.date)} />
          <Info label="Entradas" value={`${order.qty} ${order.qty === 1 ? "persona" : "personas"}`} />
          <Info label="Pase" value={pass.name} />
          <Info label="Total" value={ARS(order.total)} strong />
          <Info label="Forma de pago" value={tarjeta ? "Tarjeta (Mercado Pago)" : "Efectivo en boletería"} />
          <Info label="Estado" value={tarjeta ? "Pagada" : "A abonar en ingreso"} accent={tarjeta} />
        </div>
        <div className="mx-5 mb-5 rounded-xl bg-slate-900/[0.04] dark:bg-white/[0.04] p-4 flex items-center gap-4">
          <div className="grid grid-cols-8 gap-0.5 shrink-0" aria-hidden>
            {Array.from({ length: 64 }).map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-[1px]" style={{ background: (i * 7 + (i % 3) * 5 + (i % 5)) % 3 ? "currentColor" : "transparent", color: "var(--p6)" }} />
            ))}
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Código de reserva</div>
            <div className="font-mono font-bold text-[15px] tracking-wider text-slate-800 dark:text-white">{code}</div>
          </div>
        </div>
      </Glass>

      <div className="flex items-start gap-2 mt-4 text-[12.5px] text-slate-500 dark:text-slate-400 px-1">
        <Icon.Info className="w-4 h-4 mt-px shrink-0" style={{ color: "var(--p5)" }} />
        <span>{tarjeta
          ? "Tus entradas están pagas. Mostrá el código en el acceso para validarlas al ingresar."
          : "Presentá este código en boletería para abonar y retirar tus entradas el día de la visita."}</span>
      </div>

      <div className="mt-5">
        <PrimaryBtn onClick={onReset}><Icon.Leaf className="w-4 h-4" />Volver al inicio</PrimaryBtn>
      </div>
    </div>
  );
}
function Info({ label, value, strong, accent, cap }) {
  return (
    <div>
      <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
      <div className={`${strong ? "font-poppins font-bold text-[16px]" : "font-medium text-[13.5px]"} ${cap ? "capitalize " : ""}${accent ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white"}`}>{value}</div>
    </div>
  );
}

Object.assign(window, { PASSES, PurchaseScreen, PaymentGateway, SuccessScreen });
