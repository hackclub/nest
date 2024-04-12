#!/usr/bin/ruby

require "thor"
require "etc"
require "socket"

module NestCLI
  class Subdomain < Thor
    include Thor::Actions
    desc "add <name>", "Add subdomain <name>.youruser.hackclub.app to the Caddyfile"
    def add(name)
      run "sudo /usr/local/nest/cli/add_subdomain.sh #{name}"
    end

    desc "remove <name>", "Remove subdomain <name>.youruser.hackclub.app from the Caddyfile"
    def remove(name)
      run "sudo /usr/local/nest/cli/remove_subdomain.sh #{name}"
    end

    desc "add42 <name>", "Add subdomain <name>.youruser.hackclub.dn42 to the Caddyfile"
    def add42(name)
      run "sudo /usr/local/nest/cli/add42_subdomain.sh #{name}"
    end

    desc "remove42 <name>", "Remove subdomain <name>.youruser.hackclub.dn42 from the Caddyfile"
    def remove42(name)
      run "sudo /usr/local/nest/cli/remove42_subdomain.sh #{name}"
    end

    def self.exit_on_failure?
      return true
    end
  end

  class Domain < Thor
    include Thor::Actions
    desc "add <name>", "Add a custom domain to the Caddyfile"
    def add(name)
      run "sudo /usr/local/nest/cli/add_domain.sh #{name}"
    end

    desc "remove <name>", "Remove a custom domain from the Caddyfile"
    def remove(name)
      run "sudo /usr/local/nest/cli/remove_domain.sh #{name}"
    end

    def self.exit_on_failure?
      return true
    end
  end

  class Setup < Thor
    include Thor::Actions
    desc "docker", "Set up rootless docker, so you can run docker containers"
    def docker()
      run "dockerd-rootless-setuptool.sh install"
      run "sed -i '/^ExecStart/ s/$/ --exec-opt native.cgroupdriver=cgroupfs /' ~/.config/systemd/user/docker.service"
      run "systemctl --user daemon-reload"
      run "systemctl --user enable docker"
      run "systemctl --user restart docker"
      run "docker context use rootless"
      puts "Successfully configured docker."
    end
    def self.exit_on_failure?
      return true
    end
  end

  class Nest < Thor
    desc "subdomain SUBCOMMAND ...ARGS", "manage your nest subdomains"
    subcommand "subdomain", Subdomain

    desc "domain SUBCOMMAND ...ARGS", "manage your nest custom domains"
    subcommand "domain", Domain
    desc "setup SUBCOMMAND ...ARGS", "setup a tool to use on nest"
    subcommand "setup", Setup

    desc "get_port", "Get an open port to use for your app"
    def get_port()
      # Hack - binding to port 0 will force the kernel to assign an open port, which we can then read
      s = Socket.new Socket::AF_INET, Socket::SOCK_STREAM
      s.bind Addrinfo.tcp("127.0.0.1", 0)
      port = s.local_address.ip_port
      puts "Port #{port} is free to use!"
    end

    def self.exit_on_failure?
      return true
    end
  end

end

NestCLI::Nest.start(ARGV)
