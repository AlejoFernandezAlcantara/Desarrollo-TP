import React from 'react';
import { Detalle, Diente as DienteBD } from '../../types';

// Una selección: pieza FDI + nombre de la cara tal como está en la tabla `cara`.
// cara = null es la pieza entera (extracción, corona, conducto...)
export interface CaraSeleccionada {
  diente: number;
  cara: string | null;
}

interface OdontogramaProps {
  seleccionadas?: CaraSeleccionada[];
  onChange?: (next: CaraSeleccionada[]) => void;
  dientes: DienteBD[]; // piezas con sus caras, tal como las carga seed_dientes
  detalles: Detalle[];
  readOnly?: boolean; // consulta finalizada: se ve pero no se puede seleccionar
}

const LETRA: Record<string, string> = {
  Vestibular: 'V',
  Palatina: 'P',
  Mesial: 'M',
  Distal: 'D',
  Incisal: 'I',
  Oclusal: 'O',
  Cruzal: 'C',
  Lingual: 'L',
};

// Amarillo de las caras con práctica realizada; azul de lo seleccionado
const COLOR_PRACTICA = '#fde68a';
const BORDE_PRACTICA = '#d97706';
const COLOR_SELECCION = '#bfdbfe';
const BORDE_SELECCION = '#2563eb';
// Letras sobre caras pintadas (fondo claro en los dos temas)
const TEXTO_SOBRE_COLOR = '#1e293b';

const INTERNAS = ['Palatina', 'Lingual'];
const LATERALES = ['Vestibular', 'Mesial', 'Distal', ...INTERNAS];

// Ubica las caras que tiene la pieza en el dibujo: vestibular hacia afuera de la boca,
// palatina/lingual hacia adentro, mesial hacia la línea media. Lo que sobra va al centro.
const ubicarCaras = (numero: number, caras: string[]) => {
  const cuadrante = Math.floor(numero / 10);
  const superior = [1, 2, 5, 6].includes(cuadrante);
  // Cuadrantes que se dibujan a la izquierda de la línea media: mesial queda a la derecha
  const mesialDerecha = [1, 4, 5, 8].includes(cuadrante);
  const interna = caras.find((c) => INTERNAS.includes(c));
  const tiene = (c: string) => (caras.includes(c) ? c : undefined);

  return {
    arriba: superior ? tiene('Vestibular') : interna,
    derecha: tiene(mesialDerecha ? 'Mesial' : 'Distal'),
    abajo: superior ? interna : tiene('Vestibular'),
    izquierda: tiene(mesialDerecha ? 'Distal' : 'Mesial'),
    central: caras.find((c) => !LATERALES.includes(c)),
  };
};

// Punto en el círculo de 100x100 (0° = derecha, sentido horario en pantalla)
const polar = (r: number, grados: number): [number, number] => {
  const rad = (grados * Math.PI) / 180;
  return [50 + r * Math.cos(rad), 50 + r * Math.sin(rad)];
};

// Porción de anillo entre dos ángulos
const porcion = (a0: number, a1: number): string => {
  const [xo0, yo0] = polar(46, a0);
  const [xo1, yo1] = polar(46, a1);
  const [xi1, yi1] = polar(20, a1);
  const [xi0, yi0] = polar(20, a0);
  return `M ${xi0} ${yi0} L ${xo0} ${yo0} A 46 46 0 0 1 ${xo1} ${yo1} L ${xi1} ${yi1} A 20 20 0 0 0 ${xi0} ${yi0} Z`;
};

interface DienteProps {
  numero: number;
  carasDisponibles: string[];
  carasSeleccionadas: Set<string>;
  carasConPractica: Set<string>; // caras con alguna práctica registrada (se pintan de amarillo)
  piezaSeleccionada: boolean; // pieza entera seleccionada: anillo azul
  conPractica: boolean; // práctica sobre la pieza entera, sin cara: anillo amarillo
  readOnly: boolean;
  onToggle: (cara: string | null) => void;
}

