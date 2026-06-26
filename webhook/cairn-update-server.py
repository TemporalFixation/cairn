#!/usr/bin/env python3
"""
Cairn update webhook server.
Runs on the HOST (not inside Docker) on 127.0.0.1:9191.
The Cairn app calls POST /update?secret=<WEBHOOK_SECRET> to trigger ./update.sh.
Streams the update log back as plain text.
"""

import http.server
import os
import subprocess
import threading
import socketserver
import sys
import time
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get("WEBHOOK_PORT", "9191"))
SECRET = os.environ.get("WEBHOOK_SECRET", "")
SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root

# Track whether an update is already running
_lock = threading.Lock()
_running = False


class UpdateHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Quiet normal request logs; we log to stdout ourselves
        pass

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        global _running

        parsed = urlparse(self.path)
        if parsed.path != "/update":
            self.send_response(404)
            self.end_headers()
            return

        # Auth check
        params = parse_qs(parsed.query)
        token = params.get("secret", [""])[0]
        if not SECRET or token != SECRET:
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Forbidden")
            print(f"[cairn-webhook] Rejected request — bad or missing secret", flush=True)
            return

        # Concurrency check
        with _lock:
            if _running:
                self.send_response(409)
                self.end_headers()
                self.wfile.write(b"Update already in progress")
                return
            _running = True

        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Transfer-Encoding", "chunked")
        self.end_headers()

        def write_line(text: str):
            line = (text.rstrip() + "\n").encode("utf-8")
            try:
                # chunked encoding
                self.wfile.write(f"{len(line):X}\r\n".encode())
                self.wfile.write(line)
                self.wfile.write(b"\r\n")
                self.wfile.flush()
            except Exception:
                pass

        try:
            write_line("═══════════════════════════════════════")
            write_line("  Cairn — Starting Update")
            write_line(f"  {time.strftime('%Y-%m-%d %H:%M:%S')}")
            write_line("═══════════════════════════════════════")

            proc = subprocess.Popen(
                ["bash", "./update.sh"],
                cwd=SCRIPT_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )

            for line in proc.stdout:
                write_line(line)
                print(line, end="", flush=True)

            proc.wait()
            if proc.returncode == 0:
                write_line("")
                write_line("✓ Update complete.")
            else:
                write_line("")
                write_line(f"✗ Update failed (exit {proc.returncode}).")

        except Exception as e:
            write_line(f"✗ Error: {e}")
            print(f"[cairn-webhook] Error: {e}", flush=True)
        finally:
            # End chunked response
            try:
                self.wfile.write(b"0\r\n\r\n")
                self.wfile.flush()
            except Exception:
                pass
            with _lock:
                _running = False


class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


def main():
    if not SECRET:
        print("ERROR: WEBHOOK_SECRET env var is required.", file=sys.stderr)
        sys.exit(1)

    server = ThreadedServer(("0.0.0.0", PORT), UpdateHandler)
    print(f"[cairn-webhook] Listening on 0.0.0.0:{PORT}", flush=True)
    print(f"[cairn-webhook] Repo root: {SCRIPT_DIR}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[cairn-webhook] Stopped.", flush=True)


if __name__ == "__main__":
    main()
