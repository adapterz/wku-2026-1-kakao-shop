# FE TROUBLESHOOTING

## [2026-07-09] product.html 내용을 order.html에 잘못 붙여넣음
- 증상: git diff 확인 시 product.html의 헤더 주석과 내용이 order.html 것으로 통째로 바뀌어 있었음
- 원인: 두 파일을 번갈아 작업하다 코드를 잘못된 파일에 붙여넣음
- 해결: git restore public/product.html로 마지막 커밋 상태로 되돌린 후 재작업
- 배운 점: 커밋 안 된 파일은 git restore로 간단히 되돌릴 수 있음. 여러 파일 동시 작업 시 붙여넣기 전 파일명 재확인 필요

## [2026-07-09] 브랜치를 안 바꾸고 이전 브랜치에 계속 작업함
- 증상: 여러 화면(product, giftbox 등) 작업 후 push 하려는데 이전 작업 브랜치 그대로였음
- 원인: 새 화면 작업 시작할 때 git checkout -b로 새 브랜치 만드는 것을 매번 깜빡함
- 해결: 커밋 전 상태였기 때문에 git checkout -b <새브랜치>로 이동 시 수정 내용이 그대로 따라와 문제없이 해결
- 배운 점: 커밋하기 전에는 브랜치를 새로 만들어도 작업 내용이 유지된다는 것을 확인함. 화면 작업 시작 전 git branch로 항상 확인하는 습관 필요

## [2026-07-10] git add 후 commit 시 "nothing to commit" 발생
- 증상: git add public/index.html public/js/home.js public/js/components.js 실행 후 커밋하려는데 "nothing to commit, working tree clean" 메시지 출력
- 원인: 새 브랜치(feature/fe-home-fix) 생성 이전에 이미 다른 시점에서 동일 내용을 커밋해버린 상태였음
- 해결: git log --oneline으로 최근 커밋 목록을 확인해 이미 반영되어 있음을 확인
- 배운 점: add 이후 commit이 안 될 때는 파일 저장 여부뿐 아니라, 혹시 이미 커밋된 상태는 아닌지 git log로 먼저 확인하는 습관이 필요함
