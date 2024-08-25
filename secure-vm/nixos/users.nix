{pkgs, lib, ...}:
{ 
  security.pam.sshAgentAuth.enable = true;
  security.pam.services.sshd = {
    makeHomeDir = true;
    text = lib.mkDefault (
      lib.mkBefore ''
        auth required pam_listfile.so \
          item=group sense=allow onerr=fail file=/etc/allowed_groups
      ''
    );
  };
  environment.etc.allowed_groups = {
    text = "admins";
    mode = "0444";
  };
  security.pam.makeHomeDir.skelDirectory = "/etc/skel";
  security.sudo.extraConfig = ''
    %admins ALL=(ALL:ALL) ALL
  '';

  users.ldap = {
    enable = true;
    base = "dc=ldap,dc=secure,dc=vm,dc=hackclub,dc=app";
    server = "ldap://identity.hackclub.app";
    useTLS = true;
    extraConfig = ''
      ldap_version 3
      pam_password md5
    '';
    bind = {
      distinguishedName = "cn=ldap-service,ou=users,dc=ldap,dc=secure,dc=vm,dc=hackclub,dc=app";
      passwordFile = "/etc/ldap/bind.password";
    };
    daemon = {
      enable = true;
    };
  };
 
  services.openssh.extraConfig = ''
    AuthorizedKeysCommand /etc/ldapscript
    AuthorizedKeysCommandUser root
  '';   

  environment.etc.ldapscript = {
    text = builtins.readFile ((pkgs.writeShellApplication {
      name = "ldap-script";
      runtimeInputs = [ pkgs.openldap pkgs.gnused pkgs.cyrus_sasl pkgs.groff pkgs.libsodium pkgs.libtool pkgs.openssl pkgs.systemdMinimal pkgs.libxcrypt ];
      text = builtins.readFile /etc/ssh/ldap_script.sh;
    }) + "/bin/ldap-script");
    mode = "0755";
  };
}