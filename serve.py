#!/usr/bin/env python3
"""개발용 정적 서버.

브라우저가 src/*.js 를 캐시해 수정이 반영되지 않는 문제를 막기 위해
모든 응답에 no-store 를 붙인다. 개발 전용이며 배포와는 무관하다.

    python3 serve.py [포트]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
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
