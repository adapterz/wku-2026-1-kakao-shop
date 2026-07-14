# Docker 배포 안내

현재 운영 환경은 EC2에 직접 설치한 Nginx와 MySQL을 유지하고 Express 애플리케이션만 Docker로 실행한다.

## 구성

- Nginx: 호스트에서 80·443 포트 처리
- Docker 앱: 호스트 네트워크에서 기본 3001 포트 사용
- MySQL: 호스트의 `127.0.0.1:3306` 사용
- `.env`: 이미지에 포함하지 않고 컨테이너 실행 시 주입

## 사전 확인

```bash
free -h
docker --version
docker compose version
```

메모리가 1GB인 현재 EC2에서는 컨테이너 실행 전에 Swap 추가 또는 인스턴스 메모리 증설을 권장한다. 기존 MySQL을 별도 컨테이너로 중복 실행하지 않는다.

## 병행 검증

```bash
cd ~/wku-2026-1-kakao-shop
docker compose config
docker compose build
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:3001/api/health
```

이 단계에서는 기존 PM2 앱이 3000 포트에서 계속 실행되므로 운영 서비스에 영향을 주지 않는다.

## Nginx 전환

Docker 앱의 헬스 체크가 정상일 때만 Nginx의 `proxy_pass`를 변경한다.

```nginx
proxy_pass http://127.0.0.1:3001;
```

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -fsS https://iksanpass.shop/api/health
```

외부 접속 확인 후 PM2 앱을 중지한다.

```bash
pm2 stop kakao-gift-server
pm2 save
```

## 복구

문제가 발생하면 Nginx의 프록시 대상을 다시 3000 포트로 변경한다.

```nginx
proxy_pass http://127.0.0.1:3000;
```

```bash
pm2 start kakao-gift-server
sudo nginx -t
sudo systemctl reload nginx
```
