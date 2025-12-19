// ~/utils/countries.ts
import { getCountries, getCountryCallingCode } from 'libphonenumber-js'
import isoCountries from 'i18n-iso-countries'

// Importación ESTÁTICA (Vite/Rollup lo soporta bien)
import en from 'i18n-iso-countries/langs/en.json'
import es from 'i18n-iso-countries/langs/es.json'

export type SupportedLocale = 'es' | 'en'

export type CountryOption = {
  code: string        // "CO"
  name: string        // "Colombia"
  dialCode: string    // "+57"
  flag: string        // URL bandera
  label: string       // Texto para el select
  dialDigits?: string // "57"
}

/**
 * Registra locales SOLO una vez (y de forma idempotente)
 * para que no reviente en SSR/HMR.
 */
function ensureLocalesRegistered() {
  // i18n-iso-countries expone isRegistered(lang)
  if (!isoCountries.isRegistered('en')) isoCountries.registerLocale(en as any)
  if (!isoCountries.isRegistered('es')) isoCountries.registerLocale(es as any)
}

/**
 * Normaliza cualquier locale raro a 'es' o 'en'
 * Ej: "es-CO" -> "es", "en-US" -> "en", "pt-BR" -> "es"
 */
export function normalizeLocale(input?: string): SupportedLocale {
  const raw = (input || '').toLowerCase().trim()
  if (raw.startsWith('en')) return 'en'
  return 'es'
}

// Cache para no recalcular la lista en cada render
const cache: Record<SupportedLocale, CountryOption[] | null> = {
  es: null,
  en: null,
}

export function buildCountryOptions(localeLike: string = 'es'): CountryOption[] {
  ensureLocalesRegistered()

  const locale = normalizeLocale(localeLike)

  const cached = cache[locale]
  if (cached) return cached

  const codes = getCountries()

  const collator = new Intl.Collator(locale, { sensitivity: 'base' })

  const opts: CountryOption[] = codes.map((code) => {
    const name = isoCountries.getName(code, locale) || code

    let dial = ''
    try {
      dial = '+' + getCountryCallingCode(code as any)
    } catch {
      // si algo raro pasa, no tumbes el render
      dial = ''
    }

    const flag = `https://flagcdn.com/w20/${code.toLowerCase()}.png`

    return {
      code,
      name,
      dialCode: dial,
      flag,
      label: dial ? `${dial}  ${name}` : `${name}`,
      dialDigits: dial ? dial.replace(/\D+/g, '') : '',
    }
  })

  opts.sort((a, b) => collator.compare(a.name, b.name))

  cache[locale] = opts
  return opts
}
