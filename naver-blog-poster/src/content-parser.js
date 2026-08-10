import fs from 'node:fs';

/**
 * 간단한 포스트 파일 포맷을 파싱합니다.
 *
 *   title: 제목
 *   tags: 태그1, 태그2
 *   category: 카테고리명
 *   ---
 *   본문 첫 문단
 *
 *   본문 두번째 문단
 *   ![대체텍스트](./content/images/photo.jpg)
 *
 * title/tags/category 는 선택 항목이며, `---` 구분선 아래가 본문입니다.
 * 구분선이 없으면 파일 전체를 본문으로 취급하고, 첫 줄을 제목으로 사용합니다.
 */
export function parsePostFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  const meta = { title: '', tags: [], category: '' };
  let bodyStartIndex = 0;
  let sawSeparator = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') {
      bodyStartIndex = i + 1;
      sawSeparator = true;
      break;
    }
    const titleMatch = line.match(/^title:\s*(.+)$/i);
    const tagsMatch = line.match(/^tags:\s*(.+)$/i);
    const categoryMatch = line.match(/^category:\s*(.+)$/i);
    if (titleMatch) meta.title = titleMatch[1].trim();
    else if (tagsMatch) meta.tags = tagsMatch[1].split(',').map((t) => t.trim()).filter(Boolean);
    else if (categoryMatch) meta.category = categoryMatch[1].trim();
  }

  const bodyLines = sawSeparator ? lines.slice(bodyStartIndex) : lines;
  if (!meta.title) {
    meta.title = (bodyLines.find((l) => l.trim().length > 0) || '').trim();
  }

  const bodyText = sawSeparator
    ? bodyLines.join('\n').trim()
    : bodyLines.slice(1).join('\n').trim();

  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => parseParagraph(p));

  return { ...meta, paragraphs };
}

function parseParagraph(p) {
  const imageMatch = p.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (imageMatch) {
    return { type: 'image', alt: imageMatch[1], path: imageMatch[2] };
  }
  return { type: 'text', text: p };
}
