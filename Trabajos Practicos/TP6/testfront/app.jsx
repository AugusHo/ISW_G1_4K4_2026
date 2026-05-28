/* ═══════════════ EcoHarmony — app ═══════════════ */

/* paletas verdes conmutables (Tweak) */
const ECO_PALETTES = {
  esmeralda: { p5:"#10b981", p6:"#059669", p4:"#34d399", a5:"#84cc16", a6:"#4d9a16" },
  selva:     { p5:"#16a34a", p6:"#15803d", p4:"#4ade80", a5:"#0d9488", a6:"#0f766e" },
  tropical:  { p5:"#14b8a6", p6:"#0d9488", p4:"#2dd4bf", a5:"#22c55e", a6:"#16a34a" },
};
function applyEcoPalette(arr) {
  // arr = [p5,p6,p4,a5,a6]
  const r = document.documentElement.style;
  ["--p5","--p6","--p4","--a5","--a6"].forEach((k, i) => r.setProperty(k, arr[i]));
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "variant": "A",
  "palette": ["#10b981", "#059669", "#34d399", "#84cc16", "#4d9a16"],
  "dark": false
}/*EDITMODE-END*/;

const newCode = () =>
  "ECO-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + (Math.floor(Math.random() * 900) + 100);

function validate(f) {
  const e = {};
  if (!f.date) e.date = "Elegí una fecha de visita.";
  else if (isClosed(f.date)) e.date = "El parque permanece cerrado ese día. Elegí otra fecha.";
  if (!f.pass) e.pass = "Seleccioná un tipo de pase para continuar.";
  const ages = f.ages.slice(0, f.qty);
  if (f.qty < 1 || f.qty > 10) e.qty = "La cantidad debe estar entre 1 y 10 entradas.";
  if (ages.length < f.qty || ages.some((a) => a === "" || a == null || +a < 0 || +a > 120))
    e.ages = "Completá una edad válida (0–120) para cada visitante.";
  if (!f.payment) e.payment = "Seleccioná una forma de pago.";
  return e;
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-2.5 pb-1 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 select-none">
      <span>10:30</span>
      <div className="flex items-center gap-1.5">
        <svg viewBox="0 0 18 12" className="w-4 h-3 fill-current"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="1.5" width="3" height="10.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.4"/></svg>
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 4C7 4 3 7 1 11l11 9 11-9c-2-4-6-7-11-7Z" opacity="0.35"/><path d="M12 4c5 0 9 3 11 7l-4 3c-1.5-3-4-5-7-5Z"/></svg>
        <svg viewBox="0 0 26 12" className="w-6 h-3 stroke-current fill-none"><rect x="0.6" y="0.6" width="21" height="10.8" rx="2.5" strokeWidth="1.2"/><rect x="2.5" y="2.5" width="14" height="7" rx="1" className="fill-current stroke-none"/><rect x="23" y="3.5" width="2" height="5" rx="1" className="fill-current stroke-none"/></svg>
      </div>
    </div>
  );
}

