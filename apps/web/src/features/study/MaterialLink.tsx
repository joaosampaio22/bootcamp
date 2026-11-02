import { ArrowIcon } from '../../components/ArrowIcon';
export function MaterialLink({ url }: { url: string | null | undefined }) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) return null;
  } catch { return null; }
  return <a className="text-button material-link" href={url} target="_blank" rel="noopener noreferrer">Abrir material <ArrowIcon /></a>;
}
