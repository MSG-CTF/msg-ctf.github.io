# 화면과 에셋 출처

소개 페이지는 MSG CTF의 기존 로고·일러스트·화면과 색상을 사용합니다
플랫폼 개발 기록은 [개발·운영 기록](platform.md)에 정리했습니다

| 항목 | 원본 |
| --- | --- |
| 대회 포스터 | 운영자가 제공한 [2026 MSG CTF 홍보 포스터 원본](../assets/brand/msg-ctf-2026-poster.png) |
| 로고·축제 광장·파비콘 | [프론트엔드 intro 에셋](https://github.com/MSG-CTF/front-team/tree/3975fa447fc934b1e2ba253c360ec5dc186b22c6/public/assets/intro) |
| 보드·문제·동아리 부스 화면 | [프론트엔드 화면 기록](https://github.com/MSG-CTF/front-team/tree/3975fa447fc934b1e2ba253c360ec5dc186b22c6/docs/readme), 개발 화면 포함 |
| KOTH 지도 화면 | [프론트엔드 원본 화면](https://github.com/MSG-CTF/front-team/blob/94771a1118b70624d73714e16b55b63744f3d4fb/docs/readme/koth.jpg), 개발용 예시 데이터가 표시된 화면 |
| 보드 등장·주사위 굴림 영상 | [BoardScreen](https://github.com/MSG-CTF/front-team/blob/94771a1118b70624d73714e16b55b63744f3d4fb/src/features/board/components/BoardScreen.jsx)과 [Dice3D](https://github.com/MSG-CTF/front-team/blob/94771a1118b70624d73714e16b55b63744f3d4fb/src/features/board/components/Dice3D.jsx)를 원본 그대로 로컬에서 재생해 녹화 |
| 색상·타이포그래피 기준 | [기존 대회 소개 페이지 스타일](https://github.com/MSG-CTF/front-team/blob/3975fa447fc934b1e2ba253c360ec5dc186b22c6/src/features/intro/intro.css) |
| 낙엽 효과 | [기존 대회 소개 페이지의 AutumnLeaves](https://github.com/MSG-CTF/front-team/blob/3975fa447fc934b1e2ba253c360ec5dc186b22c6/src/features/intro/components/AutumnLeaves.jsx)와 intro.css, 정적 페이지에서 동작하도록 연결 |
| 최종 스코어보드 | 운영자가 제공한 대회 종료 후 화면 원본, 외부 트랙은 왼쪽·내부 트랙은 오른쪽 |
| 플랫폼 역할별 프로필 | [노션의 팀 구분](https://app.notion.com/p/1280f19c72be8300abd701cdac2219fa)·각 팀의 작업 담당자와 GitHub 병합 기록 대조, [역할별 계정과 출처](../data/platform-team.json) |
| 참여자 사진 | 각 참여자의 GitHub 공개 프로필 사진, 프로필 링크와 함께 표시 |
| 기술 아이콘 | Devicon·Simple Icons의 로고를 공통 타일에 배치, [출처와 라이선스](tech-icons.md) |
| AWS·Google Cloud·Azure 로고 | Devicon 원본 SVG, [파일별 출처와 해시](../data/cloud-icons.json) · [MIT 라이선스](../assets/tech/DEVICON-LICENSE.txt) |
| README 클라우드 운영 그림 | 위 CSP 로고와 자원 배정·반납 흐름을 SVG로 구성, [생성 스크립트](../scripts/build-cloud-credits.py) · [운영 기록](cloud-cost.md) |
| 링크 공유 미리보기 | 기존 축제 광장·로고·Pretendard로 구성한 1200×630 이미지, [레이아웃](../scripts/social-card.html) · [생성 스크립트](../scripts/build-social-image.py) |
| 주최 동아리 6곳 | [기존 대회 페이지의 주최 목록](https://github.com/MSG-CTF/front-team/blob/94771a1118b70624d73714e16b55b63744f3d4fb/src/features/intro/components/OrganizerLogos.jsx)과 원본 SVG |
| 후원사 3곳 | [기존 대회 페이지의 후원 목록](https://github.com/MSG-CTF/front-team/blob/94771a1118b70624d73714e16b55b63744f3d4fb/src/features/intro/components/SponsorLogos.jsx)과 원본 로고 |
| Pretendard | [라이선스](../assets/fonts/Pretendard-LICENSE.txt) |
| 감탄로드 바탕체 | 태백시 · 공공누리 제1유형 · [원본 출처와 사용 조건](../assets/fonts/MSG-FONT-SOURCES.md) |

대회 이미지와 글꼴은 원본 파일을 그대로 옮겼으며 배치는 이 소개 페이지에 맞게 구성했습니다
보드 영상은 예시 데이터로 촬영했으며 실제 대회 계정이나 API를 사용하지 않았습니다
주사위 모델·물리 모션의 참고 코드와 저작권 고지는 [프론트의 주사위 출처](https://github.com/MSG-CTF/front-team/blob/94771a1118b70624d73714e16b55b63744f3d4fb/public/third-party/dice-roller.txt)에 있습니다
영상은 보이는 장면만 한 번 자동 재생하고, 탭을 바꾸거나 화면 밖으로 나가면 멈춥니다
동작 줄이기·데이터 절약 설정에서는 직접 재생할 때 시작합니다
참가자 화면의 예시 문제명과 일정은 화면 기록에 포함된 값입니다
클라우드 비용 0원은 2026년 11월 8일 대회 운영 사용료에 크레딧을 적용한 뒤의 추가 결제액을 뜻합니다
참가 규모는 운영자가 확인한 전체 75팀·150명, 외부 50팀·100명, 내부 25팀·50명입니다
분야별 출제자 표기의 근거는 [출제자 기록](challenge-authors.md)에 남겼습니다
