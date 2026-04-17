import { useState } from "react";
import { buildWhatsAppUrl } from "../../lib/whatsapp.js";

const FPS_OPTIONS = [1, 10, 12.5, 15, 20, 25, 30];
const DISK_OPTIONS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 22];

const BITRATE_TABLES = {
  "2MP": {
    "H.264": { 1: 1536, 10: 1536, 12.5: 2048, 15: 2048, 20: 3072, 25: 4096, 30: 4096 },
    "H.265": { 1: 768, 10: 768, 12.5: 1024, 15: 1024, 20: 1536, 25: 2048, 30: 2048 },
    "H.265+": { 1: 1136, 10: 1136, 12.5: 1440, 15: 1440, 20: 1856, 25: 2048, 30: 2048 }
  },
  "4MP": {
    "H.264": { 1: 3072, 10: 3072, 12.5: 4096, 15: 4096, 20: 6144, 25: 8192, 30: 8192 },
    "H.265": { 1: 1536, 10: 1536, 12.5: 2048, 15: 2048, 20: 3072, 25: 4096, 30: 4096 },
    "H.265+": { 1: 1856, 10: 1856, 12.5: 2048, 15: 2048, 20: 3072, 25: 4096, 30: 4096 }
  },
  "8MP": {
    "H.264": { 1: 6144, 10: 6144, 12.5: 8192, 15: 8192, 20: 12288, 25: 16384, 30: 16384 },
    "H.265": { 1: 3072, 10: 3072, 12.5: 4096, 15: 4096, 20: 6144, 25: 8192, 30: 8192 },
    "H.265+": { 1: 1856, 10: 1856, 12.5: 2048, 15: 2048, 20: 3072, 25: 4096, 30: 4096 }
  }
};

const COMPLEXITY_PRESETS = {
  stable: {
    label: "Escena estable",
    multiplier: 1,
    detail: "Interior o perímetro ordenado, con fondo estable y movimiento ocasional."
  },
  mixed: {
    label: "Escena mixta",
    multiplier: 1.2,
    detail: "Tráfico moderado, variaciones de luz o varias zonas activas. Se añade 20% de margen."
  },
  demanding: {
    label: "Escena exigente",
    multiplier: 1.3,
    detail: "Movimiento alto, escenas complejas o necesidad de detalle fuerte. Se añade 30% de margen."
  }
};

const RECORDING_MODES = {
  continuous: "Grabación continua",
  event: "Grabación por evento o movimiento"
};

const RESOLUTION_DETAIL = {
  "2MP": "1080p",
  "4MP": "2560 x 1440",
  "8MP": "4K / UHD"
};

const CODEC_NOTES = {
  "H.264": "Útil cuando el cliente prioriza compatibilidad, pero consume más almacenamiento.",
  "H.265": "Mejor relación entre calidad y almacenamiento para la mayoría de proyectos nuevos.",
  "H.265+":
    "Rinde mejor en videovigilancia con fondo estable y movimiento ocasional; reduce ancho de banda y disco frente a H.265."
};

