import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TallyCount } from './TallyCount.jsx';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js';

vi.mock('../hooks/usePrefersReducedMotion.js', () => ({
  usePrefersReducedMotion: vi.fn(),
}));

beforeEach(() => {
  usePrefersReducedMotion.mockReturnValue(false);
});

describe('TallyCount', () => {
  it('renders the numeral for the given count', () => {
    render(<TallyCount count={12} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders one stroke-group svg per full group of five plus one for the remainder', () => {
    const { container } = render(<TallyCount count={12} />);
    expect(container.querySelectorAll('svg')).toHaveLength(3);
  });

  it('renders no stroke groups for a zero count', () => {
    const { container } = render(<TallyCount count={0} />);
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });

  it('omits the draw-in animation class when the user prefers reduced motion', () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const { container } = render(<TallyCount count={5} />);
    expect(container.querySelector('svg')).not.toHaveClass('tally-draw');
  });
});
