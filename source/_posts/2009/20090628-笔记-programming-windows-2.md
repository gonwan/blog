---
title: "笔记 - Programming Windows (2)"
date: "2009-06-28 07:12:00"
categories: 
  - "windows"
tags: 
  - "gdi"
---

今天来记录一下windows 中GDI (Graphics Device Interface) 的相关内容.

GDI 的目标是提供一种设备无关的绘图方式, 要支持不同的monitor 和graphics card.

### 1. WM_PAINT 消息

我们还是以以下的window procedure 代码为例:

```
LRESULT CALLBACK WndProc(HWND hwnd, UINT message, WPARAM wParam, LPARAM lParam)
{
    HDC         hdc;
    PAINTSTRUCT ps;
    RECT        rect;

    switch (message)
    {
    case WM_CREATE:
        PlaySound(TEXT("hellowin.wav"), NULL, SND_FILENAME | SND_ASYNC);
        return 0;
    case WM_PAINT:
        hdc = BeginPaint(hwnd, &ps);
        GetClientRect(hwnd, &rect);
        DrawText(hdc, TEXT("Hello, Windows !!!"), -1, &rect, DT_SINGLELINE | DT_CENTER | DT_VCENTER);
        EndPaint(hwnd, &ps);
        return 0;
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0 ;
    }
    return DefWindowProc(hwnd, message, wParam, lParam);
}
```

这次关注的让然是WM_PAINT 消息的处理. 首先我们调用BeginPaint() 函数返回一个HDC 的handle. DC(Device Context) 可以理解成跟设备联系起来的, 可以在上面绘图的一个东西. 这里的设备一般指的是monitor, 但是也可以是printer. 得到这个handle 之后, 我们就可以在DC 上绘图了, DrawText() 函数就在HC 的正中间画了一个字符串. 最后就是EndPaint() 函数来说明绘图结束. 这里有2 个概念.

第一个概念叫做invalid region. 当一个被遮盖的窗口被重新显示的时候, 实际上要重画的只是被遮盖的部分. 而这些被遮盖的需要重画的部分就叫做invalid region. windows 会给窗口发WM_PAINT 消息来让窗口重画. 在代码中ps 变量(PAINTSTRUCT 结构)的rcPaint 域实际上包含了这个invalid region 的信息. 当我们调用BeginPaint() 的时候,实际上把这个invalid region 给validate 了. 不然的话, windows 检测到还有invalid region 没被重画就会不断的发送WM_PAINT 消息, CPU 会100% 的.

第二个概念叫做clipping region. 当我们调用BeginPaint() 的时候, 实际还把一个invalid region 转换成了一个clipping region. 什么意思呢? 就是之后的GDI 调用的绘图都会只限于这个clipping region 中. 如果某个GDI 调用画在了这个clipping region之外, 实际是不会有调用开销的, 这也是windows GDI 的一个优化. 虽然我觉得GDI 还是很慢的=v= (GDI+ 更慢...).

除了调用BeginPaint(), EndPaint() 来得到DC 外, 还可以通过调用GetDC() 这个API. 比如在处理一个鼠标消息, 可能需要在屏幕上画点什么的时候. 不过有这样几点需要注意: 1) BeginPaint(), EndPaint() 只能被用在WM_PAINT 消息中. 2) GetDC() 不会去把invalid region 给validate, 我们需要手动调用ValidateRect() 或ValidateRgn() 这2 个API. 完了之后, 记得调用ReleaseDC().

有的时候, 我们需要手动刷新一个window. 也有两种方法: 1) 调用InvalidateRect() 函数. 这种方法是post 一个WM_PAINT 消息到当前window 的message queue 中, 等待刷新. 一个message queue 中不会出现多个WM_PAINT 消息, windows 会自动合并. 2) 调用UpdateWindow() 函数来强制刷新window, 相当于send 一个WM_PAINT 消息来直接调用window procedure 中的处理代码.

### 2. GDI Objects

现在来看一下DC 的使用. 一个DC 可以有很多的属性. 有以下5 种: Bitmap, Brush, Font, Pen, Region. Bitmap 可以理解成DC 中的画布(canvas), 所有画在DC 上的元素实际都是画在Bitmap 这个属性中的. Brush 表示的是绘图的背景属性, 可以是单色, 渐变色, 或是一个图案(pattern). Font 自然是字体, 包括大小, 颜色, 粗细等. Pen 表示的是画笔的属性, 包括颜色, 粗细, 线段起始点, 拐点的一些绘画属性. Region 表示一个区域, 可以理解为Bitmap 这个canvas 上的一个clipping region.

我们通过SelectObject() 这个API 来设置这些属性. 以Brush 为例, 可以使用系统与定义的Brush:

```
SelectObject(hdc, GetStockObject (WHITE_PEN));
```

也可以使用自定义的Brush:

```
HBRUSH hbrhRed = CreateSolidBrush(RGB(255, 0, 0));
HBRUSH hbrhOrig = SelectObject(hdc, hbrhRed);
// Do some drawing with the read brush here...
DeleteObject(SelectObject(hdc, hbrhOrig));
```

其它4 种属性的调用相似. 只是最后自定义的属性, 使用完了一定要记得调用DeleteObject() 这个API 来删除, GDI 的object 也是会泄漏(leak) 的.

