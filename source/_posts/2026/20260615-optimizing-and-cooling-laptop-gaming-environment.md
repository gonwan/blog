---
title: "Optimizing and Colling Laptop Gaming Environment"
date: "2026-06-15 01:23:11"
categories: 
  - "tools"
tags:
  - "windows"
  - "thermal"
  - "performance"
  - "laptop"
  - "ck3"
  - "victoria3"
---

### 0. Environment

- Hardware
  - System: 2023 version of Lenovo XiaoXin(IdeaPad) Pro 14
  - CPU: AMD 7840HS (Zen4)
  - GPU: AMD 780M iGPU (RDNA3) with 8G vRAM setup in UEFI
  - Memory: 24G (32G total, 8G is assigned to iGPU in UEFI)
- Windows 11 25H2
  - AMD graphic driver 2025.9.1
- Room Temperature
  - ~25°C


#### 1. ITS Settings

Do install Lenovo `Vantage` app or some equivalents to adjust ITS(Intelligent Thermal System) settings. It is the most important. It has higher priority than Windows settings. I'm using `ck3` and `victoria3` for benchmarking.

| Game                 | CPU Voltage (v) | CPU Power (w) | CPU Max Frequency (MHz) | CPU Temperature (°C) |
| -------------------- | --------------- | ------------- | ----------------------- | -------------------- |
| ck3 (original)       | 1.1-1.2         | 35-40         | ~4.6                    | 80-90                |
| victoria3 (original) | 1.1-1.2         | 35-40         | ~4.6                    | 80-90                |
| ck3 (after)          | 0.6-0.8         | 15-20         | ~4.6                    | 55-65                |
| victoria3 (after)    | 0.6-0.8         | 15-20         | ~4.6                    | 55-65                |

The CPU power and voltage are dramatically reduced. Thus, the temperature is much lower. The max frequency appears only when launching these two games. You see, even with strategy games from `Paradox`, they are not CPU bound.

Alternatively, you can use my homemade app [ideapad-keyboard-backlight](https://github.com/gonwan/ideapad-keyboard-backlight) to adjust ITS settings. It's much more lightweight than the official one.

#### 2. Windows Power Mode

Go to `Settings` app --> `System` --> `Power & Battery`, set `Power Mode` to `Best Power Efficiency`. This helps a bit, but not much.

| Game              | CPU Voltage (v) | CPU Power (w) | CPU Max Frequency (MHz) | CPU Temperature (°C) |
| ----------------- | --------------- | ------------- | ----------------------- | -------------------- |
| ck3 (after)       | 0.6-0.8         | ~15           | ~4.6                    | 55-60                |
| victoria3 (after) | 0.6-0.8         | ~15           | ~4.6                    | 55-60                |

#### 3. Windows Power Plan

It's really annoying there are separate settings, and what is the fxxking difference between `power mode` and `power plan`?

First, enable options via registry:

```
# REG ADD HKLM\SYSTEM\CurrentControlSet\Control\Power\PowerSettings\54533251-82be-4824-96c1-47b60b740d00\be337238-0d82-4146-a960-4f3749d470c7 /v Attributes /t REG_DWORD /d 2 /f
```

The default version is `1`. This enables the `Processor performance boost mode` option.

Now go to `Control Panel` --> `Hardware and Sound` --> `Power Options` --> `Edit Plan Settings`, click `Change advanced power settings` --> `Processor power management` --> `Processor performance boost mode`, set to `Disabled`(or maybe `Efficient Enabled`).

Now, CPU boost is completely disabled.

| Game              | CPU Voltage (v) | CPU Power (w) | CPU Max Frequency (MHz) | CPU Temperature (°C) |
| ----------------- | --------------- | ------------- | ----------------------- | -------------------- |
| ck3 (after)       | 0.6-0.8         | ~15           | ~3.7                    | 55-60                |
| victoria3 (after) | 0.6-0.8         | ~15           | ~3.7                    | 55-60                |

Your laptop is cool. Your fan makes much less noise. The setting also prevents system services or 3rd-party applications from making a sudden and unintended CPU boost.

Modern CPUs are just capable to run games at their base frequency, with almost no performance loss. All is done.

#### 4. Add Windows Defender Exclusion

See my [previous post](https://www.gonwan.com/2025/10/28/improving-windows-gaming-experience/).
