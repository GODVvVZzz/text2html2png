import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrial, summarizeTrial } from '../scripts/evaluate.mjs';
const dataset = { dataset_version: 'test', evals: [{ id: 1, prompt: 'test', assertions: ['All facts preserved'] }] };
test('unrun trials never become a fabricated success rate', () => {
  const trial = createTrial(dataset, 'manual test system');
  assert.equal(summarizeTrial(dataset, trial).firstAttemptPassRate, null);
  assert.equal(summarizeTrial(dataset, trial).notRun, 1);
  trial.records[0].checks[0].result = 'passed';
  assert.throws(() => summarizeTrial(dataset, trial), /Unrun/);
});
test('reviews, retries, and failures affect the reported rate', () => {
  const trial = createTrial(dataset, 'manual test system');
  const record = trial.records[0];
  Object.assign(record, { status: 'completed', durationSeconds: 60, attempts: 1, authorHelp: false, artifacts: ['output.html'] });
  assert.equal(summarizeTrial(dataset, trial).firstAttemptPassRate, null);
  record.checks[0].result = 'passed';
  assert.equal(summarizeTrial(dataset, trial).firstAttemptPassRate, 1);
  record.attempts = 2;
  assert.equal(summarizeTrial(dataset, trial).firstAttemptPassRate, 0);
  record.status = 'failed'; record.failureReason = 'render failed';
  assert.equal(summarizeTrial(dataset, trial).failed, 1);
  record.promptSha256 = 'changed';
  assert.throws(() => summarizeTrial(dataset, trial), /Prompt changed/);
});
