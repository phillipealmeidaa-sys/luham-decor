/* site.js: rastreio (Pixel, GA4, Google Ads), aviso de cookies (LGPD), WhatsApp e formulário de lead.
   A configuração fica em window.SITE, no topo do index.html. Este arquivo é igual em todos os sites.
   IDs de Pixel, GA4 e Google Ads são públicos por natureza. Nunca coloque token, senha ou chave secreta aqui.
   Modo de conferência: abra a página com ?teste=1 para ver cada evento na tela e em window.__eventos. */
(function () {
  "use strict";
  var C = Object.assign({
    META_PIXEL_ID: "", GA4_ID: "", GOOGLE_ADS_ID: "", ADS_LEAD_LABEL: "", ADS_WHATSAPP_LABEL: "",
    WHATSAPP: "", WHATSAPP_MSG: "Olá! Vim pelo site.",
    FORM_ENDPOINT: "", FORM_DESTINO: "planilha", // "planilha", "whatsapp" ou "planilha+whatsapp"
    PRIVACIDADE_URL: "privacidade.html"
  }, window.SITE || {});
  var TESTE = /[?&]teste=1\b/.test(location.search);
  var eventos = (window.__eventos = []);
  var RASTREIO = !!(C.META_PIXEL_ID || C.GA4_ID || C.GOOGLE_ADS_ID);

  function guarda(tipo) {
    return {
      get: function (k) { try { return window[tipo].getItem(k); } catch (_) { return null; } },
      set: function (k, v) { try { window[tipo].setItem(k, v); } catch (_) {} }
    };
  }
  var local = guarda("localStorage"), sessao = guarda("sessionStorage");

  /* ---------- origem da visita (UTM, gclid, fbclid): a primeira da sessão vale ---------- */
  var CHAVES = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  var q = new URLSearchParams(location.search);
  CHAVES.forEach(function (k) { if (q.get(k) && !sessao.get(k)) sessao.set(k, q.get(k)); });
  function origem() { var o = {}; CHAVES.forEach(function (k) { o[k] = sessao.get(k) || ""; }); return o; }

  /* ---------- registro dos eventos (e painel no modo teste) ---------- */
  var painel;
  function log(nome, dados) {
    eventos.push({ evento: nome, dados: dados || {}, hora: new Date().toISOString() });
    if (!TESTE) return;
    console.log("[site] evento:", nome, dados || "");
    if (!painel) {
      painel = document.createElement("div"); painel.id = "painel-teste";
      painel.setAttribute("aria-live", "polite");
      painel.style.cssText = "position:fixed;left:8px;top:8px;z-index:99999;max-width:260px;font:12px/1.4 system-ui,sans-serif;background:#111;color:#7CFC9A;padding:8px 10px;border-radius:6px;opacity:.92;pointer-events:none";
      painel.textContent = "MODO TESTE";
      document.body.appendChild(painel);
    }
    painel.textContent = "MODO TESTE · último evento: " + nome;
  }

  /* ---------- Google tag com Consent Mode v2 (começa negado) ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  var NEGADO = { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
  var PERMITIDO = { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" };
  gtag("consent", "default", Object.assign({ wait_for_update: 500 }, NEGADO));
  var G_ID = C.GA4_ID || C.GOOGLE_ADS_ID;
  function carrega(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }
  if (G_ID) {
    carrega("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(G_ID));
    gtag("js", new Date());
    if (C.GA4_ID) gtag("config", C.GA4_ID);
    if (C.GOOGLE_ADS_ID) gtag("config", C.GOOGLE_ADS_ID);
  }

  /* ---------- Pixel da Meta: só liga depois do "Aceitar" ---------- */
  var pixelLigado = false;
  function ligaPixel() {
    if (pixelLigado || !C.META_PIXEL_ID) return;
    pixelLigado = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq("init", C.META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  /* ---------- eventos de conversão ---------- */
  var MAPA = {
    lead: { ga: "generate_lead", fb: "Lead", ads: C.ADS_LEAD_LABEL },
    whatsapp: { ga: "clique_whatsapp", fb: "Contact", ads: C.ADS_WHATSAPP_LABEL }
  };
  function rastrear(tipo, dados) {
    var m = MAPA[tipo] || { ga: tipo };
    dados = dados || {};
    if (G_ID) {
      gtag("event", m.ga, dados);
      if (m.ads && C.GOOGLE_ADS_ID) gtag("event", "conversion", { send_to: C.GOOGLE_ADS_ID + "/" + m.ads });
    } else {
      window.dataLayer.push(Object.assign({ event: m.ga }, dados));
    }
    if (window.fbq && m.fb) window.fbq("track", m.fb, dados);
    log(m.ga, dados);
  }
  window.rastrear = rastrear;

  /* ---------- aviso de cookies (LGPD) ---------- */
  var ESTILO = "\
.ck{position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:560px;margin:0 auto;background:#fff;color:#222;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.25);padding:16px;font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}\
.ck p{margin:0 0 12px}.ck a{color:inherit}\
.ck div{display:flex;gap:8px;flex-wrap:wrap}\
.ck button{flex:1 1 140px;min-height:44px;border-radius:8px;font:600 15px system-ui,sans-serif;cursor:pointer;border:1px solid #222;background:#fff;color:#222}\
.ck button.sim{background:#222;color:#fff}\
.ck button:focus-visible,.zap-flutuante:focus-visible{outline:3px solid #2563eb;outline-offset:2px}";
  function avisoCookies() {
    if (document.getElementById("ck")) return;
    var st = document.createElement("style"); st.textContent = ESTILO; document.head.appendChild(st);
    var d = document.createElement("div");
    d.className = "ck"; d.id = "ck"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Aviso de cookies");
    d.innerHTML = '<p>Usamos cookies para medir as visitas e melhorar nossos anúncios. Você escolhe. Saiba mais na <a href="' + C.PRIVACIDADE_URL + '">Política de privacidade</a>.</p>' +
      '<div><button type="button" class="nao">Só os necessários</button><button type="button" class="sim">Aceitar</button></div>';
    d.querySelector(".sim").onclick = function () { consentir(true); };
    d.querySelector(".nao").onclick = function () { consentir(false); };
    document.body.appendChild(d);
  }
  function consentir(sim) {
    local.set("cookies", sim ? "sim" : "nao");
    gtag("consent", "update", sim ? PERMITIDO : NEGADO);
    if (sim) ligaPixel();
    var d = document.getElementById("ck"); if (d) d.remove();
    log("consentimento", { aceitou: sim });
  }

  /* ---------- WhatsApp ---------- */
  function linkZap(msg) { return "https://wa.me/" + String(C.WHATSAPP).replace(/\D/g, "") + "?text=" + encodeURIComponent(msg || C.WHATSAPP_MSG); }
  function prepararZap() {
    document.querySelectorAll("[data-whatsapp]").forEach(function (a) {
      if (!C.WHATSAPP) return;
      a.href = linkZap(a.getAttribute("data-whatsapp") || C.WHATSAPP_MSG);
      a.target = "_blank"; a.rel = "noopener";
      a.addEventListener("click", function (e) {
        rastrear("whatsapp", { local: a.getAttribute("data-local") || "" });
        if (TESTE) { e.preventDefault(); log("abriria_whatsapp", { url: a.href }); }
      });
    });
  }

  /* ---------- formulário de lead ---------- */
  function mascaraTel(i) {
    i.addEventListener("input", function () {
      var d = i.value.replace(/\D/g, "").slice(0, 11);
      i.value = d.length > 6 ? "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4)
              : d.length > 2 ? "(" + d.slice(0, 2) + ") " + d.slice(2) : d;
    });
  }
  function erroCampo(form, campo, msg) {
    var e = form.querySelector("[data-erro]");
    if (e) e.textContent = msg;
    if (campo) { campo.setAttribute("aria-invalid", "true"); campo.focus(); }
    log("erro_formulario", { campo: campo ? campo.name : "", msg: msg });
    return false;
  }
  function validar(form) {
    form.querySelectorAll("[aria-invalid]").forEach(function (c) { c.removeAttribute("aria-invalid"); });
    var campos = form.querySelectorAll("input,select,textarea");
    for (var i = 0; i < campos.length; i++) {
      var c = campos[i];
      if (c.name === "website") continue;
      var v = (c.type === "checkbox") ? c.checked : c.value.trim();
      if (c.required && !v) return erroCampo(form, c, c.getAttribute("data-msg") || "Preencha: " + (c.labels && c.labels[0] ? c.labels[0].textContent.replace(/\s+/g, " ").trim() : c.name) + ".");
      if (c.type === "tel" && v && c.value.replace(/\D/g, "").length < 10) return erroCampo(form, c, "Confira o WhatsApp com DDD.");
      if (c.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return erroCampo(form, c, "Confira o e-mail.");
    }
    var e = form.querySelector("[data-erro]"); if (e) e.textContent = "";
    return true;
  }
  function prepararForms() {
    document.querySelectorAll("form[data-lead]").forEach(function (form) {
      form.setAttribute("novalidate", "");
      form.querySelectorAll('input[type="tel"]').forEach(mascaraTel);
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var hp = form.querySelector('[name="website"]');
        if (hp && hp.value) return; // robô de spam
        if (!validar(form)) return;
        var dados = {};
        new FormData(form).forEach(function (v, k) { if (k !== "website") dados[k] = String(v); });
        Object.assign(dados, origem(), { formulario: form.getAttribute("data-lead"), pagina: location.href.split("?")[0], data: new Date().toLocaleString("pt-BR") });

        var destino = C.FORM_DESTINO;
        if (!C.FORM_ENDPOINT && destino.indexOf("whatsapp") < 0) destino = "whatsapp"; // sem planilha, o lead não se perde: vai pro WhatsApp
        if (!C.WHATSAPP && destino.indexOf("whatsapp") >= 0) destino = destino.replace(/\+?whatsapp/, "");

        if (destino.indexOf("whatsapp") >= 0) {
          var linhas = Object.keys(dados).filter(function (k) { return ["nome", "whatsapp", "email", "interesse", "mensagem", "bairro", "cidade"].indexOf(k) >= 0 && dados[k]; })
            .map(function (k) { return k.charAt(0).toUpperCase() + k.slice(1) + ": " + dados[k]; });
          var url = linkZap((form.getAttribute("data-whatsapp-intro") || "Olá! Preenchi o formulário do site.") + "\n" + linhas.join("\n"));
          if (TESTE) log("abriria_whatsapp", { url: url }); else window.open(url, "_blank", "noopener");
        }
        if (destino.indexOf("planilha") >= 0 && C.FORM_ENDPOINT) {
          var corpo = new URLSearchParams(dados);
          if (TESTE) log("enviaria_planilha", { campos: Object.keys(dados).join(",") });
          else fetch(C.FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: corpo }).catch(function () {});
        }
        rastrear("lead", { formulario: dados.formulario });

        var b = form.querySelector('[type="submit"]'); if (b) b.disabled = true;
        var ok = document.getElementById(form.getAttribute("data-ok") || "");
        if (ok) {
          form.hidden = true; form.style.display = "none"; ok.hidden = false; ok.style.display = "";
          var n = ok.querySelector("[data-nome]"); if (n && dados.nome) n.textContent = dados.nome.split(" ")[0];
          ok.setAttribute("tabindex", "-1"); ok.focus();
        }
      });
    });
  }

  /* ---------- barra fixa de ação no celular: some no topo e perto do formulário ---------- */
  function barraFixa() {
    var barra = document.querySelector("[data-barra-fixa]");
    if (!barra || !("IntersectionObserver" in window)) return;
    var topo = document.querySelector("[data-topo]"), alvos = document.querySelectorAll("[data-esconde-barra]");
    var vis = new Map();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { vis.set(x.target, x.isIntersecting); });
      var esconde = false; vis.forEach(function (v) { if (v) esconde = true; });
      barra.classList.toggle("on", !esconde);
    });
    if (topo) io.observe(topo);
    alvos.forEach(function (a) { io.observe(a); });
  }

  function iniciar() {
    var escolha = local.get("cookies");
    if (escolha === "sim") { gtag("consent", "update", PERMITIDO); ligaPixel(); }
    else if (!escolha && (RASTREIO || TESTE)) avisoCookies();
    document.querySelectorAll("[data-cookies]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); avisoCookies(); });
    });
    prepararZap(); prepararForms(); barraFixa();
    log("page_view", { pagina: location.pathname });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
