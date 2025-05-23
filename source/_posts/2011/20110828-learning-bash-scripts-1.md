---
title: "Learning Bash Scripts (1)"
date: "2011-08-28 10:17:00"
categories: 
  - "linux"
tags: 
  - "bash-2"
  - "shell"
  - "ubuntu"
---

In this first post of the series, some basic concepts are introduced. All information from [_Linux Command Line and Shell Scripting Bible, Second Edition_](http://www.amazon.com/Linux-Command-Shell-Scripting-Second/dp/1118004426).

### 1. Shell Types

There are three ways of starting a bash shell: - As a default login shell at login time - As an interactive shell that is not the login shell - As a non-interactive shell to run a script

#### Login Shell

When you log in to the Linux system, the bash shell starts as a login shell. The login shell looks for four different startup files to process commands from. The following is the order in which the bash shell processes the files:

\- _/etc/profile_ - _$HOME/.bash_profile_ - _$HOME/.bash_login_ - _$HOME/.profile_

#### Interactive Shell

If you start a bash shell without logging into a system (such as if you just type bash at a CLI prompt), you start what's called an interactive shell. The interactive shell doesn't act like the login shell, but it still provides a CLI prompt for you to enter commands.

If bash is started as an interactive shell, it doesn't process the `/etc/profile` file. Instead, it checks for the `.bashrc` file in the user's HOME directory.

#### Non-interactive Shell

Finally, the last type of shell is a non-interactive shell. This is the shell that the system starts to execute a shell script. This is different in that there isn't a CLI prompt to worry about. However, there may still be specific startup commands you want to run each time you start a script on your system.

To accommodate that situation, the bash shell provides the BASH_ENV environment variable. When the shell starts a non-interactive shell process, it checks this environment variable for the name of a startup file to execute. If one is present, the shell executes the commands in the file.

### 2. Terminfo Database

The terminfo database is a set of files that identify the characteristics of various terminals that can be used on the Linux system. The Linux system stores the terminfo data for each terminal type as a separate file in the terminfo database directory. The location of this directory often varies from distribution to distribution. Some common locations are _/usr/share/terminfo_, _/etc/terminfo_, and _/lib/terminfo_.

Since the terminfo database files are binary, you cannot see the codes within these files. However, you can use the `infocmp` command to convert the binary entries into text.

The Linux shell uses the TERM environment variable to define which terminal emulation setting in the terminfo database to use for a specific session. When the TERM environment variable is set to vt100, the shell knows to use the control codes associated with the vt100 terminfo database entry for sending control codes to the terminal emulator.

### 3. Virtual Consoles

With modern Linux systems, when the Linux system starts it automatically creates several virtual consoles. A virtual console is a terminal session that runs in memory on the Linux system. Instead of having several dumb terminals connected to the PC, most Linux distributions start seven (or sometimes even more) virtual consoles that you can access from the single PC keyboard and monitor.

In most Linux distributions, you can access the virtual consoles using a simple keystroke combination. Usually you must hold down the Ctl+Alt key combination, and then press a function key (F1 through F8) for the virtual console you want to use. Function key F1 produces virtual console 1, key F2 produces virtual console 2, and so on.

### 4. Environment Variables

There are two types of environment variables in the bash shell: - Global variables - Local variables

Global environment variables are visible from the shell session, and from any child processes that the shell spawns. Local variables are only available in shell that creates them. This makes global environment variables useful in applications that spawn child processes that require information from the parent process.

#### Get

To view the global environment variables, use the `printenv` command. To display the value of an individual environment variable, use the echo command. When referencing an environment variable, you must place a dollar sign($) before the environment variable name.

Unfortunately there isn't a command that displays only local environment variables. The `set` command displays all of the environment variables set for a specific process. However, this also includes the global environment variables.

#### Set

You can assign either a numeric or a string value to an environment variable by assigning the variable to a value using the equal sign(=). It's extremely important that there are no spaces between the environment variable name, the equal sign, and the value. If you put any spaces in the assignment, the bash shell interprets the value as a separate command.

The method used to create a global environment variable is to create a local environment variable and then `export` it to the global environment.

Of course, if you can create a new environment variable, it makes sense that you can also remove an existing environment variable. You can do this with the `unset` command.When referencing the environment variable in the `unset` command, remember not to use the dollar sign.

**NOTE**: When dealing with global environment variables, things get a little tricky. If you're in a child process and unset a global environment variable, it applies only to the child process. The global environment variable is still available in the parent process.
