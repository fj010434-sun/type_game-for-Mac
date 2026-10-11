import AppKit
import WebKit
import UniformTypeIdentifiers

final class GameWebView: WKWebView {
    // 按键交给网页处理；网页里 preventDefault 后系统不会发出“咚”的提示音
    override var acceptsFirstResponder: Bool { true }
}

/// 用 app://game/ 提供 Resources/web 里的文件，让 ES 模块、模型、音效都能正常加载
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    let root: URL
    init(root: URL) { self.root = root.standardizedFileURL }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path.removingPercentEncoding ?? url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL
        guard file.path.hasPrefix(root.path + "/"), let data = try? Data(contentsOf: file) else {
            task.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        let mime: String
        switch file.pathExtension.lowercased() {
        case "js", "mjs": mime = "text/javascript"
        case "glb": mime = "model/gltf-binary"
        case "m4a": mime = "audio/mp4"
        default: mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        }
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: [
            "Content-Type": mime,
            "Content-Length": String(data.count),
            "Access-Control-Allow-Origin": "*",
        ])!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow!
    var webView: GameWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []
        if ProcessInfo.processInfo.environment["KC_SELFTEST"] != nil { config.websiteDataStore = .nonPersistent() }
        if let dir = Bundle.main.resourceURL?.appendingPathComponent("web") {
            config.setURLSchemeHandler(BundleSchemeHandler(root: dir), forURLScheme: "app")
        }
        webView = GameWebView(frame: .zero, configuration: config)

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1280, height: 800),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered, defer: false)
        window.title = "键盘小警察"
        window.minSize = NSSize(width: 960, height: 620)
        window.contentView = webView
        window.delegate = self
        window.center()
        window.setFrameAutosaveName("KeyboardCopWindow")
        window.collectionBehavior = [.fullScreenPrimary]
        window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(webView)

        webView.load(URLRequest(url: URL(string: "app://game/index.html")!))
        buildMenu()
        NSApp.activate(ignoringOtherApps: true)
        if let out = ProcessInfo.processInfo.environment["KC_SELFTEST"] { selfTest(outDir: out) }
    }

    // 自检：用真实的键盘事件玩几秒，再把画面和状态存下来（开发时用）
    func selfTest(outDir: String) {
        func key(_ chars: String, _ code: UInt16) {
            for type in [NSEvent.EventType.keyDown, .keyUp] {
                if let e = NSEvent.keyEvent(with: type, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                            windowNumber: window.windowNumber, context: nil, characters: chars,
                                            charactersIgnoringModifiers: chars, isARepeat: false, keyCode: code) {
                    window.sendEvent(e)
                }
            }
        }
        let codes: [Character: UInt16] = ["a": 0, "s": 1, "d": 2, "f": 3, "h": 4, "g": 5, "z": 6, "x": 7, "c": 8, "v": 9, "b": 11, "q": 12, "w": 13, "e": 14, "r": 15, "y": 16, "t": 17, "o": 31, "u": 32, "i": 34, "p": 35, "l": 37, "j": 38, "k": 40, ";": 41, "n": 45, "m": 46, " ": 49]
        func snap(_ name: String, then: @escaping () -> Void) {
            webView.evaluateJavaScript("JSON.stringify(window.__kcState && window.__kcState())") { result, _ in
                try? ((result as? String) ?? "null").write(toFile: "\(outDir)/\(name).json", atomically: true, encoding: .utf8)
                self.webView.takeSnapshot(with: nil) { image, _ in
                    if let tiff = image?.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff), let png = rep.representation(using: .png, properties: [:]) {
                        try? png.write(to: URL(fileURLWithPath: "\(outDir)/\(name).png"))
                    }
                    then()
                }
            }
        }
        func typeNext(_ left: Int, done: @escaping () -> Void) {
            guard left > 0 else { return done() }
            webView.evaluateJavaScript("window.__kcState().state === 'play' ? window.__kcState().line[window.__kcState().idx] : null") { r, _ in
                guard let ch = (r as? String)?.first, let code = self.codes(ch, codes) else { return done() }
                key(String(ch), code)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { typeNext(left - 1, done: done) }
            }
        }
        // 等待真实状态；加载速度不会再决定自检是否误发按键。
        func waitFor(_ expression: String, attempts: Int = 240, then: @escaping () -> Void) {
            webView.evaluateJavaScript(expression) { result, error in
                if error == nil, (result as? Bool) == true { return then() }
                guard attempts > 0 else {
                    try? "Timed out: \(expression)".write(toFile: "\(outDir)/failure.txt", atomically: true, encoding: .utf8)
                    return NSApp.terminate(nil)
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { waitFor(expression, attempts: attempts - 1, then: then) }
            }
        }
        func play() {
            key("\r", 36)
            waitFor("window.__kcState().state === 'play'") {
                typeNext(24) {
                    snap("2-play") {
                        if ProcessInfo.processInfo.environment["KC_WARDROBE_TEST"] == nil { return NSApp.terminate(nil) }
                        typeNext(40) {
                            waitFor("Boolean(document.querySelector('#result.show')) && window.__kcState().xp === 35") { snap("4-result") { NSApp.terminate(nil) } }
                        }
                    }
                }
            }
        }
        waitFor("Boolean(document.querySelector('#menu.show'))") {
            snap("1-menu") {
                if ProcessInfo.processInfo.environment["KC_WARDROBE_TEST"] == nil { return play() }
                self.webView.evaluateJavaScript("document.getElementById('wardrobeBtn').click()") { _, _ in
                    waitFor("Boolean(document.querySelector('#wardrobe.show'))") {
                        self.webView.evaluateJavaScript("document.querySelector('[data-item=hat-helmet]').click(); document.getElementById('wardrobeCancel').click()") { _, _ in
                            snap("5-cancel") {
                                self.webView.evaluateJavaScript("document.getElementById('wardrobeBtn').click(); document.querySelector('[data-item=hat-none]').click()") { _, _ in
                                    snap("3-wardrobe") {
                                        self.webView.evaluateJavaScript("document.getElementById('wardrobeSave').click()") { _, _ in play() }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    func codes(_ ch: Character, _ table: [Character: UInt16]) -> UInt16? { table[ch] }

    func buildMenu() {
        let main = NSMenu()
        let appItem = NSMenuItem()
        main.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "全屏", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "退出键盘小警察", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        NSApp.mainMenu = main
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
