# Reverse-engineering progress log (distilled)

## Solved

- **Signing chain** — SM3 → SIMON-128/256 (72 rounds) → AES-128-CBC → Base64, with the `[nonce][sm3][aes]` layout. (See `algorithm.md`.)
- **unidbg emulation** — `libmetasec_ov.so` runs under unidbg and produces signatures; the read surface (profile/feed/search) is verified end-to-end with real data.
- **Native entry + dispatch** — the sign entry and its opcode dispatch are mapped; `0x3000001` produces the read-surface signatures.
- **TLS fingerprint** — the API only accepts a client presenting Android's OkHttp3_13 fingerprint; transport rides on a TLS stack that mimics it (`wreq`).
- **Header formats** — `x-ss-stub = MD5(plain body)` (uppercase), companion header structures.
- **Host routing** — per-surface host map (wrong host fails even with a valid signature).
- **Guard split** — ticket guard vs device guard, ECDSA P-256 + SHA256 (DER, low-s).

## Eliminated hypotheses

Tested and ruled out as the cause of the shorter read-vs-write signature: seed value, header count (29), opcode/`i2`, device_id/install_id, session handle, device info, `.msdata` VM bytecode files, `/proc/stat`, property hook (breaks bootstrap).

## Open research area — the device fingerprint

The write surface (login) requires a longer `x-argus` than the read surface. The byte gap traces to a **device fingerprint (`f23`)** that the native signer builds during bootstrap from the device's property trie (`/dev/__properties__`) and hardware identity — the crypto is portable, the device identity isn't. Emulating that fingerprint byte-for-byte is the documented open problem.

The productive live-analysis paths (not shipped here):
1. **Frida sign-proxy** — call the native signer on a real device and read the full signature (note the JNI arg trap: the URL is passed via the headers array, not the `str` parameter).
2. **Deobfuscate `f23`** — recover the fingerprint generation from the `.so` (deollvm/angr), feed it back into emulation.

## Toolchain

unidbg, Frida, mitmproxy, wreq (TLS mimicry), jadx, deollvm/angr/d810 (deobfuscation).
