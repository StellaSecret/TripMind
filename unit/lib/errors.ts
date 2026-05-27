/**
 * errors.ts — Error classification logic extracted from app.js (classifyError)
 */

export type Lang = 'fr' | 'en';

export function classifyError(e: Error | null, context: string, lang: Lang = 'fr'): string {
  const msg = e?.message ?? '';
  const en = lang === 'en';

  if (msg.includes('introuvable') || msg.includes('not found')) {
    return en
      ? `🔍 City not found: "${context}". Try adding the country (e.g. "Paris, France").`
      : `🔍 Ville introuvable : "${context}". Essayez d'ajouter le pays (ex: "Paris, France").`;
  }
  if (/HTTP 5\d\d/.test(msg)) {
    return en
      ? '⚙️ A data service is temporarily unavailable. Please try again in a moment.'
      : '⚙️ Un service de données est temporairement indisponible. Réessayez dans un instant.';
  }
  if (/HTTP 4\d\d/.test(msg)) {
    const code = msg.match(/\d{3}/)?.[0] ?? '';
    return en
      ? `🔒 Access denied by a data service (HTTP ${code}).`
      : `🔒 Accès refusé par un service de données (HTTP ${code}).`;
  }
  if (msg.includes('timeout') || msg.includes('AbortError') || e?.name === 'AbortError') {
    return en
      ? '⏱ Request timed out. The service may be overloaded — try again.'
      : '⏱ La requête a expiré. Le service est peut-être surchargé — réessayez.';
  }
  if (msg.includes('NetworkError') || msg.includes('Failed to fetch') || msg.includes('fetch')) {
    return en
      ? '🌐 Network error. Check your connection or try disabling a VPN/proxy.'
      : '🌐 Erreur réseau. Vérifiez votre connexion ou désactivez un VPN/proxy.';
  }
  return msg.replace(/^Error:\s+/i, '') || (en ? 'Unexpected error.' : 'Erreur inattendue.');
}
