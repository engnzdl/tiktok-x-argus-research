# Signing chain and byte layout

App v47.0.3, package `com.zhiliaoapp.musically`, `aid=1233`, `license_id=1611921764`.
Native signer: `libmetasec_ov.so` (OLLVM + custom VM + JIT). Signature opcodes are dispatched through the native bridge (`0x3000001` produces x-argus and its companions).

## x-argus

Plaintext is a **Protobuf** carrying `device_id`, `install_id`, `app_id`, `version`, `Khronos`, the `SM3(query/body)` digest, and `license_id`, then:

```
SM3 (32-byte digest)
  → SIMON-128/256 (72 rounds)
  → AES-128-CBC
  → Base64
```

Final layout — 546 bytes → 728 base64 chars:

```
[ nonce 8B ][ sm3 32B ][ aes-cbc 506B ]
```

The nonce is random per request (it is **not** a fixed magic). The argus length is set by the Protobuf field count — a shorter argus means missing plaintext fields (not a wrong opcode/seed/header).

## Companion headers

| Header | Format |
|---|---|
| `x-gorgon` | `8404` + nonce(4) + `1001` version tag + payload hex(36) — 52 chars |
| `x-ladon` | 48 chars → 36 bytes |
| `x-khronos` | unix seconds |
| `x-ss-stub` | `MD5(plain body)` uppercase — for gzipped bodies, MD5 over the raw plaintext |

## Guard split

- API endpoints (follow/like/feed/profile) use the **ticket guard** (`tt-ticket-guard-client-data`).
- Passport endpoints (login/2FA) use the **device guard** (`tt-device-guard-client-data`).

Both guards are ECDSA P-256 + SHA256 (DER, low-s) over a `key=value&path=...&timestamp=...` content string. The signature key and ticket are session/device-bound — not published here.

## Host routing

Each request type routes to a different host; a valid signature sent to the wrong host fails regardless:

| Surface | Host |
|---|---|
| profile (other/self) | `api19-core-c-alisg.tiktokv.com` |
| follow/like/digg/unfollow | `api19-normal-c-alisg.tiktokv.com` |
| feed | `api22-core-c-alisg.tiktokv.com` |
| search | `search22-normal-c-alisg.tiktokv.com` |
| passport (login) | `api16-normal-c-alisg.tiktokv.com` |

Full catalog in `docs/endpoints.md`.
