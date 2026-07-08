[README.md](https://github.com/user-attachments/files/29785044/README.md)
| 구분 | 이름 | 설명 |
|---|---|---|
| 폴더 | `db/` | MySQL DB 관련 파일을 관리하는 폴더입니다. 테이블 생성 SQL인 `schema.sql`, 초기 데이터 입력용 `seed.sql`, ERD 문서 등이 들어갑니다. |
| 폴더 | `docs/` | 프로젝트 문서, 개발 기록, 역할별 가이드, 회의/검토 내용을 정리하는 폴더입니다. |
| 폴더 | `node_modules/` | `npm install`을 실행하면 자동으로 생성되는 Node.js 패키지 설치 폴더입니다. 용량이 크고 각자 로컬에서 다시 설치할 수 있으므로 Git에는 올리지 않습니다. |
| 폴더 | `public/` | 프론트엔드 정적 파일을 관리하는 폴더입니다. `index.html`, CSS, 이미지, 브라우저에서 실행되는 JavaScript 파일이 들어갑니다. Express 서버가 이 폴더를 정적 파일로 제공합니다. |
| 폴더 | `server/` | 백엔드 Express 서버 코드를 관리하는 폴더입니다. 서버 시작점인 `app.js`, DB 연결 파일인 `db.js`, API 라우터 파일들이 들어갑니다. |
| 파일 | `.gitignore` | Git에 올리지 않을 파일이나 폴더를 지정하는 설정 파일입니다. 예를 들어 `node_modules/`, `.env`처럼 로컬 환경마다 다르거나 민감한 파일을 제외할 때 사용합니다. |
| 파일 | `.env` | 로컬 실행 환경에서 필요한 환경변수를 저장하는 파일입니다. DB 접속 정보(`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), 서버 포트(`PORT`)처럼 코드에 직접 적으면 안 되는 값을 따로 관리합니다. 이 파일은 개인 PC, EC2 서버 등 실행 환경마다 값이 달라질 수 있고, 비밀번호 같은 민감 정보가 들어가므로 Git에 올리지 않습니다. |
| 파일 | `package.json` | Node.js 프로젝트 설정 파일입니다. 프로젝트 이름, 실행 스크립트(`npm run dev`, `npm start`), 설치해야 할 패키지 목록을 관리합니다. |
| 파일 | `package-lock.json` | npm 패키지의 정확한 설치 버전을 고정하는 파일입니다. 팀원들이 `npm install`을 했을 때 최대한 같은 버전의 패키지가 설치되도록 도와줍니다. |


## 이해한 내용 정리

- `db/`는 DB 테이블 구조와 초기 데이터를 관리하는 폴더이다.
- `docs/`는 프로젝트 진행 문서와 기록을 관리하는 폴더이다.
- `public/`은 사용자가 브라우저에서 보는 프론트엔드 화면 파일을 관리하는 폴더이다.
- `server/`는 Express 기반 백엔드 서버와 API 코드를 관리하는 폴더이다.
- `.gitignore`는 Git에 올리면 안 되는 파일을 제외하기 위한 설정 파일이다.
- `.env`는 DB 비밀번호, DB 이름, 서버 포트처럼 실행 환경마다 달라지는 값을 저장하는 파일이다.
- `.env`에는 민감 정보가 들어갈 수 있으므로 GitHub에 올리면 안 된다.
- `package.json`은 Node.js 프로젝트 실행 방법과 필요한 패키지 목록을 관리한다.
- `package-lock.json`은 팀원들이 같은 패키지 버전으로 설치할 수 있게 고정해주는 파일이다.
- `node_modules/`는 `npm install`로 다시 만들 수 있으므로 Git에 올리지 않는다.


- home.js는 api가 가져온 파일들을 화면에 출력하고 배치하는 코드. (+예외상황 출력)
물품 조회 api가 해당 데이터를 가져오면 어떤 물품을 어디에 배치할지 정해서 실행 데이터없으면 상황에 맞는 메세지출력

## Express 라우터 구조 이해

Express 서버에서는 요청 주소에 따라 처리할 코드를 나누기 위해 라우터(router)를 사용합니다.

전체 흐름은 아래와 같습니다.

브라우저/FE 요청
→ server/app.js
→ app.js가 주소 앞부분으로 1차 분류
→ 해당 router 파일로 이동
→ router 안의 개별 route가 실제 요청 처리
→ JSON 응답 반환

우리 프로젝트에서는 `server/app.js`가 API의 큰 입구 역할을 합니다.

예시:

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);

위 코드는 다음과 같은 의미입니다.

- `/api/auth`로 시작하는 요청 → `server/routes/auth.js`에서 처리
- `/api/products`로 시작하는 요청 → `server/routes/products.js`에서 처리

라우터 파일 안에서는 세부 주소별로 실제 처리 코드를 나눕니다.

예시:

router.post('/login', ...)
router.post('/signup', ...)
router.get('/me', ...)

예를 들어 아래 두 코드가 합쳐지면 실제 API 주소가 됩니다.

app.js의 `/api/auth`
+
auth.js의 `/login`
=
`POST /api/auth/login`

정리하면 다음과 같습니다.

- `app.js` = 큰 접수처
- `router 파일` = 업무별 담당 창구
- `route` = 실제 요청을 처리하는 코드

현재 프로젝트 기준으로는 아래처럼 나눠서 관리합니다.

- 상품 조회 → `server/routes/products.js`
- 로그인/회원가입 → `server/routes/auth.js`
- 주문 → `server/routes/orders.js` 예정
- 선물함 → `server/routes/gifts.js` 예정