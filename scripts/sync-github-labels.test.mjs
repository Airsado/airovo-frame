import { test } from 'node:test'
import assert from 'node:assert/strict'
import { planLabelChanges, syncLabels, validateCatalog } from './sync-github-labels.mjs'

const label = (name, description = 'test') => ({ name, color: '006b75', description })

test('rejects duplicate names case-insensitively and malformed metadata', () => {
  assert.throws(() => validateCatalog([label('bug'), label('BUG')]), /Duplicate/)
  assert.throws(() => validateCatalog([{ ...label('bug'), color: '#ff0000' }]), /color/)
  assert.throws(() => validateCatalog([label('bug', 'x'.repeat(101))]), /description/)
})

test('plans only missing/changed catalog labels and preserves unrelated labels', () => {
  const catalog = [label('bug'), label('area:forms')]
  assert.deepEqual(planLabelChanges(catalog, [label('bug'), label('custom-user-label')]), [
    { action: 'create', label: catalog[1] },
  ])
  assert.deepEqual(planLabelChanges(catalog, [...catalog, label('custom-user-label')]), [])
})

test('recognizes existing names case-insensitively without duplicate creation', () => {
  const desired = label('area:forms')
  assert.deepEqual(planLabelChanges([desired], [label('AREA:FORMS')]), [
    { action: 'update', previousName: 'AREA:FORMS', label: desired },
  ])
})

test('check mode does not perform writes, even when catalog differs', async () => {
  const calls = []
  const changes = await syncLabels([label('bug')], async (...args) => { calls.push(args); return [] })
  assert.equal(changes.length, 1)
  assert.deepEqual(calls, [['labels?per_page=100&page=1']])
})

test('apply mode paginates and performs only targeted POST/PATCH operations', async () => {
  const calls = []
  const pages = [Array.from({ length: 100 }, (_, i) => label(`unmanaged-${i}`)), [label('area:forms', 'old')]]
  const catalog = [label('bug'), label('area:forms')]
  await syncLabels(catalog, async (...args) => {
    calls.push(args)
    return args[0].startsWith('labels?') ? pages.shift() : {}
  }, true)
  assert.deepEqual(calls, [
    ['labels?per_page=100&page=1'], ['labels?per_page=100&page=2'],
    ['labels', 'POST', catalog[0]],
    ['labels/area%3Aforms', 'PATCH', { new_name: 'area:forms', color: '006b75', description: 'test' }],
  ])
})

test('a fully synced catalog produces no writes on repeat application', async () => {
  const calls = []
  const catalog = [label('bug')]
  const changes = await syncLabels(catalog, async (...args) => { calls.push(args); return [...catalog, label('custom')] }, true)
  assert.deepEqual(changes, [])
  assert.equal(calls.length, 1)
})
