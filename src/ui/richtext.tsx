/**
 * Safe markdown-lite renderer. Content is NEVER injected as HTML — every
 * construct is parsed and emitted as React elements, so imported packs and
 * seed content alike cannot smuggle markup.
 * Supports: **bold**, `code`, ``` fenced blocks, | tables |, > quotes,
 * blank-line paragraphs, and simple "1." / "-" lists.
 */
import { Fragment, type ReactNode } from 'react'

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  // split by **bold** and `code`
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={`${keyBase}t${i++}`}>{text.slice(last, m.index)}</Fragment>)
    const token = m[0]
    if (token.startsWith('**')) {
      out.push(
        <strong key={`${keyBase}b${i++}`} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      out.push(
        <code key={`${keyBase}c${i++}`} className="font-mono text-[0.9em] bg-surface2 border border-line rounded px-1 py-px">
          {token.slice(1, -1)}
        </code>,
      )
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push(<Fragment key={`${keyBase}t${i++}`}>{text.slice(last)}</Fragment>)
  return out
}

function renderTable(lines: string[], key: string): ReactNode {
  const rows = lines.map((l) =>
    l
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim()),
  )
  const header = rows[0]
  const divider = rows[1]?.every((c) => /^-{3,}$/.test(c))
  const body = divider ? rows.slice(2) : rows.slice(1)
  return (
    <div key={key} className="overflow-x-auto my-2 scroll-thin">
      <table className="text-sm border-collapse min-w-[200px]">
        <thead>
          <tr>
            {header.map((c, i) => (
              <th key={i} className="border border-line bg-surface2 px-2.5 py-1.5 text-left font-semibold">
                {inline(c, `${key}h${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className="border border-line px-2.5 py-1.5 font-mono text-[13px]">
                  {inline(c, `${key}r${ri}c${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Rich({ text, className }: { text: string; className?: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let i = 0
  let key = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('```')) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++ // closing fence
      blocks.push(
        <pre
          key={key++}
          className="font-mono text-[13px] leading-relaxed bg-surface2 border border-line rounded-lg px-3 py-2.5 my-2 overflow-x-auto scroll-thin"
        >
          {code.join('\n')}
        </pre>,
      )
      continue
    }
    if (line.trimStart().startsWith('|') && line.includes('|', 2)) {
      const table: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('|')) {
        table.push(lines[i])
        i++
      }
      blocks.push(renderTable(table, `tbl${key++}`))
      continue
    }
    if (line.trimStart().startsWith('>')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      blocks.push(
        <blockquote key={key++} className="border-l-2 border-accent/60 bg-accent-soft rounded-r-lg px-3 py-2 my-2 text-[0.95em]">
          {quote.map((q, qi) => (
            <p key={qi} className={qi > 0 ? 'mt-1.5' : ''}>
              {inline(q, `q${key}l${qi}`)}
            </p>
          ))}
        </blockquote>,
      )
      continue
    }
    const listMatch = /^\s*(\d+\.|-)\s+/.exec(line)
    if (listMatch) {
      const items: string[] = []
      const ordered = listMatch[1] !== '-'
      while (i < lines.length && /^\s*(\d+\.|-)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*(\d+\.|-)\s+/, ''))
        i++
      }
      const Tag = ordered ? 'ol' : 'ul'
      blocks.push(
        <Tag key={key++} className={`my-1.5 ps-5 space-y-1 ${ordered ? 'list-decimal' : 'list-disc'}`}>
          {items.map((it, ii) => (
            <li key={ii}>{inline(it, `li${key}i${ii}`)}</li>
          ))}
        </Tag>,
      )
      continue
    }
    if (line.trim() === '') {
      i++
      continue
    }
    // paragraph: accumulate until blank/structural line
    const para: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trimStart().startsWith('|') &&
      !lines[i].trimStart().startsWith('```') &&
      !lines[i].trimStart().startsWith('>') &&
      !/^\s*(\d+\.|-)\s+/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="my-1.5 leading-relaxed">
        {inline(para.join(' '), `p${key}`)}
      </p>,
    )
  }
  return <div className={className}>{blocks}</div>
}
