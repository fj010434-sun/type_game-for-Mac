# 本地预览用：不缓存，方便改完立刻刷新看到效果
import http.server, functools, os
class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass
web = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'web')
http.server.ThreadingHTTPServer(('127.0.0.1', 8765), functools.partial(NoCache, directory=web)).serve_forever()
