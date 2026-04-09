#!/usr/bin/env node
/**
 * Reads Google My Maps KML (stdin or file) and prints JSON for GardenWise:
 * [{ id, name, lat, lng, kind, folder, description, websites[], phone }]
 *
 * KML <coordinates> order is longitude,latitude — output uses lat,lng.
 *
 * Usage:
 *   curl -sL 'https://www.google.com/maps/d/kml?mid=YOUR_MID&forcekml=1' | node scripts/kml-placemarks-to-json.mjs
 *   node scripts/kml-placemarks-to-json.mjs ./export.kml > src/data/vic-nurseries.json
 */

import { readFileSync } from 'node:fs'

const URL_RE = /https?:\/\/[^\s<>"')]+/gi

function stripCdata(s) {
  const m = s.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/)
  return m ? m[1].trim() : s.trim()
}

function tagContent(block, tag) {
  const re = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`, 'i')
  const m = block.match(re)
  if (!m) return ''
  return stripCdata((m[1] ?? m[2] ?? '').trim())
}

function extractUrls(text) {
  if (!text) return []
  const set = new Set()
  let m
  const re = new RegExp(URL_RE.source, 'gi')
  while ((m = re.exec(text)) !== null) {
    let u = m[0].replace(/[,;.]+$/, '')
    if (u.includes('&#')) continue
    set.add(u)
  }
  return [...set]
}

function extractPhone(description) {
  if (!description) return null
  const m = description.match(/Contact Phone\s*([^\n<br]+)/i)
  return m ? m[1].replace(/\t/g, ' ').trim() : null
}

function folderToKind(folderName) {
  const n = folderName.toLowerCase()
  if (n.includes('public garden')) return 'public_garden'
  return 'nursery'
}

function makeId(name, lat, lng) {
  const slug = (name || 'place')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `vic-${slug}-${Math.round(lat * 1e5)}-${Math.round(lng * 1e5)}`
}

function documentInner(kml) {
  const start = kml.indexOf('<Document>')
  const end = kml.lastIndexOf('</Document>')
  if (start === -1 || end === -1) return kml
  return kml.slice(start + '<Document>'.length, end)
}

function *topLevelFolders(docInner) {
  let pos = 0
  while (pos < docInner.length) {
    const i = docInner.indexOf('<Folder>', pos)
    if (i === -1) break
    let depth = 1
    let j = i + 8
    while (depth > 0 && j < docInner.length) {
      const o = docInner.indexOf('<Folder>', j)
      const c = docInner.indexOf('</Folder>', j)
      if (c === -1) return
      if (o !== -1 && o < c) {
        depth++
        j = o + 8
      } else {
        depth--
        if (depth === 0) {
          yield docInner.slice(i + 8, c)
          pos = c + 9
          break
        }
        j = c + 9
      }
    }
    if (depth !== 0) break
  }
}

function parsePlacemarksInBlock(block, folderName) {
  const kind = folderToKind(folderName)
  const out = []
  const re = /<Placemark>([\s\S]*?)<\/Placemark>/gi
  let m
  while ((m = re.exec(block)) !== null) {
    const pm = m[1]
    if (/<MultiGeometry|<LineString|<Polygon/i.test(pm)) continue

    const name = tagContent(pm, 'name')
    const description = tagContent(pm, 'description') || null

    const coordMatch = pm.match(
      /<coordinates>\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)?\s*<\/coordinates>/i,
    )
    if (!coordMatch) continue

    const lng = parseFloat(coordMatch[1])
    const lat = parseFloat(coordMatch[2])
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue

    const textBlob = `${description ?? ''}\n${name}`
    const websites = extractUrls(textBlob)
    const phone = extractPhone(description ?? '')

    out.push({
      id: makeId(name, lat, lng),
      name: name || '(unnamed)',
      lat,
      lng,
      kind,
      folder: folderName,
      description,
      websites,
      phone,
    })
  }
  return out
}

function parseKml(kml) {
  const inner = documentInner(kml)
  const rows = []
  for (const folderBlock of topLevelFolders(inner)) {
    const folderName = tagContent(folderBlock, 'name') || 'Uncategorized'
    const placemarks = parsePlacemarksInBlock(folderBlock, folderName)
    rows.push(...placemarks)
  }
  if (rows.length === 0) {
    return parsePlacemarksFlat(kml)
  }
  return rows
}

/** Fallback if no Folder structure */
function parsePlacemarksFlat(kml) {
  const out = []
  const re = /<Placemark>([\s\S]*?)<\/Placemark>/gi
  let m
  while ((m = re.exec(kml)) !== null) {
    const block = m[1]
    if (/<MultiGeometry|<LineString|<Polygon/i.test(block)) continue

    const name = tagContent(block, 'name')
    const description = tagContent(block, 'description') || null

    const coordMatch = block.match(
      /<coordinates>\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)?\s*<\/coordinates>/i,
    )
    if (!coordMatch) continue

    const lng = parseFloat(coordMatch[1])
    const lat = parseFloat(coordMatch[2])
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue

    const textBlob = `${description ?? ''}\n${name}`
    const websites = extractUrls(textBlob)
    const phone = extractPhone(description ?? '')

    out.push({
      id: makeId(name, lat, lng),
      name: name || '(unnamed)',
      lat,
      lng,
      kind: 'nursery',
      folder: '',
      description,
      websites,
      phone,
    })
  }
  return out
}

async function readAllStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

async function main() {
  const kml =
    process.argv[2] && process.argv[2] !== '-'
      ? readFileSync(process.argv[2], 'utf8')
      : await readAllStdin()

  const rows = parseKml(kml)
  process.stdout.write(JSON.stringify(rows, null, 2) + '\n')
  console.error(`Parsed ${rows.length} point placemarks.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
