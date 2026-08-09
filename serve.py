#!/usr/bin/env python3
"""개발용 정적 서버.

브라우저가 src/*.js 를 캐시해 수정이 반영되지 않는 문제를 막기 위해
모든 응답에 no-store 를 붙인다. 개발 전용이며 배포와는 무관하다.

    python3 serve.py [포트]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


PROJECT_ROOT = Path(__file__).resolve().parent
CAPTURE_ROUTE = "/__capture/c0b-the-job.webm"
CAPTURE_TARGET = PROJECT_ROOT / "video" / "c0b-the-job.webm"
MAX_CAPTURE_BYTES = 100 * 1024 * 1024


class NoCacheHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if urlsplit(self.path).path != CAPTURE_ROUTE:
            self.send_error(404)
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_error(400, "Invalid Content-Length")
            return
        if length <= 0 or length > MAX_CAPTURE_BYTES:
            self.send_error(413, "Capture is empty or too large")
            return

        payload = self.rfile.read(length)
        if len(payload) != length:
            self.send_error(400, "Incomplete capture")
            return

        CAPTURE_TARGET.parent.mkdir(parents=True, exist_ok=True)
        CAPTURE_TARGET.write_bytes(payload)
        self.send_response(201)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"saved")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):  # 콘솔을 조용하게
        pass


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8124
    handler = partial(NoCacheHandler, directory=".")
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"안개항의 상속자 — http://localhost:{port} (no-store)")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
