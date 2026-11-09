# 클라우드 추가 결제 0원

75팀·150명이 참가한 2026 MSG CTF는 무료 크레딧을 적용한 뒤 클라우드 추가 결제액 0원으로 마무리했습니다
2026년 11월 8일 대회 운영에 대한 금액이며, 크레딧 차감 전 사용료와는 구분합니다

## 여러 계정의 자원을 한곳에서 관리

AWS·GCP·Azure의 무료 크레딧으로 확보한 VM을 브로커에 등록했습니다
스케줄러는 실행 가능한 노드를 골라 CPU·메모리·디스크를 예약합니다

GCP 잔여 크레딧은 기준 잔액과 Billing Export 사용액으로 추정합니다
노드 선택에는 실행 조건과 남은 용량을 사용합니다

[브로커 구현](https://github.com/MSG-CTF/resource-broker/blob/be7e02fca5bddb46a9fa519e5dae6933eca154de/app/services/candidate_service.py) · [GCP 크레딧 조회](https://github.com/MSG-CTF/resource-broker/blob/be7e02fca5bddb46a9fa519e5dae6933eca154de/docs/GCP_CREDIT_ESTIMATE_API.md)

## 실행 방식에 맞춰 자원 사용

| 문제 유형 | 실행 방식 |
| --- | --- |
| 일반 동적 문제 | 참가자가 실행을 요청하면 K3s 노드에 격리된 컨테이너 생성 |
| 정적 문제 | 파일 제공, 문제 인스턴스 생성 생략 |
| KOTH | 별도 게임 서버에서 제출·경기 진행, 백엔드가 점수 수집 |
| Windows·전용 VM 문제 | 컨테이너와 구분된 VM 실행 경로 사용 |

빠른 기동이 필요한 문제는 시작할 때만 CPU를 높였습니다
준비가 끝나면 CPU와 예약량을 기본값으로 돌려 다른 문제에 쓸 용량을 확보했습니다

[기동 CPU 부스트와 예약 축소](https://github.com/MSG-CTF/instance-scheduler/pull/92) · [실행 구성](platform.md#문제-배포와-실행)

## 종료 뒤 실제 자원까지 정리

문제 종료나 TTL 만료 시 런타임이 실행 자원을 삭제하고, 스케줄러가 정리를 확인한 뒤 브로커에 예약을 반납했습니다
생성 실패나 응답 유실 뒤에도 남은 자원과 예약을 회수하도록 재시도 경로를 연결했습니다

[예약 반납 복구](https://github.com/MSG-CTF/instance-scheduler/pull/87) · [삭제 대기 개선과 검증](https://github.com/MSG-CTF/secure-provisioner/pull/117)

예약을 반납해도 실행 노드 VM은 계속 켜져 있습니다
VM 요금은 계속 발생하며, 대회 운영분에는 무료 크레딧을 적용했습니다

[플랫폼 화면으로 돌아가기](https://msg-ctf.github.io/platform.html#cloud-cost)
