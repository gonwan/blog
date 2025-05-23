---
title: "Windows System Call Sequence and Simulation"
date: "2013-11-07 10:40:00"
categories: 
  - "os"
tags: 
  - "assembly"
  - "system-call"
  - "x86"
---

There are hundreds of documents telling how Windows implements its system call, using `int 2e` or `sysenter`. But I can find no code to run to learn how exactly it works. And I managed to write it for my own.

The C code requires only SDK to compile, for I have copied all DDK definitions inline. It opens a `C:\test.txt` file and write `Hello World!` to it. Quite simple. I've tried a HelloWorld console application. But its call sequence is far more complex than I have expected, after I have made some reverse engineering and read some code from [ReactOS](http://www.reactos.org/) project([Wine](http://www.winehq.org/) does not help, since it does not implement a Win32 compatible call sequence in the console case). The code is the basis of our further investigation. It invokes `NtCreateFile()`, `NtWriteFile()` and `NtClose()` in `ntdll.dll` with dynamic loading:

```cpp
#include <windows.h>
#include <stdio.h>

#define FILE_OVERWRITE_IF               0x00000005
#define FILE_SYNCHRONOUS_IO_NONALERT    0x00000020
#define OBJ_KERNEL_HANDLE               0x00000200L
#define NT_SUCCESS(Status)      ((NTSTATUS)(Status) >= 0)

typedef LONG NTSTATUS;

typedef struct _UNICODE_STRING {
    USHORT Length;
    USHORT MaximumLength;
    PWSTR  Buffer;
} UNICODE_STRING, *PUNICODE_STRING;

typedef struct _OBJECT_ATTRIBUTES {
    ULONG Length;
    HANDLE RootDirectory;
    PUNICODE_STRING ObjectName;
    ULONG Attributes;
    PVOID SecurityDescriptor;        // Points to type SECURITY_DESCRIPTOR
    PVOID SecurityQualityOfService;  // Points to type SECURITY_QUALITY_OF_SERVICE
} OBJECT_ATTRIBUTES, *POBJECT_ATTRIBUTES;

typedef struct _IO_STATUS_BLOCK {
    union {
        NTSTATUS Status;
        PVOID Pointer;
    };
    ULONG_PTR Information;
} IO_STATUS_BLOCK, *PIO_STATUS_BLOCK;

typedef VOID (NTAPI *PIO_APC_ROUTINE) (
    IN PVOID ApcContext,
    IN PIO_STATUS_BLOCK IoStatusBlock,
    IN ULONG Reserved
);

typedef NTSTATUS (WINAPI *FnNtCreateFile)(
    PHANDLE FileHandle,
    ACCESS_MASK DesiredAccess,
    POBJECT_ATTRIBUTES ObjectAttributes,
    PIO_STATUS_BLOCK IoStatusBlock,
    PLARGE_INTEGER AllocationSize,
    ULONG FileAttributes,
    ULONG ShareAccess,
    ULONG CreateDisposition,
    ULONG CreateOptions,
    PVOID EaBuffer,
    ULONG EaLength
);

typedef NTSTATUS (WINAPI *FnNtWriteFile)(
    HANDLE FileHandle,
    HANDLE Event,
    PIO_APC_ROUTINE ApcRoutine,
    PVOID ApcContext,
    PIO_STATUS_BLOCK IoStatusBlock,
    PVOID Buffer,
    ULONG Length,
    PLARGE_INTEGER ByteOffset,
    PULONG Key
);

typedef NTSTATUS (WINAPI *FnNtClose)(
    HANDLE Handle
);

int main()
{
    HMODULE hModule;
    FnNtCreateFile pfnNtCreateFile;
    FnNtWriteFile pfnNtWriteFile;
    FnNtClose pfnNtClose;
    hModule = LoadLibraryA("ntdll.dll");  /* always 0x7c900000 on XP */
    if (hModule == NULL) {
        return -1;
    }
    pfnNtCreateFile = (FnNtCreateFile)GetProcAddress(hModule, "NtCreateFile");  /* 0x7c90d090 */
    pfnNtWriteFile = (FnNtWriteFile)GetProcAddress(hModule, "NtWriteFile");  /* 0x7c90df60 */
    pfnNtClose = (FnNtClose)GetProcAddress(hModule, "NtClose");  /* 0x7c90cfd0 */
    if (pfnNtCreateFile == NULL || pfnNtWriteFile == NULL || pfnNtClose == NULL) {
        FreeLibrary(hModule);
        return -1;
    } else {
        NTSTATUS ntStatus;
        UNICODE_STRING us;
        OBJECT_ATTRIBUTES oa;
        IO_STATUS_BLOCK ioStatusBlock;
        HANDLE hFile;
        char szHello[] = "Hello World!";
        us.Buffer = L"\\??\\C:\\test.txt";
        us.Length = (USHORT)wcslen(us.Buffer) * sizeof(WCHAR);
        us.MaximumLength = us.Length + sizeof(WCHAR);
        oa.Length = sizeof(oa);
        oa.RootDirectory = NULL;
        oa.ObjectName = &us;
        oa.Attributes = OBJ_KERNEL_HANDLE;
        oa.SecurityDescriptor = NULL;
        oa.SecurityQualityOfService = NULL;
        ntStatus = pfnNtCreateFile(&hFile,
            GENERIC_ALL | SYNCHRONIZE,
            &oa,
            &ioStatusBlock,
            NULL,
            FILE_ATTRIBUTE_NORMAL,
            0,
            FILE_OVERWRITE_IF,
            FILE_SYNCHRONOUS_IO_NONALERT,
            NULL,
            0);
        if (!NT_SUCCESS(ntStatus)) {
            fprintf(stderr, "Failed to create file, error = 0x%x\n", ntStatus);
            FreeLibrary(hModule);
            return -1;
        }
        ntStatus = pfnNtWriteFile(hFile,
            NULL,
            NULL,
            NULL,
            &ioStatusBlock,
            szHello,
            (ULONG)strlen(szHello),
            NULL,
            NULL);
        if (!NT_SUCCESS(ntStatus)) {
            fprintf(stderr, "Failed to write file, error = 0x%x\n", ntStatus);
            FreeLibrary(hModule);
            return -1;
        }
        pfnNtClose(hFile);
    }
    FreeLibrary(hModule);
    return 0;
}
```

