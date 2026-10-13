# 토닥 필라테스 · Claude 작업 도우미 모드

| 모드 | 하는 일 |
| --- | --- |
| `script-meter` | 대본 파일(.txt/.md, 경로에 `대본·릴스·쇼츠·script·reels·shorts`)을 저장하면 입력창 위에 **글자 수(공백 제외)**, **예상 낭독 시간(초당 7자)**, **첫 문장 글자 수**를 보여 줘요. 첫 문장이 25자를 넘으면 빨간색이에요. |
| `rules-keeper` | "앞으로", "항상", "반드시"가 들어간 말을 `.claude/my-rules.md`에 모아 두고, 대화할 때마다 지키게 해요. 답이 규칙과 어긋나면 답 아래에 ⚠️ 경고가 떠요. `/rules`로 목록을 볼 수 있어요. |
| `file-shelf` | 대화 중에 만든 이미지·HTML 파일을 옆 패널 "만든 파일"에 모아 두고, 누르면 바로 열려요. `/files`로 패널을 다시 열 수 있어요. |

## 켜는 방법
새 대화에서 Claude에게 "claude-mods 폴더의 모드 세 개 켜 줘"라고 말씀해 주세요.
"Enable hot reloading for this session?"이라는 영어 질문이 뜨면 **Enable for this session**(이번 대화에서 켜기)을 눌러 주시면 돼요.
