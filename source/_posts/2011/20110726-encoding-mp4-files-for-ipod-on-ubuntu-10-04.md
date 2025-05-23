---
title: "Encoding MP4 Files for iPod on Ubuntu 10.04"
date: "2011-07-26 13:12:00"
categories: 
  - "tools"
tags: 
  - "ipod"
  - "mp4"
  - "ubuntu"
---

I used mencoder utility to convert my video files. But it was compiled without libfaac. So if you specify AAC encoding, an error occurs. Details and solutions can be found [here](http://ubuntuforums.org/showthread.php?t=1117283). I just added the Medibuntu repository as [described](https://help.ubuntu.com/community/Medibuntu):

```
# sudo wget --output-document=/etc/apt/sources.list.d/medibuntu.list http://www.medibuntu.org/sources.list.d/$(lsb_release -cs).list
# sudo apt-get --quiet update
# sudo apt-get --yes --quiet --allow-unauthenticated install medibuntu-keyring
# sudo apt-get --quiet update
```

**NOTE**: ffmpeg utility in Lucid release does not support \*.rm/\*.rmvb yet.

Then install mencoder and codecs:

```
# sudo apt-get install mencoder libavcodec-extra-52 libavformat-extra-52
```

Now you can convert videos. Here's a sample to convert a \*.rmvb(848x480) to a \*.mp4(320x240):

```
# mencoder -oac lavc -ovc lavc -lavcopts acodec=libfaac:abitrate=96:aglobal=1:vcodec=mpeg4:vbitrate=500:vglobal=1 -vf scale=320:180,harddup -vf-add expand=:240 -ofps 24000/1001 -of lavf source.rmvb -o target.mp4
```

Modify fps/codec/bitrate values as you wish. The aglobal & vglobal options seem to be essential for iPod.

In order to keep video aspect after scaling, the output file should be 360x204. we use the -vf-add filter to add black band to the top and bottom of it. Other command line options, please refer to its manpage.

Lastly, install gtkpod to import your \*.mp4 files.

**Updated Mar 27, 2012**: The above command line is for iPod Nano. For high quality H264 encoding used in iPod Touch or iPhone, run:

```
# mencoder -oac faac -faacopts raw:object=2:mpeg=4:br=96 -ovc x264 -x264encopts nocabac:global_header:bframes=0:level_idc=30:bitrate=600:threads=auto -vf scale=960:-2,harddup -ofps 24000/1001 -of lavf -lavfopts format=mp4 source.rmvb -o target.mp4
```
