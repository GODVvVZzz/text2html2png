#!/usr/bin/env node
// Tracks real agent trials; never calls a model or fabricates missing results.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = text => createHash('sha256').update(text).digest('hex');
export function createTrial(dataset, system) {
  if (!system?.trim()) throw Error('Provide the agent, model, version, and setup in --system.');
  return { schemaVersion: 1, datasetVersion: dataset.dataset_version, system,
    records: dataset.evals.map(task => ({ id: task.id, promptSha256: digest(task.prompt), status: 'not_run',
      durationSeconds: null, attempts: null, authorHelp: null, artifacts: [], failureReason: '',
      checks: task.assertions.map(text => ({ text, result: 'not_reviewed' })) })) };
}
export function summarizeTrial(dataset, trial) {
  if (trial.schemaVersion !== 1 || trial.datasetVersion !== dataset.dataset_version || !trial.system?.trim()) throw Error('Trial version or system metadata does not match the dataset.');
  if (!Array.isArray(trial.records) || trial.records.length !== dataset.evals.length) throw Error('Keep one record for every task, including tasks not run.');
  const tasks = new Map(dataset.evals.map(task => [task.id, task]));
  const seen = new Set();
  const summary = { total: tasks.size, notRun: 0, failed: 0, pendingReview: 0, reviewedPass: 0, reviewedFail: 0, firstAttemptWithoutHelp: 0 };
  const durations = [];
  for (const record of trial.records) {
    const task = tasks.get(record.id);
    if (!task || seen.has(record.id)) throw Error('Unknown or duplicate task id: ' + record.id);
    seen.add(record.id);
    if (record.promptSha256 !== digest(task.prompt)) throw Error('Prompt changed for task ' + record.id);
    if (!['not_run', 'completed', 'failed'].includes(record.status)) throw Error('Invalid task status: ' + record.id);
    if (!Array.isArray(record.checks) || record.checks.length !== task.assertions.length || record.checks.some((check, i) => check.text !== task.assertions[i] || !['not_reviewed', 'passed', 'failed'].includes(check.result))) throw Error('Review criteria changed for task ' + record.id);
    if (!Array.isArray(record.artifacts) || record.artifacts.some(a => typeof a !== 'string' || !a.trim())) throw Error('Artifacts must be file paths or URLs.');
    if (record.status === 'not_run') {
      if (record.durationSeconds !== null || record.attempts !== null || record.authorHelp !== null || record.artifacts.length || record.checks.some(c => c.result !== 'not_reviewed')) throw Error('Unrun task has result data: ' + record.id);
      summary.notRun++; continue;
    }
    if (!Number.isFinite(record.durationSeconds) || record.durationSeconds < 0 || !Number.isInteger(record.attempts) || record.attempts < 1 || typeof record.authorHelp !== 'boolean') throw Error('Record measured duration, attempts, and author help for task ' + record.id);
    durations.push(record.durationSeconds);
    if (record.status === 'failed') {
      if (!record.failureReason?.trim()) throw Error('Failed task needs a reason: ' + record.id);
      summary.failed++; continue;
    }
    if (!record.artifacts.length) throw Error('Completed task needs an artifact or transcript: ' + record.id);
    if (record.checks.some(c => c.result === 'not_reviewed')) { summary.pendingReview++; continue; }
    if (record.checks.some(c => c.result === 'failed')) { summary.reviewedFail++; continue; }
    summary.reviewedPass++;
    if (record.attempts === 1 && !record.authorHelp) summary.firstAttemptWithoutHelp++;
  }
  const attempted = summary.total - summary.notRun;
  durations.sort((a, b) => a - b);
  return { ...summary, attempted,
    firstAttemptPassRate: attempted && !summary.pendingReview ? summary.firstAttemptWithoutHelp / attempted : null,
    medianDurationSeconds: durations.length ? (durations[Math.floor((durations.length - 1) / 2)] + durations[Math.floor(durations.length / 2)]) / 2 : null,
    note: 'Rates cover attempted tasks only. Unrun and unreviewed tasks remain visible; this is not proof of market adoption.' };
}
async function main() {
  const argv = process.argv.slice(2), option = flag => argv[argv.indexOf(flag) + 1];
  if (argv.includes('--help') || !argv.length) {
    console.log('Create: node scripts/evaluate.mjs --init output/trial.json --system "agent / model / version / setup"\nReport: node scripts/evaluate.mjs --results output/trial.json\nRun the 24 prompts with the named system, then fill in the measured results and reviews. No model is called by this script.'); return;
  }
  const dataset = JSON.parse(await readFile(path.join(root, 'evals/evals.json'), 'utf8'));
  if (argv.includes('--init')) {
    if (!argv.includes('--system')) throw Error('--system is required.');
    const trial = createTrial(dataset, option('--system'));
    const file = path.resolve(option('--init'));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(trial, null, 2) + '\n', { flag: 'wx' });
    console.log(file);
  } else if (argv.includes('--results')) {
    const trial = JSON.parse(await readFile(path.resolve(option('--results')), 'utf8'));
    console.log(JSON.stringify({ system: trial.system, ...summarizeTrial(dataset, trial) }, null, 2));
  } else throw Error('Use --init or --results.');
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
