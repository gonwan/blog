---
title: "笔记 - Essential COM (1.1)"
date: "2009-06-02"
categories: 
  - "cc"
tags: 
  - "com"
---

首先解释一下, COM 这个东西真的非常的难入门啊. 1.1 只是为了说明一些补充内容, 不算正式笔记嗯.

本文主要说一下C++ 中多重继承的一些问题.

要自己写一个COM 组件, 最最最简单的大概是这样的一个结构: 写2 个interface 继承IUnknown 接口, 然后再写一个实现类实现这两个interface.

这里假设的是我们用的是C++ 来实现COM 组件.　因为C++ 中没有语言级别的interface 的支持, 所以SDK 中interface 实际上被typedef 成了struct, 以保证所有申明的接口都默认就是public 的访问权限. 于是这就涉及到了C++ 中多继承的概念. 先不说COM, 假设已经有如下的类定义:

```
class ClassA
{
};
class ClassB : /*virtual*/ public ClassA
{
};
class ClassC : /*virtual*/ public ClassA
{
};
class ClassD : public ClassB, public ClassC
{
};
```

可以把ClassA 想像成IUnknown 接口, ClassB 和ClassC 想像成接口类, ClassD 就是实现类. COM 的标准是不允许使用虚拟基类, 即被注释掉的virtual 关键字, 理由是各厂家的编译器在实现这个feature 的时候, 二进制的格式不统一. 这里牵涉到一个vptr(virtual pointer), vtbl(virtual table) 的概念. 简单来说, C++ 中任何带有虚函数的类都会存在vptr 和vtbl, 它们的作用就是负责动态绑定. vptr 和vtbl 都是编译器生成而程序员是不能手动控制的(有些编译器指令大概可以). vptr 是一个指针指向vtbl, vtbl 是一个类似数组的东西, 它保存了当前类中所有虚函数的实际绑定地址.

更详细的内容可以参考: <<Inside the C++ Object Model>> 第4.3 节. 然后有一段代码可以帮助更好的理解vptr 和vtbl: [http://www.go4expert.com/forums/showthread.php?t=8403](http://www.go4expert.com/forums/showthread.php?t=8403)

知道了以上这些之后, 再来看如下代码:

```
int main()
{
    ClassD *pD = new ClassD;
    printf("pD=%pn", pD);
    ClassB *pB = (ClassB *)pD;
    ClassC *pC = (ClassC *)pD;
    printf("pB=%pn", pB);
    printf("pC=%pn", pC);
    ClassA *pA1 = (ClassA *)pB;
    ClassA *pA2 = (ClassA *)pC;
    printf("pA1=%pn", pA1);
    printf("pA2=%pn", pA2);
    delete pD;
    return 0;
}
```

以下是我机器上的执行结果:

```
pD=00161A88
pB=00161A88
pC=00161A89
pA1=00161A88
pA2=00161A89
```

惊讶吧? 作为父类实例的pC 指针跟作为子类实例的pD 指针居然不相等. 为什么呢? 就是因为vptr 的影响. 注意: 只有多重继承的时候才会这样. 单继承的时候指针的转换还是相等的, 比如pB 和pD 指针. 而相对的, 因为包含ClassA 的两重数据, pA1 和pA2 也是不相等的.

让我们把virtual 关键字加上再试试结果看会怎么样吧?

```
pD=005D1A88
pB=005D1A88
pC=005D1A8C
pA1=005D1A90
pA2=005D1A90
```

我们看到pB 和pC 之间差了4 个byte, 而之前是1 个byte. 看来虚拟基类果然把C++ 的vptr 结构改了呢. 具体怎么改的我也暂时没能力探明=v=. 说这个只是为了证明: C++ 中的虚拟基类是会破坏COM 的二进制兼容性的.

以上.