另外, 有一个logic object 的概念. 当我们调用CreateXXX() 函数的时候, 得到的GDI object 实际已经跟特定的DC 相关联了, 但是有时候, 我们并不要实际的GDI object, 而只是需要一个包含这些信息的一个数据结构. 于是我们就可以使用所谓的logic object. 以Font 为例. 在GDI 中CreateFont() 这个API 可以说是最麻烦的一个API 了, 光参数就有14 个. 相应的, 还有另外一个API 叫做CreateFontIndirect(), 它的参数是一个LOGFONT 结构, 其中的域对应了CreateFont() 的14 个参数, 所以可以用这两个API 完成同样的工作. 其它四种GDI object 也有类似的logic object.

### 3. GDI 坐标映射

到目前为止, 我们并没有设置过GDI 中的任何坐标. 所以我们到底是在用什么单位(unit) 来绘图的呢? 在GDI 中, 默认的坐标映射模式是MM_TEXT. 需要指出的是, 我们在GDI 函数中传入的数字都是逻辑坐标(logic coordinates), 而GDI 会根据当前的映射模式来重新加算设备相关的视点坐标(viewport coordinates).

其它的映射模式包括: MM_LOMETRIC, MM_HIMETRIC, MM_LOENGLISH, MM_HIENGLISH, MM_TWIPS, MM_ISOTROPIC, MM_ANISOTROPIC. 前5 个映射模式只是逻辑坐标的不同, 而x 轴和y 轴坐标都是等比例映射缩放的, 后两种映射模式允许非等比例的坐标映射. 具体的映射规则请查阅MSDN, 因为非常非常的麻烦, 丸子只给出一个映射的计算公式, 其中(xWinOrg, yWinOrg) 是逻辑坐标的原点, (xViewOrg, yViewOrg) 是视点坐标的原点:

- _xViewport = (xWindow - xWinOrg) \* xViewExt/xWinExt + xViewOrg_
- _yViewport = (yWindow - yWinOrg) \* yViewExt/yWinExt + yViewOrg_

这些数值当然不需要手动计算, GDI 主要提供了这样5 个函数来进行坐标映射的操作: SetMapMode(), SetWindowOrgEx(), SettWindowExtEx(), SetViewportOrgEx(), SetViewportExtEx().

根据丸子的经验, 为了计算坐标更容易, 一般只需要调用SetViewportOrgEx() 来设置视点坐标就可以了, 其它API 函数基本可以不用的.

### 4. DIB和DDB

DIB(Device-Independent Bitmap) 设备独立的位图, DDB(Device-Dependent Bitmap) 设备相关的位图.

什么意思呢? 简单来说, DIB 就是存在硬盘上的bitmap 文件, DDB 就是要在一个DC 上画bitmap 的时候, 一个HBITMAP 的handle 在windows 内存中表示的bitmap. 这里有个很搞笑的事情就是: windows 的GDI 函数中, 并没有提供从文件中读取DIB 的API 函数(Gdiplus 中有), 于是我们要手动写把DIB 转换成DDB 的函数, 这就需要我们了解DIB 的文件结构.

bitmap, 位图, 就是把一张图的所有颜色信息按照pixel 来存储, 所以我们可以把一个DIB 读到内存中, 并把这些按pixel 存储的信息放在一个数组中. 注意, 这里不仅仅是bmp 图片, jpg, png 等其它图片格式, 如果要画到GDI 的DC 上, 都要经过这写操作步骤. 这些步骤搞定之后, 我们可以调用SetDIBitsToDevice() 函数来把这些数组中的信息画到一个DC 上去, 注意倒数第二个参数:

```
int SetDIBitsToDevice(
   HDC hdc,                 // handle to DC
   int XDest,               // x-coord of destination upper-left corner
   int YDest,               // y-coord of destination upper-left corner
   DWORD dwWidth,           // source rectangle width
   DWORD dwHeight,          // source rectangle height
   int XSrc,                // x-coord of source lower-left corner
   int YSrc,                // y-coord of source lower-left corner
   UINT uStartScan,         // first scan line in array
   UINT cScanLines,         // number of scan lines
   CONST VOID *lpvBits,     // array of DIB bits
   CONST BITMAPINFO *lpbmi, // bitmap information
   UINT fuColorUse          // RGB or palette indexes
);
```

调用SetDIBitsToDevice() 只是画DIB 的一种方法, 第二种是把一个DIB 转换成一个DDB, 然后就可以调用windows 的Bitblt() 函数来更高效的绘制bitmap 了. 之所以说更高效, 是因为SetDIBitsToDevice() 是一个一个pixel 画的, 而DDB 是已经包含跟DC 相关的bitmap 信息的了. 可以调用CreateDIBitmap() 函数来生产一个DDB, 嗯.. 你没看错, 名字和用处居然不一致. 然而这种方法的缺点是, 不能按pixel 来访问bitmap 的信息了.

于是, 我们有第三种方法, 调用CreateDIBSection() 函数. 这个函数既能转换DIB 到DDB, 又能提供按pixel 访问bitmap 信息的方法. 缺点是, 很难用, 这个API 函数返回的虽然是一个HBITMAP 的handle, 但是跟CreateDIBitmap() 返回的handle 不一样, 有诸多需要特别注意的地方. 所以丸子也不推荐使用= =.

总结一下就是, 对于一张不大的bitmap, 且要精心按pixel 操作的话, 使用SetDIBitsToDevice(). 对于比较大的bitmap, 且要被画多次, 那么使用CreateDIBitmap(), 因为DDB 的绘制会比较快速. 当然, CreateDIBSection() 提供了前两者的好处, 问题就是比较难用.

以上.
