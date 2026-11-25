import Cocoa

let W = 17, H = 15, PX: CGFloat = 4
let colors: [Character: NSColor] = [
  "B": NSColor(srgbRed: 0xD9/255, green: 0x77/255, blue: 0x57/255, alpha: 1),
  "D": NSColor(srgbRed: 0xB8/255, green: 0x5C/255, blue: 0x3E/255, alpha: 1),
  "E": NSColor(srgbRed: 0x2A/255, green: 0x1A/255, blue: 0x14/255, alpha: 1),
  "W": .white,
  "Y": NSColor(srgbRed: 0xF5/255, green: 0xC5/255, blue: 0x42/255, alpha: 1),
  "G": NSColor(srgbRed: 0x5B/255, green: 0xBF/255, blue: 0x6A/255, alpha: 1),
  "S": NSColor(srgbRed: 0x16/255, green: 0x16/255, blue: 0x1A/255, alpha: 1),
  "P": NSColor(srgbRed: 0xF4/255, green: 0xEB/255, blue: 0xD6/255, alpha: 1),
  "K": NSColor(srgbRed: 0x7A/255, green: 0x4B/255, blue: 0x2E/255, alpha: 1),
  "N": NSColor(srgbRed: 0x9C/255, green: 0x8F/255, blue: 0x78/255, alpha: 1),
]
let labels = ["idle": "看书中…", "working": "正在干活…", "done": "搞定啦！", "asking": "需要你回复！"]
let stateFile = NSHomeDirectory() + "/.claude/clawd-state.json"

func sprite(_ mode: String, _ t: Int) -> [[Character]] {
  var g = Array(repeating: Array(repeating: Character("."), count: W), count: H)
  func put(_ x: Int, _ y: Int, _ c: Character) { if x >= 0 && x < W && y >= 0 && y < H { g[y][x] = c } }
  func rect(_ x: Int, _ y: Int, _ w: Int, _ h: Int, _ c: Character, _ dx: Int = 0) {
    for j in 0..<h { for i in 0..<w { put(x + i + dx, y + j, c) } }
  }
  let step = t % 2
  let dx = mode == "asking" ? (step == 1 ? 1 : -1) : 0
  let dy = mode == "working" ? step : (mode == "done" ? (step == 1 ? -2 : -1) : 0)
  let top = 4 + dy
  rect(3, top, 11, 6, "B", dx); rect(3, top + 5, 11, 1, "D", dx)
  var armL = 2, armR = 2
  if mode == "working" { armL = step == 1 ? 1 : 3; armR = step == 1 ? 3 : 1 }
  else if mode == "done" { armL = 0; armR = 0 }
  else if mode == "asking" { armR = 0 }
  rect(1, top + armL, 2, 2, "B", dx); rect(14, top + armR, 2, 2, "B", dx)
  let longA = mode != "working" || step == 0
  for (i, x) in [4, 6, 10, 12].enumerated() {
    let h = mode == "working" ? (((i % 2 == 0) == longA) ? 2 : 1) : 2
    rect(x, 10, 1, h, "D", dx)
  }
  if mode == "done" {
    for x in [4, 10] { put(x, top + 2, "E"); put(x + 1, top + 1, "E"); put(x + 2, top + 2, "E") }
    rect(7, top + 4, 3, 1, "E", dx)
  } else if mode == "asking" {
    for x in [5, 11] { rect(x, top + 1, 2, 3, "E", dx); put(x + dx, top + 1, "W") }
  } else if mode == "idle" {
    rect(4, top + 1, 3, 2, "S", dx); rect(10, top + 1, 3, 2, "S", dx); rect(7, top + 1, 3, 1, "S", dx)
    if t % 8 < 2 { put(4, top + 1, "W") }
    rect(4, top + 3, 4, 3, "P", dx); rect(8, top + 3, 1, 3, "K", dx); rect(9, top + 3, 4, 3, "P", dx)
    if t % 8 == 5 { rect(9, top + 2, 3, 1, "P", dx) }
    let l = t % 2 == 0
    rect(5, top + 4, l ? 2 : 1, 1, "N", dx); rect(10, top + 4, l ? 1 : 2, 1, "N", dx)
  } else {
    rect(5, top + 2, 1, 2, "E", dx); rect(11, top + 2, 1, 2, "E", dx)
  }
  if mode == "working" { for i in 0..<(t % 3) + 1 { put(6 + i * 2, 1, "Y") } }
  else if mode == "done" {
    let a = step == 1 ? 0 : 1
    put(1, 2 + a, "Y"); put(15, 3 - a, "Y"); put(0, 5, "G"); put(16, 6, "G")
  } else if mode == "asking" { rect(8, 0, 1, 2, "Y"); put(8, 3, "Y") }
  return g
}