function formatNumber(value, fractionDigits = 2) {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

function findDiskRecommendation(requiredTb) {
  const targetTb = Math.max(requiredTb, 0.5);
  let best = null;

  for (let count = 1; count <= 8; count += 1) {
    for (const size of DISK_OPTIONS) {
      const totalTb = count * size;

      if (totalTb < targetTb) {
        continue;
      }

      const candidate = {
        count,
        size,
        totalTb,
        family: size >= 16 || count >= 4 ? "WD Purple Pro" : "WD Purple"
      };

      if (!best) {
        best = candidate;
        continue;
      }

      if (candidate.totalTb < best.totalTb || (candidate.totalTb === best.totalTb && candidate.count < best.count)) {
        best = candidate;
      }
    }
  }

  return best || { count: 8, size: 22, totalTb: 176, family: "WD Purple Pro" };
}

function calculateStorage(form) {
  const baseBitrateKbps = BITRATE_TABLES[form.resolution][form.codec][form.fps];
  const complexity = COMPLEXITY_PRESETS[form.complexity];
  const adjustedBitrateKbps = baseBitrateKbps * complexity.multiplier;
  const recordingFactor = form.recordingMode === "continuous" ? 1 : form.eventDuty / 100;
  const effectiveHoursPerDay = form.hoursPerDay * recordingFactor;
  const bytesPerSecondPerCamera = (adjustedBitrateKbps * 1000) / 8;
  const totalBytes =
    form.cameras * bytesPerSecondPerCamera * effectiveHoursPerDay * 3600 * form.days;

  const totalTbRaw = totalBytes / 1_000_000_000_000;
  const reserveFactor = 1 + form.reservePercent / 100;
  const totalTbRecommended = totalTbRaw * reserveFactor;
  const recommendation = findDiskRecommendation(totalTbRecommended);

  return {
    baseBitrateKbps,
    adjustedBitrateKbps,
    effectiveHoursPerDay,
    dailyGb:
      (form.cameras * bytesPerSecondPerCamera * effectiveHoursPerDay * 3600) /
      1_000_000_000,
    totalTbRaw,
    totalTbRecommended,
    aggregateMbps: (form.cameras * adjustedBitrateKbps) / 1000,
    perCameraMbps: adjustedBitrateKbps / 1000,
    recommendation,
    reserveFactor
  };
}

export default function SecurityCalculator({ content, whatsappNumber }) {
  const [form, setForm] = useState({
    cameras: 8,
    resolution: "4MP",
    codec: "H.265",
    fps: 15,
    hoursPerDay: 24,
    days: 30,
    recordingMode: "continuous",
    eventDuty: 45,
    complexity: "mixed",
    reservePercent: 15
  });

  const result = calculateStorage(form);
  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    content?.ctaMessage || "Hola, necesito asesoría profesional para calcular almacenamiento CCTV."
  );

  return (
    <section className="calc-card calc-shell">
      <div className="calc-head">
        <div className="calc-card__intro">
          <p className="section-eyebrow">{content?.eyebrow || "Ingeniería comercial"}</p>
          <h2>{content?.title}</h2>
          <p>{content?.subtitle}</p>
        </div>

        <div className="calc-source-chip">
          <strong>{form.codec}</strong>
          <span>{CODEC_NOTES[form.codec]}</span>
        </div>
      </div>

      <div className="calc-layout">
        <div className="calc-workbench">
          <div className="calc-grid calc-grid--expanded">
            <label className="field">
              <span>Número de cámaras</span>
              <input
                type="number"
                min="1"
                value={form.cameras}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cameras: Math.max(1, Number(event.target.value || 1))
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Resolución</span>
              <select
                value={form.resolution}
                onChange={(event) => setForm((current) => ({ ...current, resolution: event.target.value }))}
              >
                {Object.keys(BITRATE_TABLES).map((option) => (
                  <option key={option} value={option}>
                    {option} ({RESOLUTION_DETAIL[option]})
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Códec</span>
              <select
                value={form.codec}
                onChange={(event) => setForm((current) => ({ ...current, codec: event.target.value }))}
              >
                {["H.264", "H.265", "H.265+"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>FPS</span>
              <select
                value={form.fps}
                onChange={(event) => setForm((current) => ({ ...current, fps: Number(event.target.value) }))}
              >
                {FPS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} fps
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Horas de grabación por día</span>
              <input
                type="number"
                min="1"
                max="24"
                value={form.hoursPerDay}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hoursPerDay: Math.min(24, Math.max(1, Number(event.target.value || 1)))
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Días de retención</span>
              <input
                type="number"
                min="1"
                value={form.days}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    days: Math.max(1, Number(event.target.value || 1))
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Modo de grabación</span>
              <select
                value={form.recordingMode}
                onChange={(event) => setForm((current) => ({ ...current, recordingMode: event.target.value }))}
              >
                {Object.entries(RECORDING_MODES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Complejidad de escena</span>
              <select
                value={form.complexity}
                onChange={(event) => setForm((current) => ({ ...current, complexity: event.target.value }))}
              >
                {Object.entries(COMPLEXITY_PRESETS).map(([value, preset]) => (
                  <option key={value} value={value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>

            {form.recordingMode === "event" && (
              <label className="field">
                <span>% estimado de actividad diaria</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.eventDuty}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      eventDuty: Math.min(100, Math.max(1, Number(event.target.value || 1)))
                    }))
                  }
                />
              </label>
            )}

            <label className="field">
              <span>Reserva técnica adicional</span>
              <select
                value={form.reservePercent}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reservePercent: Number(event.target.value) }))
                }
              >
                {[10, 15, 20, 25].map((option) => (
                  <option key={option} value={option}>
                    {option}%
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="calc-results calc-results--expanded">
            <article className="result-tone result-tone--primary">
              <span>Bitrate base por cámara</span>
              <strong>{formatNumber(result.baseBitrateKbps / 1000)} Mbps</strong>
              <p>Tabla de referencia para {form.resolution}, {form.codec} y {form.fps} fps.</p>
            </article>

            <article className="result-tone">
              <span>Bitrate ajustado</span>
              <strong>{formatNumber(result.perCameraMbps)} Mbps</strong>
              <p>{COMPLEXITY_PRESETS[form.complexity].detail}</p>
            </article>

            <article className="result-tone">
              <span>Ancho de banda total</span>
              <strong>{formatNumber(result.aggregateMbps)} Mbps</strong>
              <p>Consumo estimado de subida o grabación agregada para todas las cámaras.</p>
            </article>

            <article className="result-tone">
              <span>Grabación efectiva por día</span>
              <strong>{formatNumber(result.effectiveHoursPerDay)} horas</strong>
              <p>
                {form.recordingMode === "continuous"
                  ? "Grabación 24/7 o por el rango horario configurado."
                  : `Se aplica un ${form.eventDuty}% de actividad estimada.`}
              </p>
            </article>

            <article className="result-tone">
              <span>Capacidad bruta</span>
              <strong>{formatNumber(result.totalTbRaw)} TB</strong>
              <p>Proyección pura antes de reserva técnica adicional.</p>
            </article>

            <article className="result-tone result-tone--accent">
              <span>Capacidad recomendada</span>
              <strong>{formatNumber(result.totalTbRecommended)} TB</strong>
              <p>Incluye {form.reservePercent}% de margen sobre el cálculo base.</p>
            </article>
          </div>
        </div>

        <aside className="calc-note">
          <div className="calc-note__card">
            <p className="section-eyebrow">Lectura técnica</p>
            <h3>{content?.noteTitle}</h3>
            <p>{content?.noteBody}</p>
          </div>

          <div className="calc-note__card">
            <span className="calc-note__label">Recomendación de discos</span>
            <strong>
              {result.recommendation.count} x {result.recommendation.family} {result.recommendation.size} TB
            </strong>
            <p>
              Total sugerido: {formatNumber(result.recommendation.totalTb)} TB.
              Esta referencia te deja margen para retención y crecimiento inicial.
            </p>
          </div>

          <div className="calc-note__card">
            <span className="calc-note__label">Consumo diario estimado</span>
            <strong>{formatNumber(result.dailyGb)} GB por día</strong>
            <p>{content?.helper}</p>
          </div>

          <div className="calc-note__card">
            <span className="calc-note__label">Supuestos usados</span>
            <ul>
              {(content?.assumptions || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <a className="button button--primary" href={whatsappUrl} target="_blank" rel="noreferrer">
            {content?.ctaLabel || "Solicitar diseño CCTV"}
          </a>
        </aside>
      </div>
    </section>
  );
}
