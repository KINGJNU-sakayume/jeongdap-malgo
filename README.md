# 정답 말고

정답은 하나. 틀리는 방법은 여러 개. 다 찾아보세요.

제1정답처리과 민원 창구에서 '이상 없음 확인서'를 떼는 동안, 아주 쉬운 서식을 일부러 틀려 가며 숨은 반려 사유를 모으는 한국어 퍼즐 코미디.

- 설계 문서: [`docs/`](docs/README.md)
- 대사: [`content/lines/`](content/lines/)
- 개발 규칙: [`CLAUDE.md`](CLAUDE.md)

Vite · React · TypeScript · Tailwind · Vitest · GitHub Pages. 서버 없음, 저장은 브라우저 localStorage.

## 개발

```bash
npm ci
npm run dev          # 개발 서버
npm test             # Vitest (test:watch는 변경 감시)
npm run typecheck    # tsc --noEmit
npm run build        # 타입 검사 + 빌드
npm run preview      # 빌드 결과를 로컬에서 확인
```

`main`에 푸시하면 `.github/workflows/deploy.yml`이 GitHub Pages로 배포합니다 (저장소 Settings → Pages → Source: GitHub Actions).
