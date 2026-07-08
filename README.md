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

## 회원가입 정보가 DB에 저장되는 흐름

develop에 머지된 최신 코드를 EC2 서버에 반영하고 서버를 재시작하면, 회원가입 정보는 EC2의 MySQL DB `users` 테이블에 저장됩니다.

전체 흐름은 아래와 같습니다.

브라우저에서 회원가입 버튼 클릭
→ `public/js/signup.js` 실행
→ `/api/auth/signup`으로 POST 요청
→ `server/app.js`가 `/api/auth` 요청을 `authRouter`로 전달
→ `server/routes/auth.js`의 `router.post('/signup')` 실행
→ 입력값 검증
→ `bcrypt`로 비밀번호 해시
→ MySQL `users` 테이블에 INSERT
→ 성공 JSON 응답

### 1. FE 화면

사용자는 회원가입 화면에서 이메일, 비밀번호, 이름, 전화번호 등을 입력합니다.

관련 파일:

```text
public/signup.html
```

### 2. FE JS

회원가입 폼을 제출하면 아래 파일에서 form submit 이벤트를 처리합니다.

```text
public/js/signup.js
```

이 파일에서 입력값을 모아 `signupUser(payload)`를 호출합니다.

```js
await signupUser(payload);
```

### 3. 공통 API 함수

`signupUser()`는 공통 API 함수 파일에 정의되어 있습니다.

```text
public/js/api.js
```

이 함수는 실제로 아래 주소로 요청을 보냅니다.

```text
POST /api/auth/signup
```

### 4. Express 서버 입구

Express 서버의 시작점은 아래 파일입니다.

```text
server/app.js
```

`app.js`에는 다음 코드가 있습니다.

```js
app.use('/api/auth', authRouter);
```

이 코드는 아래 의미입니다.

```text
/api/auth 로 시작하는 요청은 server/routes/auth.js로 보낸다.
```

### 5. Auth 라우터

회원가입 API는 아래 파일에서 처리합니다.

```text
server/routes/auth.js
```

이 안에는 다음 route가 있습니다.

```js
router.post('/signup', async (req, res) => {
  ...
});
```

`app.js`의 `/api/auth`와 `auth.js`의 `/signup`이 합쳐져 실제 API 주소가 됩니다.

```text
POST /api/auth/signup
```

### 6. 비밀번호 해시

회원가입 시 비밀번호는 그대로 저장하지 않습니다.

```js
const passwordHash = await bcrypt.hash(password, 10);
```

즉, 사용자가 입력한 비밀번호를 `bcrypt` 해시값으로 바꾼 뒤 DB에 저장합니다.

### 7. DB 저장

회원 정보는 MySQL `users` 테이블에 저장됩니다.

```sql
INSERT INTO users (email, password, name, phone, birth_date, gender)
VALUES (?, ?, ?, ?, ?, ?)
```

여기서 중요한 점은 SQL에 직접 값을 문자열로 붙이지 않고, `?` 파라미터 바인딩을 사용한다는 점입니다.

### 8. EC2에서 DB가 연결되는 방식

EC2 서버 안의 `.env`가 아래처럼 설정되어 있으면:

```text
DB_HOST=127.0.0.1
DB_NAME=kakao_gift
```

EC2에서 실행 중인 Node 서버는 같은 EC2 안의 MySQL DB에 연결합니다.

즉, EC2에서 서비스가 실행 중일 때 회원가입을 하면 EC2 MySQL의 `kakao_gift.users` 테이블에 데이터가 저장됩니다.

### 9. 배포 후 반영 순서

auth API가 develop에 머지된 뒤 EC2에 반영하려면 아래 순서로 진행합니다.

```bash
cd /home/ubuntu/wku-2026-1-kakao-shop
git switch develop
git pull origin develop
npm install
pm2 restart all
```

### 최종 정리

회원가입 저장 흐름은 아래와 같습니다.

```text
FE 입력
→ signup.js
→ api.js
→ POST /api/auth/signup
→ app.js
→ auth.js
→ bcrypt 해시
→ users 테이블 INSERT
→ 회원가입 완료
```

정상 반영 후 아래 화면에서 회원가입하면 DB에 저장됩니다.

```text
http://3.26.95.225:3000/signup.html
```

단, 아래 조건이 충족되어야 합니다.

- auth API PR이 `develop`에 머지되어 있어야 합니다.
- EC2에서 최신 `develop`을 pull 해야 합니다.
- `npm install`로 `bcrypt`, `express-session`이 설치되어야 합니다.
- `pm2 restart all`로 서버가 재시작되어야 합니다.
- EC2의 `.env` DB 접속 정보가 올바르게 설정되어 있어야 합니다.
