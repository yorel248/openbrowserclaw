// ---------------------------------------------------------------------------
// Retirement Planner — OPFS persistence
// ---------------------------------------------------------------------------

import type { RetirementPlan } from './types.js';
import { createDefaultPlan } from './types.js';

const PLANS_DIR = 'retirement/plans';
const ACTIVE_KEY = 'retirement/active-plan-id';

async function getRoot(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory();
}

async function getPlansDir(): Promise<FileSystemDirectoryHandle> {
  const root = await getRoot();
  const parts = PLANS_DIR.split('/');
  let dir = root;
  for (const p of parts) {
    dir = await dir.getDirectoryHandle(p, { create: true });
  }
  return dir;
}

async function writeJSON(dir: FileSystemDirectoryHandle, name: string, data: unknown): Promise<void> {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(JSON.stringify(data, null, 2));
  await w.close();
}

async function readJSON<T>(dir: FileSystemDirectoryHandle, name: string): Promise<T | null> {
  try {
    const fh = await dir.getFileHandle(name);
    const file = await fh.getFile();
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function loadActivePlan(): Promise<RetirementPlan> {
  const root = await getRoot();
  const metaDir = await root.getDirectoryHandle('retirement', { create: true });
  const activeId = await readJSON<string>(metaDir, 'active-plan-id.json');

  if (activeId) {
    const plansDir = await getPlansDir();
    const plan = await readJSON<RetirementPlan>(plansDir, `${activeId}.json`);
    if (plan) return plan;
  }

  // No plan yet — create default
  const plan = createDefaultPlan();
  await savePlan(plan);
  await setActivePlan(plan.id);
  return plan;
}

export async function savePlan(plan: RetirementPlan): Promise<void> {
  plan.updatedAt = Date.now();
  const plansDir = await getPlansDir();
  await writeJSON(plansDir, `${plan.id}.json`, plan);
}

export async function setActivePlan(planId: string): Promise<void> {
  const root = await getRoot();
  const metaDir = await root.getDirectoryHandle('retirement', { create: true });
  await writeJSON(metaDir, 'active-plan-id.json', planId);
}

export async function listPlans(): Promise<{ id: string; name: string; updatedAt: number }[]> {
  const plansDir = await getPlansDir();
  const results: { id: string; name: string; updatedAt: number }[] = [];
  for await (const [name, handle] of plansDir.entries()) {
    if (handle.kind === 'file' && name.endsWith('.json')) {
      const plan = await readJSON<RetirementPlan>(plansDir, name);
      if (plan) {
        results.push({ id: plan.id, name: plan.name, updatedAt: plan.updatedAt });
      }
    }
  }
  return results.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function exportPlanJSON(plan: RetirementPlan): Promise<string> {
  return JSON.stringify(plan, null, 2);
}
