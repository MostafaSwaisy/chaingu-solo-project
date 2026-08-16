import { groupIntoFives } from '../utils/groupIntoFives.js';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js';
import './TallyCount.css';

function TallyGroup({ strokes, animate }) {
  const verticalCount = Math.min(strokes, 4);
  const verticals = Array.from({ length: verticalCount }, (_, i) => i);
  const hasSlash = strokes === 5;

  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      className={animate ? 'tally-draw' : ''}
      aria-hidden="true"
    >
      {verticals.map((i) => (
        <line key={i} x1={4 + i * 5} y1="2" x2={4 + i * 5} y2="22" />
      ))}
      {hasSlash && <line x1="2" y1="22" x2="22" y2="2" />}
    </svg>
  );
}

export function TallyCount({ count }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { fullGroups, remainder } = groupIntoFives(count);
  const groups = [
    ...Array.from({ length: fullGroups }, () => 5),
    ...(remainder > 0 ? [remainder] : []),
  ];

  return (
    <span className="tally-count">
      <span className="tally-strokes">
        {groups.map((strokes, i) => (
          <TallyGroup key={i} strokes={strokes} animate={!prefersReducedMotion} />
        ))}
      </span>
      <span className="tally-number">{count}</span>
    </span>
  );
}
