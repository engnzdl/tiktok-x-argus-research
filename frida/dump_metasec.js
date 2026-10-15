// dump_metasec.js — find metasec native functions via ClassLinker::RegisterNative hook
var POINTER_SIZE = Process.pointerSize;

// art::ClassLinker::RegisterNative(Thread*, ArtMethod*, const void*)
var regNative = Module.findGlobalExportByName("_ZN3art11ClassLinker14RegisterNativeEPNS_6ThreadEPNS_9ArtMethodEPKv");
if (!regNative) {
    // fallback: search inside libart
    var libart = Process.findModuleByName("libart.so");
    var exps = libart.enumerateExports();
    for (var i = 0; i < exps.length; i++) {
        if (exps[i].name.indexOf("ClassLinker14RegisterNative") !== -1) { regNative = exps[i].address; break; }
    }
}

if (!regNative) { console.log("[-] ClassLinker::RegisterNative not found"); }
else {
    console.log("[+] ClassLinker::RegisterNative @ " + regNative);
    Interceptor.attach(regNative, {
        onEnter: function (args) {
            this.nativeMethod = args[2]; // const void* native_method
        },
        onLeave: function (retval) {
            var nm = this.nativeMethod;
            if (nm.isNull()) return;
            var mod = Process.findModuleByAddress(nm);
            if (!mod) return;
            var modName = mod.name;
            var off = nm.sub(mod.base);
            if (modName.indexOf("metasec") !== -1 || modName.indexOf("Encryptor") !== -1) {
                console.log(">>> [RegisterNative] " + modName + " + 0x" + off.toString(16) + " (abs 0x" + nm.toString(16) + ")");
            }
        }
    });
}
