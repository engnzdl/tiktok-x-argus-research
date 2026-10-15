var libart = Process.findModuleByName("libart.so");
var exps = libart.enumerateExports();
console.log("=== libart NewString exports ===");
exps.forEach(function(e){ if(/NewString/.test(e.name)) console.log("  " + e.name + " @ " + e.address); });
// gJniNativeInterface table (checked) idx 167 = NewStringUTF
var table = null;
exps.forEach(function(e){ if(e.name.indexOf("gJniNativeInterface") !== -1) table = e.address; });
if (table) {
    console.log("=== gJniNativeInterface table idx 167/163 ===");
    console.log("  idx167(NewStringUTF) = " + table.add(167*8).readPointer());
    console.log("  idx163(NewString)    = " + table.add(163*8).readPointer());
    console.log("  idx215(RegisterNatives) = " + table.add(215*8).readPointer());
}
// is metasec loaded
var m = Process.findModuleByName("libmetasec_ov.so");
console.log("=== metasec: " + (m ? ("loaded @ " + m.base) : "not loaded"));
