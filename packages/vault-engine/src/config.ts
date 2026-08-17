import path from 'node:path';
import fs from 'node:fs';

/**
 * Resolves the primary Obsidian Vault location (Single Source of Truth)
 * Prioritizes the active Obsidian Desktop directory '/Users/jlorenzor/Documents/Obsidian Vault'
 */
export function resolveVaultRoot(customPath?: string): string {
  if (customPath && fs.existsSync(customPath)) {
    return path.resolve(customPath);
  }

  const userObsidianAppVault = '/Users/jlorenzor/Documents/Obsidian Vault';
  if (fs.existsSync(userObsidianAppVault)) {
    return userObsidianAppVault;
  }

  const repoVault = path.resolve(process.cwd(), 'vault');
  if (fs.existsSync(repoVault)) {
    return repoVault;
  }

  return path.resolve(process.cwd());
}
