# md2pptx

HTML to MD to PPTX 변환 파이프라인

AI 챗봇(ChatGPT, Claude 등)의 HTML 답변을 **구조화된 슬라이드 원고(Markdown)**로 변환하고, **PowerPoint(PPTX)**로 즉시 생성하는 웹 앱입니다.

```
HTML 파일 업로드 → 구조 파싱 → 슬라이드 MD 추출 → PPTX 생성
     (브라우저)      (port 3000)    (port 3000)     (port 8001)
```

## 스크린샷

| HTML 업로드 + MD 변환 설정 | MD 변환 결과 + PPTX 변환 |
|---|---|
| iOS 글래스모피즘 UI | 가로 정렬 결과 목록 |

## 서버 구성

| 서버 | 포트 | 역할 | 기술 |
|------|------|------|------|
| slide-converter | 3000 | HTML → MD 변환 + 웹 UI | Express.js |
| pptx-engine | 8001 | MD → PPTX 변환 엔진 | FastAPI, python-pptx |
| dashboard | 3001 | 관리 대시보드 | Next.js 15, Tailwind CSS |

## 프로젝트 구조

```
md2pptx/
├── apps/
│   ├── app-3000/              # HTML → MD 변환 서버 + 웹 UI
│   │   ├── server.js          # Express 라우트 + PPTX 프록시
│   │   ├── public/index.html  # iOS 글래스모피즘 UI
│   │   └── lib/               # crawler, extractor, converter
│   └── app-3001/              # Next.js 관리 대시보드
├── packages/ui/               # 공유 React 컴포넌트 (@md2pptx/ui)
├── api/
│   └── main.py                # FastAPI MD → PPTX 엔진
├── parser/                    # HTML/MD 파서 (Python)
├── renderer/                  # PPTX 슬라이드 빌더 (Python)
├── utils/                     # 유틸리티 (다운로드, 썸네일)
├── nginx/default.conf         # 리버스 프록시 설정
├── docker-compose.yml         # 3개 서비스 오케스트레이션
└── .github/workflows/         # CI/CD
```

## 빠른 시작

### 로컬 실행

```bash
# 1. 의존성 설치
npm install                          # Node.js (모노레포)
pip install -r api/requirements.txt  # Python

# 2. 서버 시작
node apps/app-3000/server.js &       # port 3000
python3 api/main.py &                # port 8001

# 3. 브라우저 접속
open http://localhost:3000
```

### Docker 실행

```bash
docker compose up -d --build

# 접속
# http://localhost:3000  — HTML → MD → PPTX 변환
# http://localhost:3001  — 대시보드
# http://localhost:8001/docs — API 문서
```

## 사용 방법

1. **HTML 파일 업로드** — 드래그&드롭 또는 클릭 (최대 20개, 50MB)
2. **MD 변환 설정** — 슬라이드 번호, 페이지 번호, 핵심 메시지, 본문, 레이아웃, 들여쓰기
3. **HTML to MD** 버튼 클릭 → 구조화된 마크다운 생성
4. **PPTX 변환 설정** — 폰트, 제목/본문 크기, 줄 간격
5. **MD to PPTX** 버튼 클릭 → PowerPoint 파일 다운로드

## 주요 기능

- **배치 변환** — 여러 HTML 파일을 동시에 변환
- **전체 선택 / 선택 삭제** — 결과 파일 일괄 관리
- **ZIP 다운로드** — 복수 결과 일괄 다운로드
- **전체 병합** — 여러 MD를 하나로 합치기
- **미리보기** — 변환된 마크다운 즉시 확인
- **PPTX 세부 설정** — 폰트, 크기, 줄 간격 커스터마이징
- **정렬** — 이름순, 슬라이드 수, 파일 크기

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3000` | Express 서버 포트 |
| `PPTX_HOST` | `localhost` | PPTX 엔진 호스트 (Docker: `pptx-engine`) |
| `PPTX_PORT` | `8001` | PPTX 엔진 포트 |

## 기술 스택

**Frontend**: Vanilla JS, iOS Glassmorphism CSS

**Backend**: Express.js, FastAPI, python-pptx

**모노레포**: npm workspaces, Next.js 15, @md2pptx/ui (공유 컴포넌트)

**배포**: Docker Compose, Nginx, GitHub Actions

## 라이선스

MIT
