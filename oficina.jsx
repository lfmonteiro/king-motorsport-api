import { useState, useEffect, useCallback } from "react";

// ─── URL da API ───────────────────────────────────────────────────────────────
// Em desenvolvimento: http://localhost:3001
// Em produção: troque para o IP/domínio do seu servidor
const API_URL = "http://localhost:3333";

// ─── Hook central de API ──────────────────────────────────────────────────────
// Todas as chamadas passam por aqui: trata erros, loading e JSON
const useApi = () => {
  const req = useCallback(async (method, path, body = null) => {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || "Erro na requisição");
    return data;
  }, []);

  return {
    get:    (path)        => req("GET",    path),
    post:   (path, body)  => req("POST",   path, body),
    put:    (path, body)  => req("PUT",    path, body),
    patch:  (path, body)  => req("PATCH",  path, body),
    del:    (path)        => req("DELETE", path),
  };
};

// ─── Paleta King Motorsport ───────────────────────────────────────────────────
const C = {
  bg: "#0A0A0A", surface: "#111111", card: "#181818", border: "#2A2A2A",
  gold: "#C9A84C", goldLight: "#F0CC6A", goldDim: "#1A1508", goldBright: "#FFD770",
  text: "#F0EDE8", muted: "#7A7570", green: "#2ECC71", red: "#E74C3C", yellow: "#F1C40F",
};

// ─── Dados da oficina ─────────────────────────────────────────────────────────
const OFICINA = {
  nome: "King Motorsport", razao: "KING MOTORSPORT BR",
  cnpj: "38.224.076/0001-73",
  endereco: "Rua Djalma Pessolato, 203 – São Paulo/SP – CEP 04815-120",
  telefone: "+55 (11) 95989-1402", email: "king.motorsport@outlook.com",
  instagram: "@king.motorsport",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt     = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d) => { if (!d) return "-"; const dt = new Date(d); return dt.toLocaleDateString("pt-BR"); };
const totalOS = (os) => [...(os?.servicos || []), ...(os?.pecas || [])].reduce((s, i) => s + Number(i.valor || 0), 0);
const statusColor = (s) => ({ aberta: C.yellow, "em-andamento": C.gold, concluida: C.green, cancelada: C.red }[s] || C.muted);
const statusLabel = (s) => ({ aberta: "Aberta", "em-andamento": "Em Andamento", concluida: "Concluída", cancelada: "Cancelada" }[s] || s);

// ─── Logo SVG ─────────────────────────────────────────────────────────────────
const KingLogo = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD770" /><stop offset="40%" stopColor="#C9A84C" /><stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <linearGradient id="silverG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C0C0C0" /><stop offset="50%" stopColor="#808080" /><stop offset="100%" stopColor="#505050" />
      </linearGradient>
    </defs>
    <g opacity="0.95">
      <path d="M98 95 L20 80 L15 88 L95 105 Z" fill="url(#goldG)" />
      <path d="M96 100 L18 90 L15 98 L94 110 Z" fill="url(#goldG)" opacity="0.8" />
      <path d="M94 106 L22 100 L20 108 L93 116 Z" fill="url(#goldG)" opacity="0.6" />
    </g>
    <g opacity="0.95">
      <path d="M102 95 L180 80 L185 88 L105 105 Z" fill="url(#goldG)" />
      <path d="M104 100 L182 90 L185 98 L106 110 Z" fill="url(#goldG)" opacity="0.8" />
      <path d="M106 106 L178 100 L180 108 L107 116 Z" fill="url(#goldG)" opacity="0.6" />
    </g>
    <g transform="rotate(-40, 72, 72)">
      <rect x="64" y="30" width="16" height="30" rx="3" fill="url(#silverG)" />
      <rect x="60" y="24" width="24" height="12" rx="4" fill="url(#silverG)" />
      <line x1="72" y1="60" x2="72" y2="85" stroke="url(#silverG)" strokeWidth="6" strokeLinecap="round" />
      <rect x="62" y="82" width="20" height="10" rx="3" fill="url(#silverG)" />
    </g>
    <g transform="rotate(40, 128, 72)">
      <rect x="120" y="30" width="16" height="30" rx="3" fill="url(#silverG)" />
      <rect x="116" y="24" width="24" height="12" rx="4" fill="url(#silverG)" />
      <line x1="128" y1="60" x2="128" y2="85" stroke="url(#silverG)" strokeWidth="6" strokeLinecap="round" />
      <rect x="118" y="82" width="20" height="10" rx="3" fill="url(#silverG)" />
    </g>
    <path d="M100 38 L134 52 L134 100 Q134 128 100 145 Q66 128 66 100 L66 52 Z" fill="#0A0A0A" stroke="url(#goldG)" strokeWidth="3" />
    <g transform="translate(100, 92)">
      <rect x="-22" y="8" width="44" height="10" rx="3" fill="url(#goldG)" />
      <polygon points="-22,8 -18,-14 -10,-2 0,-18 10,-2 18,-14 22,8" fill="url(#goldG)" />
      <circle cx="-18" cy="-11" r="3.5" fill="#0A0A0A" stroke={C.goldBright} strokeWidth="1" />
      <circle cx="0" cy="-15" r="3.5" fill="#0A0A0A" stroke={C.goldBright} strokeWidth="1" />
      <circle cx="18" cy="-11" r="3.5" fill="#0A0A0A" stroke={C.goldBright} strokeWidth="1" />
    </g>
    <path d="M78 132 Q100 145 122 132 L118 142 Q100 152 82 142 Z" fill="url(#goldG)" opacity="0.7" />
  </svg>
);

