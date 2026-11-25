# OOTD

React 수업 내용을 바탕으로 의류 탐색부터 모의 주문까지 동작하는 의류 구매 쇼핑몰입니다.

## 사용 도구

### 실행 환경

| 도구 | 버전 | 용도 |
|---|---|---|
| Node.js | 24.19.0 | JavaScript 실행 환경 |
| npm | 11.17.0 | 패키지 설치와 스크립트 실행 |

### 라이브러리

| 도구 | 버전 | 용도 |
|---|---|---|
| React | 19.3.0 | 화면(컴포넌트) 구성 |
| React DOM | 19.3.0 | React 화면을 브라우저에 표시 |
| React Router DOM | 7.18.4 | 페이지 이동(라우팅) |

### 개발 도구

| 도구 | 버전 | 용도 |
|---|---|---|
| Vite | 8.2.2 | 개발 서버 실행, 배포용 파일 빌드 |
| @vitejs/plugin-react | 6.1.1 | Vite에서 React(JSX) 사용 |
| rolldown | 1.2.7 | Vite 내부 빌드 도구 (`overrides`로 버전 고정) |
| oxlint | 1.81.0 | 코드 검사 (`npm run lint`) |

### 스타일·저장·배포

| 도구 | 용도 |
|---|---|
| CSS Modules | 컴포넌트별 스타일 (`*.module.css`, Vite 기본 지원) |
| localStorage | 의류·재고, 장바구니, 주문 내역, 좋아요, 재입고 알림, 최근 검색어 저장 (브라우저 기본 기능) |
| Docker · nginx · GitHub Actions | 배포: CI 가 이미지를 만들어 GHCR 에 올리고, 서버가 받아 https://ootd.hdg3383.com 으로 내보낸다 |

> Vite 8.2.2, rolldown 1.2.7, oxlint 1.81.0은 버전을 고정했습니다.
> 최신 버전은 이 PC의 Windows 스마트 앱 컨트롤에 의해 실행이 차단되므로 `npm update`로 올리지 않습니다.

## 실행 방법

```bash
npm install
npm run dev
```

개발 서버 주소: http://localhost:5175 (`vite.config.js`에서 5175 포트로 고정)

## 배포 확인

```bash
npm run build
npm run preview
```

## 배포

https://ootd.hdg3383.com

`main` 에 올리면 GitHub Actions(`.github/workflows/ci.yml`)가 검사(`npm run lint`)와 빌드를 하고, `Dockerfile` 로 nginx 이미지를 만들어
`ghcr.io/hodogu-021025/ootd` 에 올립니다. 서버는 그 이미지를 받아 띄우고, 앞단의 Caddy 가 HTTPS 를 맡습니다.
nginx(`nginx.conf`)는 파일이 없는 주소를 `index.html` 로 돌려 React Router 가 화면을 고르게 합니다.

## 폴더 구조

| 경로 | 용도 |
|---|---|
| `src/pages` | 화면(페이지) 컴포넌트 |
| `src/components` | 공통 UI 컴포넌트 |
| `src/context` | 여러 화면이 함께 쓰는 데이터(의류·재고, 장바구니, 주문, 좋아요, 재입고 알림) |
| `src/mocks` | 기초 데이터(JS 객체 배열, named export)와 사진 등록표 |
| `src/utils` | localStorage 저장·읽기, 금액·정렬 계산 |
| `src/image` | 로고·아이콘·상품 사진 (webp, 코드에서 import) |
| `src/image/products` | mock.zip에서 받은 상품 사진 (webp) |
| `src/styles` | 전역 CSS |
| `public/ootd_logo.png` | 파비콘 (`index.html`에서 사용) |
| `docs/md` | 단계별 설계·테스트·배포 문서 (원본 마크다운) |
| `docs/docx` | 같은 문서의 Word 변환본 (저장소에는 올리지 않음) |
| `backup` | 이미지 원본, 받은 자료, 이전 버전 백업 (저장소에는 올리지 않음) |

## 화면

| 번호 | 화면 | 주소 |
|---|---|---|
| S-01 | 홈 | `/` |
| S-02 | 의류 목록 | `/products` |
| S-03 | 의류 상세 | `/products/:productId` |
| S-04 | 장바구니 | `/cart` |
| S-05 | 주문서 | `/checkout` |
| S-06 | 주문 완료 | `/order-complete/:orderId` |
| S-07 | 주문 내역 | `/orders` |
| S-08 | 좋아요 목록 | `/wishlist` |
| S-09 | 관리자 의류 관리 | `/admin` |
| S-10 | 페이지 없음 | 그 밖의 주소 |
| S-11 | LISTS | `/lists` |
| S-12 | 재입고 알림 목록 | `/restock-alerts` |

## 주요 기능

**의류 탐색**
- 상품명·브랜드·종류 검색과 최근 검색어 10개 저장
- 브랜드·계절·분류(대분류 › 중분류 › 세부 항목) 사이드바 필터
- 등록순·최신순·가격순·할인율순 정렬, 한 페이지 12개 페이지네이션
- 검색·필터·정렬을 함께 적용하고 한 번에 초기화

**구매**
- 사이즈·수량(1~99)을 골라 장바구니에 담기, 같은 사이즈는 수량 합산
- 장바구니 수량 변경·삭제, 구매 불가·재고 부족 안내
- 배송 정보를 입력해 모의 주문, 주문 내역 확인과 주문 취소

**그 밖에**
- 좋아요 등록·해제와 좋아요 목록, LISTS 화면의 목록 미리 보기
- 사이즈별 재고 표시와 구매 제한, 재입고 알림 신청과 알림 팝업
- 관리자 페이지에서 의류 등록·수정·삭제, 재입고, 할인율 부여

PC 화면 기준으로 만들고 배포 뒤 휴대폰·태블릿 화면을 더했습니다(상품 2~3열, 필터 단추, 결제 금액을 목록 아래로).

로그인·결제·배송은 범위에 넣지 않았고, 장바구니·주문 내역 등 모든 저장 데이터는 브라우저(localStorage)에만 남습니다.

## 문서

`docs/md` 폴더에 01~12 문서가 있습니다. 기능은 02, 화면은 03, 데이터 구조는 05, 작업 규칙은 06, 테스트는 11, 배포는 12를 참고하세요.
