---
title: "Installing Mise for Linux Development Environment"
date: "2026-03-11 10:05:50"
categories: 
  - "linux"
tags: 
  - "terminal"
  - "ghostty"
  - "mise"
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

### 1. Mise

[`mise`](https://github.com/jdx/mise):

- Like [asdf](https://asdf-vm.com/) (or [nvm](https://github.com/nvm-sh/nvm) or [pyenv](https://github.com/pyenv/pyenv) but for any language) it manages [dev tools](https://mise.jdx.dev/dev-tools/) like node, python, cmake, terraform, and [hundreds more](https://mise.jdx.dev/registry.html).
- Like [direnv](https://github.com/direnv/direnv) it manages [environment variables](https://mise.jdx.dev/environments/) for different project directories.
- Like [make](https://www.gnu.org/software/make/manual/make.html) it manages [tasks](https://mise.jdx.dev/tasks/) used to build and test projects.

#### 1.1 Install Mise

```bash
# ubuntu 26.04+
$ sudo add-apt-repository -y ppa:jdxcode/mise
$ sudo apt update -y
$ sudo apt install -y mise
# ubuntu 22.04+
$ sudo apt update -y && sudo apt install -y curl
$ sudo install -dm 755 /etc/apt/keyrings
$ curl -fSs https://mise.jdx.dev/gpg-key.pub | sudo tee /etc/apt/keyrings/mise-archive-keyring.asc 1> /dev/null
$ echo "deb [signed-by=/etc/apt/keyrings/mise-archive-keyring.asc] https://mise.jdx.dev/deb stable main" | sudo tee /etc/apt/sources.list.d/mise.list
$ sudo apt update -y
$ sudo apt install -y mise
# almalinux 9
$ sudo dnf copr enable jdxcode/mise
$ sudo dnf install mise
```

`mise` is chosen as an alternative to [`homebrew`](https://github.com/Homebrew/homebrew-core), since `homebrew` has bugs running `patchelf`, see [#163826](https://github.com/Homebrew/homebrew-core/issues/163826) and [#258146](https://github.com/Homebrew/homebrew-core/issues/258146). But there is a workaround. [`nix`](https://github.com/NixOS/nix) is also not chosen, since it is complex and I do not want to learn its config DSL.

`mise` also helps to manage different versions of `node`, `python` etc..

#### 1.2 Activate Mise

```bash
# bash activation
$ echo 'eval "$(mise activate bash)"' >> ~/.bashrc
# bash completion
$ mise use -g usage
$ mkdir -p ~/.local/share/bash-completion/completions
# ubuntu 26.04+
$ mise completion bash > ~/.local/share/bash-completion/completions/mise
# ubuntu 22.04+ & almalinux 9
$ mise completion bash --include-bash-completion-lib > ~/.local/share/bash-completion/completions/mise
```

`mise use` installs a tool and adds the version to `mise.toml`. `-g` means it will use the global config file `~/.config/mise/config.toml`. The additional `--include-bash-completion-lib` parameter ensures that it works in `bash-completion` versions earlier than 2.12.

#### 1.3 Install Tools

```bash
$ mise use -g ripgrep[exe=rg] fd fzf jq resvg zoxide yazi
$ mise use -g neovim@0.11
$ mise use -g oh-my-posh@28
$ echo 'eval "$(oh-my-posh init bash)"' >> ~/.bashrc
```

Some useful command lines:

```bash
$ mise ls
$ mise ls-remote neovim
$ mise latest neovim
$ mise upgrade
$ mise upgrade neovim
$ mise registry
```

All supported command line tools can be found in their [registry](https://mise.jdx.dev/registry.html).

For `yazi` to be full functional, install `imagemagick` and `ffmpeg`:

```bash
# ubuntu 22.04+
$ sudo apt-get install p7zip p7zip-full ffmpeg imagemagick
$ sudo ln -sf /usr/bin/convert /usr/bin/magick
# almalinux 9
# enable crb repository
# see: https://almalinux.org/blog/2025-09-08-enabling-crb-by-default-for-almalinux10/
$ sudo dnf config-manager --set-enabled crb
$ sudo dnf install p7zip p7zip-plugins ffmpeg-free ImageMagick
$ sudo ln -sf /usr/bin/convert /usr/bin/magick
```

`ghostty` supports image preview in `yazi` out of box, while `gnome-terminal` does not. `Windows Terminal` also works by default.

#### 1.4 Install Nerd Fonts


```bash
$ wget https://github.com/ryanoasis/nerd-fonts/releases/download/v3.4.0/JetBrainsMono.zip \
  && mkdir -p ~/.local/share/fonts \
  && unzip JetBrainsMono.zip -d ~/.local/share/fonts \
  && rm JetBrainsMono.zip \
  && fc-cache -fv
```

AlmaLinux 9 selects `Source Code Pro Regular 10` as its default monospace font, while LinuxMint selects `DejaVu Sans Mono`. Change it to just `monospace` in `gnome-tweaks` or `cinnamon-settings`. We will use `fontconfig` to config system fonts.

