import { useState } from "react";
import Image from "next/image";

export default function Hero() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="grid grid-cols-3 p-32 gap-x-20 place-items-center">
      <div className="text-white font-dm-mono flex flex-col justify-start items-start gap-y-5">
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
        <div className="flex justify-start items-center gap-x-5">
          <a
            href="https://guides.hackclub.app/index.php/Quickstart"
            className="bg-HCPurple py-1.5 px-2 rounded-lg text-base md:text-lg lg:text-xl font-dm-mono font-medium text-white ml-auto mt-4 md:mt-0 hover:bg-HCBlue hover:shadow-lg transition-all duration-300 hover:scale-110"
          >
            Join Nest!
          </a>

          <a
            href="https://guides.hackclub.app/index.php/Main_Page"
            className="border-2 rounded-lg border-HCPurple font-dm-mono font-medium text-HCPurple py-1.5 px-2 text-base md:text-lg lg:text-xl hover:bg-HCPurple hover:text-white transition-all hover:scale-110 duration-300 mt-4 md:mt-0"
          >
            Read the Docs -&gt;
          </a>
        </div>
      </div>
      <div
        className={`${
          isExpanded ? "bg-gray-900" : "self-start"
        } rounded-lg col-span-2 px-5 py-10 flex flex-col gap-x-10 text-white font-dm-mono w-full`}
      >
        <div className="flex gap-x-5">
          <button
            className={`text-4xl font-medium text-HCPurple self-start`}
            disabled={isExpanded}
            onClick={() => setIsExpanded(true)}
          >
            $ <span className="text-white">ssh</span> hackclub.app
          </button>
          <div
            className={`${
              isExpanded ? "opacity-0" : "opacity-100"
            } transition-all duration-300 flex gap-x-3 self-start`}
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
