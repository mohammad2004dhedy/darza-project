/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const rawCss = readFileSync(new URL('./index.css', import.meta.url), 'utf8')
const css = rawCss.replaceAll(String.fromCharCode(39), String.fromCharCode(34))

it('sets pointer cursors for desktop clickable controls in the base layer', () => {
  const rule = css.match(/@layer base\s*{\s*@media \(hover: hover\)\s*{([^}]+)}/)?.[1]
  for (const selector of [
    'button:not(:disabled)',
    '[role="button"]:not([aria-disabled="true"])',
    'a[href]',
    'summary',
    'select',
    'label[for]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    'input[type="file"]',
  ]) {
    expect(rule).toContain(selector)
  }
  expect(rule).toContain('cursor: pointer;')
})

it('keeps the disabled cursor outside the hover-only rule', () => {
  expect(css).toMatch(
    /}\s*}\s*button:disabled,\s*\[aria-disabled="true"\]\s*{\s*cursor: not-allowed;/,
  )
})
