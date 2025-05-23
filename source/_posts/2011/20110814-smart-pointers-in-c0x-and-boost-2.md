---
title: "Smart Pointers in C++0x and Boost (2)"
date: "2011-08-14 17:32:00"
categories: 
  - "cc"
tags: 
  - "boost"
  - "c0x"
---

### 1\. Environment

\- windows xp - gcc-4.4 - boost-1.43

### 2\. auto\_ptr

A smart pointer is an abstract data type that simulates a pointer while providing additional features, such as automatic garbage collection or bounds checking. There's `auto_ptr` in C++03 library for general use. But it's not so easy to deal with it. You may encounter pitfalls or limitations. The main drawback of `auto_ptr` is that it has the transfer-of-ownership semantic. I just walk through it. Please read comments in code carefully:

```
int *test_auto_ptr_exp() {
    auto_ptr p(new int(1));
    throw runtime_error("auto_ptr test exception.");
    /* exception-safe, p is free even when an exception is thrown. */
    return p.get();
}

void test_auto_ptr_basic() {
    auto_ptr p1(new int(1));
    auto_ptr p2(new int(2));
    auto_ptr p3(p1);
    auto_ptr p4;
    p4 = p2;
    if (p1.get()) {  /* NULL */
        cout << "*p1=" << *p1 << endl;
    }
    if (p2.get()) {  /* NULL */
        cout << "*p2=" << *p2 << endl;
    }
    if (p3.get()) {  /* ownership already transferred from p1 to p3 */
        cout << "*p3=" << *p3 << endl;
    }
    if (p4.get()) {  /* ownership already transferred from p2 to p4 */
        cout << "*p4=" << *p4 << endl;
    }
    /* ERROR: void is a type of template specialization */
    //auto_ptr ptr5(new int(3));
}

void test_auto_ptr_errors() {
    /* ERROR: statically allocated object */
    const char *str = "Hello";
    auto_ptr p1(str);
    /* ERROR: two auto_ptrs refer to the same object */
    int *pi = new int(5);
    auto_ptr p2(pi);
    auto_ptr p3(p2.get());
    p2.~auto_ptr();  /* now p3 is not available too */
    /* ERROR: hold a pointer to a dynamically allocated array */
    /* When destroyed, it only deletes first single object. */
    auto_ptr (new int[10]);
    /* ERROR: store an auto_ptr in a container */
    //vector > vec;
    //vec.push_back(auto_ptr(new int(1)));
    //vec.push_back(auto_ptr(new int(2)));
    //auto_ptr p4(vec[0]);  /* vec[0] is assigned NULL */
    //auto_ptr p5;
    //p5 = vec[1];  /* vec[1] is assigned NULL */
}
```

### 3\. unique\_ptr

To resolve the drawbacks, C++0x deprecates usage of `auto_ptr`, and `unique_ptr` is the replacement. `unique_ptr` makes use of a new C++ langauge feature called _rvalue reference_ which is similar to our current (left) reference (_&_), but spelled (_&&_). GCC implemented this feature in 4.3, but `unique_ptr` is only available begin from 4.4.

What is _rvalue_?

_rvalues_ are temporaries that evaporate at the end of the full-expression in which they live ("at the semicolon"). For example, _1729_, _x + y_, _std::string("meow")_, and _x++_ are all rvalues.

While, _lvalues_ name objects that persist beyond a single expression. For example, _obj_, _\*ptr_, _ptr\[index\]_, and _++x_ are all lvalues.

**NOTE**: It's important to remember: _lvalueness_ versus _rvalueness_ is a property of expressions, not of objects.

We may have another whole post to address the _rvalue_ feature. Now, let's take a look of the basic usage. Please carefully reading the comments:

```
unique_ptr get_unique_ptr(int i) {
    return unique_ptr (new int(i));
}

void use_unique_ptr(unique_ptr p) {
    /* p is deleted when finish running this function. */
}

void test_unique_ptr_basic() {
    unique_ptr p(new int(1));
    /*
     * One can make a copy of an rvalue unique_ptr.
     * But one can not make a copy of an lvalue unique_ptr.
     * Note the defaulted and deleted functions usage in source code(c++0x).
     */
    //unique_ptr p2 = p;  /* error */
    //use_unique_ptr(p);       /* error */
    use_unique_ptr(move(p));
    use_unique_ptr(get_unique_ptr(3));
}
```

One can ONLY make a copy of an rvalue `unique_ptr`. This confirms no ownership issues occur like that of `auto_ptr`. Since temporary values cannot be referenced after the current expression, it is impossible for two `unique_ptr` to refer to a same pointer. You may also noticed the _move_ function. We will also discuss it in a later post.

Some more snippet:

```
struct aclass {
    aclass() { cout << "in aclass::ctor()" << endl; }
    ~aclass() { cout << "in aclass::dtor()" << endl; }
};

struct aclass_deleter {
    void operator()(void *p) {
        delete static_cast (p);
    }
};

template
struct array_deleter {
    void operator()(T *array) {
        delete[] array;
    }
};

typedef array_deleter aclass_array_deleter;
typedef unique_ptr aclass_array_ptr;

void test_unique_ptr_custom_deleter() {
    /*
     * Hold a pointer to a dynamically allocated array.
     * aaptr & aaptr2 are deleted when finish running this function.
     */
    aclass_array_ptr aaptr(new aclass[3]);
    unique_ptr aaptr2(new aclass[3]);  /* default_deleter */
    /* allow void pointer, but a custom deleter must be used. */
    unique_ptr p3(new aclass);
}
```

