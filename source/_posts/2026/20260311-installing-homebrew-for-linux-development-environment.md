---
title: "Installing Homebrew for Linux Development Environment"
date: "2026-03-11 10:04:12"
categories: 
  - "linux"
tags: 
  - "terminal"
  - "ghostty"
  - "homebrew"
  - "yazi"
  - "oh-my-posh"
  - "nerd-font"
---

### 0. Install Ghostty

[`ghostty`](https://github.com/ghostty-org/ghostty) is a fast, feature-rich, and cross-platform terminal emulator that uses platform-native UI and GPU acceleration. [`kitty`](https://github.com/kovidgoyal/kitty) is not chosen, since it is not as easy as `ghostty` by default. `ghostty` provides out-of-box support for features that require configuration in `kitty`. [`wezterm`](https://github.com/wezterm/wezterm) can be an alternative, but the project is less active these days, since the author is busy moving countries, see [#7451](https://github.com/wezterm/wezterm/issues/7451). `ghostty` also provides better native experience on Linux and MacOS.

For Ubuntu, install it using a community binary [here](https://github.com/mkasberg/ghostty-ubuntu).

```bash
$ sudo dpkg -i ghostty_1.2.3-0.ppa1_amd64_24.04.deb
```

For AlmaLinux, there is a `AppImage` [here](https://ghostty.org/docs/install/binary#universal-appimage). Nightly build in flatpak is also provided [here](https://github.com/ghostty-org/ghostty/actions/workflows/flatpak.yml). Extract and install it with:

```bash
$ unzip com.mitchellh.ghostty-x86_64.flatpak.zip
$ mv com.mitchellh.ghostty com.mitchellh.ghostty.flatpak
$ sudo flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
$ sudo flatpak install com.mitchellh.ghostty.flatpak
```

### 1. Homebrew

#### 1.1 Prerequisites

```bash
# ubuntu 22.04+
$ sudo apt install build-essential procps curl file git
# almalinux 9
$ sudo dnf group install 'Development Tools'
$ sudo dnf install procps-ng curl file
```

#### 1.2 Install Tools

```bash
$ bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
$ echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"' >> ~/.bashrc
$ source ~/.bashrc
$ brew install ripgrep fd fzf jq resvg zoxide yazi
$ brew install neovim oh-my-posh
$ echo 'eval "$(oh-my-posh init bash)"' >> ~/.bashrc
```

For `yazi` to be full functional, install `imagemagick` and `ffmpeg`:

```bash
# ubuntu 22.04+
$ sudo apt-get install p7zip p7zip-full ffmpeg imagemagick
$ sudo ln -sf /usr/bin/convert /usr/bin/magick
# almalinux 9
# enable crb repository
# See: https://almalinux.org/blog/2025-09-08-enabling-crb-by-default-for-almalinux10/
$ sudo dnf config-manager --set-enabled crb
$ sudo dnf install p7zip p7zip-plugins ffmpeg-free ImageMagick
$ sudo ln -sf /usr/bin/convert /usr/bin/magick
```

`ghostty` supports image preview in `yazi` out of box, while `gnome-terminal` does not. `Windows Terminal` also works by default.

#### 1.3 Install Nerd Fonts


```bash
$ wget https://github.com/ryanoasis/nerd-fonts/releases/download/v3.4.0/JetBrainsMono.zip \
  && mkdir -p ~/.local/share/fonts \
  && unzip JetBrainsMono.zip -d ~/.local/share/fonts \
  && rm JetBrainsMono.zip \
  && fc-cache -fv
```

AlmaLinux 9 selects `Source Code Pro Regular 10` as its default monospace font, while LinuxMint selects `DejaVu Sans Mono`. Change it to just `monospace` in `gnome-tweaks` or `cinnamon-settings`. We will use `fontconfig` to config system fonts.

#### 1.4  Workaround Bugs in `patchelf` 

`homebrew` has bugs running `patchelf`, see [#163826](https://github.com/Homebrew/homebrew-core/issues/163826) and [#258146](https://github.com/Homebrew/homebrew-core/issues/258146). For `gtk+3` and `libadwaita`, we can simply fix them by not running `patchelf` at all. Find bottles in the cache and extract them directly into the `homebrew` installation directory:

```bash
$ ls ~/.cache/Homebrew/downloads/*bottle*.tar.gz | grep -iE 'gtk+3|adwaita'
/home/gonwan/.cache/Homebrew/downloads/0a00657a6b24c00ca122404a34a7ed7af7b88ba48cea9e192d6f7ec101675f51--gtk+3--3.24.51.x86_64_linux.bottle.tar.gz
/home/gonwan/.cache/Homebrew/downloads/0d02f139507799d4915c97def5e0a717b25ee3e56704b318da8d8aa0e76fa45b--libadwaita--1.8.4.x86_64_linux.bottle.tar.gz
$ tar xzvf /home/gonwan/.cache/Homebrew/downloads/0a00657a6b24c00ca122404a34a7ed7af7b88ba48cea9e192d6f7ec101675f51--gtk+3--3.24.51.x86_64_linux.bottle.tar.gz -C /home/linuxbrew/.linuxbrew/Cellar/ gtk+3/3.24.51/lib/
$ tar xzvf /home/gonwan/.cache/Homebrew/downloads/0d02f139507799d4915c97def5e0a717b25ee3e56704b318da8d8aa0e76fa45b--libadwaita--1.8.4.x86_64_linux.bottle.tar.gz -C /home/linuxbrew/.linuxbrew/Cellar/ libadwaita/1.8.4/lib/
```

Only `*.so` files are restored. `patchelf` can be mandatory for binary files in `bin` directories, they have a `@@HOMEBREW_PREFIX@@` placeholder hardcoded in the `ldd` dependency list, which to be replaced by `patchelf`. The workaround does work, because we are using the default installation prefix `/home/linuxbrew/.linuxbrew`.

Otherwise, you may want to build `gtk+3` and `libadwaita` from source, which leads to tons of dependencies to be installed as well as much time to build them.

```bash
$ brew reinstall -s gtk+3 libadwaita
```

Now, `gtk3`/`gtk+4`/`libadwaita` apps work. Verified with `evince` and `gnome-papers`:

```bash
$ brew install evince gnome-papers
$ export XDG_DATA_DIRS=/home/linuxbrew/.linuxbrew/share:$XDG_DATA_DIRS
$ evince &
$ papers &
```

