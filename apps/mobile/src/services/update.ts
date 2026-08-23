import { APP } from '@/config/app';
import { getLastUpdateCheck, setLastUpdateCheck } from '@/storage/localStore';

function parts(v: string) { return v.replace(/^v/, '').split('.').map(x => Number(x) || 0); }
export function isNewer(remote: string, local: string) {
  const a = parts(remote), b = parts(local);
  for (let i=0;i<Math.max(a.length,b.length);i++) {
    if ((a[i]||0) > (b[i]||0)) return true;
    if ((a[i]||0) < (b[i]||0)) return false;
  }
  return false;
}

export async function checkGitHubRelease(force = false) {
  if (!force) {
    const last = await getLastUpdateCheck();
    if (Date.now() - last < 24 * 60 * 60 * 1000) return null;
  }
  const res = await fetch(`https://api.github.com/repos/${APP.githubRepo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' }
  });
  if (res.status === 404) { await setLastUpdateCheck(Date.now()); return null; }
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  await setLastUpdateCheck(Date.now());
  const apk = (data.assets || []).find((a: any) => String(a.name).toLowerCase().endsWith('.apk'));
  return {
    tag: data.tag_name as string,
    name: data.name as string,
    url: (apk?.browser_download_url || data.html_url) as string,
    notes: data.body as string,
    newer: isNewer(data.tag_name, APP.version)
  };
}
