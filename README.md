# arch-repo ![GitHub repo size](https://img.shields.io/github/repo-size/Slinet6056/arch-repo)

My personal Arch repository

## Notes

Add the following to `/etc/pacman.conf`:

```ini
[slinet]
Server = https://aur.slinet.moe
```

Import the GPG key:

```sh
sudo pacman-key --recv-keys 66A6F13611E7BCA3

sudo pacman-key --lsign-key 66A6F13611E7BCA3
```