const LogoHeader = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <KingLogo size={40} />
    <div>
      <p style={{ color: C.gold, fontWeight: 900, fontSize: 14, margin: 0, letterSpacing: 3, textTransform: "uppercase", fontFamily: "'Georgia', serif" }}>KING</p>
      <p style={{ color: C.goldLight, fontWeight: 700, fontSize: 8, margin: 0, letterSpacing: 4, textTransform: "uppercase" }}>MOTORSPORT</p>
    </div>
  </div>
);

const LogoNota = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    <KingLogo size={68} />
    <div style={{ textAlign: "center" }}>
      <p style={{ color: C.gold, fontWeight: 900, fontSize: 20, margin: 0, letterSpacing: 6, textTransform: "uppercase", fontFamily: "'Georgia', serif" }}>KING MOTORSPORT</p>
      <div style={{ height: 1, background: `linear-gradient(to right,transparent,${C.gold},transparent)`, margin: "4px 0" }} />
      <p style={{ color: C.muted, fontSize: 10, margin: 0, letterSpacing: 2 }}>SERVIÇOS AUTOMOTIVOS</p>
    </div>
  </div>
);

// ─── Componentes base ─────────────────────────────────────────────────────────
const Badge = ({ status }) => (
  <span style={{ background: statusColor(status) + "22", color: statusColor(status), border: `1px solid ${statusColor(status)}55`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
    {statusLabel(status)}
  </span>
);

const Btn = ({ children, onClick, variant = "primary", small, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? C.border : variant === "primary" ? `linear-gradient(135deg,${C.gold},${C.goldLight})` : variant === "ghost" ? "transparent" : variant === "danger" ? C.red + "22" : C.card,
    color: disabled ? C.muted : variant === "primary" ? "#000" : variant === "danger" ? C.red : variant === "ghost" ? C.muted : C.text,
    border: variant === "ghost" ? "none" : `1px solid ${disabled ? C.border : variant === "danger" ? C.red + "55" : variant === "primary" ? C.gold : C.border}`,
    borderRadius: 10, padding: small ? "6px 14px" : "11px 20px", fontSize: small ? 12 : 14,
    fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer", transition: "opacity .15s", letterSpacing: small ? 0.5 : 0.8, ...style,
  }}>{children}</button>
);

const Input = ({ label, value, onChange, type = "text", placeholder, required }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 5 }}>
      {label}{required && <span style={{ color: C.gold }}> *</span>}
    </label>}
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 13px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
  </div>
);

const Select = ({ label, value, onChange, children, required }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 5 }}>
      {label}{required && <span style={{ color: C.gold }}> *</span>}
    </label>}
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 13px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}>
      {children}
    </select>
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>}
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 13px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
  </div>
);

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 12, cursor: onClick ? "pointer" : "default", transition: "border-color .15s, background .15s", ...style }}
    onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.borderColor = C.gold + "66"; e.currentTarget.style.background = "#1E1A10"; } }}
    onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; } }}>
    {children}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "#000000DD", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div style={{ background: C.surface, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", padding: "8px 20px 32px", borderTop: `2px solid ${C.gold}44` }}>
      <div style={{ width: 40, height: 3, background: C.gold + "66", borderRadius: 2, margin: "12px auto 18px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: C.text, fontSize: 17, fontWeight: 800, margin: 0 }}>{title}</h2>
        <Btn variant="ghost" small onClick={onClose}>✕</Btn>
      </div>
      {children}
    </div>
  </div>
);

// ─── Spinner de carregamento ──────────────────────────────────────────────────
const Spinner = ({ texto = "Carregando..." }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, gap: 16 }}>
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      border: `3px solid ${C.border}`, borderTopColor: C.gold,
      animation: "spin 0.8s linear infinite",
    }} />
    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{texto}</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Mensagem de erro de conexão ──────────────────────────────────────────────
const ErroConexao = ({ onRetry }) => (
  <div style={{ textAlign: "center", padding: "48px 24px" }}>
    <p style={{ fontSize: 48, margin: "0 0 12px" }}>🔌</p>
    <p style={{ color: C.text, fontWeight: 700, fontSize: 16, margin: "0 0 8px" }}>Sem conexão com o servidor</p>
    <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px", lineHeight: 1.5 }}>
      Verifique se a API está rodando em<br />
      <code style={{ color: C.gold, fontSize: 12 }}>{API_URL}</code>
    </p>
    <Btn onClick={onRetry}>Tentar novamente</Btn>
  </div>
);

const GoldDivider = () => (
  <div style={{ height: 1, background: `linear-gradient(to right,transparent,${C.gold}88,transparent)`, margin: "12px 0" }} />
);

