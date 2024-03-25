#!/usr/bin/ruby

require "thor"
require "etc"

module NestCLI
  class Subdomain < Thor
    include Thor::Actions
    desc "add <name>", "Add subdomain <name>.youruser to the Caddyfile"
    def add(name)
      run "sudo /usr/local/nest-cli/add_subdomain.sh #{name}"
    end
    
    desc "remove <name>", "Remove subdomain <name>.youruser from the Caddyfile"
    def remove(name)
      run "sudo /usr/local/nest-cli/remove_subdomain.sh #{name}"
    end
    
    def self.exit_on_failure?
      return true
    end
  end

  class Nest < Thor
    desc "subdomain SUBCOMMAND ...ARGS", "manage your nest subdomains"
    subcommand "subdomain", Subdomain
    def self.exit_on_failure?
      return true
    end
  end

end

NestCLI::Nest.start(ARGV)
