---
title: "整理了一下Qt 的coding convention"
date: "2009-10-09 06:20:00"
categories: 
  - "cc"
tags: 
  - "qt"
---

开门见山, 我就直接罗列了, 主要是naming convention, style convention 的话, 私以为自己还不错, 就不参考了.

0. General: a) 命名要有意义. b) 命名要一致. 比如不要先用prev, 然后用previous. c) 命名尽量不要缩写. 超过2 个字母, 第一个字母大写其余小写; 只有2 个字母的则全部大写.

1. Class: a) 类名: 单词首字母大写, 以Q 为首字母. b) 成员变量: 除了第一个单词, 其余首字母大写. c) 成员函数: 同上. d) 静态成员: 同上. e) 接口: Qt 似乎除了plugin 相关, 不太用接口(纯抽象类). 一般以QXxxInterface, QXxxPlugin 来命名.

2. 结构: a) 命名跟类一样, 没有特别的convention. b) 公有的结构以Q 为首字母. 如果是嵌套的, 似乎没有规律.

3. 枚举: a) 命名跟类一样, 没有特别的convention. b) 与类相关的枚举可以定义在类中, 这样可以用类名作为前缀. c) 公有枚举放到公共的名字空间中. 类, 结构, 接口不放到这个名字空间. d) 命名体现枚举值的相关性. 比如Qt::CaseInsensitive, Qt::CaseSensitive. e) 尽量用枚举作为Flag 使用. Qt 中有QFlag, QFlags 两个类作为辅助.

5. 函数: a) 全局函数: qXxxXxx. 比如qFill, qBinaryFind.

6. 宏: a) 全部大写, 下划线分隔. b) static const 的全局变量同上.

7. PS: a) 编辑器的文本编码最好设成ascii, 这样就保证不会出现中文之类了. b) 函数的参数, Qt 推荐使用指针, 而不是引用, 因为能显式说明参数会被修改. c) 头文件include 的顺序, 越是specilized 的放在前面, 越是general 的越放在后面.

Qt 的coding convention 跟Java 的非常像. 私以为加上匈牙利命名法会更好一些. 其实又参考了wxWidgets 的部分代码, 由于它不用命名空间, 所以枚举的命名有些小不一样.

**参考**:
- [Designing Qt-Style C++ APIs](http://doc.trolltech.com/qq/qq13-apis.html)
- [Qt - CodingConventions](http://qt.gitorious.org/qt/pages/CodingConventions)
- [Qt - CodingStyle](http://qt.gitorious.org/qt/pages/QtCodingStyle)
