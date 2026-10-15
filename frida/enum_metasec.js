var m = Process.findModuleByName("libmetasec_ov.so");
if (!m) { console.log("not found"); } else {
    console.log("base: " + m.base + " size: 0x" + m.size.toString(16));
    var exps = m.enumerateExports();
    console.log("exports (" + exps.length + "):");
    exps.forEach(function(e) { console.log("  EXPORT " + e.name + " @ off=0x" + e.address.sub(m.base).toString(16)); });
    var syms = m.enumerateSymbols();
    console.log("symbols (" + syms.length + "):");
    var shown = 0;
    for (var i = 0; i < syms.length && shown < 300; i++) {
        var s = syms[i];
        if (/Java_|JNI|ms_bd|metasec|_a$|^a$|^k$|native|_0x/i.test(s.name)) {
            console.log("  SYM " + s.name + " @ off=0x" + s.address.sub(m.base).toString(16));
            shown++;
        }
    }
}
