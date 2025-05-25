---
title: "Writing UTF-8 String Using ofstream in C++"
date: "2013-08-21 06:47:00"
categories: 
  - "cpp"
tags: 
  - "boost"
  - "unicode"
  - "utf-8"
---

I've googled a lot to find the answer. But none really solve the problem simply and gracefully, even on [stackoverflow](http://www.stackoverflow.com/). So we'll do ourselves here :)

Actually, `std::string` supports operation using multibytes characters. This is the base of our solution:

```cpp
static const char g_cs[] = "\xE4\xBD\xA0\xE5\xA5\xBD";

bool test_std_string()
{
    ofstream ofs("a.txt");
    ofs << string(g_cs) << endl;
    ofs.close();
    string s;
    ifstream ifs("a.txt");
    ifs >> s;
#if _WIN32
    wstring ws = utf8_to_ucs2(s);
    MessageBoxW(NULL, ws.c_str(), L"test_std_string", MB_OK);
#else
    cout << s << endl;
#endif
    return true;
}
```

`g_cs` is a Chinese word("你好" which means hello) encoded in UTF-8. The code works under both Windows(WinXP+VS2005) and Linux(Ubuntu12.04+gcc4.6). You may wanna open a.txt to check whether the string is correctly written.

**NOTE**: Under Linux, we print the string directly since the default console encoding is UTF-8, and we can view the string. While under Window, the console **DOES NOT** support UTF-8(codepage 65001) encoding. Printing to it simply causes typo. We just convert it to a `std::wstring` and use `MessageBox()` API to check the result. I will cover the encoding issue in windows console in my next post, maybe.

I began to investigate the problem, since I cannot find a solution to read/write a UTF-8 string to XML file using [boost::property_tree](http://www.boost.org/doc/libs/1_54_0/doc/html/property_tree.html). Actually, it's a bug and is already fixed in boost 1.47 and later versions. Unfortunately, Ubuntu 12.04 came with boost 1.46.1. When reading non-ASCII characters, some bytes are incorrectly skipped. The failure function is `boost::property_tree::detail::rapidxml::internal::get_index()`. My test code looks like:

```cpp
static const char g_xml[] = "\n"
    "\n"
        "\xE4\xBD\xA0\xE5\xA5\xBD\n"
        "\xE7\xA5\x9E\xE9\xA9\xAC\n"
    "\n";

bool test_boost_ptree()
{
    /* write to file */
    FILE *f = fopen("a.xml", "w");
    fwrite(g_xml, sizeof(g_xml)-1, 1, f);
    fclose(f);
    /* read and modify */
    const char cstr[] = "\xE4\xB8\xB8\xE5\xAD\x90\xE9\x85\xB1";
    try {
        boost::property_tree::ptree pt;
        int flags = boost::property_tree::xml_parser::trim_whitespace;
        boost::property_tree::read_xml("a.xml", pt, flags, std::locale());
        boost::property_tree::ptree pt2 = pt.get_child("aaa").add("bbb", string(cstr));
        boost::property_tree::xml_writer_settings settings(' ', 2);
        boost::property_tree::write_xml("b.xml", pt, std::locale(), settings);
    } catch (boost::property_tree::xml_parser_error &) {
        return false;
    } catch (boost::property_tree::ptree_bad_path &) {
        return false;
    }
    /* read again */
    try {
        boost::property_tree::ptree pt;
        int flags = boost::property_tree::xml_parser::trim_whitespace;
        boost::property_tree::read_xml("b.xml", pt, flags, std::locale());
        string s = pt.get("aaa.bbb");
#if _WIN32
        wstring ws = utf8_to_ucs2(s);
        MessageBoxW(NULL, ws.c_str(), L"test_boost_ptree", MB_OK);
#else
        cout << s << endl;
#endif
    } catch (boost::property_tree::xml_parser_error &) {
        return false;
    } catch (boost::property_tree::ptree_bad_path &) {
        return false;
    }
    return true;
}
```

Almost the same structure with the previous function. And finally the `utf8_to_ucs2()` function:

```cpp
#ifdef _WIN32
wstring utf8_to_ucs2(const string &input)
{
    wchar_t *pwc;
    wstring output;
    int len = MultiByteToWideChar(CP_UTF8, 0, input.c_str(), (int)input.length(), NULL, 0);
    pwc = new wchar_t[len+1];
    ZeroMemory(pwc, sizeof(wchar_t)*(len+1));
    MultiByteToWideChar(CP_UTF8, 0, input.c_str(), (int)input.length(), pwc, len+1);
    output = pwc;
    delete pwc;
    return output;
}
#endif
```

Please add header files yourselves to make it compile :)
