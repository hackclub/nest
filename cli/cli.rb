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

  class Nest < Thor
    desc "subdomain SUBCOMMAND ...ARGS", "manage your nest subdomains"
    subcommand "subdomain", Subdomain

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
