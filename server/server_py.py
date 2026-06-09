#!/usr/bin/env python3
"""
轻量级排行榜后端（无需外部依赖），提供 /leaderboard GET 与 POST，数据保存在 leaderboard.json
用法：python server_py.py
"""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), 'leaderboard.json')

def read_list():
    try:
        with open(DATA_FILE, 'r', encoding='utf8') as f:
            return json.load(f)
    except Exception:
        return []

def write_list(lst):
    with open(DATA_FILE, 'w', encoding='utf8') as f:
        json.dump(lst, f, ensure_ascii=False, indent=2)

class Handler(BaseHTTPRequestHandler):
    def _set_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != '/leaderboard':
            self.send_response(404); self.end_headers(); return
        lst = read_list()
        self.send_response(200)
        self._set_cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(lst, ensure_ascii=False).encode('utf8'))

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != '/leaderboard':
            self.send_response(404); self.end_headers(); return
        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length)
            try:
                obj = json.loads(raw.decode('utf8'))
                name = str(obj.get('name', '匿名'))[:20]
                score = int(obj.get('score', 0))
                time = int(obj.get('time', 0)) if obj.get('time') else int(__import__('time').time()*1000)
                timeTo2048 = obj.get('timeTo2048', None)
                if timeTo2048 is not None:
                    try:
                        timeTo2048 = int(timeTo2048)
                    except Exception:
                        timeTo2048 = None
            except Exception:
                self.send_response(400); self.end_headers(); return
            lst = read_list()
            entry = {'name': name, 'score': score, 'time': time}
            if timeTo2048 is not None:
                entry['timeTo2048'] = timeTo2048
            lst.append(entry)
        lst.sort(key=lambda x: x['score'], reverse=True)
        top = lst[:10]
        write_list(top)
        self.send_response(200)
        self._set_cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'top': top}, ensure_ascii=False).encode('utf8'))

def run(host='0.0.0.0', port=3000):
    server = HTTPServer((host, port), Handler)
    print(f'Python leaderboard server running on http://{host}:{port}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()

if __name__ == '__main__':
    run()
