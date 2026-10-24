const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

export const PREVIEW_CSP =
  "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'"

const blockedElements = new Set([
  'script',
  'meta',
  'base',
  'form',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'link',
  'portal',
  'fencedframe',
  'foreignobject',
  'template',
  'noscript',
  'audio',
  'video',
  'source',
  'input',
  'textarea',
  'select',
  'button',
  'applet',
])
const urlAttributes = new Set([
  'href',
  'xlink:href',
  'src',
  'srcset',
  'action',
  'formaction',
  'data',
  'poster',
  'background',
  'cite',
  'codebase',
  'manifest',
  'profile',
  'icon',
  'longdesc',
  'xml:base',
  'ping',
  'archive',
])
const animationAttributes = new Set([
  'transform',
  'opacity',
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'width',
  'height',
  'd',
  'points',
])

function cleanCss(css: string): string {
  const decoded = css
    .replace(
      /\\([0-9a-f]{1,6})(?:\r\n|[ \n\r\t\f])?|\\([^\r\n\f])/gi,
      (_match, hex: string | undefined, literal: string | undefined) =>
        hex ? String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff)) : (literal ?? ''),
    )
    .replace(/\/\*[\s\S]*?\*\//g, '')
  return (
    decoded
      .replace(/@import\b[^;{}]*(?:;|$)/gi, '')
      .replace(
        /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi,
        (
          _match,
          double: string | undefined,
          single: string | undefined,
          plain: string | undefined,
        ) => {
          const url = (double ?? single ?? plain ?? '').trim()
          return /^#[a-z0-9_-]+$/i.test(url) ? `url(${url})` : 'none'
        },
      )
      .replace(/(?:https?:|javascript:|data:|\/\/)[^\s'";){}]*/gi, '')
      // Raw-text <style> serialization does not escape '<'. Keep decoded CSS
      // escapes from creating a new closing tag when srcdoc parses a second time.
      .replace(/</g, '\\3c ')
  )
}

/** Parse into an inert template: no untrusted nodes ever enter the parent DOM. */
export function createSafePreview(source: string): string {
  const template = document.createElement('template')
  template.innerHTML = source
  for (const element of Array.from(template.content.querySelectorAll('*'))) {
    const tag = element.localName.toLowerCase()
    if (
      blockedElements.has(tag) ||
      ![HTML_NAMESPACE, SVG_NAMESPACE].includes(element.namespaceURI ?? '')
    ) {
      element.remove()
      continue
    }
    if (['animate', 'animatetransform', 'animatemotion', 'set'].includes(tag)) {
      const property = element.getAttribute('attributeName')?.toLowerCase()
      if (tag !== 'animatetransform' && (!property || !animationAttributes.has(property))) {
        element.remove()
        continue
      }
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      if (
        name.startsWith('on') ||
        ['srcdoc', 'target', 'download', 'autofocus', 'contenteditable', 'is', 'nonce'].includes(
          name,
        )
      ) {
        element.removeAttribute(attribute.name)
      } else if (urlAttributes.has(name)) {
        const localSvgReference =
          element.namespaceURI === SVG_NAMESPACE &&
          tag !== 'a' &&
          ['href', 'xlink:href'].includes(name) &&
          /^#[a-z0-9_-]+$/i.test(value)
        const inlineImage =
          tag === 'img' &&
          name === 'src' &&
          /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(value)
        if (!localSvgReference && !inlineImage) element.removeAttribute(attribute.name)
      } else if (name === 'style' || /url\s*\(/i.test(value)) {
        element.setAttribute(attribute.name, cleanCss(attribute.value))
      }
    }
    if (tag === 'style') element.textContent = cleanCss(element.textContent ?? '')
  }
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${template.innerHTML}</body></html>`
}
