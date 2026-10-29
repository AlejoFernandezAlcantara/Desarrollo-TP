import React from 'react';
import { Detalle, Diente as DienteBD } from '../../types';

// Una cara seleccionada: pieza FDI + nombre de la cara tal como está en la tabla `cara`
export interface CaraSeleccionada {
  diente: number;
  cara: string;
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

// Amarillo de las caras con práctica realizada
const COLOR_PRACTICA = '#fde68a';
const BORDE_PRACTICA = '#d97706';

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
  conPractica: boolean; // práctica sobre la pieza entera, sin cara: se marca con un anillo
  readOnly: boolean;
  onToggle: (cara: string) => void;
}

const Diente: React.FC<DienteProps> = ({ numero, carasDisponibles, carasSeleccionadas, carasConPractica, conPractica, readOnly, onToggle }) => {
  const pos = ubicarCaras(numero, carasDisponibles);

  const caras = [
    { pos: 'arriba', cara: pos.arriba, a0: -135, a1: -45 },
    { pos: 'derecha', cara: pos.derecha, a0: -45, a1: 45 },
    { pos: 'abajo', cara: pos.abajo, a0: 45, a1: 135 },
    { pos: 'izquierda', cara: pos.izquierda, a0: 135, a1: 225 },
  ];
  const central = pos.central;

  // Zona sin cara cargada para esta pieza: se dibuja gris y no se puede seleccionar
  const estiloVacio: React.CSSProperties = { fill: 'var(--bg-muted, #e2e8f0)', stroke: '#cbd5e1', strokeWidth: 1.5 };

  // Prioridad: seleccionada (azul) > con práctica (amarillo) > libre (blanco)
  const estilo = (cara: string): React.CSSProperties => {
    const seleccionada = carasSeleccionadas.has(cara);
    const tratada = carasConPractica.has(cara);
    return {
      fill: seleccionada ? 'var(--primary-light, #bfdbfe)' : tratada ? COLOR_PRACTICA : 'var(--bg-card, #ffffff)',
      stroke: seleccionada ? 'var(--primary, #2563eb)' : tratada ? BORDE_PRACTICA : '#94a3b8',
      strokeWidth: 1.5,
      cursor: readOnly ? 'default' : 'pointer',
    };
  };
  const titulo = (cara: string) =>
    `Diente ${numero}: ${cara}${carasConPractica.has(cara) ? ' (práctica registrada)' : ''}`;

  const manejarTecla = (cara: string) => (ev: React.KeyboardEvent) => {
    if (readOnly) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      onToggle(cara);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg viewBox="0 0 100 100" width={46} height={46} aria-label={`Pieza ${numero}`}>
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
                fill="#334155"
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
            fill="#334155"
            style={{ pointerEvents: 'none' }}
          >
            {LETRA[central]}
          </text>
        </g>
        )}

        {conPractica && (
          <circle cx={50} cy={50} r={48} fill="none" stroke="#d97706" strokeWidth={2} style={{ pointerEvents: 'none' }} />
        )}
      </svg>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>{numero}</span>
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

export const Odontograma: React.FC<OdontogramaProps> = ({
  seleccionadas = [],
  onChange = () => {},
  dientes,
  detalles,
  readOnly = false,
}) => {
  const carasDe = (numero: number) =>
    new Set(seleccionadas.filter((s) => s.diente === numero).map((s) => s.cara));

  const toggle = (numero: number, cara: string) => {
    const existe = seleccionadas.some((s) => s.diente === numero && s.cara === cara);
    onChange(
      existe
        ? seleccionadas.filter((s) => !(s.diente === numero && s.cara === cara))
        : [...seleccionadas, { diente: numero, cara }]
    );
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
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: COLOR_PRACTICA, border: `1px solid ${BORDE_PRACTICA}`, borderRadius: 2 }} />
          Práctica realizada
        </span>
        {!readOnly && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: 'var(--primary-light, #bfdbfe)', border: '1px solid var(--primary, #2563eb)', borderRadius: 2 }} />
            Seleccionada
          </span>
        )}
      </div>
    </div>
  );
};