I found the handle value and all three function pointers are fixed, at least on my Windows XP(SP3). It may be caused by the preferred base address of `ntdll.dll`. The code should work on all Windows platforms, since it has no hardcoded values.

Now, translate the C code into assembly. Error handling is ommitted:

```
.386
.model flat,stdcall
.data

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;            SDK prototypes            ;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
NULL            EQU 0

UNICODE_STRING STRUCT
    Len             WORD ?
    MaximumLength   WORD ?
    Buffer          DWORD ?
UNICODE_STRING ENDS

OBJECT_ATTRIBUTES STRUCT
    Len                         DWORD ?
    RootDirectory               DWORD ?
    ObjectName                  DWORD ?
    Attributes                  DWORD ?
    SecurityDescriptor          DWORD ?
    SecurityQualityOfService    DWORD ?
OBJECT_ATTRIBUTES ENDS

IO_STATUS_BLOCK STRUCT
    Status  DWORD ?
    Pointer DWORD ?
IO_STATUS_BLOCK ENDS

ExitProcess PROTO :DWORD

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;         Program declarations         ;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; IMPORTANT: The paddding is required!!
STR_HELLO           DB      "Hello World!",0,0,0,0
STR_FILE            WORD    "\","?","?","\","C",":","\","t","e","s","t",".","t","x","t",0

.code

NtCreateFile PROC
    ; 25h(XP) or 42h(Win7)
    mov eax, 25h
    mov edx, 7ffe0300h
    call DWORD PTR [edx]
    retn 2ch
NtCreateFile ENDP

NtWriteFile PROC
    ; 112h(XP) or 18ch(Win7)
    mov eax, 112h
    mov edx, 7ffe0300h
    call DWORD PTR [edx]
    retn 24h
NtWriteFile ENDP

NtClose PROC
    ; 19h(XP) or 32h(Win7)
    mov eax, 19h
    mov edx, 7ffe0300h
    call DWORD PTR [edx]
    retn 4h
NtClose ENDP

main PROC
    ;LOCAL ntStatus:DWORD
    LOCAL us:UNICODE_STRING
    LOCAL oa:OBJECT_ATTRIBUTES
    LOCAL ioStatusBlock:IO_STATUS_BLOCK
    LOCAL hFile:DWORD
    ; 1. initialization
    mov us.Buffer, OFFSET STR_FILE
    mov us.Len, 30
    mov us.MaximumLength, 32
    mov oa.Len, TYPE OBJECT_ATTRIBUTES
    mov oa.RootDirectory, NULL
    lea eax, [us]
    mov oa.ObjectName, eax
    ; OBJ_KERNEL_HANDLE
    mov oa.Attributes, 200h
    mov oa.SecurityDescriptor, NULL
    mov oa.SecurityQualityOfService, NULL
    ; 2. parameters of NtCreateFile
    push 0
    push NULL
    ; FILE_SYNCHRONOUS_IO_NONALERT
    push 20h
    ; FILE_OVERWRITE_IF
    push 5h
    push 0
    ; FILE_ATTRIBUTE_NORMAL
    push 80h      
    push NULL
    lea eax, [ioStatusBlock]
    push eax
    lea eax, [oa]
    push eax
    ; GENERIC_ALL | SYNCHRONIZE
    push 10100000h
    lea eax, [hFile]
    push eax
    ; 3. call NtCreateFile
    call NtCreateFile
    ; 4. parameters of NtWriteFile
    push NULL
    push NULL
    push 12
    push OFFSET STR_HELLO
    lea eax, [ioStatusBlock]
    push eax
    push NULL
    push NULL
    push NULL
    push hFile
    ; 5. call NtWriteFile
    call NtWriteFile
    ; 6. parameters of NtClose
    push hFile
    ; 7. call NtClose
    call NtClose
    ; 8. Exit
    ;INVOKE ExitProcess, 0
    ret
main ENDP

END main
```

