# TikTok Android v47.0.3 — Endpoint catalog (RE reference)

All endpoints captured via MuMu Pro (Mac) + patched APK + mitmproxy. Full request/response for each flow is under `flows/`. This file is the at-a-glance summary for client implementation.

## Hosts

| Host | Role |
|---|---|
| `aggr16-normal.tiktokv.us` | anonymous session's main API (aggregation) |
| `aggr32-normal.tiktokv.com` | logged-in FYP feed (For You) |
| `api19-core-c-alisg.tiktokv.com` | logged-in session's main API (profile, IM, relation) |
| `api19-normal-c-alisg.tiktokv.com` | logged-in session's secondary API (IM, relation, upvote) |
| `api22-core-c-alisg.tiktokv.com` | logged-in FYP feed (aweme/v2/feed + follow/feed) |
| `api16-normal-c-alisg.tiktokv.com` | passport (login) backend |
| `rc-verification16-...tiktokv.us` | risk-control / captcha backend |
| `mcs-ttp2.us.tiktok.com` | captcha MCS service (challenge) |
| `web-ttp2.us.tiktok.com` | captcha H5 webview |
| `frontier-va.tiktokv.com` (wss) | IM WebSocket (realtime messages) |
| `p16/p19-common-sign.tiktokcdn-*.com` | CDN (avatar/video/cover, signed URLs) |
| `mon-boot / tnc16 / log16 / mssdk22` | telemetry / domain resolution / log / risk report |

## Signing chain (on every signed request)

```
x-argus          ← long base64 (the main signature)
x-gorgon         ← 8404... prefix
x-khronos        ← unix timestamp
x-ladon          ← base64
x-ss-stub        ← 32 hex
x-ss-req-ticket  ← ms timestamp
x-ss-dp          ← aid (1233)
x-tt-pba-encode  ← hex (e.g. 1040)
x-common-params-v2 ← all device params (on feed)
x-tt-ttnet-origin-host ← actual origin host
```

## Cookie chain (logged-in)

```
sessionid / sessionid_ss / sid_tt / sid_guard = <32hex>
multi_sids = <userId>%3A<sessionid>
uid_tt / uid_tt_ss = <64hex>
odin_tt = <128hex>
install_id = <iid>
passport_csrf_token / passport_csrf_token_default = <32hex>
msToken = <base64>
d_ticket = <32hex>
store-idc / tt-target-idc / store-country-code
```

## Device fingerprint (common params on every request)

`device_type=SM-S9180, device_brand=Samsung, os_api=32, os_version=12, resolution=2160*3840, dpi=640, host_abi=arm64-v8a, aid=1233, app_name=musical_ly, version_code=470003, version_name=47.0.3, sys_region=TR, current_region=US, residence=US, mcc_mnc=31001, timezone_name=Europe/Istanbul, timezone_offset=10800, iid, device_id, channel=googleplay`

## Auth (passport) — login flow

| Step | Endpoint | Method | Purpose |
|---|---|---|---|
| 1 | `passport/app/store_region/` | POST | region registration |
| 2 | `passport/auth/get_nonce/` | POST | nonce + msToken rotate + store-sec-uid |
| 3 | `passport/user/check_login_name_registered/?login_name=X` | GET | is username registered |
| 4 | `passport/user/login/pre_check/` | POST | login type (login_page=pwd) |
| 5 | `passport/user/login/` | POST | password login (2FA → 2046) |
| 6 | `passport/email/send_code/` | POST | send email OTP (email_ticket) |
| 7 | `passport/email/check_code/` | POST | verify OTP |
| 8 | `passport/user/login/` (2nd) | POST | with verified ticket → session |
| 9 | `passport/safe/two_step_verification/add_auth_device/v2/` | POST | trust device |
| 10 | `passport/sotl/blobstore/update/` + `cloud_token/enable/` + `user/basic_info/` | POST | post-login bootstrap |

2FA: `user/login` → `error_code=2046` → `verify_ticket` + `not_login_ticket` → `send_code` → `check_code` → `login` again.

## Content

| Endpoint | Method | Purpose |
|---|---|---|
| `aweme/v2/feed/` | POST | For You feed (protobuf, gzip body / br resp) |
| `aweme/v2/follow/feed/check_items` | POST | follow-feed check (JSON body: items + statistics + score + recent_read_item_ids) |
| `aweme/v2/comment/list/` | GET | comments (cursor pagination) |
| `aweme/v1/aweme/stats/` | POST | video stats |
| `aweme/v1/private/aweme/` | GET | private videos |

## Search (8 tabs)

