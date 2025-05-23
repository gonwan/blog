---
title: "Learning Bash Scripts (3)"
date: "2011-10-04 12:17:00"
categories: 
  - "linux"
tags: 
  - "bash-2"
  - "shell"
  - "ubuntu"
---

This post covers the loop usage of bash shell. **NOTE**: read inline comments carefully :)

### 1. for loop

```
#!/bin/bash

# loop list, last value remains
for test in Alabama Alaska Arizona Arkansas California Colorado
do
    echo The next state is $test
done
echo "The last state we visited was $test"
test=Connecticut
echo "Wait, now we're visiting $test"

# using escape or quote
for test in I don\'t know if "this'll" work
do
    echo "word: $test"
done

# loop variable & files
states="Alabama Alaska Arizona Arkansas Colorado Connecticut Delaware Florida Georgia"
statesfile=states.txt
for state in $states; do
    echo $state >> $statesfile
done
for state in `cat $statesfile`; do
    echo "Visit beautiful $state"
done
rm $statesfile

# loop directory
for file in ~/.b*; do
    if [ -d "$file" ]; then
        echo "$file is a directory"
    elif [ -f "$file" ]; then
        echo "$file is a file"
    else
        echo "$file doesn't exist"
    fi
done

# c-style syntax
for (( i = 1; i <= 10; i++ )); do
    echo "The next number is $i"
done

# IFS (internal field separator) to separator string
IFSHOLD=$IFS
IFS=$'\n'
for entry in `cat /etc/passwd`; do
    echo "Values in $entry:"
    IFS=:
    for value in $entry; do
        echo "  $value"
    done
done
IFS=$IFSHOLD
```

### 2. while loop

```
#!/bin/bash

var1=10
while [ $var1 -gt 0 ]; do
    echo $var1
    var1=$[ $var1 - 1 ]
done
```

### 3. until loop

```
#!/bin/bash

var1=100
until [ $var1 -eq 0 ]; do
    echo $var1
    var1=$[ $var1 - 25 ]
done
```

### 4. break & continue

```
#!/bin/bash

# break
for (( a = 1; a < 4; a++ )); do
    echo "Outer loop: $a"
    for (( b = 1; b < 100; b++ )); do
        if [ $b -eq 5 ]; then
            break
        fi
        echo "Inner loop: $b"
    done
done

# break outer loop
for (( a = 1; a < 4; a++ )); do
    echo "Outer loop: $a"
    for (( b = 1; b < 100; b++ )); do
        if [ $b -eq 5 ]; then
            break 2
        fi
        echo "Inner loop: $b"
    done
done

# continue outer loop
for (( a = 1; a <= 5; a++ )); do
    echo "Iteration $a:"
    for (( b = 1; b < 3; b++ )); do
        if [ $a -gt 2 ] && [ $a -lt 4 ]; then
            continue 2
        fi
        var3=$[ $a * $b ]
        echo "  The result of $a * $b is $var3"
    done
done
```

There may be times when you're in an inner loop but need to stop the outer loop. The break command includes a single command line parameter value: `break n` where n indicates the level of the loop to break out of. By default, n is 1, indicating to break out of the current loop. If you set n to a value of 2, the break command will stop the next level of the outer loop.

### 5. redirect & pipe

Finally, you can either pipe or redirect the output of a loop within your shell script.

```
#!/bin/bash

testfile=testloop.txt
for (( a = 1; a < 10; a++ )); do
    echo "The number is $a"
done > $testfile
echo "The command is finished."
cat $testfile
rm $testfile
```
