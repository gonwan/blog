---
title: "Sharing Mutex and Condition Variable Between Processes"
date: "2014-04-10"
categories: 
  - "cc"
tags: 
  - "multiprocessing"
  - "pthread"
---

As title, the key is to set an attribute(`PTHREAD_PROCESS_SHARED`) to the mutex/condition variable using `pthread_mutexattr_setpshared()` or `pthread_condattr_setpshared()`. Without these function calls, the parent in the following code will not get signaled forever.

```
/*
 * gcc mutex.c -o mutex -lrt
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <pthread.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>

#define MYMUTEX "/mymutex"
#define MYCOND  "/mycond"

int main(int argc, char* argv[])
{
    pthread_cond_t *cond;
    pthread_mutex_t *mutex;
    int cond_id, mutex_id;
    int mode = S_IRWXU | S_IRWXG;
    /* mutex */
    mutex_id = shm_open(MYMUTEX, O_CREAT | O_RDWR | O_TRUNC, mode);
    if (mutex_id < 0) {
        perror("shm_open failed with " MYMUTEX);
        return -1;
    }
    if (ftruncate(mutex_id, sizeof(pthread_mutex_t)) == -1) {
        perror("ftruncate failed with " MYMUTEX);
        return -1;
    }
    mutex = (pthread_mutex_t *) mmap(NULL, sizeof(pthread_mutex_t), PROT_READ | PROT_WRITE, MAP_SHARED, mutex_id, 0);
    if (mutex == MAP_FAILED) {
        perror("mmap failed with " MYMUTEX);
        return -1;
    }
    /* cond */
    cond_id = shm_open(MYCOND, O_CREAT | O_RDWR | O_TRUNC, mode);
    if (cond_id < 0) {
        perror("shm_open failed with " MYCOND);
        return -1;
    }
    if (ftruncate(cond_id, sizeof(pthread_cond_t)) == -1) {
        perror("ftruncate failed with " MYCOND);
        return -1;
    }
    cond = (pthread_cond_t *) mmap(NULL, sizeof(pthread_cond_t), PROT_READ | PROT_WRITE, MAP_SHARED, cond_id, 0);
    if (cond == MAP_FAILED) {
        perror("ftruncate failed with " MYCOND);
        return -1;
    }
    /* set mutex shared between processes */
    pthread_mutexattr_t mattr;
    pthread_mutexattr_init(&mattr);
    pthread_mutexattr_setpshared(&mattr, PTHREAD_PROCESS_SHARED);
    pthread_mutex_init(mutex, &mattr);
    pthread_mutexattr_destroy(&mattr);
    /* set condition shared between processes */
    pthread_condattr_t cattr;
    pthread_condattr_init(&cattr);
    pthread_condattr_setpshared(&cattr, PTHREAD_PROCESS_SHARED);
    pthread_cond_init(cond, &cattr);
    pthread_condattr_destroy(&cattr);
    /*************************************/
    pid_t pid;
    if ((pid = fork()) < 0) {
        perror("fork failure");
        return -1;
    } else if (pid == 0) { /* child */
        sleep(5);
        pthread_mutex_lock(mutex);
        pthread_cond_signal(cond);
        printf("child signaled\n");
        pthread_mutex_unlock(mutex);
        exit(0);
    } else { /* parent */
        printf("parent waiting on condition\n");
        pthread_mutex_lock(mutex);
        pthread_cond_wait(cond, mutex);
        printf("parent signaled by child, wake up!!!\n");
        pthread_mutex_unlock(mutex);
        pthread_mutex_destroy(mutex);
        pthread_cond_destroy(cond);
        shm_unlink(MYCOND);
        shm_unlink(MYMUTEX);
    }
    return 0;
}
```

Shared memory is used to share the mutex and condition variable.

**NOTE**: The process-shared mutex attribute isn’t universally supported yet. You should confirm before using them.

**Updated Oct 14, 2020**: Fixed `pthread_mutexattr_t` and `pthread_condattr_t` initialization.
