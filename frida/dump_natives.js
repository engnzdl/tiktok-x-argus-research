// dump_natives.js v7 — JavaVM -> GetEnv -> JNIEnv -> RegisterNatives (correct chain)
var POINTER_SIZE = Process.pointerSize;
var JNI_VERSION_1_6 = 0x00010006;

// get JNIEnv from JavaVM (JNIInvokeInterface.GetEnv index=6)
function getJniEnv(vm) {
    try {
        var invokeTable = vm.readPointer();           // JNIInvokeInterface*
        var getEnvPtr = invokeTable.add(6 * POINTER_SIZE).readPointer();
        var getEnvFn = new NativeFunction(getEnvPtr, 'int', ['pointer', 'pointer', 'int']);
        var envPtr = Memory.alloc(POINTER_SIZE);
        var ret = getEnvFn(vm, envPtr, JNI_VERSION_1_6);
        if (ret !== 0) return null;
        return envPtr.readPointer();
    } catch (e) {
        console.log("[!] getJniEnv: " + e);
        return null;
    }
}

function hookRegisterNativesFromEnv(env) {
    try {
        var fnTable = env.readPointer();              // JNINativeInterface*
        var regNatives = fnTable.add(215 * POINTER_SIZE).readPointer();
        console.log("[+] RegisterNatives @ " + regNatives);
        Interceptor.attach(regNatives, {
            onEnter: function (args) {
                this.methods = args[2];
                this.count = args[3].toInt32();
            },
            onLeave: function (retval) {
                for (var i = 0; i < this.count; i++) {
                    var base = this.methods.add(i * POINTER_SIZE * 3);
                    var namePtr = base.readPointer();
                    var sigPtr = base.add(POINTER_SIZE).readPointer();
                    var fnPtr = base.add(POINTER_SIZE * 2).readPointer();
                    var name = namePtr.isNull() ? "" : namePtr.readCString();
                    var sig = sigPtr.isNull() ? "" : sigPtr.readCString();
                    var mod = Process.findModuleByAddress(fnPtr);
                    var modName = mod ? mod.name : "?";
                    console.log("[REG] " + modName + " | " + name + " | " + sig + " | 0x" + fnPtr.toString(16));
                }
            }
        });
    } catch (e) {
        console.log("[!] hookRegisterNativesFromEnv: " + e);
    }
}

var hooked = {};
function tryHookLib(name) {
    if (hooked[name]) return;
    var m = Process.findModuleByName(name);
    if (!m) return;
    hooked[name] = true;
    console.log("[+] " + name + " @ " + m.base);
    var jni = m.findExportByName("JNI_OnLoad");
    if (!jni) { console.log("[-] " + name + " no JNI_OnLoad"); return; }
    Interceptor.attach(jni, {
        onEnter: function (args) {
            console.log("[JNI_OnLoad:" + name + "] vm=" + args[0]);
            var env = getJniEnv(args[0]);   // args[0] = JavaVM
            if (env) hookRegisterNativesFromEnv(env);
        }
    });
}

var linker = Process.findModuleByName("linker64");
var dlopenFn = linker ? (linker.findExportByName("android_dlopen_ext") || linker.findExportByName("__loader_android_dlopen_ext")) : null;
if (dlopenFn) {
    Interceptor.attach(dlopenFn, {
        onEnter: function (args) { this.fn = args[0].isNull() ? "" : args[0].readCString(); },
        onLeave: function (ret) {
            var f = this.fn || "";
            ["libmetasec_ov.so", "libsscronet.so", "libEncryptor.so", "libttboringssl.so"].forEach(function (lib) {
                if (f.indexOf(lib) !== -1) { console.log("[DLOPEN] " + f); tryHookLib(lib); }
            });
        }
    });
    console.log("[+] android_dlopen_ext hooked");
}
