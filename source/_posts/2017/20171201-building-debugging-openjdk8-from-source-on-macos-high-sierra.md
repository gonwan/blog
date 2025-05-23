---
title: "Building & Debugging OpenJDK8 from Source on macOS High Sierra"
date: "2017-12-01 06:56:45"
categories: 
  - "java"
tags: 
  - "debugging"
  - "jvm"
  - "profiling"
---

While reading _Understanding the JVM - Advanced Features and Best Practices, Second Edition_ ([in Chinese](https://www.amazon.cn/dp/B00D2ID4PK/)) recently, there is a guide in chapter one to build JVM from source. It is based on OpenJDK7, which only works when using a Java6/Java7 VM as build bootstrap. Java8 bootstrap has more strict code checks and will finally fail the build. So, I just switched to a more recent [OpenJDK8](http://jdk.java.net/java-se-ri/8) code. The file name is `openjdk-8u40-src-b25-10_feb_2015.zip`.

The code provides a better build experience, and compiles on my Linux box almost out of box. But remember, do not use a gcc compiler >= gcc-6. It defaults to C++14 and breaks the build. On macOS, the build scripts seem only support gcc. Actually, a clang compiler is required to build the objc code.

1. So the first step after downloading and unzipping the code, modify the configure script:

```
# cd openjdk
# vi common/autoconf/generated-configure.sh
```

Comment out the lines(2 appearances):

```
as_fn_error $? "GCC compiler is required. Try setting --with-tools-dir." "$LINENO" 5
```

2. Now install freetype and run configure:

```
# brew install freetype
# bash ./configure --prefix=/Users/gonwan/openjdk-runtime --with-debug-level=slowdebug --with-freetype-include=/usr/local/Cellar/freetype/2.8.1/include/freetype2 --with-freetype-lib=/usr/local/Cellar/freetype/2.8.1/lib --with-milestone=special --with-update-version=u01 --with-build-number=b01
```

A `slowdebug` build disables optimization and helps a lot when debugging. The summary output looks like:

```
Configuration summary:
* Debug level:    slowdebug
* JDK variant:    normal
* JVM variants:   server
* OpenJDK target: OS: macosx, CPU architecture: x86, address length: 64

Tools summary:
* Boot JDK:       java version "1.8.0_152" Java(TM) SE Runtime Environment (build 1.8.0_152-b16) Java HotSpot(TM) 64-Bit Server VM (build 25.152-b16, mixed mode)  (at /Library/Java/JavaVirtualMachines/jdk1.8.0_152.jdk/Contents/Home)
* C Compiler:      version  (at /usr/bin/gcc)
* C++ Compiler:    version  (at /usr/bin/g++)

Build performance summary:
* Cores to use:   2
* Memory limit:   16384 MB
* ccache status:  not installed (consider installing)


```

3. Apply the following patch to fix build errors. Partially picked from an official OpenJDK10 [changeset](http://hg.openjdk.java.net/jdk10/jdk10/hotspot/rev/316854ef2fa2):

```
diff -ru openjdk.old/hotspot/src/share/vm/opto/lcm.cpp openjdk/hotspot/src/share/vm/opto/lcm.cpp
--- openjdk.old/hotspot/src/share/vm/opto/lcm.cpp	2017-12-01 13:24:42.000000000 +0800
+++ openjdk/hotspot/src/share/vm/opto/lcm.cpp	2017-12-01 13:25:35.000000000 +0800
@@ -57,7 +57,7 @@
 // Check whether val is not-null-decoded compressed oop,
 // i.e. will grab into the base of the heap if it represents NULL.
 static bool accesses_heap_base_zone(Node *val) {
- if (Universe::narrow_oop_base() > 0) { // Implies UseCompressedOops.
+  if (Universe::narrow_oop_base() != 0) { // Implies UseCompressedOops.
     if (val && val->is_Mach()) {
       if (val->as_Mach()->ideal_Opcode() == Op_DecodeN) {
         // This assumes all Decodes with TypePtr::NotNull are matched to nodes that
diff -ru openjdk.old/hotspot/src/share/vm/opto/loopPredicate.cpp openjdk/hotspot/src/share/vm/opto/loopPredicate.cpp
--- openjdk.old/hotspot/src/share/vm/opto/loopPredicate.cpp	2017-12-01 13:24:42.000000000 +0800
+++ openjdk/hotspot/src/share/vm/opto/loopPredicate.cpp	2017-12-01 13:26:08.000000000 +0800
@@ -772,7 +772,7 @@
       Node*          idx    = cmp->in(1);
       assert(!invar.is_invariant(idx), "index is variant");
       Node* rng = cmp->in(2);
- assert(rng->Opcode() == Op_LoadRange || _igvn.type(rng)->is_int() >= 0, "must be");
+      assert(rng->Opcode() == Op_LoadRange || _igvn.type(rng)->is_int()->_lo >= 0, "must be");
       assert(invar.is_invariant(rng), "range must be invariant");
       int scale    = 1;
       Node* offset = zero;
diff -ru openjdk.old/hotspot/src/share/vm/runtime/virtualspace.cpp openjdk/hotspot/src/share/vm/runtime/virtualspace.cpp
--- openjdk.old/hotspot/src/share/vm/runtime/virtualspace.cpp	2017-12-01 13:24:42.000000000 +0800
+++ openjdk/hotspot/src/share/vm/runtime/virtualspace.cpp	2017-12-01 13:26:41.000000000 +0800
@@ -332,7 +332,7 @@
                 (UseCompressedOops && (Universe::narrow_oop_base() != NULL) &&
                  Universe::narrow_oop_use_implicit_null_checks()) ?
                   lcm(os::vm_page_size(), alignment) : 0) {
- if (base() > 0) {
+  if (base() != 0) {
     MemTracker::record_virtual_memory_type((address)base(), mtJavaHeap);
   }
 
diff -ru openjdk.old/jdk/src/macosx/native/sun/osxapp/ThreadUtilities.m openjdk/jdk/src/macosx/native/sun/osxapp/ThreadUtilities.m
--- openjdk.old/jdk/src/macosx/native/sun/osxapp/ThreadUtilities.m	2017-12-01 13:24:33.000000000 +0800
+++ openjdk/jdk/src/macosx/native/sun/osxapp/ThreadUtilities.m	2017-12-01 13:28:37.000000000 +0800
@@ -36,7 +36,7 @@
 static jobject appkitThreadGroup = NULL;
 static BOOL awtEmbedded = NO;
 
-inline void attachCurrentThread(void** env) {
+static inline void attachCurrentThread(void** env) {
     if ([NSThread isMainThread]) {
         JavaVMAttachArgs args;
         args.version = JNI_VERSION_1_4;


```

```
# patch -p1 < ../openjdk8.patch
```

4. Start the build:

```
# export USE_CLANG=true
# export COMPILER_WARNINGS_FATAL=false
# export LFLAGS='-Xlinker -lstdc++'
# make
```

Lots of warnings, but the build should finish successfully:

```
----- Build times -------
Start 2017-12-01 13:33:20
End   2017-12-01 13:41:30
00:00:28 corba
00:02:39 hotspot
00:00:15 jaxp
00:00:22 jaxws
00:03:53 jdk
00:00:32 langtools
00:08:10 TOTAL
-------------------------
```

5. Debugging with lldb:

The output binary lie in `openjdk/build/macosx-x86_64-normal-server-slowdebug/jdk`. The output of `java -version`:

```
openjdk version "1.8.0_u01-special-debug"
OpenJDK Runtime Environment (build 1.8.0_u01-special-debug-b01)
OpenJDK 64-Bit Server VM (build 25.40-b25-debug, mixed mode)
```

Never used `lldb` before, seems to be compatible with `gdb`:

```
# lldb ./java
(lldb) target create "./java"
Current executable set to './java' (x86_64).
(lldb) b main
Breakpoint 1: 21 locations.
(lldb) run -version
Process 67998 launched: './java' (x86_64)
Process 67998 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 1.1
    frame #0: 0x000000010000d5b2 java`main(argc=2, argv=0x00007ffeefbff9c8) at main.c:97
   94  	{
   95  	    int margc;
   96  	    char** margv;
-> 97  	    const jboolean const_javaw = JNI_FALSE;
   98  	#endif /* JAVAW */
   99  	#ifdef _WIN32
   100 	    {
Target 0: (java) stopped.
(lldb) p argv[1]
(char *) $0 = 0x00007ffeefbffb27 "-version"
(lldb)
```
