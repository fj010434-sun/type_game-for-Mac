import AppKit

// 生成 1024×1024 的应用图标：蓝色圆角底 + 警察 + 键帽
let size: CGFloat = 1024
let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "icon.png"
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size), pixelsHigh: Int(size), bitsPerSample: 8,
                           samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)

let inset: CGFloat = 100
let bg = NSBezierPath(roundedRect: NSRect(x: inset, y: inset, width: size - inset * 2, height: size - inset * 2), xRadius: 185, yRadius: 185)
NSGradient(starting: NSColor(red: 0.37, green: 0.72, blue: 1, alpha: 1), ending: NSColor(red: 0.18, green: 0.44, blue: 0.93, alpha: 1))!.draw(in: bg, angle: -90)

// 键帽
let key = NSBezierPath(roundedRect: NSRect(x: 300, y: 170, width: 424, height: 230), xRadius: 50, yRadius: 50)
NSColor(red: 0.12, green: 0.16, blue: 0.27, alpha: 0.35).setFill()
NSBezierPath(roundedRect: NSRect(x: 300, y: 150, width: 424, height: 230), xRadius: 50, yRadius: 50).fill()
NSColor.white.setFill(); key.fill()
let para = NSMutableParagraphStyle(); para.alignment = .center
("F J" as NSString).draw(in: NSRect(x: 300, y: 195, width: 424, height: 180), withAttributes: [
    .font: NSFont.systemFont(ofSize: 140, weight: .heavy),
    .foregroundColor: NSColor(red: 0.12, green: 0.16, blue: 0.27, alpha: 1), .paragraphStyle: para])

("👮" as NSString).draw(in: NSRect(x: 212, y: 390, width: 600, height: 520), withAttributes: [
    .font: NSFont.systemFont(ofSize: 430), .paragraphStyle: para])

NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
