// Tarpec AI — Data Engine: currency tag reader
// Reads a currency tag from a column name, for example
// "Total Sales Value (NGN)", "cost_usd" or "Revenue NGN".
// Tarpec stores NO currency list of its own: a tag only counts if the
// system's own ISO currency standard confirms it is a currency.
//
// To avoid false matches (Top, Pen, Cup, Try, All are real currency codes),
// a tag counts only when it is:
//   - inside brackets, e.g. "(NGN)" or "[usd]", or
//   - the last word after an underscore or hyphen, e.g. "cost_usd", or
//   - the last word written in capitals, e.g. "Revenue NGN".

let systemCurrencies: Set<string> | null = null;

function isCurrencyCode(code: string): boolean {
  if (!systemCurrencies) {
    try {
      const supported = (
        Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
      ).supportedValuesOf;
      systemCurrencies = new Set(supported ? supported("currency") : []);
    } catch {
      systemCurrencies = new Set();
    }
  }
  return systemCurrencies.has(code.toUpperCase());
}

export function currencyTagInName(name: string): string | undefined {
  // 1) Inside brackets: (NGN) or [usd]
  for (const m of name.matchAll(/[(\[]\s*([A-Za-z]{3})\s*[)\]]/g)) {
    if (isCurrencyCode(m[1])) return m[1].toUpperCase();
  }

  // 2) Last word, after _ or - or in capitals
  const last = name.trim().match(/(^|[_\-\s])([A-Za-z]{3})$/);
  if (last) {
    const separator = last[1];
    const code = last[2];
    const allowed =
      separator === "_" || separator === "-" || code === code.toUpperCase();
    if (allowed && isCurrencyCode(code)) return code.toUpperCase();
  }

  return undefined;
}
