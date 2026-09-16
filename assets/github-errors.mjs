export async function githubError(response) {
 const body = await response.json().catch(() => ({}));
 const detail = typeof body.message === 'string' ? body.message : response.statusText || 'Request rejected';
 const prefix = `GitHub ${response.status}: ${detail}`;
 if (response.status === 409) return `${prefix}\nThe site changed since you connected. Export your draft, reconnect, and apply your changes to the latest version.`;
 if (response.status === 401) return `${prefix}\nYour token is invalid, expired, or revoked. Save your draft, enter a new token, and reconnect.`;
 if (response.status === 429 || (response.status === 403 && (response.headers.get('x-ratelimit-remaining') === '0' || /rate limit|abuse detection/i.test(detail)))) {
  const retry = response.headers.get('retry-after');
  const reset = Number(response.headers.get('x-ratelimit-reset'));
  return `${prefix}\n${retry ? `Wait ${retry} seconds before retrying.` : reset ? `Retry after ${new Date(reset * 1000).toLocaleString()}.` : 'Wait at least one minute before retrying.'} Your edits are still in the editor; save a draft before leaving.`;
 }
 if (response.status === 403 || response.status === 404) {
  return `${prefix}\nCheck your token settings: Resource owner = RohamIzadidoost; Repository access = Only select repositories → AD4051; Repository permissions → Contents = Read and write. The token owner must also have write access to AD4051. Public read access alone does not allow publishing.\nIf these are already correct, check GitHub’s message above for account restrictions or branch protection. Save your draft before reconnecting, then restore it after connecting.`;
 }
 return `${prefix}\nYour edits remain in the editor. Save or export a draft before leaving.`;
}
