# OpenAPI Client 사용 가이드

## 목적

프론트엔드 API 호출을 백엔드 OpenAPI 스펙 기반으로 점진 전환한다. 현재 1차 적용 범위는 `member`, `product` 서비스다.

React Query 전환은 별도 단계로 진행한다. 현재 단계에서는 생성 client를 기존 서비스 함수에 연결하고, 기존 화면의 반환값 형태를 유지하는 것을 우선한다.

## 생성 명령어

```bash
npm run api:generate
```

이 명령은 `orval.config.ts`를 사용해 아래 파일을 재생성한다.

- `src/api/generated/member`
- `src/api/generated/product`

## 설정 파일

- `orval.config.ts`
- `src/api/openapiMutator.ts`

`openapiMutator.ts`는 Orval의 fetch-style generated client를 기존 `apiClient` 기반 호출 방식에 맞춘 adapter다.

## 현재 적용 범위

### member

`src/features/auth/authApi.ts`에서 아래 API는 생성 client를 사용한다.

- 로그인
- 회원가입
- 이메일 인증 발송
- 이메일 인증 확인
- 비밀번호 재설정 요청
- 비밀번호 재설정 확인
- 내 정보 조회
- 현재 세션 로그아웃

OAuth provider가 동적으로 바뀌는 Google/Kakao 공통 라우팅은 기존 `apiClient` 호출을 유지한다.

### product

`src/features/product/productApi.ts`에서 아래 API는 생성 client를 사용한다.

- 상품 상세 조회
- 카테고리 목록 조회
- 하위 카테고리 조회
- 상품 생성
- 상품 이미지 삭제
- 관리자 카테고리 생성
- 판매자 카테고리 생성
- 관리자 카테고리 수정
- 판매자 카테고리 수정
- 카테고리 삭제
- 상품 ES 재색인

## 수동 호출 유지 항목

`src/features/product/productApi.ts`에서 아래 API는 아직 기존 `apiClient` 호출을 유지한다.

- 상품 목록 조회
- 인기 상품 조회
- 판매자 상품 조회
- 상품 수정
- 상품 이미지 업로드
- 상품 ID 목록 조회

유지 이유는 각 함수 근처 주석에 남겨두었다. 주요 이유는 다음과 같다.

- 생성 client의 `pageable` query 객체가 `[object Object]`로 직렬화될 수 있다.
- 생성 params에 `authenticatedMember` 같은 query 객체가 포함되어 현재 프론트엔드 호출 방식과 맞지 않는다.
- 이미지 업로드 endpoint는 multipart `FormData`가 필요한데, 생성된 `uploadImage` 호출은 JSON body로 만들어졌다.
- 배열 query 직렬화 방식이 기존 repeated `productIds` 계약과 달라질 수 있다.

## 검증 절차

OpenAPI client를 재생성하거나 서비스 연결을 수정한 뒤 아래 명령을 실행한다.

```bash
npm run api:generate
npm run typecheck
npm run build
npm run lint
```

`npm run lint`에는 현재 OpenAPI 작업과 무관한 React Hook dependency warning이 남아 있을 수 있다.

## 추후 작업

- 백엔드 OpenAPI 스펙에서 `pageable`, `authenticatedMember`, multipart upload, array query serialization 정의를 정리한다.
- 스펙이 정리되면 product 수동 호출 항목을 생성 client로 추가 전환한다.
- 그 다음 React Query 전환을 진행한다.
