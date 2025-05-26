---
title: "Learning Bash Scripts (2)"
date: "2011-10-04 09:13:00"
categories: 
  - "linux"
tags: 
  - "bash"
  - "shell"
  - "ubuntu"
---

### 1. Comments

When creating a shell script file, you must specify the shell you are using in the first line of the file. The format for this is:

```bash
#!/bin/bash
# This script displays the date and who's logged on
date
who
```

In a normal shell script line, the pound sign(#) is used as a comment line. A comment line in a shell script isn't processed by the shell. However, the first line of a shell script file is a special case, and the pound sign followed by the exclamation point tells the hell what shell to run the script under (yes, you can be using a bash shell and run your script using another shell).

### 2. Display

The `echo` command can display a simple text string if you add the string following the command.

```bash
#!/bin/bash
# basic usage
echo This is a test.
echo "Let's see if this'll work"
# environment variables
echo "User info for user: $USER"
echo UID: $UID
echo HOME: $HOME
echo "The cost of the item is \$15"
# user variables
days=10
guest="Katie"
echo "$guest checked in $days days ago"
days=5
guest="Jessica"
echo "$guest checked in $days days ago"
# backtip
testing=`date`
echo "The date and time are: " $testing
```

The `echo` command uses either double or single quotes to delineate text strings. If you use them within your string, you need to use one type of quote within the text and the other type to delineate the string.

Notice that the environment variables in the `echo` commands are replaced by their current values when the script is run. Also notice that we were able to place the $USER system variable within the double quotation marks in the first string, and the shell script was still able to figure out what we meant.

You may also see variables referenced using the format ${variable}. The extra braces around the variable name are often used to help identify the variable name from the dollar sign.

User variables can be any text string of up to 20 letters, digits, or an underscore character. User variables are case sensitive, so the variable Var1 is different from the variable var1. This little rule often gets novice script programmers in trouble.

Values are assigned to user variables using an equal sign. No spaces can appear between the variable, the equal sign, and the value (another trouble spot for novices). Here are a few examples of assigning values to user variables.

The shell script automatically determines the data type used for the variable value. Variables defined within the shell script maintain their values throughout the life of the shell script but are deleted when the shell script completes.

Just like system variables, user variables can be referenced using the dollar sign. It's important to remember that when referencing a variable value you use the dollar sign, but when referencing the variable to assign a value to it, you do not use the dollar sign.

The backtick allows you to assign the output of a shell command to a variable.

### 3. Redirect I/O

\>: output redirect >>: output redirect append data <: input redirect <<: inline input redirect

```bash
# wc << EOF
> test string 1
> test string 2
> test string 3
> EOF
    3    9    42
# 
```

The inline input redirection symbol is the double less-than symbol (<<). Besides this symbol, you must specify a text marker that delineates the beginning and end of the data used for input. You can use any string value for the text marker, but it must be the same at the beginning of the data and the end of the data.

### 4. Math Expression

```bash
#!/bin/bash
var1=10
var2=3
var3=`expr $var1 \* $var2`
var4=$[$var1 * $var2]
var5=`expr $var1 / $var2`
var6=$[$var1 / $var2]
var7=`echo "scale=3; $var1 / $var2" | bc`
echo The result is $var3
echo The result is $var4
echo The result is $var5
echo The result is $var6
echo The result is $var7
```

The `expr` command allowed the processing of equations from the command line. Note the spaces around operator is necessary. Escape character(backslash) is used to identify any characters that may be misinterpreted by the shell before being passed to the `expr` command.

Bash also provides a much easier way of performing mathematical equations. In bash, when assigning a mathematical value to a variable, you can enclose the mathematical equation using a dollar sign and square brackets (`$[ operation ]`).

The bash shell mathematical operators support only integer arithmetic. The most popular solution uses the built-in bash calculator, called `bc`.

### 5. Structured Commands

#### 5.1 if/else

The bash shell *if* statement runs the command defined on the *if* line. If the exit status of the command is zero (the command completed successfully), the commands listed under the *then* section are executed. If the exit status of the command is anything else, the then commands aren't executed, and the bash shell moves on to the next command in the script.

```bash
#!/bin/bash
user=gonwan
user2=test2
user3=test3
# if-then
if grep $user /etc/passwd; then
    echo "The bash files for user $user are:"
    ls -a /home/$user/.b*
fi
# if-then-else
if grep $user2 /etc/passwd; then
    echo "The bash files for user $user2 are:"
    ls -a /home/$user2/.b*
else
    echo "The user name $user2 does not exist on this system"
fi
#if-then-elif-then-else
if grep $user3 /etc/passwd; then
    echo "The bash files for user $user3 are:"
    ls -a /home/$user3/.b*
elif grep $user2 /etc/passwd; then
    echo "The bash files for user $user2 are:"
    ls -a /home/$user2/.b*
else
    echo "The user name $user2 and $user3 does not exist on this system"
fi
```

#### 5.2 test

The `test` command provides a way to test different conditions in an *if-then* statement. If the condition listed in the test command evaluates to true, the test command exits with a zero exit status code, making the *if-then* statement behave in much the same way that *if-then* statements work in other programming languages. If the condition is false, the test command exits with a 1, which causes the *if-then* statement to fail.

##### 5.2.1 Numeric Comparisons

| Comparison | Description                                 |
| ---------- | ------------------------------------------- |
| n1 -eq n2  | Check if n1 is equal to n2.                 |
| n1 -ge n2  | Check if n1 is greater than or equal to n2. |
| n1 -gt n2  | Check if n1 is greater than n2.             |
| n1 -le n2  | Check if n1 is less than or equal to n2.    |
| n1 -lt n2  | Check if n1 is less than n2.                |
| n1 -ne n2  | Check if n1 is not equal to n2.             |

```bash
#!/bin/bash
val1=10
val2=11
if [ $val1 -gt $val2 ]; then
    echo "$val1 is greater than $val2"
else
    echo "$val1 is less than $val2"
fi
if (( $val1 > $val2 )); then
    echo "$val1 is greater than $val2"
else
    echo "$val1 is less than $val2"
fi
```

However, The `test` command wasn't able to handle the floating-point value. You may also notice usage of double parentheses. It provide advanced mathematical formulas for comparisons, no escape is needed in it:

| Symbol | Description         |
| ------ | ------------------- |
| val++  | Post-increment      |
| val--  | Post-decrement      |
| ++val  | Pre-increment       |
| --val  | Pre-decrement       |
| !      | Logical negation    |
| ∼      | Bitwise negation    |
| **     | Exponentiation      |
| <<     | Left bitwise shift  |
| >>     | Right bitwise shift |
| &      | Bitwise Boolean AND |
| \|     | Bitwise Boolean OR  |
| &&     | Logical AND         |
| \|\|   | Logical OR          |

##### 5.2.2 String Comparisons

| Comparison   | Description                                   |
| ------------ | --------------------------------------------- |
| str1 = str2  | Check if str1 is the same as string str2.     |
| str1 != str2 | Check if str1 is not the same as str2.        |
| str1 < str2  | Check if str1 is less than str2.              |
| str1 > str2  | Check if str1 is greater than str2.           |
| -n str1      | Check if str1 has a length greater than zero. |
| -z str1      | Check if str1 has a length of zero.           |

Trying to determine if one string is less than or greater than another is where things start getting tricky. There are two problems that often plague shell programmers when trying to use the greater-than or less-than features of the test command: - The greater-than and less-than symbols must be escaped, or the shell will use them as redirection symbols, with the string values as filenames. - The greater-than and less-than order is not the same as that used with the sort command.

```bash
#!/bin/bash
val1=ben
val2=mike
if [ $val1 \> $val2 ]; then
    echo "$val1 is greater than $val2"
else
    echo "$val1 is less than $val2"
fi
if [[ $val1 > $val2 ]]; then
    echo "$val1 is greater than $val2"
else
    echo "$val1 is less than $val2"
fi
```

The double bracketed expression uses the standard string comparison used in the `test` command. However, it provides an additional feature that the test command doesn't, **pattern matching**. No escape is needed anymore.

Capitalized letters are treated as less than lowercase letters in the `test` command. However, when you put the same strings in a file and use the `sort` command, the lowercase letters appear first. This is due to the ordering technique each command uses. The `test` command uses standard ASCII ordering, using each character's ASCII numeric value to determine the sort order. The `sort` command uses the sorting order defined for the system locale language settings. For the English language, the locale settings specify that lowercase letters appear before uppercase letters in sorted order.

While the [BashFAQ](http://mywiki.wooledge.org/BashFAQ/031) said: As of bash 4.1, string comparisons using `<` or `>` respect the current locale when done in `[[`, but **not** in `[` or `test`. In fact, `[` and `test` have *never* used locale collating order even though past man pages *said* they did. Bash versions prior to 4.1 do not use locale collating order for `[[` either. So you get opposite result when running on CentOS-5.7(bash-3.2) and Ubuntu-10.04(bash-4.1) with `[[` operator. And bash-4.1 is consistent with `sort` command now.

#### 5.3 case

Well, this is easy, just walk through the snippet:

```bash
#!/bin/bash
case $USER in
gonwan | barbara)
    echo "Welcome, $USER"
    echo "Please enjoy your visit"
    ;;
testing)
    echo "Special testing account"
    ;;
jessica)
    echo "Do not forget to log off when you're done"
    ;;
*)
    echo "Sorry, you are not allowed here"
    ;;
esac
```

All sample code are tested under CentOS-5.7 and Ubuntu-10.04.
