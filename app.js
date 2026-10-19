(() => {
  const $ = id => document.getElementById(id);
  let supabase = null, mode = "login", currentUser = null;
  const configured = window.ISLA_SUPABASE_URL && window.ISLA_SUPABASE_KEY &&
    !window.ISLA_SUPABASE_URL.includes("PEGA_AQUI") && !window.ISLA_SUPABASE_KEY.includes("PEGA_AQUI");
  $("setupWarning").classList.toggle("hidden", configured);
  if (!configured || !window.supabase) {
    $("authMessage").textContent = "Primero hay que conectar el proyecto de Supabase en config.js.";
    $("authSubmit").disabled = true;
    return;
  }
  supabase = window.supabase.createClient(window.ISLA_SUPABASE_URL, window.ISLA_SUPABASE_KEY);
  const say = (id, message) => $(id).textContent = message || "";
  function setMode(next) {
    mode = next;
    $("loginTab").classList.toggle("active", mode === "login");
    $("signupTab").classList.toggle("active", mode === "signup");
    $("usernameWrap").classList.toggle("hidden", mode !== "signup");
    $("authSubmit").textContent = mode === "login" ? "Entrar" : "Crear cuenta";
    $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
    say("authMessage", "");
  }
  $("loginTab").addEventListener("click", () => setMode("login"));
  $("signupTab").addEventListener("click", () => setMode("signup"));
  $("authForm").addEventListener("submit", async e => {
    e.preventDefault();
    $("authSubmit").disabled = true;
    say("authMessage", "Procesando...");
    const email = $("email").value.trim();
    const password = $("password").value;
    try {
      if (mode === "signup") {
        const username = $("username").value.trim();
        if (!username) throw new Error("Escribe un nombre de usuario.");
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
        if (error) throw error;
        if (data.session) {
          say("authMessage", "Cuenta creada. Cargando...");
          await loadApp(data.user);
        } else {
          say("authMessage", "Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.");
          setMode("login");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await loadApp(data.user);
      }
    } catch (err) { say("authMessage", err.message || "No se pudo completar el acceso."); }
    finally { $("authSubmit").disabled = false; }
  });
  $("logoutBtn").addEventListener("click", async () => { await supabase.auth.signOut(); currentUser = null; $("appPanel").classList.add("hidden"); $("authPanel").classList.remove("hidden"); $("logoutBtn").classList.add("hidden"); });
  $("refreshBtn").addEventListener("click", () => loadMatches());
  async function loadApp(user) {
    currentUser = user;
    $("authPanel").classList.add("hidden"); $("appPanel").classList.remove("hidden"); $("logoutBtn").classList.remove("hidden");
    await loadProfile();
    await loadMatches();
  }
  async function loadProfile() {
    const { data, error } = await supabase.from("profiles").select("id, username, points, role").eq("id", currentUser.id).maybeSingle();
    if (error) { $("welcomeName").textContent = currentUser.user_metadata?.username || "Jugador"; $("pointsValue").textContent = "—"; say("matchesMessage", "No se pudo leer el perfil. Revisa las políticas RLS de la tabla profiles."); return; }
    if (!data) {
      $("welcomeName").textContent = currentUser.user_metadata?.username || "Jugador";
      $("pointsValue").textContent = "—";
      say("matchesMessage", "Tu cuenta no tiene un perfil todavía. El administrador debe crear tu fila en profiles con el mismo ID de Auth.");
      return;
    }
    $("welcomeName").textContent = data.username || "Jugador";
    $("pointsValue").textContent = Number(data.points || 0).toLocaleString("es-US");
    $("adminPanel").classList.toggle("hidden", data.role !== "admin");
  }
  async function loadMatches() {
    $("matches").innerHTML = "";
    say("matchesMessage", "Cargando partidos...");
    const { data, error } = await supabase.from("matches")
      .select("id, sport, home_team, away_team, starts_at, odds_home, odds_away, odds_draw, status, result")
      .order("starts_at", { ascending: true }).limit(100);
    if (error) { say("matchesMessage", "No se pudieron cargar los partidos. Revisa que matches permita SELECT para usuarios autenticados. Detalle: " + error.message); return; }
    if (!data?.length) { say("matchesMessage", "Todavía no hay partidos. El administrador puede agregar uno desde Administración."); return; }
    say("matchesMessage", "");
    for (const m of data) {
      const card = document.createElement("article"); card.className = "match";
      const date = m.starts_at ? new Date(m.starts_at).toLocaleString("es-US", { dateStyle:"medium", timeStyle:"short" }) : "Fecha por confirmar";
      const top = document.createElement("div"); top.className = "matchTop";
      const sport = document.createElement("span"); sport.textContent = m.sport || "Deporte";
      const status = document.createElement("span"); status.className = "status"; status.textContent = m.status || "programado";
      top.append(sport, status);
      const dateEl = document.createElement("p"); dateEl.className = "message"; dateEl.textContent = date;
      const teams = document.createElement("div"); teams.className = "teams";
      const home = document.createElement("div"); home.textContent = m.home_team || "Local";
      const vs = document.createElement("div"); vs.className = "vs"; vs.textContent = "VS";
      const away = document.createElement("div"); away.textContent = m.away_team || "Visitante";
      teams.append(home, vs, away);
      const odds = document.createElement("div"); odds.className = "odds";
      const addOdd = (label, value) => { if (value !== null && value !== undefined && value !== "") { const el = document.createElement("div"); el.className = "odd"; const s = document.createElement("span"); s.textContent = label; const strong = document.createElement("strong"); strong.textContent = Number(value).toFixed(2); el.append(s,strong); odds.append(el); } };
      addOdd("LOCAL", m.odds_home); addOdd("EMPATE", m.odds_draw); addOdd("VISITANTE", m.odds_away);
      card.append(top, dateEl, teams, odds);
      if (m.result) { const result = document.createElement("p"); result.className = "message"; result.textContent = "Resultado: " + m.result; card.append(result); }
      $("matches").append(card);
    }
  }
  $("matchForm").addEventListener("submit", async e => {
    e.preventDefault();
    $("adminMessage").textContent = "Guardando...";
    const record = {
      sport: $("sport").value.trim(), home_team: $("home").value.trim(), away_team: $("away").value.trim(),
      starts_at: new Date($("startsAt").value).toISOString(), odds_home: Number($("oddsHome").value),
      odds_away: Number($("oddsAway").value), status: "scheduled"
    };
    if ($("oddsDraw").value.trim()) record.odds_draw = Number($("oddsDraw").value);
    const { error } = await supabase.from("matches").insert(record);
    if (error) { $("adminMessage").textContent = "No se pudo guardar. Revisa la política RLS de INSERT para administradores. Detalle: " + error.message; return; }
    $("matchForm").reset(); $("oddsHome").value = "1.90"; $("oddsAway").value = "1.90";
    $("adminMessage").textContent = "Partido guardado.";
    await loadMatches();
  });
  supabase.auth.getSession().then(({ data }) => { if (data.session?.user) loadApp(data.session.user); });
  supabase.auth.onAuthStateChange((_event, session) => { if (session?.user && !currentUser) loadApp(session.user); });
})();