class PetView: NSView {
  var mode = "idle", tick = 0, reply = ""
  var onClick: (() -> Void)?
  var downAt = NSPoint.zero, origin = NSPoint.zero, moved = false
  override var isFlipped: Bool { true }
  override var mouseDownCanMoveWindow: Bool { false }
  override func mouseDown(with e: NSEvent) {
    downAt = NSEvent.mouseLocation; origin = window!.frame.origin; moved = false
  }
  override func mouseDragged(with e: NSEvent) {
    let p = NSEvent.mouseLocation
    if abs(p.x - downAt.x) + abs(p.y - downAt.y) > 3 { moved = true }
    if moved { window!.setFrameOrigin(NSPoint(x: origin.x + p.x - downAt.x, y: origin.y + p.y - downAt.y)) }
  }
  override func mouseUp(with e: NSEvent) { if !moved { onClick?() } }
  override func draw(_ r: NSRect) {
    let g = sprite(mode, tick)
    for (y, row) in g.enumerated() { for (x, c) in row.enumerated() {
      guard let col = colors[c] else { continue }
      col.setFill()
      NSRect(x: CGFloat(x) * PX, y: CGFloat(y) * PX, width: PX, height: PX).fill()
    } }
    var text = labels[mode] ?? ""
    if mode == "done" && !reply.isEmpty { text = String(reply.prefix(22)) + (reply.count > 22 ? "…" : "") }
    let attrs: [NSAttributedString.Key: Any] = [
      .font: NSFont.systemFont(ofSize: 10, weight: .bold),
      .foregroundColor: mode == "idle" ? NSColor.lightGray : (mode == "done" ? colors["G"]! : colors["Y"]!),
    ]
    let s = NSAttributedString(string: text, attributes: attrs)
    let sz = s.size()
    let box = NSRect(x: (bounds.width - sz.width) / 2 - 8, y: CGFloat(H) * PX + 3, width: sz.width + 16, height: sz.height + 4)
    NSColor(white: 0.1, alpha: 0.85).setFill()
    NSBezierPath(roundedRect: box, xRadius: 8, yRadius: 8).fill()
    s.draw(at: NSPoint(x: box.minX + 8, y: box.minY + 2))
  }
  override func menu(for event: NSEvent) -> NSMenu? {
    let m = NSMenu()
    m.addItem(withTitle: "退出 Clawd", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
    return m
  }
}

class ChatPanel: NSPanel, NSTextFieldDelegate {
  let field = NSTextField()
  init() {
    super.init(contentRect: NSRect(x: 0, y: 0, width: 280, height: 34),
               styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
    isOpaque = false; backgroundColor = .clear; level = .floating; hasShadow = true
    let box = NSView(frame: NSRect(x: 0, y: 0, width: 280, height: 34))
    box.wantsLayer = true; box.layer?.cornerRadius = 10
    box.layer?.backgroundColor = NSColor(white: 0.12, alpha: 0.95).cgColor
    field.frame = NSRect(x: 10, y: 6, width: 260, height: 22)
    field.isBordered = false; field.drawsBackground = false
    field.textColor = .white; field.focusRingType = .none
    field.placeholderAttributedString = NSAttributedString(string: "跟 Claude 说点什么…",
      attributes: [.foregroundColor: NSColor.gray])
    field.delegate = self
    box.addSubview(field); contentView = box
  }
  override var canBecomeKey: Bool { true }
  func control(_ c: NSControl, textView: NSTextView, doCommandBy sel: Selector) -> Bool {
    if sel == #selector(insertNewline(_:)) {
      let t = field.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
      if !t.isEmpty {
        let obj: [String: Any] = ["seq": Int(Date().timeIntervalSince1970 * 1000), "text": t]
        if let d = try? JSONSerialization.data(withJSONObject: obj) {
          try? d.write(to: URL(fileURLWithPath: NSHomeDirectory() + "/.claude/clawd-inbox.json"))
        }
      }
      field.stringValue = ""; orderOut(nil); return true
    }
    if sel == #selector(cancelOperation(_:)) { orderOut(nil); return true }
    return false
  }
}

class App: NSObject, NSApplicationDelegate {
  var win: NSPanel!, view: PetView!
  var lastSeq = -1
  func applicationDidFinishLaunching(_ n: Notification) {
    let size = NSSize(width: CGFloat(W) * PX, height: CGFloat(H) * PX + 22)
    win = NSPanel(contentRect: NSRect(origin: NSPoint(x: 200, y: 200), size: size),
                  styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
    win.isOpaque = false; win.backgroundColor = .clear; win.hasShadow = false
    win.level = .floating; win.isMovableByWindowBackground = false
    win.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
    win.hidesOnDeactivate = false
    view = PetView(frame: NSRect(origin: .zero, size: size))
    win.contentView = view
    view.onClick = { [unowned self] in self.toggleChat() }
    win.setFrameAutosaveName("ClawdDeskPos"); win.setContentSize(size)
    Timer.scheduledTimer(withTimeInterval: 0.45, repeats: true) { _ in self.tick() }
  }
  var chat: ChatPanel?
  func toggleChat() {
    if let c = chat, c.isVisible { c.orderOut(nil); return }
    let c = chat ?? ChatPanel()
    chat = c
    let f = win.frame
    c.setFrameOrigin(NSPoint(x: f.midX - c.frame.width / 2, y: f.minY - c.frame.height - 6))
    NSApp.activate(ignoringOtherApps: true)
    c.makeKeyAndOrderFront(nil)
    c.makeFirstResponder(c.field)
  }
  var shown = false
  func claudeRunning() -> Bool {
    NSWorkspace.shared.runningApplications.contains { $0.bundleIdentifier == "com.anthropic.claudefordesktop" }
  }
  func tick() {
    let up = claudeRunning()
    if up != shown {
      shown = up
      if up { win.orderFrontRegardless() } else { win.orderOut(nil); chat?.orderOut(nil) }
    }
    if !up { return }
    var mode = "idle", seq = 0
    if let d = FileManager.default.contents(atPath: stateFile),
       let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any] {
      mode = j["mode"] as? String ?? "idle"; seq = j["seq"] as? Int ?? 0; view.reply = j["reply"] as? String ?? ""
    }
    if seq != lastSeq {
      lastSeq = seq
      if mode == "done" { NSSound(named: "Glass")?.play() }
      if mode == "asking" { NSSound(named: "Ping")?.play() }
    }
    view.mode = mode; view.tick += 1; view.needsDisplay = true
  }
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let delegate = App()
app.delegate = delegate
app.run()
