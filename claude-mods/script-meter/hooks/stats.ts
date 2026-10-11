import type { ScriptStats } from '../types'

export const CHARS_PER_SECOND = 7
export const FIRST_SENTENCE_LIMIT = 25

// 대본으로 보는 파일: .txt/.md 이면서 경로에 대본·script·릴스·reels·쇼츠·shorts 가 들어간 것
const SCRIPT_PATH = /(대본|script|릴스|reels?|쇼츠|shorts)/i
const TEXT_EXT = /\.(txt|md)$/i

export const isScriptFile = (path: string): boolean =>
  TEXT_EXT.test(path) && SCRIPT_PATH.test(path)

// 낭독되는 글자만 셉니다: 공백과 마크다운 기호(#, *, >, -, _ , `)는 빼고
const spoken = (text: string): string =>
  text
    .split('\n')
    .filter(line => !/^\s*#/.test(line))
    .join('\n')
    .replace(/[#*>_`~|\-]/g, '')
    .replace(/\s+/g, '')

export const firstSentenceOf = (text: string): string => {
  const body = text
    .split('\n')
    .map(line => line.replace(/^\s*(?:[-*>]\s*)+/, '').trim())
    .filter(line => line !== '' && !line.startsWith('#'))
    .join('\n')
  const match = body.match(/^[^\n.!?。！？]*[.!?。！？]?/)

  return (match?.[0] ?? '').trim()
}

export const measure = (file: string, text: string): ScriptStats => {
  const chars = [...spoken(text)].length
  const firstSentence = firstSentenceOf(text)

  return {
    file,
    chars,
    seconds: Math.round(chars / CHARS_PER_SECOND),
    firstSentence,
    firstChars: [...spoken(firstSentence)].length,
  }
}

export const formatTime = (seconds: number): string =>
  seconds < 60 ? `${seconds}초` : `${Math.floor(seconds / 60)}분 ${seconds % 60}초`