const Diente: React.FC<DienteProps> = ({
  numero,
  carasDisponibles,
  carasSeleccionadas,
  carasConPractica,
  piezaSeleccionada,
  conPractica,
  readOnly,
  onToggle,
}) => {
  const pos = ubicarCaras(numero, carasDisponibles);

  const caras = [
    { pos: 'arriba', cara: pos.arriba, a0: -135, a1: -45 },
    { pos: 'derecha', cara: pos.derecha, a0: -45, a1: 45 },
    { pos: 'abajo', cara: pos.abajo, a0: 45, a1: 135 },
    { pos: 'izquierda', cara: pos.izquierda, a0: 135, a1: 225 },
  ];
  const central = pos.central;

  // Zona sin cara cargada para esta pieza: se dibuja gris y no se puede seleccionar
  const estiloVacio: React.CSSProperties = { fill: 'var(--bg-muted, #e2e8f0)', stroke: '#94a3b8', strokeWidth: 1.5 };

  // Prioridad: seleccionada (azul) > con práctica (amarillo) > libre (color de la tarjeta)
  const pintada = (cara: string) => carasSeleccionadas.has(cara) || carasConPractica.has(cara);
  const estilo = (cara: string): React.CSSProperties => {
    const seleccionada = carasSeleccionadas.has(cara);
    const tratada = carasConPractica.has(cara);
    return {
      fill: seleccionada ? COLOR_SELECCION : tratada ? COLOR_PRACTICA : 'var(--bg-card, #ffffff)',
      stroke: seleccionada ? BORDE_SELECCION : tratada ? BORDE_PRACTICA : '#94a3b8',
      strokeWidth: 1.5,
      cursor: readOnly ? 'default' : 'pointer',
    };
  };
  const colorLetra = (cara: string) => (pintada(cara) ? TEXTO_SOBRE_COLOR : 'var(--text-main, #1e293b)');
  const titulo = (cara: string) =>
    `Diente ${numero}: ${cara}${carasConPractica.has(cara) ? ' (práctica registrada)' : ''}`;
  const tituloPieza = `Diente ${numero}${conPractica ? ': práctica en la pieza entera' : ''}`;

  const manejarTecla = (cara: string | null) => (ev: React.KeyboardEvent) => {
    if (readOnly) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      onToggle(cara);
    }
  };

  // Anillo exterior: azul si la pieza entera está seleccionada, amarillo si tiene una práctica sin cara
  const anillo = piezaSeleccionada ? BORDE_SELECCION : conPractica ? BORDE_PRACTICA : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg viewBox="0 0 100 100" width={46} height={46} aria-label={`Pieza ${numero}`}>
        <title>{tituloPieza}</title>
        {caras.map(({ pos: p, cara, a0, a1 }) => {
          if (!cara) return <path key={p} d={porcion(a0, a1)} style={estiloVacio} />;
          const [tx, ty] = polar(33, (a0 + a1) / 2);
          return (
            <g
              key={cara}
              role="button"
              tabIndex={readOnly ? -1 : 0}
              aria-label={`Diente ${numero}, cara ${cara}`}
              aria-pressed={carasSeleccionadas.has(cara)}
              onClick={() => !readOnly && onToggle(cara)}
              onKeyDown={manejarTecla(cara)}
            >
              <title>{titulo(cara)}</title>
              <path d={porcion(a0, a1)} style={estilo(cara)} />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontWeight={700}
                fill={colorLetra(cara)}
                style={{ pointerEvents: 'none' }}
              >
                {LETRA[cara]}
              </text>
            </g>
          );
        })}

        {!central ? (
          <circle cx={50} cy={50} r={20} style={estiloVacio} />
        ) : (
          <g
            role="button"
            tabIndex={readOnly ? -1 : 0}
            aria-label={`Diente ${numero}, cara ${central}`}
            aria-pressed={carasSeleccionadas.has(central)}
            onClick={() => !readOnly && onToggle(central)}
            onKeyDown={manejarTecla(central)}
          >
            <title>{titulo(central)}</title>
            <circle cx={50} cy={50} r={20} style={estilo(central)} />
            <text
              x={50}
              y={50}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight={700}
              fill={colorLetra(central)}
              style={{ pointerEvents: 'none' }}
            >
              {LETRA[central]}
            </text>
          </g>
        )}

        {anillo && (
          <circle cx={50} cy={50} r={48} fill="none" stroke={anillo} strokeWidth={3} style={{ pointerEvents: 'none' }} />
        )}
      </svg>
      {/* El número selecciona la pieza entera */}
      <span
        role={readOnly ? undefined : 'button'}
        tabIndex={readOnly ? undefined : 0}
        aria-pressed={readOnly ? undefined : piezaSeleccionada}
        title={readOnly ? tituloPieza : `Seleccionar la pieza ${numero} entera`}
        onClick={() => !readOnly && onToggle(null)}
        onKeyDown={manejarTecla(null)}
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0 6px',
          borderRadius: 4,
          cursor: readOnly ? 'default' : 'pointer',
          color: piezaSeleccionada ? '#ffffff' : 'var(--text-main, #1e293b)',
          background: piezaSeleccionada ? BORDE_SELECCION : 'transparent',
        }}
      >
        {numero}
      </span>
    </div>
  );
};

