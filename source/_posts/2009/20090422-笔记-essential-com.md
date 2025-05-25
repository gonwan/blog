---
title: "笔记 - Essential COM"
date: "2009-04-22 04:54:00"
categories: 
  - "cpp"
tags: 
  - "com"
---

今天开始重新拜读Don Box 的经典著作\<\<Essential COM\>\>.

之所以是重看, 是因为去年看的时候完全都不得要领, 光前两章就看了一个星期, 还没完全懂. 一年的修炼之后, 两个小时看完了第一章, 理解度应该在90%以上了.

言归正传, 记录下第一章的内容.

COM, Component Object Model, 看名字, 应该知道这是一个基于组件的对象模型. COM 其实只是一套规范, 定义了用C++来实现组件的重用必须要怎么做的规范. COM 是OOP的, 因为要作为组件对象嘛, 呵呵. 我们知道, 要做到OOP, 那么封装(encapsulation), 继承(inheritance), 多态(polymorphism) 一个都不能少. COM 在这三个要素中, 封装的作用尤其的重要. COM 是通过纯虚函数来把接口(interface) 和实现(implementation) 相分离的, 这让我们在写COM 类的时候, 要做到KISS(Keep It Simple& Stupid), 即接口要尽可能简单.

以上对于COM 说了个大概的思路, 下面说一下为什么要用COM 这个东西.

要实现组件的重用, 最容易想到的方法自然是dll. 没错, 把所有可以重用的组件统统包到一个dll 里. 但这样是有问题的: 由于各个编译器(compiler) 对于C++ 输出符号(export symbol)的命名(name mangling) 并没有统一, 所以用Visual C++编译的dll 在gcc 或者C++ Builder 里很可能是不能用的, 会找不到符号. 也就是说, **我们要确保的是二进制(binary)上的一致性**. 有一种方法可以保证输出符号一致, 那就是加一个`*.def`文件. 好了, 假设这个问题我们也解决了, 问题又来了, 有一些C++的语言特性依然是编译器相关的(C++标准并没有规定语言的特征在运行时是怎么样的): 典型的就是exception 的处理. 好的, 你又可以说不用exception 就行了, 但是还有其它不能跨越dll 边界的语言特性呢? 比如多继承的时候, 纯虚基类的实现就是编译器相关的.

假设已经解决了上面的所有问题, 接下来的问题跟封装有关. 我就沿用书上的例子了: 假设有一个FastString 类已经实现了功能, 且已经发布. 现在我们要发布v2.0 的FastString 类, 为此我们加了很多的新功能, 公共(public) 接口保持不变的基础上, 添加新的函数, 为此我们也添加了成员变量, 当然它们都是私有(private) 的. 但是依然有这样一个问题: C++虽然在代码层保持了封装, 但是二进制层却不行. 客户端代码必须明确了解类库的二进制结构. 所以当我没用sizeof 之类的, 跟布局(alignment) 相关的操作时, 就会有问题. 当然这种二进制的耦合性是为了提高C++ 的performance. 一种解决方法是如mfc 的做法, 把版本号加在dll 名之中, 比如mfc80.dll, mfc90.dll 等.

总之, 我们现在要做的是设计这样一种方法: **可以屏蔽C++在二进制层面的不兼容性**， 也就是说, 把接口(interface)和实现(implementation)分离. 能想到方法有两种, 包含(composition)和继承(inheritance). 这也是一般OOA/D 中能想到的方法, 我们分别来看一下这两种方法. 依然书上的例子了: 假设已有一个FastString 类已经实现了功能, 现在的目的是屏蔽二进制层面的不兼容性.

先来看包含. 我们在定义一个FastStringItf 类, 里面包含一个FastString 类的指针作为成员变量, 这其实用的是proxy 模式. 于是对于一个操作, 我们调用的是FastStringItf 接口, 实际操作的则是FastString 的实例. 但是这样有会有什么问题呢? 就是当类的操作很多的时候, 我们每次都要新加2 个函数的调用开销, 书上说对于performance 而言会不太好, 可是我并没有觉得想对于继承来说, 到底会不好到哪里.

然后就是继承了, 这也是COM 所用的方法. 首先声明一个IFastString 的接口, 然后是具体的 FastString 类. 并export 出一个全局函数来创建和返回FastString 的实例. 这个函数给dll 外的客户端代码调用, 是对外的唯一需要link 的接口. 由于我们得到了IFastString 的一个实例, 且有它的头文件(即所有操作声明), 所以我们就可以调用所有IFastString 的操作而不用link 到dll 中具体的操作实现. 好像很难懂, 看代码吧:

```cpp
// IFastString.h
class IFastString
{
public:
    virtual int Length() = 0;
    virtual int Find(const char *psz) = 0;
};
extern "C" IFastString *CreateFastString(const char *psz);
// FastString.cpp
IFastString *CreateFastString(const char *psz)
{
    return new FastString(psz);
}
```

解决了以上问题之后, 书中又提出了另外一个问题: 当我们要为FastString 类加入新功能, 比如持久化(persistence) 的时候, 应该怎么做, 到底是修改IFastString 接口, 还是让FastString 类实现一个新的IPersistentObject 接口. 答案是后者, 因为对于接口来讲, 尽量不要修改它, 这样会破环封装性.

于是我们继续coding, 首先创建了一个IFastSting 的实例, 然后转成IPersistentObject 的实例使用持久化的功能. 但是用完之后, 我们要销毁实例的时候, 到底应该如何delete? 因为多重继承的问题, 我们到底销毁 IFastString 的实例, 还是IPersistentObject 的实例, 还是都要销毁? 这个问题对于简单的代码来说, 很容易解决, 只需要销毁一个就可以了, 但是当FastString 继承了很多的接口的时候, 可能就会搞不清. 针对这个问题, COM 引入了引用计数(reference count) 这个东西. 每当用接口来返回创建的FastString 对象的时候, 引用计数加一, 包括转换接口对象的情况. 而销毁接口对象的时候, 简单的把引用计数减一, 计数为零的时候实际销毁对象. 这两个操作对应的是COM 中AddRef() 和Release() 操作. 而对于转换对象接口, 不要依赖于C++ 的RTTI 实现, 因为这也是编译器相关的. 在最后附的例子代码中, 我们自己写两个一个DynamicCast() 函数来负责这项工作, 这个函数在COM 里的对象函数是 QueryInterface().

好了, 第一章就此结束, 初看会比较复杂, 但是当你把design pattern啊, windows 系统的其它部件的设计都有所了解的时候, 就会很容易理解. 侯捷童鞋有这样一篇文章: [From Cpp to COM](http://www.newasp.net/tech/program/20176.html), 建议看一下, 里面还推荐了两本书\<\<Inside C++ Object Model\>\> 和\<\<Inside COM\>\>.
