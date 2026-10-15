var B64_OFF = 0x14f338;
var done = false;
function tryHook() {
    if (done) return;
    var m = Process.findModuleByName("libmetasec_ov.so");
    if (!m) return;
    done = true;
    console.log("[+] metasec @ " + m.base);
    Interceptor.attach(m.base.add(B64_OFF), {
        onEnter: function (a) { this.in = a[3]; this.l = a[4].toInt32(); },
        onLeave: function () {
            if (this.l > 100 && this.l < 400) {
                console.log("[B64-xargus?] len=" + this.l);
                // backtrace: caller addresses (as offsets)
                var bt = Thread.backtrace(this.context, Backtracer.ACCURATE);
                bt.forEach(function(addr){
                    var mod = Process.findModuleByAddress(addr);
                    if (mod && mod.name.indexOf("metasec") !== -1) {
                        console.log("    metasec +0x" + addr.sub(mod.base).toString(16));
                    }
                });
            }
        }
    });
    console.log("[*] base64 hooked (with backtrace)");
}
setInterval(tryHook, 300);