| Tab | Endpoint | search_channel |
|---|---|---|
| Top | `aweme/v2/search/general/single/` | musically_general |
| Videos | `aweme/v1/search/item/` | musically_video |
| Users | `aweme/v1/discover/search/` | musically_user |
| Live | `aweme/v1/live/search/` | musically_live |
| Sounds | `aweme/v1/music/search/` | musically_music |
| Places | `aweme/v1/search/place/` | tiktok_places |
| Photos | `aweme/v1/search/photo/` | mt_photo |
| Hashtags | `aweme/v1/challenge/search/` | musically_challenge |

- Auto-complete: `aweme/v1/search/sug/stream/` (STREAM_FORECAST, request per keystroke)
- Pagination: `aweme/v2/search/loadmore/`
- Other: `sug_pre_info`, `sug_cached_words`, `search/settings`

## Profile

| Endpoint | Method | Purpose |
|---|---|---|
| `tiktok/user/profile/other/v1?scene_id=201&sec_user_id=X` | GET | other user's profile |
| `tiktok/user/profile/self/v1?scene_id=101` | GET | own profile (session cookie) |
| `aweme/v1/aweme/post/` | GET | posts (max_cursor; filter_private=1 on self) |
| `tiktok/v1/mix/list/` | GET | mix/collection tab |
| `tiktok/v1/upvote/item/list` | GET | likes tab |
| `aweme/v1/user/following/list/` | GET | following list (self source_type=1, other=4) |
| `aweme/v1/user/follower/list/` | GET | followers (same source_type split) |
| `tiktok/user/relation/maf/list/v1?scene=13` | GET | suggested accounts |
| `tiktok/user/relation/search/v1` | GET | in-list search (to_uid + search_string) |

## Engagement (write actions)

| Action | Endpoint | Method | Param |
|---|---|---|---|
| Follow/Unfollow | `aweme/v1/commit/follow/user/` | POST | type=1/0 |
| Video like | `aweme/v1/commit/item/digg/` | POST | type=1/0 |
| Comment like | `aweme/v1/comment/digg/` | GET | digg_type=2 (toggle) |
| Save video | `aweme/v1/aweme/collect/` | GET | action=1/0 |
| Comment reply | `aweme/v1/comment/publish/` | POST | text + reply_id |
| Repost | `tiktok/v1/upvote/publish` | POST | has_reposted=true |
| Delete repost | `tiktok/v1/upvote/delete` | POST | item_id |

## Inbox + DM

| Endpoint | Method | Purpose |
|---|---|---|
| `tiktok/v1/im/chat/notice/` | GET | inbox (source_type=inbox) / chat (source_type=dm_chat + conversation_id) |
| `tiktok/v1/im/chat/notice/ack/` | POST | read ack |
| `v1/conversation/preassigned_ids` | POST | message ID reservation |
| `v1/message/get` / `get_by_user_combo` | POST | fetch messages |
| `v1/message/batch_ack` | POST | batch ack |
| `v2/conversation/get_info` | POST | conversation info |
| `v3/conversation/get_read_index` | POST | read status |
| `tiktok/v2/im/typing_recommendation?raw_keyword=X` | GET | typing suggestion |
| **`wss://frontier-va.tiktokv.com`** | WS | SEND messages (realtime) |

conversation_id format: `0:1:<other_user_id>:<my_user_id>`

## Captcha (risk-control)

```
GET web-ttp2.us.tiktok.com/verifycenter/ttcaptcha/?verify_host=rc-verification16...&verify_data={code:10000,type:verify,subtype:3d,detail:<base64>}
POST mcs-ttp2.us.tiktok.com/v1/user/webid
POST mcs-ttp2.us.tiktok.com/v1/list  (challenge list)
```

## Critical rules

1. **Anonymous vs logged-in host:** anonymous → `aggr16`, logged-in → `api19-core/api19-normal`. All requests go to api19 after login.
2. **Body compression:** request bodies use `x-bd-content-encoding: gzip` (gzipped form-urlencoded); responses use `br` (brotli).
3. **Toggles:** like/save/follow toggle via `type`/`action` param; comment digg is a GET toggle; repost publish/delete are separate.
4. **Pagination:** feed/comment/search = `cursor`; profile posts = `max_cursor`; follower/following = `max_time` + `page_token`; MAF = `page_token` (base64 offset).
5. **msToken rotation:** `get_nonce` and `send_code` rotate msToken — the client must fetch a fresh msToken on every auth request.
6. **Signing (x-argus/x-gorgon/x-ladon/x-khronos):** the hardest part of client implementation. Computed in the native signer (`libmetasec_ov.so`); must be re-implemented after RE, or computed via a real device/emulator.
