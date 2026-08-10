import 'dotenv/config';
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const AUTH_STATE_PATH = process.env.NAVER_AUTH_STATE || './auth/naver-storage.json';

async function main() {
  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('네이버 로그인 페이지를 엽니다. 브라우저 창에서 직접 로그인해주세요.');
  console.log('(아이디/비밀번호는 이 스크립트에 저장되지 않습니다. 로그인 세션만 저장됩니다.)');
  await page.goto('https://nid.naver.com/nidlogin.login');

  console.log('로그인을 완료하면 이 창에서 Enter 키를 눌러주세요...');
  await waitForEnter();

  await context.storageState({ path: AUTH_STATE_PATH });
  console.log(`로그인 세션을 저장했습니다: ${AUTH_STATE_PATH}`);

  await browser.close();
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.pause();
      resolve();
    });
  });
}

main().catch((err) => {
  console.error('로그인 세션 저장 중 오류가 발생했습니다:', err);
  process.exit(1);
});
