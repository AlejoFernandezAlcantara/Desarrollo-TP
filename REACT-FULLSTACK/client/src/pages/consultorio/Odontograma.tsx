import React from 'react';
import { Detalle } from '../../types';

// Una cara seleccionada: pieza FDI + nombre de la cara tal como está en la tabla `cara`
export interface CaraSeleccionada {
  diente: number;
  cara: string;
}

interface OdontogramaProps {
  seleccionadas: CaraSeleccionada[];
  onChange: (next: CaraSeleccionada[]) => void;
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

// Pieza de leche 5X equivale a la permanente 1X (51 = 11, 61 = 21, etc.)
const equivalente = (n: number) => (n >= 50 ? n - 40 : n);

// Cara del centro del círculo, según la pieza
const caraCentral = (e: number): string => {
  if ((e >= 11 && e <= 13) || (e >= 21 && e <= 23)) return 'Incisal';
  if (e >= 14 && e <= 18) return 'Oclusal';
  return 'Cruzal'; // 24 a 28
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
  carasSeleccionadas: Set<string>;
  conPractica: boolean;
  readOnly: boolean;
  onToggle: (cara: string) => void;
}

const Diente: React.FC<DienteProps> = ({ numero, carasSeleccionadas, conPractica, readOnly, onToggle }) => {
  const e = equivalente(numero);
  // Cuadrante superior derecho del paciente (dientes 11 a 18): mesial queda hacia la derecha del dibujo
  const superiorDerecho = e >= 11 && e <= 18;

  const caras = [
    { cara: 'Vestibular', a0: -135, a1: -45 },
    { cara: superiorDerecho ? 'Mesial' : 'Distal', a0: -45, a1: 45 },
    { cara: 'Palatina', a0: 45, a1: 135 },
    { cara: superiorDerecho ? 'Distal' : 'Mesial', a0: 135, a1: 225 },
  ];
  const central = caraCentral(e);

  const estilo = (cara: string): React.CSSProperties => ({
    fill: carasSeleccionadas.has(cara) ? 'var(--primary-light, #bfdbfe)' : 'var(--bg-card, #ffffff)',
    stroke: carasSeleccionadas.has(cara) ? 'var(--primary, #2563eb)' : '#94a3b8',
    strokeWidth: 1.5,
    cursor: readOnly ? 'default' : 'pointer',
  });

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
        {caras.map(({ cara, a0, a1 }) => {
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
              <title>{`Diente ${numero}: ${cara}`}</title>
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

        <g
          role="button"
          tabIndex={readOnly ? -1 : 0}
          aria-label={`Diente ${numero}, cara ${central}`}
          aria-pressed={carasSeleccionadas.has(central)}
          onClick={() => !readOnly && onToggle(central)}
          onKeyDown={manejarTecla(central)}
        >
          <title>{`Diente ${numero}: ${central}`}</title>
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

        {conPractica && (
          <circle cx={50} cy={50} r={48} fill="none" stroke="#d97706" strokeWidth={2} style={{ pointerEvents: 'none' }} />
        )}
      </svg>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>{numero}</span>
    </div>
  );
};

export const Odontograma: React.FC<OdontogramaProps> = ({
  seleccionadas,
  onChange,
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

  const conPractica = (numero: number) => detalles.some((d) => d.diente?.numero === numero);

  const renderFila = (numeros: number[]) =>
    numeros.map((n) => (
      <Diente
        key={n}
        numero={n}
        carasSeleccionadas={carasDe(n)}
        conPractica={conPractica(n)}
        readOnly={readOnly}
        onToggle={(cara) => toggle(n, cara)}
      />
    ));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 6 }}>{renderFila([18, 17, 16, 15, 14, 13, 12, 11])}</div>
        <div style={{ display: 'flex', gap: 6 }}>{renderFila([21, 22, 23, 24, 25, 26, 27, 28])}</div>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 6 }}>{renderFila([55, 54, 53, 52, 51])}</div>
        <div style={{ display: 'flex', gap: 6 }}>{renderFila([61, 62, 63, 64, 65])}</div>
      </div>
    </div>
  );
};
