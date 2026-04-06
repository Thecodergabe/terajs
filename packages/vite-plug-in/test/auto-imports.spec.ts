// Test utility for Nebula auto-imports
// Run with: npx vitest run
import { describe, it, expect } from 'vitest';
import nebulaPlugin from '../src/index';
import fs from 'node:fs';
import path from 'node:path';

describe('nebulaPlugin auto-imports', () => {
  it('generates virtual module with all .nbl components', () => {
    const plugin = nebulaPlugin();
    const resolved = plugin.resolveId('virtual:nebula-auto-imports');
    expect(resolved).toBe('\0virtual:nebula-auto-imports');
    const code = plugin.load('\0virtual:nebula-auto-imports');
    expect(typeof code).toBe('string');
    // Should export all .nbl files in components dir
    const componentsDir = path.resolve(process.cwd(), 'packages/devtools/src/components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.nbl'));
    for (const f of files) {
      const name = f.replace(/\.nbl$/, '');
      expect(code).toContain(name);
    }
  });
});
