import 'dotenv/config';
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { parsePostFile } from './content-parser.js';

const AUTH_STATE_PATH = process.env.NAVER_AUTH_STATE || './auth/naver-storage.json';
const BLOG_ID = process.env.NAVER_BLOG_ID;
const HEADLESS = (process.env.HEADLESS ?? 'true') !== 'false';

function parseArgs(argv) {
  const args = { file: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file' || argv[i] === '-f') args.file = argv[++i];
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

async function main() {
  const { file, dryRun } = parseArgs(process.argv.slice(2));

  if (!file) {
    console.error('사용법: npm run post -- --file content/example-post.md');
    process.exit(1);
  }
  if (!BLOG_ID) {
    console.error('NAVER_BLOG_ID 환경변수가 설정되어 있지 않습니다. .env 파일을 확인해주세요.');
    process.exit(1);
  }
  if (!fs.existsSync(AUTH_STATE_PATH)) {
    console.error(`로그인 세션 파일이 없습니다: ${AUTH_STATE_PATH}\n먼저 'npm run login'을 실행해 로그인해주세요.`);
    process.exit(1);
  }

  const post = parsePostFile(path.resolve(file));
  if (!post.title) {
    console.error('제목을 찾을 수 없습니다. 파일 상단에 "title: 제목" 을 추가하거나 첫 줄을 제목으로 작성해주세요.');
    process.exit(1);
  }

  console.log('--- 게시할 글 미리보기 ---');
  console.log('제목:', post.title);
  console.log('카테고리:', post.category || '(기본 카테고리)');
  console.log('태그:', post.tags.join(', ') || '(없음)');
  console.log('문단 수:', post.paragraphs.length);
  console.log('--------------------------');

  if (dryRun) {
    console.log('dry-run 모드이므로 실제로 게시하지 않았습니다.');
    return;
  }

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
  const page = await context.newPage();

  try {
    await openWriteForm(page);
    const frame = await getEditorFrame(page);

    await dismissContinueDraftPopup(frame);
    await fillTitle(frame, post.title);
    await fillBody(frame, post.paragraphs);
    if (post.category) {
      await selectCategory(frame, post.category);
    }
    await publish(frame, post.tags);

    console.log(`"${post.title}" 게시를 완료했습니다.`);
  } catch (err) {
    console.error('게시 중 오류가 발생했습니다:', err);
    if (HEADLESS) {
      console.error('HEADLESS=false 로 다시 실행해 브라우저 화면을 직접 확인해보세요.');
    }
    const screenshotPath = 'auth/last-error.png';
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    console.error(`오류 시점 스크린샷 저장: ${screenshotPath}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

async function openWriteForm(page) {
  await page.goto(`https://blog.naver.com/${BLOG_ID}?Redirect=Write&`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1500);
}

async function getEditorFrame(page) {
  const frameElement = await page.waitForSelector('iframe#mainFrame', { timeout: 15000 });
  const frame = await frameElement.contentFrame();
  if (!frame) throw new Error('에디터 iframe(mainFrame)을 찾지 못했습니다.');
  await frame.waitForSelector('.se-title-text, .se-component-content', { timeout: 15000 });
  return frame;
}

async function dismissContinueDraftPopup(frame) {
  const cancelButton = frame.getByRole('button', { name: /취소|새로 작성/ });
  if (await cancelButton.first().isVisible().catch(() => false)) {
    await cancelButton.first().click();
    await frame.waitForTimeout(500);
  }
}

async function fillTitle(frame, title) {
  const titleEl = frame.locator('.se-title-text').first();
  await titleEl.click();
  await titleEl.pressSequentially(title, { delay: 15 });
}

async function fillBody(frame, paragraphs) {
  const bodyEl = frame.locator('.se-main-container').first();
  await bodyEl.click();

  for (const paragraph of paragraphs) {
    if (paragraph.type === 'image') {
      await insertImage(frame, paragraph.path);
    } else {
      await typeText(frame, paragraph.text);
    }
    await frame.locator('body').press('Enter').catch(() => {});
  }
}

async function typeText(frame, text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    await frame.locator('.se-main-container').first().pressSequentially(lines[i], { delay: 8 });
    if (i < lines.length - 1) {
      await frame.locator('.se-main-container').first().press('Shift+Enter');
    }
  }
}

async function insertImage(frame, imagePath) {
  const resolvedPath = path.resolve(imagePath);
  if (!fs.existsSync(resolvedPath)) {
    console.warn(`이미지 파일을 찾을 수 없어 건너뜁니다: ${resolvedPath}`);
    return;
  }

  const imageButton = frame.locator('.se-image-toolbar-button, button[data-name="image"]').first();
  const [fileChooser] = await Promise.all([
    frame.page().waitForEvent('filechooser', { timeout: 10000 }),
    imageButton.click(),
  ]);
  await fileChooser.setFiles(resolvedPath);
  await frame.waitForTimeout(1500);
}

async function selectCategory(frame, categoryName) {
  const categoryDropdown = frame.getByText('카테고리', { exact: false }).first();
  if (!(await categoryDropdown.isVisible().catch(() => false))) return;

  await categoryDropdown.click();
  const option = frame.getByText(categoryName, { exact: true }).first();
  if (await option.isVisible().catch(() => false)) {
    await option.click();
  } else {
    console.warn(`카테고리 "${categoryName}"를 찾지 못해 기본 카테고리로 게시합니다.`);
  }
}

async function publish(frame, tags) {
  await frame.getByRole('button', { name: '발행', exact: true }).first().click();
  await frame.waitForTimeout(800);

  if (tags && tags.length > 0) {
    const tagInput = frame.locator('#tag-input, input[placeholder*="태그"]').first();
    if (await tagInput.isVisible().catch(() => false)) {
      for (const tag of tags) {
        await tagInput.pressSequentially(tag, { delay: 10 });
        await tagInput.press('Enter');
      }
    }
  }

  const finalPublishButton = frame.getByRole('button', { name: '발행', exact: true }).last();
  await finalPublishButton.click();
  await frame.waitForTimeout(2000);
}

main();
