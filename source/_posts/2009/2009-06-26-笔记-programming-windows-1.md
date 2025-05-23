---
title: "笔记 - Programming Windows (1)"
date: "2009-06-26"
categories: 
  - "windows"
tags: 
  - "unicode"
---

我终于读完了Charles Petzold 的这本圣书: [http://www.amazon.com/Programming-Windows%C2%AE-Fifth-Microsoft/dp/157231995X](http://www.amazon.com/Programming-Windows%C2%AE-Fifth-Microsoft/dp/157231995X)

丸子觉得这本书虽然很多东西已经有些过时了, 比如palette, mci 之类的, 但是有2 个方面讲的非常的深入: 一个是windows 的message 机制, 还有一个是GDI 的绘图部分. 今天闲来讲一下windows 的message 机制.

### 1\. 入口函数

先看一段最最最入门的代码, 这边写的代码都是纯C 代码:

```
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PSTR szCmdLine, int iCmdShow)
{
    MessageBoxA(NULL, "Hello World !", "Hello", MB_OK) ;
    return 0;
}
```

跟console 的程序不同, windows 的窗口程序都是以WinMain 函数作为入口的. 不过这只是一个编译选项而已, 可以指定/entry 参数重设, 当然我们一般都用默认的. 第一个参数hInstance 表示的是这个程序实例的句柄(handle), 我们可以用它来load 内嵌的resource, 第二个参数在win98 以后的版本都不会用到不讲. 第三个参数是传入的命令行参数. 第四个也是运行参数, 控制的是窗口初始化时的现实模式, 最大化, 最小化还是其它什么, 这个参数可以在windows shortcut 的property 里设置, 也可以在CreateProcess() 和ShellExecute() 等API 函数里指定.

### 2\. Unicode 编码

接下来是一个Unicode 的问题, 上面的代码用到的其实是ANSI 编码的API, 从windows nt 开始, Unicode 已经是windows 的内建编码了, 所以Unicode 版本的程序在windows nt 之后的版本会运行的更快一些. 然而windows nt 之前的os 就不一定能运行了. 还是看代码:

```
int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PWSTR szCmdLine, int iCmdShow)
{
    MessageBoxW(NULL, L"Hello World !", L"Hello", MB_OK) ;
    return 0;
}
```

区别有这样几个: WinMain-->wWinMain, PSTR-->PWSTR, MessageBoxA-->MessageBoxW, "Hello"-->L"Hello". 其实就是把函数改成Unicode 版本, 字符串改成宽字符. 我们也可以写一个ANSI 和Unicode 通用的版本:

```
int WINAPI _tWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PTSTR szCmdLine, int iCmdShow)
{
    MessageBox(NULL, TEXT("Hello World !"), TEXT("Hello"), MB_OK) ;
    return 0;
}
```

\_tWinMain 实际上是一个宏定义(macro)(注意下划线), 它会根据编译器是否定义了UNICODE 这个宏来分别预处理(preprocess) 成WinMain 和wWinMain, 同样的情况适用于PTSTR, TEXT, MessageBox 宏. 嗯.. 你没看错, MessageBox 实际是一个宏, 具体参阅windows sdk 的头文件.

### 3\. Windows 消息机制

接下来看一个稍微复杂一些的代码:

```
LRESULT CALLBACK WndProc(HWND, UINT, WPARAM, LPARAM);

int WINAPI _tWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PTSTR szCmdLine, int iCmdShow)
{
    static TCHAR szAppName[] = TEXT("HelloWin");
    HWND         hwnd;
    MSG          msg;
    WNDCLASS     wndclass;

    wndclass.style         = CS_HREDRAW | CS_VREDRAW;
    wndclass.lpfnWndProc   = WndProc;
    wndclass.cbClsExtra    = 0;
    wndclass.cbWndExtra    = 0;
    wndclass.hInstance     = hInstance;
    wndclass.hIcon         = LoadIcon(NULL, IDI_APPLICATION) ;
    wndclass.hCursor       = LoadCursor(NULL, IDC_ARROW) ;
    wndclass.hbrBackground = (HBRUSH)GetStockObject(WHITE_BRUSH) ;
    wndclass.lpszMenuName  = NULL;
    wndclass.lpszClassName = szAppName;

    if (!RegisterClass(&wndclass))
    {
        MessageBox(NULL, TEXT("This program requires Windows NT!"), szAppName, MB_ICONERROR);
        return 0;
    }

    hwnd = CreateWindow(szAppName,  // window class name
        TEXT("Hello"),              // window caption
        WS_OVERLAPPEDWINDOW,        // window style
        CW_USEDEFAULT,              // initial x position
        CW_USEDEFAULT,              // initial y position
        CW_USEDEFAULT,              // initial x size
        CW_USEDEFAULT,              // initial y size
        NULL,                       // parent window handle
        NULL,                       // window menu handle
        hInstance,                  // program instance handle
        NULL);                      // creation parameters

    ShowWindow(hwnd, iCmdShow);
    UpdateWindow(hwnd);

    while(GetMessage(&msg, NULL, 0, 0))
    {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    return msg.wParam;
}

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
        return 0;
    }
    return DefWindowProc(hwnd, message, wParam, lParam);
}
```

好长好长的代码呀.. 运行的效果是, 现实一个窗口, 中间有一行字, 启动时还有音效.

我们要显示一个window(指的是程序窗口), 大概要做两件事, 第一是注册这个window 的class, 第二是用这个class 来create 这个window. 分别对应的API 就是RegisterClass() 和CreateWindow().

调用RegisterClass() 的时候, 我们指定这个class 的名字, 样式(style), 实例句柄(instance handle), 以及最最重要的window procedure 的回调函数(callback function)地址, 我们将通过这个回调函数来处理对于属于这个window class 所创建出的window 的消息处理.

RegisterClass() 并不创建实际的window, 而只是创建了一个window 的类别, 比如button 就是一个windows 内建的window class. 我们调用CreateWindow() 来创建一个具体的可现实的window. 可以看到, 这个API 的参数里有一个叫做window style, 这个东西很容易跟之前的class style 搞混. 怎么区分呢? 记住class style 指定的是所有这个class 的window 都会有的style, 比如一个button, 它总是可以click 的, 这就是一个class style. 而window style 则是在class style 的基础上各个window 定制的style, 比如不同的button 可以有不同的观感(look and feel), 这就是要给window style).

