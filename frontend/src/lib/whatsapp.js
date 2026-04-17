export function buildWhatsAppUrl(number, message) {
  const cleanNumber = `${number || ""}`.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message || "");
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}
