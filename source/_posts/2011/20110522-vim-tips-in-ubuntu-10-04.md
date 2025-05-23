---
title: "Vim Tips in Ubuntu 10.04"
date: "2011-05-22 17:11:00"
categories: 
  - "linux"
tags: 
  - "lucid"
  - "ubuntu"
  - "vim"
---

The objective of this article is to make Vim your programmer's editor.

First, a normal version of Vim should be installed to enable syntax highlighting. The default installation of Ubuntu 10.04 only contains a compact version "vim-tiny":

```
# sudo apt-get install vim
```

Then copy a local vim configure file:

```
# cp /etc/vim/vimrc ~/.vimrc
# vi ~/.vimrc
```

### 1\. Line Number

Add line into the .vimrc file:

```
set number
```

A similar command can be used to show/hide line number when editing on the fly:

```
:set number
:set nonumber
```

Related help:

```
:help set
:help 'number'
```

### 2\. Tab-space Conversion

From the Vim help:

```
'tabstop' 'ts'          number  (default 8)
                        local to buffer
        Number of spaces that a  in the file counts for.  Also see
        |:retab| command, and 'softtabstop' option.

        Note: Setting 'tabstop' to any other value than 8 can make your file
        appear wrong in many places (e.g., when printing it).

        There are four main ways to use tabs in Vim:
        1. Always keep 'tabstop' at 8, set 'softtabstop' and 'shiftwidth' to 4
           (or 3 or whatever you prefer) and use 'noexpandtab'.  Then Vim
           will use a mix of tabs and spaces, but typing  and  will
           behave like a tab appears every 4 (or 3) characters.
        2. Set 'tabstop' and 'shiftwidth' to whatever you prefer and use
           'expandtab'.  This way you will always insert spaces.  The
           formatting will never be messed up when 'tabstop' is changed.
        3. Set 'tabstop' and 'shiftwidth' to whatever you prefer and use a
           |modeline| to set these values when editing the file again.  Only
           works when using Vim to edit the file.
        4. Always set 'tabstop' and 'shiftwidth' to the same value, and
           'noexpandtab'.  This should then work (for initial indents only)
           for any tabstop setting that people use.  It might be nice to have
           tabs after the first non-blank inserted as spaces if you do this
           though.  Otherwise aligned comments will be wrong when 'tabstop' is
           changed.
```

I will choose to use the 2nd approach, so add:

```
set expandtab
set tabstop=4
set shiftwidth=4
```

The auto-indent feature is also useful:

```
set autoindent
```

When setting expandtab, a real tab can be input by <Ctrl-v>\_<Tab>

Related help:

```
:help autoindent
:help expandtab
:help tabstop
:help shiftwidth
:help retab
```

### 3\. Option 'modeline':

If you start editing a new file, and the 'modeline' option is on, a number of lines at the beginning and end of the file are checked for modelines. This is simply enabled by adding:

```
set modeline
```

Your C/C++ comment may look like one of the following:

```
/* vi: set ai ts=4 sw=4: */
/* vim: set ai et ts=4 sw=4: */
```

And likely, the Python comments:

```
# vi: set ai ts=4 sw=4:
# vim: set ai et ts=4 sw=4:
```

Here, `ai`, `et`, `ts` and `sw` are just abbreviations. And `expandtab` is an option only in Vim, not Vi.

Read related help by typing:

```
:help modeline
```

### 4\. Using Taglist:

There are lots of useful scripts in the Vim website that we can use. But Actually, Ubuntu repository also has some of them included:

```
# sudo apt-get install vim-scripts vim-addon-manager
```

After installation, these scripts are just downloaded, but not installed for your Vim. We list available script by typing:

```
# vim-addons
```

Output on Lucid 10.04:

```
# Name                     User Status  System Status 
align                       removed       removed       
alternate                   removed       removed       
bufexplorer                 removed       removed       
calendar                    removed       removed       
closetag                    removed       removed       
colors sampler pack         removed       removed       
detectindent                removed       removed       
doxygen-toolkit             removed       removed       
editexisting                removed       removed       
enhanced-commentify         removed       removed       
gnupg                       removed       removed       
info                        removed       removed       
justify                     removed       removed       
lbdbq                       removed       removed       
markdown-syntax             removed       removed       
matchit                     removed       removed       
minibufexplorer             removed       removed       
nerd-commenter              removed       removed       
omnicppcomplete             removed       removed       
po                          removed       removed       
project                     removed       removed       
python-indent               removed       removed       
secure-modelines            removed       removed       
snippetsEmu                 removed       removed       
sokoban                     removed       removed       
supertab                    removed       removed       
surround                    removed       removed       
taglist                     removed       removed       
tetris                      removed       removed       
utl                         removed       removed       
vcscommand                  removed       removed       
vimplate                    removed       removed       
whatdomain                  removed       removed       
winmanager                  removed       removed       
xmledit                     removed       removed
```

The Taglist plugin is described here, while OmniCppComplete plugin in next section. Both of them make use of ctags utility. Install it first:

```
# sudo apt-get install exuberant-ctags
```

