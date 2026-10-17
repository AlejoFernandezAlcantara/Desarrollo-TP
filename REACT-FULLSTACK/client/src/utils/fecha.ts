// Todas las fechas que muestra la app se ven en hora de Argentina.
// El back guarda y devuelve UTC; el navegador del usuario puede estar en cualquier zona.
export const TZ_AR = 'America/Argentina/Buenos_Aires';

type Opts = Intl.DateTimeFormatOptions;

export const formatFecha = (iso: string | Date, opts: Opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('es-AR', { timeZone: TZ_AR, ...opts });

export const formatHora = (iso: string | Date, opts: Opts = { hour: '2-digit', minute: '2-digit' }) =>
  new Date(iso).toLocaleTimeString('es-AR', { timeZone: TZ_AR, hourCycle: 'h23', ...opts });
// Día calendario YYYY-MM-DD visto desde Argentina (para filtrar y comparar días)
export const diaAR = (iso: string | Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ_AR, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(iso));

// Hora HH:mm visto desde Argentina
export const horaAR = (iso: string | Date) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ_AR, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(iso));

export const hoyAR = () => diaAR(new Date());