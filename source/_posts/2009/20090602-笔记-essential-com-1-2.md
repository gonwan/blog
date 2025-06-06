---
title: "笔记 - Essential COM (1.2)"
date: "2009-06-02 14:22:00"
categories: 
  - "cpp"
tags: 
  - "com"
---

依然是补充内容, 还是跟继承相关, 不过这次还有模板(template).

直接看代码吧:

```cpp
template <class T>
class Array {
public:
    virtual int Compare(const Array<T>& rhs) = 0;
    bool operator< (const Array<T>& rhs)
    { return this->Compare(rhs) < 0; }
    bool operator> (const Array<T>& rhs)
    { return this->Compare(rhs) > 0; }
    bool operator== (const Array<T>& rhs)
    { return this->Compare(rhs) == 0; }
private:
    T m_rg[1024];
};
```

这是一个数组模板类, 提供了数据类型无关的一系列比较操作, 子类需要重载的就是Compare() 这个纯虚函数了. 比如有一个字符串的类:

```cpp
class String : public Array<char> {
public:
    int Compare(const Array<char>& rhs)
    { return strcmp(m_rg, rhs.m_rg); }
};
```

这样的写法似乎是理所应当的, 但是考虑一下之前笔记1.1 中关于vptr, vbtl 的内容, 使用虚函数首先会层加4 个byte 的内存开销, 而且later binding 的操作过程相对于其它运算以及函数调用操作是非常慢的. 于是M$ 的童鞋们想出了不用虚函数, 也能实现动态绑定的方法, 还是继续看代码:

```cpp
template <class T, class Deriving>
class Array {
public:
    bool operator< (const Array<T, Deriving>& rhs)
    { return static_cast<Deriving* >(this)->Compare(rhs) < 0; }
    bool operator> (const Array<T, Deriving>& rhs)
    { return static_cast<Deriving* >(this)->Compare(rhs) > 0; }
    bool operator== (const Array<T, Deriving>& rhs)
    { return static_cast<Deriving* >(this)->Compare(rhs) == 0; }
private:
    T m_rg[1024];
};
```

在模板参数中, 我们加入了子类的类型, 所以在父类中, 就可以用static_cast 来转成特定的子类类型来进行操作, 而不是到vptr 那边兜个圈子了. 而接下来只要保证String 类继承Array 类, 就不会有类型不对之类的发满出现了:

```cpp
class String : public Array<char, String> {
public:
    int Compare(const Array<char, String>& rhs)
    { return strcmp(m_rg, rhs.m_rg); }
};
```

这样的做法, 既节省了vptr 和vbtl 的内存开销, 又大大提高了performance.

可能会有这样的疑问:
- 定义类的时候, 把自己的类型作为模板参数可以么? 答案是可以, template 的标准并没有说不可以.
- 定义Array 类的时候, 并不知道有Compare() 这个函数, 也可以调用? 丸子告诉你, 你一定是java写多了, C++ 就是这样的, 的确有些类型不安全.

以上. 刚才说了这是M$ 的人想出来的, 而这也是ATL(Active Template Library) 的基础.