// Filas del odontograma (FDI), de izquierda a derecha en pantalla
const FILAS: [number[], number[]][] = [
  [[18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28]],
  [[55, 54, 53, 52, 51], [61, 62, 63, 64, 65]],
  [[85, 84, 83, 82, 81], [71, 72, 73, 74, 75]],
  [[48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38]],
];

const Muestra: React.FC<{ fondo: string; borde: string; redonda?: boolean; texto: string }> = ({ fondo, borde, redonda, texto }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span
      style={{
        width: 12,
        height: 12,
        background: fondo,
        border: `${redonda ? 2 : 1}px solid ${borde}`,
        borderRadius: redonda ? '50%' : 2,
      }}
    />
    {texto}
  </span>
);

export const Odontograma: React.FC<OdontogramaProps> = ({
  seleccionadas = [],
  onChange = () => {},
  dientes,
  detalles,
  readOnly = false,
}) => {
  const carasDe = (numero: number) =>
    new Set(seleccionadas.filter((s) => s.diente === numero && s.cara !== null).map((s) => s.cara!));
  const piezaEntera = (numero: number) => seleccionadas.some((s) => s.diente === numero && s.cara === null);

  // La pieza entera y sus caras se excluyen: elegir una quita la otra
  const toggle = (numero: number, cara: string | null) => {
    const existe = seleccionadas.some((s) => s.diente === numero && s.cara === cara);
    if (existe) {
      onChange(seleccionadas.filter((s) => !(s.diente === numero && s.cara === cara)));
      return;
    }
    const resto = seleccionadas.filter(
      (s) => s.diente !== numero || (cara === null ? false : s.cara !== null)
    );
    onChange([...resto, { diente: numero, cara }]);
  };

  // Prácticas sin cara (pieza entera) y caras con práctica, por número de pieza
  const conPractica = (numero: number) => detalles.some((d) => d.diente?.numero === numero && !d.cara);
  const carasConPractica = (numero: number) =>
    new Set(detalles.filter((d) => d.diente?.numero === numero && d.cara).map((d) => d.cara!.nombre));

  // Caras de cada pieza según diente_cara
  const carasPorNumero = new Map(dientes.map((d) => [d.numero, (d.caras ?? []).map((c) => c.cara.nombre)]));

  const renderFila = (numeros: number[]) =>
    numeros.filter((n) => carasPorNumero.has(n)).map((n) => (
      <Diente
        key={n}
        numero={n}
        carasDisponibles={carasPorNumero.get(n)!}
        carasSeleccionadas={carasDe(n)}
        carasConPractica={carasConPractica(n)}
        piezaSeleccionada={piezaEntera(n)}
        conPractica={conPractica(n)}
        readOnly={readOnly}
        onToggle={(cara) => toggle(n, cara)}
      />
    ));

  if (dientes.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay piezas dentales cargadas.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      {FILAS.map(([izquierda, derecha]) => (
        <div key={izquierda[0]} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 6 }}>{renderFila(izquierda)}</div>
          <div style={{ display: 'flex', gap: 6 }}>{renderFila(derecha)}</div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <Muestra fondo={COLOR_PRACTICA} borde={BORDE_PRACTICA} texto="Práctica en la cara" />
        <Muestra fondo="transparent" borde={BORDE_PRACTICA} redonda texto="Práctica en la pieza entera" />
        {!readOnly && <Muestra fondo={COLOR_SELECCION} borde={BORDE_SELECCION} texto="Cara seleccionada" />}
        {!readOnly && <Muestra fondo="transparent" borde={BORDE_SELECCION} redonda texto="Pieza entera seleccionada (clic en el número)" />}
      </div>
    </div>
  );
};
