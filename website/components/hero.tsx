import { useState } from "react";
import Image from "next/image";

export default function Hero() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="grid grid-cols-3 place-items-center gap-x-20 p-32">
      <div className="flex flex-col items-start justify-start gap-y-5 font-dm-mono text-white">
        <p className="text-4xl font-medium">
          <span className="text-HCPurple">Nest</span>, a free Linux server from{" "}
          <a href="https://hackclub.com" className="text-HCRed underline">
            Hack Club
          </a>
        </p>
        <p className="text-xl">
          Host Discord bots, apps, websites, try out basic computer networking,
          chat with others and more!
        </p>
        <div className="flex items-center justify-start gap-x-5">
          <a
            href="https://guides.hackclub.app/index.php/Quickstart"
            className="hover:bg-HCBlue ml-auto mt-4 rounded-lg bg-HCPurple px-2 py-1.5 font-dm-mono text-base font-medium text-white transition-all duration-300 hover:scale-110 hover:shadow-lg md:mt-0 md:text-lg lg:text-xl"
          >
            Join Nest!
          </a>

          <a
            href="https://guides.hackclub.app/index.php/Main_Page"
            className="mt-4 rounded-lg border-2 border-HCPurple px-2 py-1.5 font-dm-mono text-base font-medium text-HCPurple transition-all duration-300 hover:scale-110 hover:bg-HCPurple hover:text-white md:mt-0 md:text-lg lg:text-xl"
          >
            Read the Docs -&gt;
          </a>
        </div>
      </div>
      <div
        className={`${
          isExpanded ? "bg-gray-900" : "self-start"
        } col-span-2 flex w-full flex-col gap-x-10 rounded-lg px-5 py-10 font-dm-mono text-white`}
      >
        <div className="flex gap-x-5">
          <button
            className={`self-start text-4xl font-medium text-HCPurple`}
            disabled={isExpanded}
            onClick={() => setIsExpanded(true)}
          >
            $ <span className="text-white">ssh</span> hackclub.app
          </button>
          <div
            className={`${
              isExpanded ? "opacity-0" : "opacity-100"
            } flex gap-x-3 self-start transition-all duration-300`}
          >
            <Image src={"/arrow.svg"} alt="nest logo" width={85} height={85} />
            <p className="text-2xl font-medium">click me!</p>
          </div>
        </div>
        <pre
          className={`${
            isExpanded ? "opacity-100" : "opacity-0"
          } transition-all duration-300`}
        >{`
 __________________    website@nest 
< Welcome to Nest! >   ----------- 
 ------------------    OS: Debian GNU/Linux 12 (bookworm) x86_64 
          \\            Host: KVM/QEMU (Standard PC (i440FX + PIIX, 1996) pc-i440fx-8.1) 
           \\           Kernel: 6.1.0-21-amd64 
            \\  __      Uptime: 22 days, 2 hours, 1 min 
              / _)     Packages: 1448 (dpkg), 104 (nix-user), 51 (nix-default) 
     _.----._/ /       Shell: bash 5.2.15 
    /         /        Resolution: 1280x800 
 __/ (| | (  |         Terminal: /dev/pts/88 
/__.-'|_|--|_|         CPU: 13th Gen Intel i5-13500 (20) @ 2.496GHz 
                       GPU: 00:02.0 Vendor 1234 Device 1111 
                       Memory: 26666MiB / 52203MiB 
		`}</pre>
      </div>
    </section>
  );
}
