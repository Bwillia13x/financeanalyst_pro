// @vitest-environment jsdom
import React, { useEffect } from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCommandRegistry } from '../useCommandRegistry.js';

// Test harness to expose hook API to tests via callback
function HookHarness({ context = {}, onAPI }) {
  const api = useCommandRegistry(context);
  useEffect(() => {
    if (onAPI) onAPI(api);
  }, [api, onAPI]);
  return null;
}

const nextTick = () => new Promise((r) => setTimeout(r, 0));

describe('useCommandRegistry', () => {
  beforeEach(() => {
    // Reset storages to ensure clean test runs
    localStorage.clear?.();
  });

  afterEach(() => {
    cleanup();
  });

  it('searchCommands returns relevant results for simple queries', async () => {
    let latestApi;
    render(<HookHarness onAPI={(api) => { latestApi = api; }} />);
    // Wait a tick to ensure first effect runs
    await nextTick();

    const results = latestApi.searchCommands('dcf');
    const ids = results.map(r => r.id);
    expect(ids).toContain('create-dcf');

    const results2 = latestApi.searchCommands('sensitivity');
    expect(results2.map(r => r.id)).toContain('sensitivity-analysis');
  });

  it('executeCommand runs command and increments usage', async () => {
    let latestApi;
    render(<HookHarness onAPI={(api) => { latestApi = api; }} />);
    await nextTick();

    const beforeUsage = latestApi.commandUsage['create-dcf'] || 0;

    const result = await latestApi.executeCommand('create-dcf', { company: 'TEST' });
    expect(result).toEqual({ action: 'create-model', type: 'dcf', company: 'TEST' });

    // Allow state update + effect to flush
    await nextTick();

    // After re-render, onAPI will provide updated api instance
    expect((latestApi.commandUsage['create-dcf'] || 0)).toBe(beforeUsage + 1);
  });

  it('getContextualCommands reflects activeTab context', async () => {
    let latestApi;
    render(<HookHarness context={{ activeTab: 'modeling' }} onAPI={(api) => { latestApi = api; }} />);
    await nextTick();

    const contextual = latestApi.getContextualCommands();
    const ids = contextual.map(c => c.id);
    expect(ids).toEqual(expect.arrayContaining(['create-dcf', 'sensitivity-analysis', 'go-to-analysis']));
  });
});