之后, 终于讲到windows 的message 机制了. 每个windows 的程序都会有一个message queue(消息队列), 这个queue 保存了从windows 系统或是其它程序发给这个程序的各种message. windows 可以通过这种方法来实现各个应用程序之间的交互. 有了这个message queue 之后, windows 又定义了叫做message loop(消息循环) 的机制来从这个queue 里拿出消息并进行处理. GetMessage() 这个API 就是用来实现这个功能的, 而代码中GetMessage() 之外的while 循环就叫做message loop.

注意, 这边GetMessage() 拿到的message 是针对整个程序来说的, 并不针对某个特别的窗口. 当GetMessage() 收到的是WM\_QUIT 消息的时候返回0, 发生错误的时候返回-1, 其它情况下返回其它非0 值. 所以在代码中我们根据它的返回值是否为0 来判断要不要结束message loop. 在GetMessage() 的输出参数中, 会返回得到的message 数据, 即一个MSG 结构. 在message loop 中, 又有2 个API 调用.

TranslateMessage() 的作用是用来转换键盘消息. 当我们按下一个键的时候, 会产生WM\_KEYDOWN 或WM\_SYSKEYDOWN 消息, 放开按键的时候则会产生WM\_KEYUP 或WM\_SYSKEYUP 消息. WM\_SYS 开头的消息是系统消息, 一般是Alt 跟其它键的组合键, 比如Alt+Tab, 这个没什么值得讨论的. 在WM\_KEYDOWN 的时候, 我们有时要根据shift 是否也被按了来进行大小写字母的判断, 但这不是很好的做法. 比如, caps lock 的状态怎么判断? 如果输入的是中文呢(中文没有对应的virtual key code)? 所以TranslateMessage() 这个API 会帮我们做把所谓keystroke message 转换成character message, 即如果接受到WM\_KEYDOWN 消息且shift 被按下又能够组合成一个字符(character), 那么另外一个WM\_CHAR 消息会被插入到当前的message queue 中, 紧接在WM\_KEYDOWN 消息之后. windows 在处理键盘消息的时候, 其实有一个system message queue. 为什么要有这个东西, 而不把每次的按键直接加到当前窗口的message queue 里呢? 因为无法判断下一个键盘消息到底要发给哪个窗口. 比如要是按了Alt+Tab 怎么办呢?

