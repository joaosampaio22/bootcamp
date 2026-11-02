export function ArrowIcon({ down = false }: { down?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d={down ? 'M10 3v14m-5-5 5 5 5-5' : 'M4 16 16 4M5 4h11v11'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
