{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
      ./caddy.nix
      ./users.nix
      ./networking.nix
    ];

  # Use the GRUB 2 boot loader.
  boot.loader.grub.enable = true;
  # Define on which hard drive you want to install Grub.
  boot.loader.grub.device = "/dev/sda"; # or "nodev" for efi only

  # Pick only one of the below networking options.
  # networking.wireless.enable = true;  # Enables wireless support via wpa_supplicant.
  # networking.networkmanager.enable = true;  # Easiest to use and most distros use this by default.

  services.qemuGuest.enable = true;

  # Set your time zone.
  time.timeZone = "Etc/UTC";

  security.pki.certificates = [ (builtins.readFile ./authentik.crt) ];

  environment.systemPackages = with pkgs; [
    vim # Do not forget to add an editor to edit configuration.nix! The Nano editor is also installed by default.
    pkgs.wget
    pkgs.openldap
    pkgs.unzip
    pkgs.zip
    git
    busybox
    docker-compose 

    pkgs.php
  ];

  # Enable the OpenSSH daemon.
  services.openssh = {
    enable = true;
    extraConfig = ''
       AuthenticationMethods publickey
    '';
  };

  users.users.root.openssh.authorizedKeys.keys = [
    # admin keys
  ];

  services.tailscale.enable = true;
  programs.htop.enable = true;

  virtualisation.docker.enable = true;

  # Copy the NixOS configuration file and link it from the resulting system
  # (/run/current-system/configuration.nix). This is useful in case you
  # accidentally delete configuration.nix.
  system.copySystemConfiguration = true;

  # This value determines the NixOS release from which the default
  # settings for stateful data, like file locations and database versions
  # on your system were taken. It's perfectly fine and recommended to leave
  # this value at the release version of the first install of this system.
  # Before changing this value read the documentation for this option
  # (e.g. man configuration.nix or on https://nixos.org/nixos/options.html).
  system.stateVersion = "23.05"; # Did you read the comment?

  # Set vm.max_map_count
  boot.kernel.sysctl = {
    "vm.max_map_count" = 262144; # Set your desired value here
  };
}