然后是DispatchMessage() 这个API. 它的作用是把得到的message 传回给windows 系统, 让windows 根据MSG 结构里的信息, 把这个消息dispatch 到相应的window procedure(关于window procedure 之后会讲). 这里其实很神奇, 在我们自己的程序里, 居然要手动dispatch 系统的消息.

接下来来看window procedure 的回调函数WndProc. 这个函数提供了对于各种发送给窗口的对于处理方法. 这个回调函数有4 个参数: 第一个参数是一个HWND 的handle, 由于多个的window 可以指定同一个window procedure, 可以用这个handle 来区分. 第二个参数是收到的message 的类型. 第三第四个参数是对于当前收到message 的参数, 比如对于WM\_KEYDOWN 消息, wParam 就是key 的virtual code, lParam 则是其它一切附加信息. 代码中我们处理了3 个消息: WM\_CREATE 是window 在被创建时收到的消息, 我们播放了一段音频. WM\_PAINT 是window 要被重画时收到的消息, 我们简单画了一个字符串(关于GDI 相关的内容, 下次笔记再讲). WM\_DESTROY 消息则是window 被销毁的时候收到的消息, 我们让整个程序退出. 对于其它我们不感兴趣的消息, 我们简单的把它们扔给DefWindowProc() 来做默认处理.

现在应该对windows 的消息机制有一定了解了, 让我们来看看以上程序中, 当我们按了Alt+F4 的系统热键发生了些什么吧. 我们的WinProc 首先会有到一个WM\_SYSCOMMAND 消息, 并传给DefWindowProc() 处理. DefWindowProc() 的默认处理方法就是发一个WM\_CLOSE 消息给这个window. 又一次, 我们的WinProc 吧这个消息传给DefWindowProc(). DefWindowProc() 的默认处理方法是调用DestoryWindow(), 而DestroyWindow() 会给这个window 发一个WM\_DESTROY 消息. 这次终于有自定义处理代码了, PostQuitMessage() 简单的发送一个WM\_QUIT 消息给当前的程序. WM\_QUIT 消息导致message loop 的退出(GetMessage() 返回0), 于是整个程序结束. PostQuitMessage() 的参数表示exit code, 会被存在MSG 结构的wParam 域里.

以上说了message loop 中的消息处理. 这里消息叫做queued message, 但是还有一类叫做nonqueued message, 即它们是不会进入message loop, 而是直接通过上面的window procedure 函数调用的. 有两个函数: SendMessage() 和PostMessage(), 它们分别对应queued 和nonqueued. 调用SendMessage() 产生一个nonqueued message, 结果就是直接调用window procedure 函数, 且函数返回了, SendMessage() 才会返回, 它是同步的. 调用PostMessage() 产生一个queued message, 并把这个message 加到message queue 中, 之后通过程序的GetMessage() 来polling 处理, PostMessage() 是直接返回的, 不需要等到message 被处理完, 它是异步的. 一般, 通过windows API 间接发送的消息都是nonqueued message, 比如代码中的UpdateWindow() 会把WM\_PAINT 作为参数直接调用window procedure 回调函数来强制刷新.

另外要提到作为timer 使用的WM\_TIMER 消息. 这是一个queued message, 虽然用来计时, 但却不是那么的准确. 如果WM\_TIMER 的前一次消息处理时间太长的话, 会把多个WM\_TIMER 合并在一起. 因此, 需要更加准确的计时的话, 我们需要调用Thread 的相关API 函数.

### 4\. 子控件相关

稍微加少下子控件的概念, 所谓的子控件, 就是window上的控件, 真废话=v=. 这里要说的其实没多少东西, 只是一笔带过.

当子控件被点击的时候, 子控件就会给父控件发送一个WM\_COMMAND 消息. 当一个push button 被点击, radio button 被选中, check button 被选中都是这个消息. 注意, 是从子控件发送给父控件, 也就是说WM\_COMMAND 消息的处理是在父控件的window procedure 回调函数中.

当我们用CreateWindow() 创建window 的时候, 上面的子控件是不具备Tab 遍历功能的, 我们添加对于Tab 键的处理. 但是如果它是通过CreateDialog() 或DialogBox() API 函数创建的话, 只要子控件指定了WS\_TABSTOP 的window style 的flag, 就会自动添加Tab 键的遍历功能.