Now install the Taglist plugin to your Vim:

```
# vim-addons install taglist
```

When editing a supported file type, Show the taglist window can be opened by one of the following:

```
:Tlist
:TlistOpen
:TlistToggle
```

Move your cursor between windows by <Ctrl-w>\_w as usual. You may want to add a shortcut to toggle this feature. Add lines to your .vimrc file per official document:

```
nnoremap   :TlistUpdate
nnoremap   :TlistToggle
```

When your cursor hovers on a function, <Ctrl-\]> takes you to its declaration, while <Ctrl-t> takes you back.

More help:

```
:help taglist-using
:help taglist-options
```

### 5\. Using OmniCppComplete:

Vim include basic support for code completion. The simplest way is to use <Ctrl-p>. Vim will search your include headers and do insertion. See the screenshot:

[![vim_ctrlp](images/5746665104_6f34e57521.jpg)](http://www.flickr.com/photos/gonwan1985/5746665104/)

The include search path can be set by:

```
:set path 
```

More help info:

```
:help 'complete'
:help ins-completion
```

Next, Vim provides basic C language completion using ctags. No C++ is supported. Additional languages script can be found in Vim's autoload directory, say `/usr/share/vim/vim72/autoload`. But you should generate necessary ctags index files first. For libc6 header files:

```
# cd ~/.vim 
# ctags --c-kinds=+p --fields=+aS --extra=+q -f libc /usr/include/* /usr/include/arpa/* /usr/include/bits/* /usr/include/sys/*
```

And add lines to .vimrc file:

```
autocmd FileType c set omnifunc=ccomplete#Complete
set tags +=~/.vim/libc
set completeopt=longest,menu
map  :!ctags -R --c++-kinds=+p --fields=+iaS --extra=+q .
```

Omni completion can be issued by <Ctrl-x>\_<Ctrl-o>.

Screenshot showing function prototype:

[![vim_omni_c1](images/5746744228_68243a2ef3.jpg)](http://www.flickr.com/photos/gonwan1985/5746744228/)

Screenshot showing struct member completion:

[![vim_omni_c2](images/5746200187_2f2cdcc857.jpg)](http://www.flickr.com/photos/gonwan1985/5746200187/)

More help info:

```
:help ft-syntax-onmi
```

Note, the `ccomplete` does not work well in C++ completion. So we need to install `OmniCppComplete` plugin:

```
# vim-addons install omnicppcomplete
```

Generate ctags index for libstdc++ and qt4:

```
# cd ~/.vim
# ctags -R --c++-kinds=+p --fields=+iaS --extra=+q --language-force=C++ -f libcpp /usr/include/c++
# ctags -R --c++-kinds=+p --fields=+iaS --extra=+q --language-force=C++ -f libqt4 /usr/include/qt4
```

And add lines to .vimrc file:

```
set nocp
filetype plugin on
set tags +=~/.vim/libc
set tags +=~/.vim/libcpp
set tags +=~/.vim/libqt4
set completeopt=longest,menu
map  :!ctags -R --c++-kinds=+p --fields=+iaS --extra=+q .
" OmniCppComplete Options
let OmniCpp_ShowPrototypeInAbbr = 1  " function parameters
let OmniCpp_MayCompleteScope = 1     " autocomplete after ::
let OmniCpp_DefaultNamespaces = ["std", "_GLIBCXX_STD"]  " see :help omnicpp-faq
```

You may encounter problems when completing STL functions. Refer to `:help omnicpp-faq` and find the solution. Anyway, it works all good for me. Here're screenshots showing STL and Qt code completion:

[![vim_omni_cpp1](images/5746625195_a63af8e1c9.jpg)](http://www.flickr.com/photos/gonwan1985/5746625195/)

[![vim_omni_cpp2](images/5746625207_e897a6e76d.jpg)](http://www.flickr.com/photos/gonwan1985/5746625207/)

**!!!NOTE!!!** : The _tags_ file for current file must be generated for OmniCppComplete to work. I've set _Ctrl+F12_ as the accelerate key. Otherwise, you'll get "Pattern not found" error. More help:

```
:help omnicpp-options
:help omnicpp-features
```

Finally, the list of lines adding to my .vimrc file:

```
set number
"set autoindent
"set expandtab
"set tabstop=4
"set shiftwidth=4
set modeline

" Taglist Options
let Tlist_Exit_OnlyWindow = 1
nnoremap   :TlistUpdate
nnoremap   :TlistToggle

set nocp
filetype plugin on
set tags +=~/.vim/libc
set tags +=~/.vim/libcpp
set tags +=~/.vim/libqt4
set completeopt=longest,menu
map  :!ctags -R --c++-kinds=+p --fields=+iaS --extra=+q .

" OmniCppComplete Options
let OmniCpp_ShowPrototypeInAbbr = 1  " function parameters
let OmniCpp_MayCompleteScope = 1     " autocomplete after ::
let OmniCpp_DefaultNamespaces = ["std", "_GLIBCXX_STD"]  " see :help omnicpp-faq
```
