export default async function handler(req, res) {
  // /api 요청을 Vercel 환경변수에 설정된 실제 백엔드 URL로 프록시한다.
  const backendUrl = process.env.VITE_SERVER_URL;
  const targetUrl = backendUrl ? `${backendUrl}${req.url}` : null;
  const isSseRequest = req.url?.includes("/api/notifications/stream");

  // 백엔드 URL이 없으면 프록시할 대상이 없으므로 즉시 설정 오류를 반환한다.
  if (!targetUrl) {
    res.status(500).json({
      error: {
        code: "VITE_SERVER_URL_MISSING",
        message: "VITE_SERVER_URL is not configured.",
      },
    });
    return;
  }

  // 원본 요청 헤더는 유지하되, Vercel 함수의 host 헤더는 백엔드로 전달하지 않는다.
  const headers = Object.fromEntries(
    Object.entries(req.headers).filter(([key]) => key !== "host")
  );

  try {
    const fetchOptions = {
      method: req.method,
      headers,
    };

    // 본문을 가질 수 있는 요청 메서드는 원본 요청 본문을 그대로 백엔드로 전달한다.
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      fetchOptions.body = Buffer.concat(chunks);
    }

    // SSE 요청은 클라이언트 연결이 끊기면 백엔드 요청도 함께 중단한다.
    let controller = null;
    if (isSseRequest) {
      controller = new AbortController();
      fetchOptions.signal = controller.signal;
      res.on("close", () => controller.abort());
    }

    const response = await fetch(targetUrl, fetchOptions);

    // 프록시 또는 스트리밍 응답을 깨뜨릴 수 있는 헤더는 제외한다.
    response.headers.forEach((value, key) => {
      if (
        key !== "transfer-encoding" &&
        key !== "content-length" &&
        key !== "content-encoding" &&
        key !== "connection"
      ) {
        res.setHeader(key, value);
      }
    });

    // SSE 이벤트가 브라우저에 즉시 도달하도록 중간 버퍼링을 막는 헤더를 설정한다.
    if (isSseRequest || response.headers.get("content-type")?.includes("text/event-stream")) {
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
    }

    res.status(response.status);
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    // SSE 응답은 전체를 버퍼링하지 않고 청크 단위로 바로 흘려보낸다.
    if (isSseRequest || response.headers.get("content-type")?.includes("text/event-stream")) {
      const reader = response.body?.getReader();

      if (!reader) {
        res.end();
        return;
      }

      const decoder = new TextDecoder();

      try {
        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          if (value) {
            res.write(Buffer.from(value));
          }
        }
      } finally {
        try {
          await reader.cancel();
        } catch {
          // 클라이언트 연결이 이미 끊긴 뒤에는 reader 취소가 실패할 수 있지만 정리는 계속 진행한다.
        }

        const tail = decoder.decode();
        if (tail) {
          res.write(tail);
        }

        res.end();
      }

      return;
    }

    // 일반 응답은 백엔드에서 받은 원본 바이트를 그대로 클라이언트에 반환한다.
    const buffer = await response.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (error) {
    // 아직 응답이 시작되지 않았다면 프록시 실패를 JSON 오류로 반환한다.
    if (!res.headersSent) {
      res.status(502).json({
        error: {
          code: error?.name === "AbortError" ? "UPSTREAM_ABORTED" : "PROXY_REQUEST_FAILED",
          message:
            error?.name === "AbortError"
              ? "The upstream request was aborted."
              : error?.message || "The proxy request failed.",
        },
      });
      return;
    }

    // 스트리밍 응답이 이미 시작된 경우에는 연결을 종료하는 것이 안전한 처리다.
    res.end();
  }
}
