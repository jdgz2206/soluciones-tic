import { useEffect, useState } from "react";
import { buildWhatsAppUrl } from "../../lib/whatsapp.js";

function resolveActiveSection(sectionMessages, visibleId) {
  return sectionMessages.find((item) => item.id === visibleId) || sectionMessages[0];
}

export default function SmartWhatsAppButton({ number, sectionMessages = [] }) {
  const [visibleId, setVisibleId] = useState(sectionMessages[0]?.id || "");

  useEffect(() => {
    const sections = sectionMessages
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          setVisibleId(visibleEntry.target.id);
        }
      },
      {
        threshold: [0.25, 0.4, 0.6],
        rootMargin: "-20% 0px -35% 0px"
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [sectionMessages]);

  if (!sectionMessages.length) {
    return null;
  }

  const active = resolveActiveSection(sectionMessages, visibleId);
  const href = buildWhatsAppUrl(number, active.message);

  return (
    <a className="smart-wa" href={href} target="_blank" rel="noreferrer" aria-label={active.label}>
      <span className="smart-wa__eyebrow">WhatsApp directo</span>
      <strong>{active.label}</strong>
      <small>{active.helper}</small>
    </a>
  );
}
