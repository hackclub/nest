{pkgs, ...}:

{
  services.caddy = {
    enable = true;
    virtualHosts."ts.hackclub.app".extraConfig = ''
      reverse_proxy localhost:8089
    '';
    virtualHosts."nest-secure".extraConfig = ''
      reverse_proxy localhost:8005
    '';
    virtualHosts."identity.hackclub.app".extraConfig = ''
      reverse_proxy localhost:9080
    '';
    virtualHosts."guides.hackclub.app".extraConfig = ''
      reverse_proxy localhost:8080
    '';
    virtualHosts."[fd7a:115c:a1e0::2]:7081".extraConfig = ''
      reverse_proxy localhost:7080
    '';
    virtualHosts."wazuh.hackclub.app".extraConfig = ''
      reverse_proxy localhost:5602
    '';
  };  
}