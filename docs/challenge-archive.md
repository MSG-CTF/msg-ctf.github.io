# 문제 아카이브

[문제 36개 보기](https://msg-ctf.github.io/challenges.html) · [출제자 보기](https://msg-ctf.github.io/authors.html)

2026 MSG CTF 일반 문제 30개와 KOTH 6개의 제목·분야·지문·출제자를 모았습니다
문제별 주소가 있어 특정 문제를 바로 공유할 수 있습니다

## 기록 기준

지문은 문제 저장소의 각 info.yaml에 기록된 description 원문입니다
줄바꿈·강조·링크를 웹에서 읽기 좋게 표시했고, 문장은 새로 쓰지 않았습니다
원문에 적힌 참가자용 다운로드 주소와 압축 비밀번호도 함께 남겼습니다
외부 파일의 현재 다운로드 가능 여부는 이 아카이브에서 보장하지 않습니다

- 원본 저장소: MSG-CTF/2026_MSG_CTF
- 기준 커밋: [b048f3684063b7f9aa1faf8a6f1e2d1c767cb5b0](https://github.com/MSG-CTF/2026_MSG_CTF/tree/b048f3684063b7f9aa1faf8a6f1e2d1c767cb5b0)
- 기준 커밋 시각: 2026년 11월 6일 18:05 KST
- 수집일: 2026년 11월 9일
- 출제자 대조 기록: [문제별 출제자](challenge-authors.md)

운영 사이트 DB를 복제한 자료가 아니라 위 커밋의 지문을 보관한 자료입니다
정답과 운영 설정, 출제자용 풀이 파일은 포함하지 않았습니다
예시 문제 web-notebook은 대회 문제 목록에서 제외했습니다

## 수정 방법

[data/challenges.json](../data/challenges.json)에 공개할 지문과 출제자 정보를 보관합니다
프로필은 확인된 GitHub 계정을 사용하고, 계정이 확인되지 않은 공동 출제자는 이름으로 표시합니다

내용을 고친 뒤 저장소 루트에서 아래 명령을 실행합니다

```sh
python scripts/build-archive.py
```

출제자 목록, 문제 목록, 문제별 HTML이 함께 생성됩니다
지문과 링크는 JavaScript 없이도 읽을 수 있고, JavaScript가 있으면 분야 필터와 검색을 사용할 수 있습니다
