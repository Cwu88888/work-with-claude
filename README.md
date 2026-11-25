# Work With Claude

A tiny pixel-art orange **Clawd** that works alongside Claude.

| State | What Clawd does |
| --- | --- |
| Idle | Wears sunglasses and reads a book |
| Claude is working | Bobs, types and walks, with "…" above its head |
| Turn finished | Jumps, sparkles, toast + system notification, shows the start of the reply |
| Needs your approval / a question | Waves a yellow "!" |

It lives in two places:

1. **Inside Claude Code** (this mod): a row above the prompt, plus `/clawd` for a big pane.
2. **On your desktop** (optional, macOS): a draggable always-on-top Clawd. It shows only while the Claude desktop app is running. Click it to type a message to Claude.

## Install the mod

In a Claude Code terminal session:

```
/plugin install work-with-claude --marketplace <owner>/work-with-claude
```

Answer `y` to add the marketplace, then pick a scope.

## Optional: desktop companion (macOS)

Needs Xcode command line tools (`swiftc`).

```bash
mkdir -p ~/ClawdDesk
swiftc -O desktop/ClawdDesk.swift -o ~/ClawdDesk/ClawdDesk
~/ClawdDesk/ClawdDesk &
```

The mod starts it automatically when a session begins (if the binary is at `~/ClawdDesk/ClawdDesk`). Right-click Clawd and choose **Quit** to stop it.

The mod and the companion talk through two small files in `~/.claude/`: `clawd-state.json`, `clawd-inbox.json`. Nothing leaves your machine.

## Notes

- Early-access mod API; it may need updates as Claude Code changes.
- Not affiliated with Anthropic. Clawd is a fan-made pixel sprite.

MIT licensed.
