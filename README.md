# tiktok-x-argus-research

Reverse-engineering notes for TikTok's mobile request signing — `x-argus`, `x-gorgon`, `x-ladon`, `x-khronos` — for Android app v47.0.3 (`com.zhiliaoapp.musically`, `aid=1233`). Educational security research.

## What's documented here

- The full signing chain and byte layout (`docs/algorithm.md`)
- The host-routing map and endpoint catalog (`docs/endpoints.md`)
- A distilled reverse-engineering progress log (`docs/status.md`)
- Dynamic-analysis hook scripts (`frida/`)

## The signing chain, in one line

```
Protobuf payload → SM3 (32B digest) → SIMON-128/256 (72 rounds) → AES-128-CBC → Base64
```

The `x-argus` header is 546 bytes (728 base64 chars) laid out as `[nonce 8B][sm3 32B][aes-cbc 506B]`. The companion headers — `x-gorgon` (52), `x-ladon` (48), `x-khronos` (unix seconds) — are produced in the same native pass.

The logic lives inside `libmetasec_ov.so`, an OLLVM control-flow-flattened native library with a custom bytecode VM and JIT. Static disassembly is a dead end; the productive route is running the binary under emulation (unidbg) rather than reading it.

## Status

The **read** surface — profile, feed, search — is reverse-engineered and working end-to-end via unidbg emulation of the native signer. The **write** surface (login) additionally binds a device fingerprint (`f23`) read live from the device property trie at `/dev/__properties__`: the crypto is portable, the device identity isn't. That's the documented open research area in `docs/status.md`.

## Write-up

The full narrative is on dev.to: [I reverse-engineered TikTok's x-argus anti-bot signature](https://dev.to/engnzdl/i-reverse-engineered-tiktoks-x-argus-anti-bot-signature-194p).

## Repo layout

| Path | Contents |
|---|---|
| `docs/algorithm.md` | signing chain + byte layout + header formats |
| `docs/endpoints.md` | host routing + endpoint catalog (v47.0.3) |
| `docs/status.md` | RE progress log, eliminated hypotheses, open area |
| `frida/` | dynamic-analysis hook scripts |

## Disclaimer

Educational security research. This repository documents the structure of a publicly-described signature scheme and dynamic-analysis techniques. **No keys, credentials, device tokens, or working signer are published.** Use only on software you own or are authorized to test.

## License

GPLv3 — see [LICENSE](LICENSE).
