var done = false;
function disasm() {
    if (done) return;
    var m = Process.findModuleByName("libmetasec_ov.so");
    if (!m) return;
    done = true;
    var jni = m.findExportByName("JNI_OnLoad");
    console.log("[+] JNI_OnLoad @ " + jni + " (offset 0x" + jni.sub(m.base) + ")");
    var addr = jni;
    var count = 0;
    try {
        var insn = Instruction.parse(addr);
        while (insn && count < 120) {
            console.log("  " + addr.sub(m.base) + "  " + insn.toString());
            addr = insn.next;
            insn = Instruction.parse(addr);
            count++;
        }
    } catch (e) { console.log("[!] " + e); }
}
var poller = setInterval(function(){ disasm(); }, 500);
