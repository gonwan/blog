---
title: "Basic Usage of Boost MultiIndex Containers"
date: "2015-12-28"
categories: 
  - "cc"
tags: 
  - "boost"
  - "data-structures"
---

Just take a simple note here. The Boost Multi-index Containers Library provides a class template named `multi_index_container` which enables the construction of containers maintaining one or more _indices_ with different sorting and access semantics.

```
#include 
#include 
#include 
#include 
#include 
#include 
#include 
#include 
using namespace std;
using namespace boost::multi_index;


struct auth
{
    string m_name;
    string m_pass;
    auth(const string &name, const string &pass)
        : m_name(name), m_pass(pass) { }
    bool operator<(const auth &o) const { return m_name < o.m_name; }
    friend ostream &operator<<(ostream &os, const auth &a) { os << "(" << a.m_name << ", " << a.m_pass << ")"; return os; }
};

struct employee
{
    int m_id;
    auth m_auth;
    int m_hire;
    int m_resign;
    employee(int id, const string &name, const string &pass, int hire, int resign)
        : m_id(id), m_auth(name, pass), m_hire(hire), m_resign(resign) { }
    bool operator<(const employee &o) const { return m_id < o.m_id; }
    friend ostream &operator<<(ostream &os, const employee &e) { os << "(" << e.m_id << ", " << e.m_auth << ", " << e.m_hire << ", " << e.m_resign << ")"; return os; }
};


struct auth_t { };

struct change_resign {
    int m_resign;
    change_resign(int r) : m_resign(r) { }
    void operator()(employee &e) { e.m_resign = m_resign; }
};

typedef multi_index_container<
    employee,
    indexed_by<
        /* sort by employee::operator< */
        ordered_unique >,
        /* sort by less on m_hire */
        ordered_non_unique >,
        /* sort by less on m_auth */
        ordered_non_unique, member >
    >
> employee_set;

int main()
{
    employee_set es;
    es.insert(employee(1, "555", "555pass", 2012, 0));
    es.insert(employee(2, "444", "444pass", 2011, 0));
    es.insert(employee(3, "333", "333pass", 2013, 0));
    es.insert(employee(4, "222", "222pass", 2015, 0));
    es.insert(employee(5, "555", "555pass", 2014, 0)); /* dup */
    typedef employee_set::nth_index<1>::type hire_index_t;
    typedef employee_set::index::type auth_index_t;
    cout << "Get a view to index #1 (m_hire).." << endl;
    hire_index_t &hire_index = es.get<1>();
    std::copy(hire_index.begin(), hire_index.end(), ostream_iterator(cout, "\n"));
    cout << "Get a view to index tag auth_t (m_auth).." << endl;
    const auth_index_t &auth_index = es.get();
    std::copy(auth_index.begin(), auth_index.end(), ostream_iterator(cout, "\n"));
    cout << "Find.." << endl;
    hire_index_t::iterator it = hire_index.find(2015);
#if 0
    employee t = *it;
    t.m_resign = 2048;
    hire_index.replace(it, t);
#else
    hire_index.modify_key(it, boost::lambda::_1=1111);
    int old_resign = it->m_resign;
    hire_index.modify(it, change_resign(2048), change_resign(old_resign));
#endif
    cout << (*it) << endl;
    cout << "Find all.." << endl;
    pair pr = auth_index.equal_range(auth("555", ""));
    std::copy(pr.first, pr.second, ostream_iterator(cout, "\n"));
    return 0;
}
```

Output:

```
Get a view to index #1 (m_hire)..
(2, (444, 444pass), 2011, 0)
(1, (555, 555pass), 2012, 0)
(3, (333, 333pass), 2013, 0)
(5, (555, 555pass), 2014, 0)
(4, (222, 222pass), 2015, 0)
Get a view to index tag auth_t (m_auth)..
(4, (222, 222pass), 2015, 0)
(3, (333, 333pass), 2013, 0)
(2, (444, 444pass), 2011, 0)
(1, (555, 555pass), 2012, 0)
(5, (555, 555pass), 2014, 0)
Find..
(4, (222, 222pass), 1111, 2048)
Find all..
(1, (555, 555pass), 2012, 0)
(5, (555, 555pass), 2014, 0)
```

To use with pointer values, only limited change needed as highlighted:

```
#include 
#include 
#include 
#include 
#include 
#include 
#include 
#include 
using namespace std;
using namespace boost::multi_index;


struct auth
{
    string m_name;
    string m_pass;
    auth(const string &name, const string &pass)
        : m_name(name), m_pass(pass) { }
    bool operator<(const auth &o) const { return m_name < o.m_name; }
    friend ostream &operator<<(ostream &os, const auth &a) { os << "(" << a.m_name << ", " << a.m_pass << ")"; return os; }
};

struct employee
{
    int m_id;
    auth m_auth;
    int m_hire;
    int m_resign;
    employee(int id, const string &name, const string &pass, int hire, int resign)
        : m_id(id), m_auth(name, pass), m_hire(hire), m_resign(resign) { }
    bool operator<(const employee &o) const { return m_id < o.m_id; }
    friend ostream &operator<<(ostream &os, const employee *e) { os << "(" << e->m_id << ", " << e->m_auth << ", " << e->m_hire << ", " << e->m_resign << ")"; return os; }
};


struct auth_t { };

struct change_resign {
    int m_resign;
    change_resign(int r) : m_resign(r) { }
    void operator()(employee *e) { e->m_resign = m_resign; }
};

typedef multi_index_container<
    employee *,
    indexed_by<
        /* sort by employee::operator< */
        ordered_unique >,
        /* sort by less on m_hire */
        ordered_non_unique >,
        /* sort by less on m_auth */
        ordered_non_unique, member >
    >
> employee_set;

int main()
{
    employee_set es;
    es.insert(new employee(1, "555", "555pass", 2012, 0));
    es.insert(new employee(2, "444", "444pass", 2011, 0));
    es.insert(new employee(3, "333", "333pass", 2013, 0));
    es.insert(new employee(4, "222", "222pass", 2015, 0));
    es.insert(new employee(5, "555", "555pass", 2014, 0)); /* dup */
    typedef employee_set::nth_index<1>::type hire_index_t;
    typedef employee_set::index::type auth_index_t;
    cout << "Get a view to index #1 (m_hire).." << endl;
    hire_index_t &hire_index = es.get<1>();
    std::copy(hire_index.begin(), hire_index.end(), ostream_iterator(cout, "\n"));
    cout << "Get a view to index tag auth_t (m_auth).." << endl;
    const auth_index_t &auth_index = es.get();
    std::copy(auth_index.begin(), auth_index.end(), ostream_iterator(cout, "\n"));
    cout << "Find.." << endl;
    hire_index_t::iterator it = hire_index.find(2015);
#if 0
    employee *t = *it;
    t->m_auth.m_name = "888";
    /* must use replace() to notify changes in indexed fields */
    hire_index.replace(it, t);
#else
    hire_index.modify_key(it, boost::lambda::_1=1111);
    int old_resign = (*it)->m_resign;
    hire_index.modify(it, change_resign(2048), change_resign(old_resign));
#endif
    cout << (*it) << endl;
    cout << "Find all.." << endl;
    pair pr = auth_index.equal_range(auth("555", ""));
    std::copy(pr.first, pr.second, ostream_iterator(cout, "\n"));
    /* clear */
    for (employee_set::const_iterator it = es.begin(); it != es.end(); ++it) {
        delete *it;
    }
    employee_set().swap(es);
    return 0;
}
```
