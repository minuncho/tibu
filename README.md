# Tibu

펫 사진으로 띠부씰을 만들고, 전세계 띠부씰을 뽑아 모으는 모바일 웹.
Next.js (App Router) + Supabase (구글 로그인 / DB / 스토리지) + OpenAI gpt-image.

## 바로 실행 (키 없이 데모 모드)

```bash
npm run dev
```

http://localhost:3000 을 모바일 크기로 열면 됩니다.
키가 없으면 **데모 모드**로 동작합니다: 가짜 로그인, 로컬 JSON 저장(`.demo-data/`), 샘플 띠부씰 5개,
AI 변환 없이 올린 사진 그대로 3장 표시. 초기화하려면 `.demo-data` 폴더를 지우세요.

## 직접 해야 하는 설정

### 1. Supabase
1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor에 [supabase/schema.sql](supabase/schema.sql) 전체를 붙여넣고 실행 (테이블 + 스토리지 버킷 생성)
3. Project Settings → API 에서 URL / anon key / service_role key 복사

### 2. 구글 로그인
1. Google Cloud Console → API 및 서비스 → 사용자 인증 정보 → OAuth 클라이언트 ID (웹 애플리케이션)
2. 승인된 리디렉션 URI: `https://<프로젝트>.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google 에 클라이언트 ID / 시크릿 입력
4. Supabase → Authentication → URL Configuration
   - Site URL: 배포 주소 (예: `https://xxx.vercel.app`)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://xxx.vercel.app/auth/callback`

### 3. OpenAI
https://platform.openai.com 에서 API 키 발급. (gpt-image 계열은 조직 인증이 필요할 수 있음)

### 4. 환경변수
`.env.example` 을 `.env.local` 로 복사해서 채우고, Vercel 프로젝트의 Environment Variables 에도 같은 값을 넣습니다.

스태프 계정은 `STAFF_EMAILS` 에 구글 이메일을 쉼표로 구분해 넣습니다. 스태프는 홈 왼쪽 위 프로필 메뉴에 "Review reports" 가 보입니다.
(데모 모드에서는 데모 유저가 스태프입니다.)

### 5. GitHub / Vercel
```bash
git init
```
이후 GitHub 저장소에 올리고 Vercel에서 Import 하면 됩니다. 별도 빌드 설정은 필요 없습니다.

## 규칙 (현재 구현)

| 항목 | 내용 |
| --- | --- |
| 순번 | 전체 공용, 0000부터 제작 순서대로 자동 부여 |
| 제작 | 현지 날짜 기준 하루 3회. **AI 변환을 실행하는 순간** 차감 |
| 뽑기 | 하루 기본 1회 + 띠부씰 완성 1개당 +1회. 안 쓴 기회는 현지 자정에 소멸 |
| 뽑기 풀 | 내가 만든 것 제외, 전체 동일 확률, 중복 허용. 풀이 비면 기회 차감 없음 |
| 앨범 | Drawn / Made 전환 + No.(순번) / Date(오래된 순) 정렬. 중복도 각각 저장 |
| 말풍선 | 띠부씰 바깥에 표시. 앨범에서 띠부씰을 누르면 나옴 |
| 국기 | 띠부씰 오른쪽 위. 제작할 때 주인이 직접 선택. 접속 국가(Vercel IP, 로컬에서는 기기 언어의 지역)가 기본으로 선택돼 있음 |
| 신고 | 뽑은 띠부씰만, 한 사람이 한 띠부씰에 한 번. 스태프가 `/staff` 에서 직접 확인 |
| 신고 인정 | 띠부씰 숨김(뽑기 풀·모든 앨범에서 제외) + 제작자 7일간 제작 금지 + 그 띠부씰을 신고한 사람 모두에게 뽑기 크레딧 1개 |
| 신고 기각 | 아무 일도 없음 (뽑는 데 쓴 기회는 그대로 소진) |
| 크레딧 | 자정에 사라지지 않는 뽑기 기회. 그날 기본 기회를 다 쓴 뒤에 사용됨 |
| 계정 삭제 | 프로필 메뉴 맨 아래. 앨범·뽑기 기록·기회·신고 내역은 지워지고, 만든 띠부씰은 주인 없는 상태로 남아 계속 뽑힘 |
| 글자수 | 이름 20자, 말풍선 50자 (`src/lib/types.ts` 에서 변경) |

## 구조

- `src/app` — 화면(`/`, `/create`, `/draw`, `/album`, `/login`)과 API(`/api/*`)
- `src/lib/server/store.ts` — 저장소 인터페이스. `store-supabase.ts`(실서비스) / `store-demo.ts`(데모)
- `src/lib/server/openai.ts` — 스타일별 프롬프트와 이미지 변환 호출
- `src/lib/server/quota.ts` — 하루 제작/뽑기 횟수 계산
- `src/lib/server/reports.ts` — 신고 인정/기각 처리 (패널티 일수·보상은 `src/lib/types.ts`)
- `src/lib/render.ts` — 띠부씰만 PNG로 그려 저장 (말풍선·배경 제외)
- `src/components/Art.tsx` — 홈 버튼 일러스트(SVG)