当我们要拿子控件的属性的时候, 我们其实也是通过windows 的message 来实现的. MFC 类库中把这些message 都封装成了宏(macro) 来方便使用. 比如我们要那一个check button 的选中状态, 则可以发送一个BM\_GETCHECK 消息.

关于子控件的自定义有3 种方法或者说概念, 从最简单的说起:

a) Owner Draw: 这种方法一般用来定制子控件的外观. 举个例子, 如果要owner-draw 一个push button 的外观, 那么这个button 的style 里要有BS\_OWNERDRAW 这个flag. window procedure 回调函数遇到owner-draw 的控件时, 会收到一个WM\_DRAWITEM 的消息, 你要做的就是在这个消息处理中把button 画出来.

b) Sub-classing: 这种方法一般用来定制子控件的行为. 还是以push button 为例, button 的点击的默认行为是发送一个WM\_COMMAND 消息给父窗口, 那么我们怎么修改这个默认行为呢? 由于button 这类系统与定义的控件的window procedure 都是在windows 系统中写死的, 我们只能想办法替换这个window procedure 回调函数. 具体的方法是调用SetWindowLong() 这个API, 并传入DWL\_DLGPROC 这个flag.

c) Custom Control: 不用说了, 最全面的方法. 如果你要完全定义一个全新的子控件. 你需要完全自己coding 所有的代码, 调用RegisterClass(), CreateWindow(), 实现window procedure 回调函数. 很大的工程那...

### 5\. Dialog 对话框

Dialog 可以分成2 类, modal 和modeless(注意拼写=v=). 具体概念我就不解释了.

一个modal 的dialog 调用DialogBox() 函数创建, 一个modeless 的dialog 调用CreateDialog() 创建. 跟CreateWindow() 的调用一样, 我们也要把一个所谓的dialog procedure 当作参数传进去. 一下是这个procedure 的signature:

```
INT_PTR CALLBACK DialogProc(HWND hwndDlg, UINT uMsg, WPARAM wParam, LPARAM lParam);
```

对比window procedure:

```
LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
```

dialog precedure 虽然返回值是一个INT\_PTR类型, 但通常情况下返回的是TRUE 或这FALSE, 特殊值的返回请参阅MSDN. 除了返回值意外, 这两个回调函数似乎没什么不一样, 但实际上并不那么简单. 一个dialog 是一个window, 而它对应的window procedure 是包含在windows 系统中的, 在那个window procedure 中, 会调用到我们的dialog procedure.

dialog 不会收到WM\_CREATE 消息, 但是会收到对应的WM\_INITDIALOG 消息, 想来是windows 系统在WM\_CREATE 消息中重新发的消息吧. 如此一来便可以完成一些dialog 特有的初始化操作. 当我们要用代码销毁一个dialog 的时候, modal 和modeless 这2 中dialog 的方法不同. modal dialog 调用EndDialog(), 而modeless dialog 调用DestroyWindow().

最后, 书上有这样一句话: Unlike messages to modal dialog boxes and message boxes, messages to modeless dialog boxes come through your program's message queue. The message queue must be altered to pass these messages to the dialog box window procedure. 然后说我们要调用IsDialogMessage() 这个API 来传递message. 经过实践, 上面那句话的意思其实是说: modeless dialog 跟window 一样, 默认不支持Tab 键的遍历等键盘消息处理, 但是调用了这个IsDialogMessage() 之后, 所有标记过WS\_TABSTOP 的子控件就都支持了. MSDN 上还说, 传入的window 句柄不一定要是dialog, window 也可以. 通过这种方法, 我们通过CreateWindow() 出来的window 也毫不费力的实现Tab 的遍历了. 于是最终, 我们的message loop 的代码大概是这样的(假设hDlgModeless 是一个modeless 的dialog 的handle):

```
while(GetMessage(&msg, NULL, 0, 0))
{
    if (hDlgModeless == 0 ¦¦ !IsDialogMessage(hDlgModeless, &msg))
    {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
}
```

如果我们有多个modeless 的dialog, 这种写法岂不是要死人? M$ 的knowledge base 上有篇文章可以参考: [How To Use One IsDialogMessage() Call for Many Modeless Dialogs](http://support.microsoft.com/kb/71450)

以上. 请继续期待下次GDI 的笔记.