const EmptyState = ({ icon, text, sub, action, onAction }) => (
  <div style={{ textAlign: "center", padding: "48px 20px" }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
    <p style={{ color: C.text, fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>{text}</p>
    <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>{sub}</p>
    {action && <Btn onClick={onAction}>{action}</Btn>}
  </div>
);

// ─── Toast de feedback ────────────────────────────────────────────────────────
const Toast = ({ msg, tipo }) => {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
      background: tipo === "erro" ? C.red : C.green,
      color: "#fff", borderRadius: 12, padding: "10px 20px",
      fontSize: 13, fontWeight: 700, zIndex: 200,
      boxShadow: "0 4px 20px #0008",
      animation: "fadeIn .2s ease",
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(-8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {tipo === "erro" ? "❌ " : "✅ "}{msg}
    </div>
  );
};

// ─── Hook de toast ────────────────────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState(null);
  const mostrar = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, mostrar };
};

// ═══════════════════════════════════════════════════════════════════════════════
// TELA: Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function TelaDashboard({ setTab, push }) {
  const api = useApi();
  const [dados, setDados] = useState(null);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true); setErro(false);
    try {
      const [resumo, recentes] = await Promise.all([
        api.get("/ordens/dashboard"),
        api.get("/ordens?limit=4"),
      ]);
      setDados(resumo);
      setOrdens(recentes.slice(0, 4));
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, []);

  if (loading) return <Spinner texto="Carregando painel..." />;
  if (erro) return <ErroConexao onRetry={carregar} />;

  const Stat = ({ icon, label, value, onClick }) => (
    <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 12px", cursor: onClick ? "pointer" : "default", transition: "border-color .15s" }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.borderColor = C.gold + "66"; }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.borderColor = C.border; }}>
      <p style={{ fontSize: 22, margin: "0 0 6px" }}>{icon}</p>
      <p style={{ color: C.gold, fontWeight: 900, fontSize: 22, margin: "0 0 2px", fontFamily: "'Georgia', serif" }}>{value}</p>
      <p style={{ color: C.muted, fontSize: 10, margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</p>
    </div>
  );

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        <KingLogo size={68} />
        <p style={{ color: C.gold, fontWeight: 900, fontSize: 18, margin: "8px 0 2px", letterSpacing: 4, textTransform: "uppercase", fontFamily: "'Georgia', serif" }}>KING MOTORSPORT</p>
        <p style={{ color: C.muted, fontSize: 10, margin: 0, letterSpacing: 3 }}>SERVIÇOS AUTOMOTIVOS</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <Stat icon="👥" label="Clientes" value={dados.totalClientes} onClick={() => setTab("clientes")} />
        <Stat icon="🚗" label="Veículos" value={dados.totalVeiculos} />
        <Stat icon="🔓" label="OS Abertas" value={dados.abertas} onClick={() => setTab("ordens")} />
        <Stat icon="⚙️" label="Em Andamento" value={dados.emAndamento} onClick={() => setTab("ordens")} />
      </div>

      <div style={{ background: "linear-gradient(135deg,#1A1200,#0F0D06)", border: `2px solid ${C.gold}55`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <p style={{ color: C.gold, fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", margin: "0 0 6px" }}>Faturamento Total</p>
        <p style={{ color: C.goldBright, fontSize: 30, fontWeight: 900, margin: "0 0 4px", fontFamily: "'Georgia', serif" }}>{fmt(dados.faturamento)}</p>
        <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{dados.concluidas} ordens concluídas</p>
        <GoldDivider />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>📞 {OFICINA.telefone}</p>
          <p style={{ color: C.gold + "88", fontSize: 11, margin: 0 }}>{OFICINA.instagram}</p>
        </div>
      </div>

      {ordens.length > 0 && <>
        <h3 style={{ color: C.gold, fontSize: 12, fontWeight: 800, margin: "0 0 12px", letterSpacing: 2, textTransform: "uppercase" }}>Ordens Recentes</h3>
        {ordens.map(os => (
          <Card key={os._id} onClick={() => { push({ tipo: "os", id: os._id }); setTab("ordens"); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ color: C.text, fontWeight: 600, fontSize: 13, margin: "0 0 2px" }}>{os.descricao}</p>
                <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>
                  {os.clienteId?.nome} · {os.veiculoId?.placa} · {fmtDate(os.data)}
                </p>
              </div>
              <Badge status={os.status} />
            </div>
          </Card>
        ))}
      </>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELA: Clientes
// ═══════════════════════════════════════════════════════════════════════════════
function TelaClientes({ onVerCliente }) {
  const api = useApi();
  const { toast, mostrar } = useToast();
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", cpf: "", email: "", endereco: "" });

  const carregar = useCallback(async () => {
    setLoading(true); setErro(false);
    try {
      const data = await api.get(`/clientes${busca ? `?busca=${busca}` : ""}`);
      setClientes(data);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    const t = setTimeout(carregar, 300); // debounce na busca
    return () => clearTimeout(t);
  }, [carregar]);

  const salvar = async () => {
    if (!form.nome.trim()) return;
    setSalvando(true);
    try {
      await api.post("/clientes", form);
      mostrar("Cliente cadastrado!");
      setModal(false);
      setForm({ nome: "", telefone: "", cpf: "", email: "", endereco: "" });
      carregar();
    } catch (e) {
      mostrar(e.message, "erro");
    } finally {
      setSalvando(false);
    }
  };

  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <Toast {...(toast || { msg: null })} />
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍  Buscar cliente..."
          style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
        <Btn onClick={() => setModal(true)}>+ Novo</Btn>
      </div>

      {loading ? <Spinner /> : erro ? <ErroConexao onRetry={carregar} /> : clientes.length === 0
        ? <EmptyState icon="👥" text="Nenhum cliente" sub="Cadastre seu primeiro cliente" action="+ Cadastrar" onAction={() => setModal(true)} />
        : clientes.map(c => {
          return (
            <Card key={c._id} onClick={() => onVerCliente(c._id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: C.text, fontWeight: 700, fontSize: 15, margin: "0 0 3px" }}>{c.nome}</p>
                  <p style={{ color: C.muted, fontSize: 13, margin: "0 0 2px" }}>📞 {c.telefone}</p>
                  {c.email && <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>✉ {c.email}</p>}
                </div>
                <span style={{ background: C.goldDim, color: C.gold, border: `1px solid ${C.gold}33`, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>›</span>
              </div>
            </Card>
          );
        })}

      {modal && (
        <Modal title="Novo Cliente" onClose={() => setModal(false)}>
          <Input label="Nome completo" value={form.nome} onChange={f("nome")} required />
          <Input label="Telefone" value={form.telefone} onChange={f("telefone")} placeholder="(11) 99999-9999" />
          <Input label="CPF" value={form.cpf} onChange={f("cpf")} />
          <Input label="E-mail" value={form.email} onChange={f("email")} type="email" />
          <Input label="Endereço" value={form.endereco} onChange={f("endereco")} />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn style={{ flex: 1 }} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELA: Detalhe Cliente
// ═══════════════════════════════════════════════════════════════════════════════
function TelaDetalheCliente({ id, onBack, onVerVeiculo }) {
  const api = useApi();
  const { toast, mostrar } = useToast();
  const [cliente, setCliente] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ marca: "", modelo: "", ano: "", placa: "", cor: "", km: "" });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [c, vs, os] = await Promise.all([
        api.get(`/clientes/${id}`),
        api.get(`/veiculos?clienteId=${id}`),
        api.get(`/ordens?clienteId=${id}`),
      ]);
      setCliente(c); setVeiculos(vs); setOrdens(os);
    } catch (e) {
      mostrar(e.message, "erro");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const salvarVeiculo = async () => {
    if (!form.marca || !form.modelo || !form.placa) return;
    setSalvando(true);
    try {
      await api.post("/veiculos", { ...form, km: Number(form.km) || 0, clienteId: id });
      mostrar("Veículo cadastrado!");
      setModal(false);
      setForm({ marca: "", modelo: "", ano: "", placa: "", cor: "", km: "" });
      carregar();
    } catch (e) {
      mostrar(e.message, "erro");
    } finally {
      setSalvando(false);
    }
  };

  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  if (loading) return <><Btn variant="ghost" onClick={onBack} style={{ marginBottom: 16, padding: "6px 0", color: C.gold }}>← Voltar</Btn><Spinner /></>;

  return (
    <div>
      <Toast {...(toast || { msg: null })} />
      <Btn variant="ghost" onClick={onBack} style={{ marginBottom: 16, padding: "6px 0", color: C.gold }}>← Voltar</Btn>

      <Card style={{ marginBottom: 20, borderColor: C.gold + "44", background: "#141008" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👤</div>
          <div>
            <p style={{ color: C.text, fontWeight: 800, fontSize: 17, margin: 0 }}>{cliente.nome}</p>
            <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{cliente.cpf || "CPF não informado"}</p>
          </div>
        </div>
        <GoldDivider />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[["📞", cliente.telefone], ["✉", cliente.email], ["📍", cliente.endereco]].filter(([, v]) => v).map(([ico, val]) => (
            <p key={val} style={{ color: C.muted, fontSize: 12, margin: 0, gridColumn: ico === "📍" ? "1/-1" : undefined }}>{ico} {val}</p>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ color: C.gold, fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: 1.5, textTransform: "uppercase" }}>🚗 Veículos</h3>
        <Btn small onClick={() => setModal(true)}>+ Veículo</Btn>
      </div>

      {veiculos.length === 0
        ? <Card style={{ textAlign: "center", padding: 20 }}><p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Nenhum veículo cadastrado</p></Card>
        : veiculos.map(v => (
          <Card key={v._id} onClick={() => onVerVeiculo(v._id)}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: C.text, fontWeight: 700, fontSize: 15, margin: "0 0 3px" }}>{v.marca} {v.modelo} {v.ano}</p>
                <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{v.placa}</p>
                <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{v.cor} · {Number(v.km).toLocaleString("pt-BR")} km</p>
              </div>
              <span style={{ color: C.gold }}>›</span>
            </div>
          </Card>
        ))}

      {ordens.length > 0 && <>
        <h3 style={{ color: C.gold, fontSize: 13, fontWeight: 800, margin: "20px 0 12px", letterSpacing: 1.5, textTransform: "uppercase" }}>🔧 Últimas Ordens</h3>
        {ordens.slice(0, 3).map(os => (
          <Card key={os._id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: "0 0 3px" }}>{os.descricao}</p>
                <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{os.veiculoId?.placa} · {fmtDate(os.data)}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <Badge status={os.status} />
                <p style={{ color: C.gold, fontWeight: 700, fontSize: 13, margin: "6px 0 0" }}>{fmt(totalOS(os))}</p>
              </div>
            </div>
          </Card>
        ))}
      </>}

      {modal && (
        <Modal title="Novo Veículo" onClose={() => setModal(false)}>
          <Input label="Marca" value={form.marca} onChange={f("marca")} required />
          <Input label="Modelo" value={form.modelo} onChange={f("modelo")} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Ano" value={form.ano} onChange={f("ano")} />
            <Input label="Placa" value={form.placa} onChange={f("placa")} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Cor" value={form.cor} onChange={f("cor")} />
            <Input label="KM atual" value={form.km} onChange={f("km")} type="number" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn style={{ flex: 1 }} onClick={salvarVeiculo} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELA: Detalhe Veículo
// ═══════════════════════════════════════════════════════════════════════════════
function TelaDetalheVeiculo({ id, onBack, onNovaOS, onVerOS }) {
  const api = useApi();
  const [veiculo, setVeiculo] = useState(null);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [v, os] = await Promise.all([
        api.get(`/veiculos/${id}`),
        api.get(`/ordens?veiculoId=${id}`),
      ]);
      setVeiculo(v); setOrdens(os);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  if (loading) return <><Btn variant="ghost" onClick={onBack} style={{ marginBottom: 16, padding: "6px 0", color: C.gold }}>← Voltar</Btn><Spinner /></>;

  const gastoTotal = ordens.reduce((s, o) => s + totalOS(o), 0);
  const cliente = veiculo?.clienteId;

  return (
    <div>
      <Btn variant="ghost" onClick={onBack} style={{ marginBottom: 16, padding: "6px 0", color: C.gold }}>← Voltar</Btn>

      <Card style={{ marginBottom: 20, borderColor: C.gold + "44", background: "#141008" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🚗</div>
          <div>
            <p style={{ color: C.text, fontWeight: 800, fontSize: 18, margin: 0 }}>{veiculo.marca} {veiculo.modelo}</p>
            <p style={{ color: C.gold, fontWeight: 800, fontSize: 16, margin: "2px 0" }}>{veiculo.placa}</p>
            <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{veiculo.ano} · {veiculo.cor}</p>
          </div>
        </div>
        <GoldDivider />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[[Number(veiculo.km).toLocaleString("pt-BR"), "KM ATUAL"], [ordens.length, "ORDENS"], [fmt(gastoTotal), "INVESTIDO"]].map(([val, lab]) => (
            <div key={lab} style={{ textAlign: "center" }}>
              <p style={{ color: C.gold, fontWeight: 800, fontSize: lab === "INVESTIDO" ? 11 : 16, margin: 0 }}>{val}</p>
              <p style={{ color: C.muted, fontSize: 9, margin: 0, letterSpacing: 0.8 }}>{lab}</p>
            </div>
          ))}
        </div>
        {cliente && <p style={{ color: C.muted, fontSize: 12, marginTop: 10, marginBottom: 0, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>👤 {cliente.nome} · {cliente.telefone}</p>}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ color: C.gold, fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: 1.5, textTransform: "uppercase" }}>🔧 Histórico</h3>
        <Btn small onClick={() => onNovaOS(veiculo)}>+ OS</Btn>
      </div>

      {ordens.length === 0
        ? <EmptyState icon="🔧" text="Sem ordens de serviço" sub="Crie a primeira OS" action="+ Nova OS" onAction={() => onNovaOS(veiculo)} />
        : ordens.sort((a, b) => new Date(b.data) - new Date(a.data)).map(os => (
          <Card key={os._id} onClick={() => onVerOS(os._id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.text, fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>{os.descricao}</p>
                <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>📅 {fmtDate(os.data)} · {os.km ? `${Number(os.km).toLocaleString("pt-BR")} km` : ""}</p>
              </div>
              <div style={{ textAlign: "right", marginLeft: 12 }}>
                <Badge status={os.status} />
                <p style={{ color: C.gold, fontWeight: 800, fontSize: 14, margin: "8px 0 0" }}>{fmt(totalOS(os))}</p>
              </div>
            </div>
          </Card>
        ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELA: Ordens
// ═══════════════════════════════════════════════════════════════════════════════
function TelaOrdens({ onVerOS }) {
  const api = useApi();
  const [ordens, setOrdens] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true); setErro(false);
    try {
      const path = filtro === "todas" ? "/ordens" : `/ordens?status=${filtro}`;
      const data = await api.get(path);
      setOrdens(data);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => { carregar(); }, [carregar]);

  const lista = ordens.filter(o => {
    const txt = busca.toLowerCase();
    return o.descricao?.toLowerCase().includes(txt)
      || o.veiculoId?.placa?.toLowerCase().includes(txt)
      || o.clienteId?.nome?.toLowerCase().includes(txt);
  });

  const counts = { todas: ordens.length };
  ordens.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });

  return (
    <div>
      <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍  OS, placa, cliente..."
        style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12 }} />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[["todas", "Todas"], ["aberta", "Abertas"], ["em-andamento", "Em Andamento"], ["concluida", "Concluídas"]].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)} style={{
            background: filtro === k ? `linear-gradient(135deg,${C.gold},${C.goldLight})` : C.card,
            color: filtro === k ? "#000" : C.muted, border: `1px solid ${filtro === k ? C.gold : C.border}`,
            borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
          }}>{l} {counts[k] ? `(${counts[k]})` : ""}</button>
        ))}
      </div>

      {loading ? <Spinner /> : erro ? <ErroConexao onRetry={carregar} /> : lista.length === 0
        ? <EmptyState icon="📋" text="Nenhuma ordem" sub="Crie uma OS a partir de um veículo" />
        : lista.map(os => (
          <Card key={os._id} onClick={() => onVerOS(os._id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: C.gold, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>OS #{String(os.numero).padStart(4, "0")}</span>
                  <Badge status={os.status} />
                </div>
                <p style={{ color: C.text, fontWeight: 600, fontSize: 14, margin: "0 0 3px" }}>{os.descricao}</p>
                <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{os.clienteId?.nome} · {os.veiculoId?.placa} · {fmtDate(os.data)}</p>
              </div>
              <p style={{ color: C.gold, fontWeight: 800, fontSize: 15, margin: 0, marginLeft: 12 }}>{fmt(totalOS(os))}</p>
            </div>
          </Card>
        ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELA: Detalhe OS
// ═══════════════════════════════════════════════════════════════════════════════
function TelaDetalheOS({ id, onBack }) {
  const api = useApi();
  const { toast, mostrar } = useToast();
  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/ordens/${id}`);
      setOs(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const mudarStatus = async (status) => {
    try {
      const atualizada = await api.patch(`/ordens/${id}/status`, { status });
      setOs(prev => ({ ...prev, status: atualizada.status }));
      mostrar("Status atualizado!");
      setEditStatus(false);
    } catch (e) {
      mostrar(e.message, "erro");
    }
  };

  if (loading) return <><Btn variant="ghost" onClick={onBack} style={{ marginBottom: 16, padding: "6px 0", color: C.gold }}>← Voltar</Btn><Spinner /></>;
  if (!os) return null;

  const total = totalOS(os);
  const cliente = os.clienteId;
  const veiculo = os.veiculoId;

  const LinhaNota = ({ label, value, gold }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}>
      <span style={{ color: C.muted, fontSize: 12 }}>{label}</span>
      <span style={{ color: gold ? C.gold : C.text, fontWeight: gold ? 800 : 400, fontSize: 12 }}>{value}</span>
    </div>
  );

  return (
    <div>
      <Toast {...(toast || { msg: null })} />
      <Btn variant="ghost" onClick={onBack} style={{ marginBottom: 16, padding: "6px 0", color: C.gold }}>← Voltar</Btn>

      <Card style={{ borderColor: C.gold + "55", background: "#0F0D06", marginBottom: 12 }}>
        <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: `1px solid ${C.gold}33` }}>
          <LogoNota />
        </div>
        <div style={{ fontSize: 11, color: C.muted, textAlign: "center", lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}>{OFICINA.endereco}</p>
          <p style={{ margin: 0 }}>📞 {OFICINA.telefone} · ✉ {OFICINA.email}</p>
          <p style={{ margin: 0 }}>CNPJ: {OFICINA.cnpj}</p>
          <p style={{ margin: "4px 0 0", color: C.gold + "88" }}>{OFICINA.instagram}</p>
        </div>
        <GoldDivider />
        <div style={{ textAlign: "center" }}>
          <p style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 6px" }}>Ordem de Serviço</p>
          <p style={{ color: C.goldBright, fontSize: 28, fontWeight: 900, margin: "0 0 8px", fontFamily: "'Georgia', serif", letterSpacing: 4 }}>
            #{String(os.numero).padStart(4, "0")}
          </p>
          <Badge status={os.status} />
        </div>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <p style={{ color: C.gold, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>Cliente & Veículo</p>
        <LinhaNota label="Cliente" value={cliente?.nome} />
        <LinhaNota label="Telefone" value={cliente?.telefone} />
        <LinhaNota label="Veículo" value={`${veiculo?.marca} ${veiculo?.modelo} ${veiculo?.ano}`} />
        <LinhaNota label="Placa" value={veiculo?.placa} gold />
        <LinhaNota label="KM" value={os.km ? Number(os.km).toLocaleString("pt-BR") + " km" : "-"} />
        <LinhaNota label="Data" value={fmtDate(os.data)} />
      </Card>

      {(os.servicos || []).length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <p style={{ color: C.gold, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>Serviços Realizados</p>
          {os.servicos.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.text, fontSize: 13 }}>{s.desc}</span>
              <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{fmt(s.valor)}</span>
            </div>
          ))}
        </Card>
      )}

      {(os.pecas || []).length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <p style={{ color: C.gold, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>Peças Utilizadas</p>
          {os.pecas.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.text, fontSize: 13 }}>{p.desc}</span>
              <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{fmt(p.valor)}</span>
            </div>
          ))}
        </Card>
      )}

      <div style={{ background: "linear-gradient(135deg,#1A1200,#2A1E00)", border: `2px solid ${C.gold}88`, borderRadius: 14, padding: "16px 20px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: C.gold, fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 2px" }}>TOTAL A PAGAR</p>
          <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>Serviços + Peças</p>
        </div>
        <p style={{ color: C.goldBright, fontWeight: 900, fontSize: 26, margin: 0, fontFamily: "'Georgia', serif" }}>{fmt(total)}</p>
      </div>

      {os.observacoes && (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ color: C.gold, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 8px" }}>Observações</p>
          <p style={{ color: C.text, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{os.observacoes}</p>
        </Card>
      )}

      <div style={{ textAlign: "center", padding: "10px 0 14px" }}>
        <GoldDivider />
        <p style={{ color: C.muted, fontSize: 11, margin: "8px 0 0" }}>Obrigado pela confiança! · King Motorsport</p>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setEditStatus(true)}>🔄 Status</Btn>
        <Btn style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Imprimir</Btn>
      </div>

      {editStatus && (
        <Modal title="Alterar Status" onClose={() => setEditStatus(false)}>
          {["aberta", "em-andamento", "concluida", "cancelada"].map(s => (
            <button key={s} onClick={() => mudarStatus(s)} style={{
              width: "100%", background: os.status === s ? statusColor(s) + "22" : C.bg,
              border: `1px solid ${os.status === s ? statusColor(s) : C.border}`,
              borderRadius: 10, padding: "12px 16px", color: os.status === s ? statusColor(s) : C.text,
              fontSize: 14, fontWeight: 700, cursor: "pointer", textAlign: "left", marginBottom: 8,
            }}>{statusLabel(s)}</button>
          ))}
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELA: Nova OS
// ═══════════════════════════════════════════════════════════════════════════════
function TelaNOvaOS({ veiculoInicial, clienteInicial, onBack, onSalvo }) {
  const api = useApi();
  const { toast, mostrar } = useToast();
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    descricao: "", data: new Date().toISOString().split("T")[0],
    status: "aberta", km: veiculoInicial?.km || "", observacoes: "",
    clienteId: clienteInicial?._id || veiculoInicial?.clienteId?._id || veiculoInicial?.clienteId || "",
    veiculoId: veiculoInicial?._id || "",
  });
  const [servicos, setServicos] = useState([{ desc: "", valor: "" }]);
  const [pecas, setPecas] = useState([{ desc: "", valor: "" }]);

  useEffect(() => {
    if (!veiculoInicial) {
      api.get("/clientes").then(setClientes).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!veiculoInicial && form.clienteId) {
      api.get(`/veiculos?clienteId=${form.clienteId}`).then(setVeiculos).catch(() => {});
    }
  }, [form.clienteId]);

  const f = k => v => setForm(p => ({ ...p, [k]: v }));
  const total = [...servicos, ...pecas].reduce((s, i) => s + Number(i.valor || 0), 0);

  const salvar = async () => {
    if (!form.descricao || !form.veiculoId) {
      mostrar("Preencha os campos obrigatórios", "erro"); return;
    }
    setSalvando(true);
    try {
      const payload = {
        ...form,
        km: Number(form.km) || undefined,
        servicos: servicos.filter(s => s.desc).map(s => ({ ...s, valor: Number(s.valor) })),
        pecas: pecas.filter(p => p.desc).map(p => ({ ...p, valor: Number(p.valor) })),
      };
      const nova = await api.post("/ordens", payload);
      mostrar("OS criada com sucesso!");
      setTimeout(() => onSalvo(nova._id), 800);
    } catch (e) {
      mostrar(e.message, "erro");
    } finally {
      setSalvando(false);
    }
  };

  const ItemRow = ({ item, i, onUpd, onRem }) => (
    <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
      <input value={item.desc} onChange={e => onUpd(i, "desc", e.target.value)} placeholder="Descrição"
        style={{ flex: 2, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 11px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
      <input value={item.valor} onChange={e => onUpd(i, "valor", e.target.value)} placeholder="R$" type="number"
        style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 11px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
      <button onClick={() => onRem(i)} style={{ background: "none", border: "none", color: C.red, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>×</button>
    </div>
  );

  return (
    <div>
      <Toast {...(toast || { msg: null })} />
      <Btn variant="ghost" onClick={onBack} style={{ marginBottom: 16, padding: "6px 0", color: C.gold }}>← Voltar</Btn>
      <h2 style={{ color: C.text, fontSize: 18, fontWeight: 800, margin: "0 0 20px" }}>Nova Ordem de Serviço</h2>

      {veiculoInicial ? (
        <div style={{ background: "#141008", border: `1px solid ${C.gold}44`, borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
          <p style={{ color: C.gold, fontWeight: 800, fontSize: 14, margin: "0 0 2px" }}>{veiculoInicial.marca} {veiculoInicial.modelo} · {veiculoInicial.placa}</p>
          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{clienteInicial?.nome || veiculoInicial.clienteId?.nome}</p>
        </div>
      ) : (
        <>
          <Select label="Cliente" value={form.clienteId} onChange={f("clienteId")} required>
            <option value="">Selecione o cliente</option>
            {clientes.map(c => <option key={c._id} value={c._id}>{c.nome}</option>)}
          </Select>
          <Select label="Veículo" value={form.veiculoId} onChange={f("veiculoId")} required>
            <option value="">Selecione o veículo</option>
            {veiculos.map(v => <option key={v._id} value={v._id}>{v.marca} {v.modelo} — {v.placa}</option>)}
          </Select>
        </>
      )}

      <Input label="Descrição da OS" value={form.descricao} onChange={f("descricao")} placeholder="Ex: Revisão completa + troca de óleo" required />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="Data" value={form.data} onChange={f("data")} type="date" />
        <Input label="KM entrada" value={form.km} onChange={f("km")} type="number" />
      </div>
      <Select label="Status" value={form.status} onChange={f("status")}>
        <option value="aberta">Aberta</option>
        <option value="em-andamento">Em Andamento</option>
        <option value="concluida">Concluída</option>
      </Select>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <label style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>Serviços</label>
          <Btn small variant="secondary" onClick={() => setServicos(p => [...p, { desc: "", valor: "" }])}>+ Adicionar</Btn>
        </div>
        {servicos.map((s, i) => (
          <ItemRow key={i} item={s} i={i}
            onUpd={(i, k, v) => setServicos(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x))}
            onRem={i => setServicos(p => p.filter((_, idx) => idx !== i))} />
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <label style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>Peças</label>
          <Btn small variant="secondary" onClick={() => setPecas(p => [...p, { desc: "", valor: "" }])}>+ Adicionar</Btn>
        </div>
        {pecas.map((p, i) => (
          <ItemRow key={i} item={p} i={i}
            onUpd={(i, k, v) => setPecas(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x))}
            onRem={i => setPecas(p => p.filter((_, idx) => idx !== i))} />
        ))}
      </div>

      <Textarea label="Observações" value={form.observacoes} onChange={f("observacoes")} placeholder="Recomendações, próxima revisão..." />

      <div style={{ background: "#1A1200", border: `1px solid ${C.gold}55`, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ color: C.gold, fontWeight: 800 }}>Total Estimado</span>
        <span style={{ color: C.goldBright, fontWeight: 900, fontSize: 20 }}>{fmt(total)}</span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="secondary" style={{ flex: 1 }} onClick={onBack}>Cancelar</Btn>
        <Btn style={{ flex: 1 }} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar OS"}</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [pilha, setPilha] = useState([]);
  const push = item => setPilha(p => [...p, item]);
  const pop  = ()   => setPilha(p => p.slice(0, -1));
  const atual = pilha[pilha.length - 1];
  const changeTab = t => { setTab(t); setPilha([]); };

  // Resolve qual tela renderizar com base na pilha de navegação
  const renderConteudo = () => {
    if (!atual) return null;

    switch (atual.tipo) {
      case "cliente":
        return <TelaDetalheCliente id={atual.id} onBack={pop} onVerVeiculo={id => push({ tipo: "veiculo", id })} />;

      case "veiculo":
        return <TelaDetalheVeiculo id={atual.id} onBack={pop}
          onNovaOS={v => push({ tipo: "nova-os", veiculo: v })}
          onVerOS={id => push({ tipo: "os", id })} />;

      case "os":
        return <TelaDetalheOS id={atual.id} onBack={pop} />;

      case "nova-os":
        return <TelaNOvaOS
          veiculoInicial={atual.veiculo}
          clienteInicial={atual.cliente}
          onBack={pop}
          onSalvo={id => {
            // Após salvar, vai direto para a OS criada
            setPilha(p => [...p.filter(x => x.tipo !== "nova-os"), { tipo: "os", id }]);
          }} />;

      default: return null;
    }
  };

  const conteudo = renderConteudo();

  const tabs = [
    { id: "dashboard", icon: "👑", label: "Painel" },
    { id: "clientes",  icon: "👥", label: "Clientes" },
    { id: "ordens",    icon: "📋", label: "Ordens" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 20px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <LogoHeader />
          {atual && (
            <span style={{ color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: C.goldDim, border: `1px solid ${C.gold}33`, borderRadius: 8, padding: "3px 10px" }}>
              {atual.tipo === "cliente" && "Cliente"}
              {atual.tipo === "veiculo" && "Veículo"}
              {atual.tipo === "os" && "OS"}
              {atual.tipo === "nova-os" && "Nova OS"}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "20px 20px 100px", maxWidth: 480, margin: "0 auto" }}>
        {conteudo || (
          <>
            {tab === "dashboard" && <TelaDashboard setTab={changeTab} push={push} />}
            {tab === "clientes"  && <TelaClientes onVerCliente={id => push({ tipo: "cliente", id })} />}
            {tab === "ordens"    && <TelaOrdens onVerOS={id => push({ tipo: "os", id })} />}
          </>
        )}
      </div>

      {/* Bottom nav */}
      {!atual && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.gold}33`, display: "flex", justifyContent: "space-around", padding: "10px 0 20px", zIndex: 50 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => changeTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 24px" }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ color: tab === t.id ? C.gold : C.muted, fontSize: 11, fontWeight: tab === t.id ? 800 : 400, letterSpacing: 0.5 }}>{t.label}</span>
              {tab === t.id && <div style={{ width: 20, height: 2, background: `linear-gradient(to right,${C.gold},${C.goldLight})`, borderRadius: 1 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