`unique_ptr` can hold pointers to an array. `unique_ptr` defines _deleter_s to free memory of its internal pointer. There are pre-defined `default_deleter` using _delete_ and _delete\[\]_(array) for general deallocation. You can also define your customized ones. In addition, a `void` type can be used.

**NOTE**: To compile the code, you must specify the `-std=c++0x` flag.

### 4\. shared\_ptr

A `shared_ptr` is used to represent shared ownership; that is, when two pieces of code needs access to some data but neither has exclusive ownership (in the sense of being responsible for destroying the object). A `shared_ptr` is a kind of counted pointer where the object pointed to is deleted when the use count goes to zero.

Following snippet shows the use count changes when using `shared_ptr`. The use count changes from 0 to 3, then changes back to 0:

```
struct bclass {
    int i;
    bclass(int i) { this->i = i; }
    virtual ~bclass() { cout << "in bclass::dtor() with i=" << i << endl; }
};

struct cclass: bclass {
    cclass(int i) : bclass(i) { }
    virtual ~cclass() { cout << "in cclass::dtor() with i=" << i << endl; }
};

void use_shared_ptr(shared_ptr p) {
    cout << "count=" << p.use_count() << endl;
}

void test_shared_ptr_basic() {
    shared_ptr p;
    cout << "count=" << p.use_count() << endl;
    p.reset(new int(1));
    cout << "count=" << p.use_count() << endl;
    shared_ptr p2 = p;
    cout << "count=" << p.use_count() << endl;
    use_shared_ptr(p2);
    cout << "count=" << p.use_count() << endl;
    p2.~shared_ptr();
    cout << "count=" << p.use_count() << endl;
    p2.~shared_ptr();
    cout << "count=" << p.use_count() << endl;
}
```

Snippets showing pointer type conversion:

```
void test_shared_ptr_convertion() {
    /* p is deleted accurately without custom deleter */
    shared_ptr p(new aclass);
    /* use parent type to hold child object */
    shared_ptr p2(new cclass(10));
    shared_ptr p3 = static_pointer_cast (p2);
    cout << "p3->i=" << p3->i << endl;
    p3->i = 20;
    cout << "p2->i=" << p2->i << endl;
}
```

The `void` type can be used directly without a custom deleter, which is required in `unique_ptr`. Actually, `shared_ptr` has already save the exact type info in its constructor. Refer to source code for details :). And `static_pointer_cast` function is used to convert between pointer types.

Unlike `auto_ptr`, Since `shared_ptr` can be _shared_, it can be used in STL containers:

```
typedef shared_ptr bclass_ptr;

struct bclass_ops {
    void operator()(const bclass_ptr& p) {
        cout << p->i << endl;
    }
    bool operator()(const bclass_ptr& a, const bclass_ptr& b) {
        return a->i < b->i;
    }
};

void test_shared_ptr_containers() {
    vector vec1, vec2;
    bclass_ptr ptr(new bclass(1));
    vec1.push_back(ptr);
    vec2.push_back(ptr);
    ptr.reset(new bclass(2));
    vec1.push_back(ptr);
    vec2.push_back(ptr);
    ptr.reset(new bclass(3));
    vec1.push_back(ptr);
    vec2.push_back(ptr);
    for_each(vec1.begin(), vec1.end(), bclass_ops());
    reverse(vec2.begin(), vec2.end());
    for_each(vec2.begin(), vec2.end(), bclass_ops());
}
```

**NOTE**: `shared_ptr` is available in both TR1 and Boost library. You can use either of them, for their interfaces are compatible. In addition, there are [dual C++0x and TR1 implementation](http://gcc.gnu.org/onlinedocs/libstdc++/manual/shared_ptr.html). The TR1 implementation is considered relatively stable, so is unlikely to change unless bug fixes require it.

### 5\. weak\_ptr

`weak_ptr` objects are used for breaking cycles in data structures. See snippet:

```
struct mynode {
    int i;
    shared_ptr snext;
    weak_ptr wnext;
    mynode(int i) { this->i = i; }
    ~mynode() { cout << "in mynode::dtor() with i=" < i < endl; }
};

void test_weak_ptr() {
    shared_ptr head(new mynode(1));
    head->snext = shared_ptr(new mynode(2));
    /* use weak_ptr to solve cyclic dependency */
    //head->snext = head;
    head->wnext = head;
}
```

If we use uncomment to use `shared_ptr`, _head_ is not freed since there still one reference to it when exiting the function. By using `weak_ptr`, this code works fine.

### 6\. scoped\_ptr

`scoped_ptr` template is a simple solution for simple needs. It supplies a basic "resource acquisition is initialization" facility, without shared-ownership or transfer-of-ownership semantics.

This class is only available in Boost. Since `unique_ptr` is already there in C++0x, this class may be thought as redundant. Snippet is also simple:

```
void test_scoped_ptr() {
    /* simple solution for simple needs */
    scoped_ptr p(new aclass);
}
```

Complete and updated code can be found on google code host [here](http://code.google.com/p/qskin/source/browse/trunk/study/cpp/smartptr.cpp). I use conditional compilation to swith usage between TR1 and Boost implementation in code. Hope you find it useful.
