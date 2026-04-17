import { useEffect, useState } from "react";

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:4000";
const PAGE_KEYS = ["redes-y-vpn", "servidores", "soporte", "blog-tecnico"];

const linesToArray = (value) =>
  value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

const arrayToLines = (value = []) => value.join("\n");

function Field({ label, value, onChange, multiline = false, placeholder = "", type = "text" }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value || ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type={type} value={value || ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function ImageField({ label, value, token, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const preview = value
    ? /^https?:\/\//i.test(value)
      ? value
      : `${API_BASE}${value.startsWith("/") ? value : `/${value}`}`
    : "";

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("image", file);
    setUploading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body
      });

      if (!response.ok) throw new Error("No se pudo subir la imagen.");
      const result = await response.json();
      onUploaded(result.path);
    } catch (error) {
      alert(error.message || "Error al subir la imagen.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="admin-field">
      <span>{label}</span>
      {preview && <img className="image-preview" src={preview} alt={label} />}
      <input value={value || ""} onChange={(event) => onUploaded(event.target.value)} placeholder="/uploads/mi-imagen.png" />
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <small className="status-note">{uploading ? "Subiendo imagen..." : "Puedes pegar una URL o subir un archivo."}</small>
    </div>
  );
}

function SectionEditor({ sections = [], onChange }) {
  const updateSection = (index, patch) =>
    onChange(sections.map((section, currentIndex) => (currentIndex === index ? { ...section, ...patch } : section)));

  return (
    <div className="admin-card-list">
      {sections.map((section, index) => (
        <article className="admin-card" key={`${section.title}-${index}`}>
          <div className="admin-card__header">
            <strong>Sección {index + 1}</strong>
            <button className="mini-button" type="button" onClick={() => onChange(sections.filter((_, i) => i !== index))}>
              Eliminar
            </button>
          </div>
          <Field label="Título" value={section.title} onChange={(value) => updateSection(index, { title: value })} />
          <Field label="Contenido" value={section.content} multiline onChange={(value) => updateSection(index, { content: value })} />
          <Field
            label="Bullets (uno por línea)"
            value={arrayToLines(section.bullets)}
            multiline
            onChange={(value) => updateSection(index, { bullets: linesToArray(value) })}
          />
        </article>
      ))}
      <button
        className="mini-button"
        type="button"
        onClick={() => onChange([...sections, { title: "Nueva sección", content: "", bullets: [] }])}
      >
        Agregar sección
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const [token, setToken] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedPage, setSelectedPage] = useState(PAGE_KEYS[0]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("soluciones-tic-admin-token");
    if (savedToken) {
      setToken(savedToken);
      bootstrap(savedToken);
    }
  }, []);

  async function bootstrap(authToken) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/admin/bootstrap`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!response.ok) throw new Error("No se pudo cargar el contenido editable.");
      setData(await response.json());
    } catch (requestError) {
      setError(requestError.message || "Error al cargar el panel.");
      setToken("");
      window.localStorage.removeItem("soluciones-tic-admin-token");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error("Usuario o contraseña inválidos.");
      const result = await response.json();
      setToken(result.token);
      window.localStorage.setItem("soluciones-tic-admin-token", result.token);
      await bootstrap(result.token);
    } catch (requestError) {
      setError(requestError.message || "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  async function saveDocument(name) {
    if (!data) return;
    setStatus("Guardando cambios...");
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/admin/${name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data[name])
      });
      if (!response.ok) throw new Error(`No se pudo guardar ${name}.`);
      const result = await response.json();
      setData((current) => ({ ...current, [name]: result }));
      setStatus(`Cambios de ${name} guardados correctamente.`);
    } catch (requestError) {
      setError(requestError.message || "Error guardando cambios.");
    }
  }

  async function saveAllDocuments() {
    if (!data) return;
    setStatus("Guardando todo el contenido...");
    setError("");
    try {
      for (const name of ["site", "home", "pages", "blog", "support"]) {
        const response = await fetch(`${API_BASE}/api/admin/${name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(data[name])
        });
        if (!response.ok) throw new Error(`No se pudo guardar ${name}.`);
      }
      setStatus("Todo el contenido fue guardado correctamente.");
    } catch (requestError) {
      setError(requestError.message || "Error guardando todos los cambios.");
    }
  }

  const updateSite = (patch) => setData((current) => ({ ...current, site: { ...current.site, ...patch } }));
  const updateHomeBlock = (path, patch) =>
    setData((current) => ({ ...current, home: { ...current.home, [path]: { ...current.home[path], ...patch } } }));
  const updateHomeRoot = (patch) => setData((current) => ({ ...current, home: { ...current.home, ...patch } }));
  const updatePage = (pageKey, patch) =>
    setData((current) => ({ ...current, pages: { ...current.pages, [pageKey]: { ...current.pages[pageKey], ...patch } } }));
  const updateBlogPost = (index, patch) =>
    setData((current) => ({ ...current, blog: current.blog.map((post, i) => (i === index ? { ...post, ...patch } : post)) }));
  const addBlogPost = () =>
    setData((current) => ({
      ...current,
      blog: [
        ...current.blog,
        {
          slug: `nuevo-articulo-${current.blog.length + 1}`,
          category: "Videovigilancia",
          title: "Nuevo artículo",
          excerpt: "",
          metaDescription: "",
          publishedAt: new Date().toISOString().slice(0, 10),
          readingTime: "3 min",
          coverImage: "",
          sections: []
        }
      ]
    }));
  const removeBlogPost = (index) =>
    setData((current) => ({ ...current, blog: current.blog.filter((_, postIndex) => postIndex !== index) }));
  const updateQuickSolution = (index, patch) =>
    setData((current) => ({
      ...current,
      home: {
        ...current.home,
        quickSolutions: {
          ...current.home.quickSolutions,
          items: current.home.quickSolutions.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
        }
      }
    }));
  const addQuickSolution = () =>
    setData((current) => ({
      ...current,
      home: {
        ...current.home,
        quickSolutions: {
          ...current.home.quickSolutions,
          items: [...current.home.quickSolutions.items, { title: "Nueva solución", description: "", tag: "Nueva línea", message: "" }]
        }
      }
    }));
  const removeQuickSolution = (index) =>
    setData((current) => ({
      ...current,
      home: {
        ...current.home,
        quickSolutions: {
          ...current.home.quickSolutions,
          items: current.home.quickSolutions.items.filter((_, itemIndex) => itemIndex !== index)
        }
      }
    }));
  const updateInfrastructureItem = (index, patch) =>
    setData((current) => ({
      ...current,
      home: {
        ...current.home,
        infrastructure: {
          ...current.home.infrastructure,
          items: current.home.infrastructure.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
        }
      }
    }));
  const addInfrastructureItem = () =>
    setData((current) => ({
      ...current,
      home: {
        ...current.home,
        infrastructure: {
          ...current.home.infrastructure,
          items: [...current.home.infrastructure.items, { badge: "Nueva línea", title: "Nueva solución", description: "", message: "" }]
        }
      }
    }));
  const removeInfrastructureItem = (index) =>
    setData((current) => ({
      ...current,
      home: {
        ...current.home,
        infrastructure: {
          ...current.home.infrastructure,
          items: current.home.infrastructure.items.filter((_, itemIndex) => itemIndex !== index)
        }
      }
    }));
  const updateBrand = (index, patch) =>
    setData((current) => ({
      ...current,
      home: {
        ...current.home,
        trustBanner: {
          ...current.home.trustBanner,
          brands: current.home.trustBanner.brands.map((brand, brandIndex) => (brandIndex === index ? { ...brand, ...patch } : brand))
        }
      }
    }));
  const addBrand = () =>
    setData((current) => ({
      ...current,
      home: {
        ...current.home,
        trustBanner: {
          ...current.home.trustBanner,
          brands: [...current.home.trustBanner.brands, { name: "Nueva marca", logoUrl: "" }]
        }
      }
    }));
  const removeBrand = (index) =>
    setData((current) => ({
      ...current,
      home: {
        ...current.home,
        trustBanner: {
          ...current.home.trustBanner,
          brands: current.home.trustBanner.brands.filter((_, brandIndex) => brandIndex !== index)
        }
      }
    }));
  const updateSupportTool = (index, patch) =>
    setData((current) => ({
      ...current,
      support: { ...current.support, tools: current.support.tools.map((tool, toolIndex) => (toolIndex === index ? { ...tool, ...patch } : tool)) }
    }));
  const addSupportTool = () =>
    setData((current) => ({
      ...current,
      support: {
        ...current.support,
        tools: [...current.support.tools, { name: "Nueva herramienta", category: "Soporte", description: "", url: "" }]
      }
    }));
  const removeSupportTool = (index) =>
    setData((current) => ({ ...current, support: { ...current.support, tools: current.support.tools.filter((_, toolIndex) => toolIndex !== index) } }));

  function logout() {
    setToken("");
    setData(null);
    window.localStorage.removeItem("soluciones-tic-admin-token");
  }

  if (!token || !data) {
    return (
      <div className="login-card">
        <p className="section-eyebrow">Acceso privado</p>
        <h2>Panel editable de Soluciones TIC</h2>
        <p>Desde aquí puedes editar textos, artículos, mensajes de WhatsApp e imágenes sin tocar código.</p>
        <p className="status-note">Las credenciales del editor se configuran en <code>backend/.env</code>.</p>
        <form className="admin-card-list spacer-top" onSubmit={handleLogin}>
          <Field label="Usuario" value={form.username} onChange={(value) => setForm((current) => ({ ...current, username: value }))} />
          <Field label="Contraseña" type="password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} />
          <div className="admin-actions">
            <button className="button button--primary" type="submit" disabled={loading}>{loading ? "Ingresando..." : "Entrar al panel"}</button>
          </div>
          {error && <p className="status-error">{error}</p>}
        </form>
      </div>
    );
  }

  const page = data.pages[selectedPage];
  const home = data.home;
  const site = data.site;

  function renderGeneralTab() {
    return (
      <section className="admin-panel">
        <h3>Información general y contacto</h3>
        <div className="admin-grid">
          <Field label="Nombre de la empresa" value={site.companyName} onChange={(value) => updateSite({ companyName: value })} />
          <Field label="Eslogan" value={site.tagline} onChange={(value) => updateSite({ tagline: value })} />
          <Field label="Teléfono visible" value={site.phoneDisplay} onChange={(value) => updateSite({ phoneDisplay: value })} />
          <Field label="WhatsApp" value={site.whatsappNumber} onChange={(value) => updateSite({ whatsappNumber: value })} />
          <Field label="Correo" value={site.email} onChange={(value) => updateSite({ email: value })} />
          <Field label="Ubicación" value={site.location} onChange={(value) => updateSite({ location: value })} />
        </div>
        <ImageField label="Logo principal" value={site.logoPath} token={token} onUploaded={(value) => updateSite({ logoPath: value })} />
        <Field label="Mensaje principal de WhatsApp" value={site.primaryWhatsappMessage} multiline onChange={(value) => updateSite({ primaryWhatsappMessage: value })} />
        <Field label="Mensaje de redes y servidores" value={site.secondaryWhatsappMessage} multiline onChange={(value) => updateSite({ secondaryWhatsappMessage: value })} />
        <Field label="Nota de cobertura" value={site.coverageNote} multiline onChange={(value) => updateSite({ coverageNote: value })} />
        <Field label="Texto del footer" value={site.footerNotice} multiline onChange={(value) => updateSite({ footerNotice: value })} />
        <div className="admin-actions">
          <button className="button button--primary" type="button" onClick={() => saveDocument("site")}>Guardar general</button>
        </div>
      </section>
    );
  }

  function renderHomeTab() {
    return (
      <section className="admin-panel">
        <h3>Home comercial</h3>
        <div className="admin-card">
          <div className="admin-card__header"><strong>Hero</strong></div>
          <div className="admin-grid">
            <Field label="Eyebrow" value={home.hero.eyebrow} onChange={(value) => updateHomeBlock("hero", { eyebrow: value })} />
            <Field label="Título" value={home.hero.title} onChange={(value) => updateHomeBlock("hero", { title: value })} />
            <Field label="CTA principal" value={home.hero.primaryCtaLabel} onChange={(value) => updateHomeBlock("hero", { primaryCtaLabel: value })} />
            <Field label="CTA secundario" value={home.hero.secondaryCtaLabel} onChange={(value) => updateHomeBlock("hero", { secondaryCtaLabel: value })} />
          </div>
          <Field label="Subtítulo" value={home.hero.subtitle} multiline onChange={(value) => updateHomeBlock("hero", { subtitle: value })} />
          <div className="admin-grid">
            <Field label="Texto sobre la imagen" value={home.hero.visualBadge} onChange={(value) => updateHomeBlock("hero", { visualBadge: value })} />
            <Field label="Texto alternativo" value={home.hero.visualAlt} onChange={(value) => updateHomeBlock("hero", { visualAlt: value })} />
          </div>
          <ImageField label="Imagen principal del hero" value={home.hero.visualImage} token={token} onUploaded={(value) => updateHomeBlock("hero", { visualImage: value })} />
          <Field label="Badge de garantía" value={home.hero.badgeLabel} onChange={(value) => updateHomeBlock("hero", { badgeLabel: value })} />
          <Field label="Indicadores del hero (uno por línea)" value={arrayToLines(home.hero.floatingStats)} multiline onChange={(value) => updateHomeBlock("hero", { floatingStats: linesToArray(value) })} />
          <Field label="Servicios complementarios (uno por línea)" value={arrayToLines(home.secondaryServices)} multiline onChange={(value) => updateHomeRoot({ secondaryServices: linesToArray(value) })} />
        </div>

        <div className="admin-card">
          <div className="admin-card__header"><strong>Comparador CCTV</strong></div>
          <div className="admin-grid">
            <Field label="Título del bloque" value={home.compare.title} onChange={(value) => updateHomeBlock("compare", { title: value })} />
            <Field label="Título interno" value={home.compare.detailsTitle} onChange={(value) => updateHomeBlock("compare", { detailsTitle: value })} />
            <Field label="Etiqueta antes" value={home.compare.beforeLabel} onChange={(value) => updateHomeBlock("compare", { beforeLabel: value })} />
            <Field label="Etiqueta después" value={home.compare.afterLabel} onChange={(value) => updateHomeBlock("compare", { afterLabel: value })} />
          </div>
          <Field label="Descripción" value={home.compare.subtitle} multiline onChange={(value) => updateHomeBlock("compare", { subtitle: value })} />
          <Field label="Texto interno" value={home.compare.detailsBody} multiline onChange={(value) => updateHomeBlock("compare", { detailsBody: value })} />
          <Field label="Bullets internos (uno por línea)" value={arrayToLines(home.compare.detailsBullets)} multiline onChange={(value) => updateHomeBlock("compare", { detailsBullets: linesToArray(value) })} />
          <Field label="Nota" value={home.compare.note} multiline onChange={(value) => updateHomeBlock("compare", { note: value })} />
          <div className="admin-grid">
            <ImageField label="Imagen 2MP" value={home.compare.beforeImage} token={token} onUploaded={(value) => updateHomeBlock("compare", { beforeImage: value })} />
            <ImageField label="Imagen 4MP / 8MP" value={home.compare.afterImage} token={token} onUploaded={(value) => updateHomeBlock("compare", { afterImage: value })} />
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__header"><strong>Tecnología nocturna</strong></div>
          <div className="admin-grid">
            <Field label="Eyebrow" value={home.nightVision.eyebrow} onChange={(value) => updateHomeBlock("nightVision", { eyebrow: value })} />
            <Field label="Título" value={home.nightVision.title} onChange={(value) => updateHomeBlock("nightVision", { title: value })} />
            <Field label="Badge" value={home.nightVision.badge} onChange={(value) => updateHomeBlock("nightVision", { badge: value })} />
            <Field label="Texto alternativo" value={home.nightVision.imageAlt} onChange={(value) => updateHomeBlock("nightVision", { imageAlt: value })} />
          </div>
          <Field label="Descripción" value={home.nightVision.subtitle} multiline onChange={(value) => updateHomeBlock("nightVision", { subtitle: value })} />
          <Field label="Bullets (uno por línea)" value={arrayToLines(home.nightVision.bullets)} multiline onChange={(value) => updateHomeBlock("nightVision", { bullets: linesToArray(value) })} />
          <div className="admin-grid">
            <Field label="CTA" value={home.nightVision.ctaLabel} onChange={(value) => updateHomeBlock("nightVision", { ctaLabel: value })} />
            <ImageField label="Imagen del bloque" value={home.nightVision.image} token={token} onUploaded={(value) => updateHomeBlock("nightVision", { image: value })} />
          </div>
          <Field label="Mensaje de WhatsApp" value={home.nightVision.ctaMessage} multiline onChange={(value) => updateHomeBlock("nightVision", { ctaMessage: value })} />
        </div>

        <div className="admin-card">
          <div className="admin-card__header"><strong>Video porteros IP</strong></div>
          <div className="admin-grid">
            <Field label="Eyebrow" value={home.videoIntercom.eyebrow} onChange={(value) => updateHomeBlock("videoIntercom", { eyebrow: value })} />
            <Field label="Título" value={home.videoIntercom.title} onChange={(value) => updateHomeBlock("videoIntercom", { title: value })} />
            <Field label="Badge" value={home.videoIntercom.badge} onChange={(value) => updateHomeBlock("videoIntercom", { badge: value })} />
            <Field label="Texto alternativo" value={home.videoIntercom.imageAlt} onChange={(value) => updateHomeBlock("videoIntercom", { imageAlt: value })} />
          </div>
          <Field label="Descripción" value={home.videoIntercom.subtitle} multiline onChange={(value) => updateHomeBlock("videoIntercom", { subtitle: value })} />
          <Field label="Bullets (uno por línea)" value={arrayToLines(home.videoIntercom.bullets)} multiline onChange={(value) => updateHomeBlock("videoIntercom", { bullets: linesToArray(value) })} />
          <div className="admin-grid">
            <Field label="CTA" value={home.videoIntercom.ctaLabel} onChange={(value) => updateHomeBlock("videoIntercom", { ctaLabel: value })} />
            <ImageField label="Imagen del bloque" value={home.videoIntercom.image} token={token} onUploaded={(value) => updateHomeBlock("videoIntercom", { image: value })} />
          </div>
          <Field label="Mensaje de WhatsApp" value={home.videoIntercom.ctaMessage} multiline onChange={(value) => updateHomeBlock("videoIntercom", { ctaMessage: value })} />
        </div>
      </section>
    );
  }

  function renderHomeSecondaryTab() {
    return (
      <section className="admin-panel">
        <h3>Inicio: soluciones y confianza</h3>
        <div className="admin-card">
          <div className="admin-card__header">
            <strong>Grid de soluciones</strong>
            <button className="mini-button" type="button" onClick={addQuickSolution}>Agregar tarjeta</button>
          </div>
          <Field label="Eyebrow" value={home.quickSolutions.eyebrow} onChange={(value) => updateHomeBlock("quickSolutions", { eyebrow: value })} />
          <Field label="Título" value={home.quickSolutions.title} onChange={(value) => updateHomeBlock("quickSolutions", { title: value })} />
          <Field label="Subtítulo" value={home.quickSolutions.subtitle} multiline onChange={(value) => updateHomeBlock("quickSolutions", { subtitle: value })} />
          <div className="admin-card-list">
            {home.quickSolutions.items.map((item, index) => (
              <article className="admin-card" key={`${item.title}-${index}`}>
                <div className="admin-card__header">
                  <strong>Tarjeta {index + 1}</strong>
                  <button className="mini-button" type="button" onClick={() => removeQuickSolution(index)}>Eliminar</button>
                </div>
                <div className="admin-grid">
                  <Field label="Título" value={item.title} onChange={(value) => updateQuickSolution(index, { title: value })} />
                  <Field label="Etiqueta" value={item.tag} onChange={(value) => updateQuickSolution(index, { tag: value })} />
                </div>
                <Field label="Descripción" value={item.description} multiline onChange={(value) => updateQuickSolution(index, { description: value })} />
                <Field label="Mensaje de WhatsApp" value={item.message} multiline onChange={(value) => updateQuickSolution(index, { message: value })} />
              </article>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__header">
            <strong>Infraestructura que soporta el video</strong>
            <button className="mini-button" type="button" onClick={addInfrastructureItem}>Agregar tarjeta</button>
          </div>
          <Field label="Eyebrow" value={home.infrastructure.eyebrow} onChange={(value) => updateHomeBlock("infrastructure", { eyebrow: value })} />
          <Field label="Título" value={home.infrastructure.title} onChange={(value) => updateHomeBlock("infrastructure", { title: value })} />
          <Field label="Subtítulo" value={home.infrastructure.subtitle} multiline onChange={(value) => updateHomeBlock("infrastructure", { subtitle: value })} />
          <div className="admin-card-list">
            {home.infrastructure.items.map((item, index) => (
              <article className="admin-card" key={`${item.title}-${index}`}>
                <div className="admin-card__header">
                  <strong>Tarjeta {index + 1}</strong>
                  <button className="mini-button" type="button" onClick={() => removeInfrastructureItem(index)}>Eliminar</button>
                </div>
                <div className="admin-grid">
                  <Field label="Etiqueta" value={item.badge} onChange={(value) => updateInfrastructureItem(index, { badge: value })} />
                  <Field label="Título" value={item.title} onChange={(value) => updateInfrastructureItem(index, { title: value })} />
                </div>
                <Field label="Descripción" value={item.description} multiline onChange={(value) => updateInfrastructureItem(index, { description: value })} />
                <Field label="Mensaje de WhatsApp" value={item.message} multiline onChange={(value) => updateInfrastructureItem(index, { message: value })} />
              </article>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__header"><strong>Calculadora técnica</strong></div>
          <div className="admin-grid">
            <Field label="Eyebrow" value={home.storageCalculator.eyebrow} onChange={(value) => updateHomeBlock("storageCalculator", { eyebrow: value })} />
            <Field label="Título" value={home.storageCalculator.title} onChange={(value) => updateHomeBlock("storageCalculator", { title: value })} />
            <Field label="CTA" value={home.storageCalculator.ctaLabel} onChange={(value) => updateHomeBlock("storageCalculator", { ctaLabel: value })} />
            <Field label="Título del panel técnico" value={home.storageCalculator.noteTitle} onChange={(value) => updateHomeBlock("storageCalculator", { noteTitle: value })} />
          </div>
          <Field label="Subtítulo" value={home.storageCalculator.subtitle} multiline onChange={(value) => updateHomeBlock("storageCalculator", { subtitle: value })} />
          <Field label="Texto auxiliar" value={home.storageCalculator.helper} multiline onChange={(value) => updateHomeBlock("storageCalculator", { helper: value })} />
          <Field label="Texto del panel técnico" value={home.storageCalculator.noteBody} multiline onChange={(value) => updateHomeBlock("storageCalculator", { noteBody: value })} />
          <Field label="Supuestos técnicos (uno por línea)" value={arrayToLines(home.storageCalculator.assumptions)} multiline onChange={(value) => updateHomeBlock("storageCalculator", { assumptions: linesToArray(value) })} />
          <Field label="Mensaje de WhatsApp" value={home.storageCalculator.ctaMessage} multiline onChange={(value) => updateHomeBlock("storageCalculator", { ctaMessage: value })} />
        </div>

        <div className="admin-card">
          <div className="admin-card__header">
            <strong>Banner de confianza</strong>
            <button className="mini-button" type="button" onClick={addBrand}>Agregar marca</button>
          </div>
          <Field label="Eyebrow" value={home.trustBanner.eyebrow} onChange={(value) => updateHomeBlock("trustBanner", { eyebrow: value })} />
          <Field label="Título" value={home.trustBanner.title} onChange={(value) => updateHomeBlock("trustBanner", { title: value })} />
          <Field label="Subtítulo" value={home.trustBanner.subtitle} multiline onChange={(value) => updateHomeBlock("trustBanner", { subtitle: value })} />
          <div className="admin-grid">
            <Field label="Texto CTA principal" value={home.trustBanner.primaryCtaLabel} onChange={(value) => updateHomeBlock("trustBanner", { primaryCtaLabel: value })} />
            <Field label="Texto CTA secundario" value={home.trustBanner.secondaryCtaLabel} onChange={(value) => updateHomeBlock("trustBanner", { secondaryCtaLabel: value })} />
          </div>
          <Field label="Promesas (una por línea)" value={arrayToLines(home.trustBanner.promiseItems)} multiline onChange={(value) => updateHomeBlock("trustBanner", { promiseItems: linesToArray(value) })} />
          <div className="admin-card-list">
            {home.trustBanner.brands.map((brand, index) => (
              <article className="admin-card" key={`${brand.name}-${index}`}>
                <div className="admin-card__header">
                  <strong>Marca {index + 1}</strong>
                  <button className="mini-button" type="button" onClick={() => removeBrand(index)}>Eliminar</button>
                </div>
                <div className="admin-grid">
                  <Field label="Nombre" value={brand.name} onChange={(value) => updateBrand(index, { name: value })} />
                  <ImageField label="Logo opcional" value={brand.logoUrl} token={token} onUploaded={(value) => updateBrand(index, { logoUrl: value })} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="admin-actions">
          <button className="button button--primary" type="button" onClick={() => saveDocument("home")}>Guardar inicio</button>
        </div>
      </section>
    );
  }

  function renderPagesTab() {
    return (
      <section className="admin-panel">
        <h3>Páginas internas</h3>
        <div className="admin-tabs">
          {PAGE_KEYS.map((key) => (
            <button className={selectedPage === key ? "is-active" : ""} type="button" key={key} onClick={() => setSelectedPage(key)}>
              {data.pages[key].menuLabel}
            </button>
          ))}
        </div>
        <div className="admin-grid">
          <Field label="Menú" value={page.menuLabel} onChange={(value) => updatePage(selectedPage, { menuLabel: value })} />
          <Field label="Título corto" value={page.title} onChange={(value) => updatePage(selectedPage, { title: value })} />
          <Field label="Eyebrow" value={page.eyebrow} onChange={(value) => updatePage(selectedPage, { eyebrow: value })} />
          <Field label="Título SEO" value={page.metaTitle} onChange={(value) => updatePage(selectedPage, { metaTitle: value })} />
        </div>
        <Field label="Meta description" value={page.metaDescription} multiline onChange={(value) => updatePage(selectedPage, { metaDescription: value })} />
        <Field label="Hero title" value={page.heroTitle} multiline onChange={(value) => updatePage(selectedPage, { heroTitle: value })} />
        <Field label="Hero intro" value={page.heroIntro} multiline onChange={(value) => updatePage(selectedPage, { heroIntro: value })} />
        <div className="admin-grid">
          <Field label="Texto CTA" value={page.ctaLabel || ""} onChange={(value) => updatePage(selectedPage, { ctaLabel: value })} />
          <Field label="Mensaje CTA" value={page.ctaMessage || ""} multiline onChange={(value) => updatePage(selectedPage, { ctaMessage: value })} />
        </div>
        {page.sections ? <SectionEditor sections={page.sections} onChange={(sections) => updatePage(selectedPage, { sections })} /> : <p className="status-note">Esta página usa el contenido del blog y no necesita secciones adicionales.</p>}
        <div className="admin-actions">
          <button className="button button--primary" type="button" onClick={() => saveDocument("pages")}>Guardar páginas</button>
        </div>
      </section>
    );
  }

  function renderBlogTab() {
    return (
      <section className="admin-panel">
        <div className="admin-card__header">
          <h3>Artículos técnicos</h3>
          <button className="mini-button" type="button" onClick={addBlogPost}>Agregar artículo</button>
        </div>
        <div className="admin-card-list">
          {data.blog.map((post, index) => (
            <article className="admin-card" key={`${post.slug}-${index}`}>
              <div className="admin-card__header">
                <strong>{post.title || `Artículo ${index + 1}`}</strong>
                <button className="mini-button" type="button" onClick={() => removeBlogPost(index)}>Eliminar</button>
              </div>
              <div className="admin-grid">
                <Field label="Slug" value={post.slug} onChange={(value) => updateBlogPost(index, { slug: value })} />
                <Field label="Categoría" value={post.category} onChange={(value) => updateBlogPost(index, { category: value })} />
                <Field label="Fecha" value={post.publishedAt} onChange={(value) => updateBlogPost(index, { publishedAt: value })} />
                <Field label="Tiempo de lectura" value={post.readingTime} onChange={(value) => updateBlogPost(index, { readingTime: value })} />
              </div>
              <Field label="Título" value={post.title} onChange={(value) => updateBlogPost(index, { title: value })} />
              <Field label="Extracto" value={post.excerpt} multiline onChange={(value) => updateBlogPost(index, { excerpt: value })} />
              <Field label="Meta description" value={post.metaDescription} multiline onChange={(value) => updateBlogPost(index, { metaDescription: value })} />
              <ImageField label="Portada" value={post.coverImage} token={token} onUploaded={(value) => updateBlogPost(index, { coverImage: value })} />
              <SectionEditor sections={post.sections || []} onChange={(sections) => updateBlogPost(index, { sections })} />
            </article>
          ))}
        </div>
        <div className="admin-actions">
          <button className="button button--primary" type="button" onClick={() => saveDocument("blog")}>Guardar blog</button>
        </div>
      </section>
    );
  }

  function renderSupportTab() {
    return (
      <section className="admin-panel">
        <div className="admin-card__header">
          <h3>Centro de soporte</h3>
          <button className="mini-button" type="button" onClick={addSupportTool}>Agregar herramienta</button>
        </div>
        <Field label="Título" value={data.support.title} onChange={(value) => setData((current) => ({ ...current, support: { ...current.support, title: value } }))} />
        <Field label="Subtítulo" value={data.support.subtitle} multiline onChange={(value) => setData((current) => ({ ...current, support: { ...current.support, subtitle: value } }))} />
        <div className="admin-card-list">
          {data.support.tools.map((tool, index) => (
            <article className="admin-card" key={`${tool.name}-${index}`}>
              <div className="admin-card__header">
                <strong>Herramienta {index + 1}</strong>
                <button className="mini-button" type="button" onClick={() => removeSupportTool(index)}>Eliminar</button>
              </div>
              <div className="admin-grid">
                <Field label="Nombre" value={tool.name} onChange={(value) => updateSupportTool(index, { name: value })} />
                <Field label="Categoría" value={tool.category} onChange={(value) => updateSupportTool(index, { category: value })} />
              </div>
              <Field label="Descripción" value={tool.description} multiline onChange={(value) => updateSupportTool(index, { description: value })} />
              <Field label="URL" value={tool.url} onChange={(value) => updateSupportTool(index, { url: value })} />
            </article>
          ))}
        </div>
        <div className="admin-actions">
          <button className="button button--primary" type="button" onClick={() => saveDocument("support")}>Guardar soporte</button>
        </div>
      </section>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div>
          <p className="section-eyebrow">Contenido editable</p>
          <h2>Administra la web sin tocar código</h2>
          <p>Puedes cambiar textos, imágenes, artículos, mensajes de WhatsApp y marcas desde este panel.</p>
        </div>
        <div className="admin-actions">
          <a className="mini-button" href="/" target="_blank" rel="noreferrer">Ver sitio</a>
          <button className="mini-button" type="button" onClick={saveAllDocuments}>Guardar todo</button>
          <button className="mini-button" type="button" onClick={logout}>Cerrar sesión</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === "general" ? "is-active" : ""} type="button" onClick={() => setActiveTab("general")}>General</button>
        <button className={activeTab === "inicio-a" ? "is-active" : ""} type="button" onClick={() => setActiveTab("inicio-a")}>Inicio I</button>
        <button className={activeTab === "inicio-b" ? "is-active" : ""} type="button" onClick={() => setActiveTab("inicio-b")}>Inicio II</button>
        <button className={activeTab === "paginas" ? "is-active" : ""} type="button" onClick={() => setActiveTab("paginas")}>Páginas</button>
        <button className={activeTab === "blog" ? "is-active" : ""} type="button" onClick={() => setActiveTab("blog")}>Blog</button>
        <button className={activeTab === "soporte" ? "is-active" : ""} type="button" onClick={() => setActiveTab("soporte")}>Soporte</button>
      </div>

      {status && <p className="status-note">{status}</p>}
      {error && <p className="status-error">{error}</p>}

      {activeTab === "general" && renderGeneralTab()}
      {activeTab === "inicio-a" && renderHomeTab()}
      {activeTab === "inicio-b" && renderHomeSecondaryTab()}
      {activeTab === "paginas" && renderPagesTab()}
      {activeTab === "blog" && renderBlogTab()}
      {activeTab === "soporte" && renderSupportTab()}
    </div>
  );
}