Compile the code with:

```bash
$ ml /c testnt.asm
$ link /subsystem:console testnt.obj
```

The assembly code of `NtCreateFile()`, `NtWriteFile()` and `NtClose()` are copied directly from `ntdll.dll`. For `NtCreate()`, `25h` is the system service number that will be used to index into the `KiServiceTable`(SSDT, System Service Dispatch Table) to locate the kernel function that handles the call.

System service numbers vary between Windows versions. This is why they are not recommend to be used directly to invoke system calls. I only demonstrate the approach here. For Windows XP, the values of the three numbers are `25h`, `112h` and `19h`. While for Windows 7, they are `42h`, `18ch` and `32h`. Change them yourself if you're running Windows 7. For a complete list of system service numbers, refer [here](http://j00ru.vexillium.org/2011/11/refreshed-windows-system-call-table-released/) or dissemble your `ntdll.dll` manually :). The output executable is a tiny one, only 3KB in size, since it eliminates the usage of CRT. Moreover, it has an empty list of import functions!

At 7ffe0300h is a pointer to the following code:

```
mov edx, esp
sysenter
```

**NOTE**: The assembly code may work only when compiled to a 32-bit application. 64-bit mode is not tested and need modification to work.

One last point, it seems the `STR_HELLO` string is required to be aligned to 8 byte border. Otherwise, you will get `0x80000002` error code(`STATUS_DATATYPE_MISALIGNMENT`).
