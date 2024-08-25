{pkgs, config, ...}:
{
  networking = {
    hostName = "nest-secure";
    interfaces.ens18 = {
      useDHCP = false;
      ipv4.addresses = [{address = "37.27.51.33"; prefixLength = 32;}];
      ipv6.addresses = [{address = "2a01:4f9:3081:399c::3"; prefixLength = 64;}];
    };
    defaultGateway = {
      address = "37.27.51.35";
      interface = "ens18";
    };
    defaultGateway6 = {
      address = "2a01:4f9:3081:399c::2";
      interface = "ens18";
    };
    nameservers = [ "9.9.9.9" ];
    firewall = { 
      trustedInterfaces = [ "tailscale0" "docker0" "br-3b81356e7490" ];
      allowedTCPPorts = [ 443 80 8747 47176 config.services.tailscale.port 5601];
      allowedUDPPorts = [ 443 80];
      extraCommands = ''
        iptables -A nixos-fw -p tcp --source 37.27.51.33/32 --dport 389 -j nixos-fw-accept
        iptables -A nixos-fw -p tcp --source 37.27.51.33/32 --dport 636 -j nixos-fw-accept
        iptables -A nixos-fw -p tcp --source 37.27.51.34/32 --dport 389 -j nixos-fw-accept
        iptables -A nixos-fw -p tcp --source 37.27.51.34/32 --dport 636 -j nixos-fw-accept
        iptables -A nixos-fw -p tcp --source 37.27.51.35/32 --dport 389 -j nixos-fw-accept
        iptables -A nixos-fw -p tcp --source 37.27.51.35/32 --dport 636 -j nixos-fw-accept

        ip6tables -A nixos-fw -p tcp --source 2a01:4f9:3081:399c::3/128 --dport 389 -j nixos-fw-accept
        ip6tables -A nixos-fw -p tcp --source 2a01:4f9:3081:399c::3/128 --dport 636 -j nixos-fw-accept
        ip6tables -A nixos-fw -p tcp --source 2a01:4f9:3081:399c::4/128 --dport 389 -j nixos-fw-accept
        ip6tables -A nixos-fw -p tcp --source 2a01:4f9:3081:399c::4/128 --dport 636 -j nixos-fw-accept
        ip6tables -A nixos-fw -p tcp --source 2a01:4f9:3081:399c::2/128 --dport 389 -j nixos-fw-accept
        ip6tables -A nixos-fw -p tcp --source 2a01:4f9:3081:399c::2/128 --dport 636 -j nixos-fw-accept
      '';
    };
    extraHosts =
      ''
        37.27.51.33 identity.hackclub.app
        37.27.51.33 ts.hackclub.app
        37.27.51.33 guides.hackclub.app
        37.27.51.34 hackclub.app
      '';
  };
  services.openssh.openFirewall = false;
}