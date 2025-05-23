---
title: "Retrieve BIOS Info Programmatically in Linux"
date: "2011-08-08 17:25:00"
categories: 
  - "cc"
tags: 
  - "bios"
---

Generally, BIOS info can be found by **dmidecode** utility(run as root), like:

```bash
$ dmidecode --type bios
```

Here, I retrieve it by using **libhd** library provided in **hwinfo** utility:

```c
/* bios.c */
#include <hd.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>

/* install libhd-dev/libhd-devel packages to build */

int main()
{
    hd_data_t *hddata;
    hd_t *hdlist;
    hd_smbios_t *smbios;

    if (getuid() != 0) {
        printf("ERROR: Please run as root.\n");
        return -1;
    }

    hddata = (hd_data_t *)calloc(1, sizeof(hd_data_t));
    hdlist = hd_list(hddata, hw_bios, 1, NULL);

    for (smbios = hddata->smbios; smbios; smbios = smbios->next) {
        if (smbios->any.type == sm_biosinfo) {
            break;
        }
    }
    if (!smbios) {
        printf("INFO: No BIOS info found.\n");
    } else {
        if (smbios->biosinfo.vendor) {
            printf("Vendor:       \"%s\"\n", smbios->biosinfo.vendor);
        }
        if (smbios->biosinfo.version) {
            printf("Version:      \"%s\"\n", smbios->biosinfo.version);
        }
        if (smbios->biosinfo.date) {
            printf("Release Date: \"%s\"\n", smbios->biosinfo.date);
        }
    }

    hd_free_hd_list(hdlist);
    hd_free_hd_data(hddata);
    free(hddata);

    return 0;

}
```
