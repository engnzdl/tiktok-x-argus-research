// catch_signing.js — attach to running app, catch signature strings
var POINTER_SIZE = Process.pointerSize;

function isInteresting(s) {
    if (!s) return false;
    if (s.length < 20) return false;
    // base64/hex/signature-like or long
    return /^[A-Za-z0-9+/=|]+$/.test(s) && s.length >= 40;
}

// NewStringUTF (idx 167) — ASCII
var newStringUTF = ptr("0x7b9c0a2d80");
Interceptor.attach(newStringUTF, {
    onEnter: function (args) {
        this.ret = this.returnAddress;
        try { this.str = args[1].isNull() ? null : args[1].readCString(); } catch (e) { this.str = null; }
    },
    onLeave: function () {
        var mod = Process.findModuleByAddress(this.ret);
        if (!mod) return;
        var n = mod.name;
        if (n.indexOf("metasec") !== -1 || n.indexOf("sscronet") !== -1) {
            var s = this.str || "";
            if (s.length >= 20) {
                console.log("[UTF8] " + n + " +0x" + this.ret.sub(mod.base).toString(16) + " :: " + s);
            }
        }
    }
});

// NewString (idx 163) — UTF-16
var newString = ptr("0x7b9c0a116c");
Interceptor.attach(newString, {
    onEnter: function (args) {
        this.ret = this.returnAddress;
        // args[1]=jchar*, args[2]=len
        this.str16 = null;
        try {
            var len = args[2].toInt32();
            if (len > 0 && len < 4096 && !args[1].isNull()) {
                var bytes = args[1].readByteArray(len * 2);
                var arr = new Uint8Array(bytes);
                var out = "";
                for (var i = 0; i < arr.length; i += 2) {
                    var code = arr[i] | (arr[i + 1] << 8);
                    out += String.fromCharCode(code);
                }
                this.str16 = out;
            }
        } catch (e) {}
    },
    onLeave: function () {
        var mod = Process.findModuleByAddress(this.ret);
        if (!mod) return;
        var n = mod.name;
        if (n.indexOf("metasec") !== -1 || n.indexOf("sscronet") !== -1) {
            var s = this.str16 || "";
            if (s.length >= 20) {
                console.log("[UTF16] " + n + " +0x" + this.ret.sub(mod.base).toString(16) + " :: " + s);
            }
        }
    }
});

console.log("[*] NewString/NewStringUTF hooked — waiting for scroll...");