function AppBar({ step, onBack }) {
  const title = step === "mp" ? "Pago" : step === "success" ? "Confirmación" : "Comprar Entradas";
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-emerald-900/[0.06] dark:border-white/[0.06]">
      {step === "form" ? (
        <span className="grid place-items-center w-9 h-9 rounded-full text-white shrink-0" style={{ background: "linear-gradient(135deg,var(--p5),var(--a5))" }}>
          <Icon.Leaf className="w-[18px] h-[18px]" />
        </span>
      ) : (
        <button onClick={onBack} className="grid place-items-center w-9 h-9 rounded-full text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 transition shrink-0">
          <Icon.ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-poppins font-bold text-[15px] text-slate-900 dark:text-white leading-tight truncate">{title}</div>
        {step === "form" && <div className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-tight">EcoHarmony Park</div>}
      </div>
      <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-emerald-500/[0.08] shrink-0">
        <span className="grid place-items-center w-6 h-6 rounded-full text-white text-[10px] font-bold" style={{ background: "linear-gradient(135deg,var(--p6),var(--a6))" }}>VM</span>
        <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 hidden xs:inline pr-1">Sesión iniciada</span>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [step, setStep] = useState("form");
  const [f, setF] = useState({ date: null, pass: null, qty: 1, ages: [""], payment: null });
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { applyEcoPalette(t.palette); }, [t.palette]);
  useEffect(() => { document.documentElement.classList.toggle("dark", !!t.dark); }, [t.dark]);

  const set = (patch) => {
    setF((prev) => {
      const next = { ...prev, ...patch };
      if ("qty" in patch) {
        const a = [...next.ages];
        while (a.length < next.qty) a.push("");
        a.length = next.qty;
        next.ages = a;
      }
      return next;
    });
    setErrors((e) => {
      const n = { ...e };
      Object.keys(patch).forEach((k) => {
        if (k in n) delete n[k];
        if ((k === "qty" || k === "ages") && n.ages) delete n.ages;
      });
      return n;
    });
  };

  const toTop = () => scrollRef.current && scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });

  const confirm = () => {
    const e = validate(f);
    setErrors(e);
    if (Object.keys(e).length) {
      // llevar al primer error visible
      toTop();
      return;
    }
    const pass = PASSES[f.pass];
    setOrder({ ...f, total: pass.price * f.qty, code: newCode() });
    setStep(f.payment === "tarjeta" ? "mp" : "success");
    toTop();
  };

  const reset = () => {
    setF({ date: null, pass: null, qty: 1, ages: [""], payment: null });
    setErrors({});
    setOrder(null);
    setStep("form");
    toTop();
  };

  const back = () => {
    if (step === "mp") { setStep("form"); toTop(); }
    else if (step === "success") reset();
  };

  const total = order ? order.total : (f.pass ? PASSES[f.pass].price * f.qty : 0);

  return (
    <div className="app-stage">
      <Aurora />
      <div className="screen">
        <StatusBar />
        <AppBar step={step} onBack={back} />
        <main ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          {step === "form" && <PurchaseScreen f={f} set={set} errors={errors} onConfirm={confirm} variant={t.variant} />}
          {step === "mp" && <PaymentGateway amount={total} onPaid={() => { setStep("success"); toTop(); }} onCancel={back} />}
          {step === "success" && <SuccessScreen order={order} onReset={reset} />}
        </main>
        {step === "form" && (
          <div className="px-4 py-3 border-t border-emerald-900/[0.06] dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.02] backdrop-blur-xl">
            <PrimaryBtn onClick={confirm}>
              <Icon.Lock className="w-4 h-4" />Confirmar compra · {ARS(total)}
            </PrimaryBtn>
            <p className="text-[11px] text-center text-slate-400 mt-2">La compra está disponible solo para usuarios registrados</p>
          </div>
        )}
      </div>

      <TweaksPanel>
        <TweakSection label="Pantalla principal" />
        <TweakRadio label="Diseño" value={t.variant}
          options={[{ value: "A", label: "Tarjetas" }, { value: "B", label: "Compacto" }, { value: "C", label: "Visual" }]}
          onChange={(v) => setTweak("variant", v)} />
        <TweakSection label="Estilo" />
        <TweakColor label="Paleta" value={t.palette}
          options={[ECO_PALETTES.esmeralda, ECO_PALETTES.selva, ECO_PALETTES.tropical].map((p) => [p.p5, p.p6, p.p4, p.a5, p.a6])}
          onChange={(v) => setTweak("palette", v)} />
        <TweakToggle label="Modo oscuro" value={t.dark} onChange={(v) => setTweak("dark", v)} />
      </TweaksPanel>
    </div>
  );
}

/* aurora background (emerald) */
function Aurora() {
  return (
    <div className="aurora">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
