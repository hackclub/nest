import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaCode, FaBook } from "react-icons/fa";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let nodes: Node[] = [];
    const nodeCount = 100;
    const connectionDistance = 150;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }));
    };

    const drawNode = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawConnection = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      opacity: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(197, 123, 229, ${opacity})`;
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#a633d6";
      ctx.strokeStyle = "#C57BE5";
      ctx.lineWidth = 0.5;

      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        drawNode(node.x, node.y);

        for (let j = i + 1; j < nodes.length; j++) {
          const otherNode = nodes[j];
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = 1 - distance / connectionDistance;
            drawConnection(node.x, node.y, otherNode.x, otherNode.y, opacity);
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 hidden opacity-40 lg:block"
    />
  );
};

const ButtonLink: React.FC<{
  href: string;
  className: string;
  children: React.ReactNode;
}> = ({ href, className, children }) => (
  <Link
    href={href}
    className={`group flex items-center gap-x-2 rounded-lg border-2 border-HCPurple px-4 py-2 font-dm-mono text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95 2xl:text-xl ${className}`}
  >
    {children}
  </Link>
);

export default function Hero() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="relative grid grid-cols-1 place-items-center px-4 py-16 lg:grid-cols-3 lg:gap-x-16 lg:px-16 lg:py-24 2xl:px-32 2xl:py-32">
      <div className="absolute inset-0 overflow-hidden">
        <AnimatedBackground />
      </div>
      <div className="relative z-10 mb-6 flex flex-col items-start justify-start gap-y-5 font-dm-mono text-white 2xl:mb-32">
        <h1 className="text-3xl font-medium 2xl:text-4xl">
          <span className="text-HCPurpleText">Nest</span>, a free Linux server
          from{" "}
          <Link href="https://hackclub.com" className="text-HCRed underline">
            Hack Club
          </Link>
        </h1>
        <p className="text-lg 2xl:text-xl">
          Host Discord bots, apps, websites, try out basic computer networking,
          chat with others and more!
        </p>
        <div className="flex items-center justify-start gap-x-5 ">
          <ButtonLink
            href="https://guides.hackclub.app/index.php/Quickstart"
            className="bg-HCPurple text-white hover:bg-HCPurple text-sm tabletx:text-base"
          >
            <FaCode className="text-xl" />
            <span>Join Nest!</span>
          </ButtonLink>

          <ButtonLink
            href="https://guides.hackclub.app/index.php/Main_Page"
            className="text-HCPurpleText hover:bg-HCPurple hover:text-white text-sm tabletx:text-base"
          >
            <FaBook className="text-xl" />
            <span>Read the Docs</span>
          </ButtonLink>
        </div>
        <pre className="px-10 font-mono text-[4px] lg:hidden">
          {`
                                        ▓▓▓▓▓▓                                          
                                    ▓▓▓▓░░░░░░▓▓▓▓                                      
                                ▓▓▓▓░░░░░░░░░░░░▒▒▓▓██                                  
                            ▒▒▒▒▓▓▒▒░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒                              
                        ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒██                            
                    ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒░░░░██                          
                ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒░░░░░░░░░░░░██                        
            ██▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓░░░░░░░░░░██                      
        ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒████▓▓▓▓██░░░░░░░░██                      
      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒░░████▓▓▓▓▓▓▓▓██░░░░██░░██                      
    ██░░▒▒▒▒░░░░░░░░░░░░░░░░░░░░▒▒▒▒░░████▓▓▓▓▓▓▓▓▓▓▓▓██░░████░░██                      
    ██░░░░░░▒▒▒▒░░░░░░░░░░░░▒▒▒▒░░████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██░░██░░░░██                      
    ██░░░░░░░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██░░░░▒▒░░██                      
    ██░░░░░░░░░░░░░░▒▒▒▒░░████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██░░▒▒░░░░██                      
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓░░░░▓▓░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓██░░░░██░░██                      
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██░░████░░██                      
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓░░▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓██░░████░░██                      
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██░░██░░░░██                      
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██░░░░░░░░██                      
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██░░░░░░░░██                      
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████░░░░░░████                        
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████░░░░░░████▒▒██                        
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████░░░░░░▓▓▓▓▒▒▒▒▒▒██████                    
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓████░░░░░░▓▓▓▓▒▒▒▒▒▒████░░░░░░▓▓                  
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓██▓▓░░░░░░▓▓▓▓▒▒▒▒▒▒████░░░░░░▓▓▓▓██                  
    ████░░░░░░░░░░░░░░░░██▓▓▓▓████░░░░░░████▒▒▒▒▒▒████░░░░░░████░░░░░░██                
      ██████░░░░░░░░░░░░░░████░░░░░░████▒▒▒▒▒▒████░░░░░░████░░░░████░░░░██              
    ██▒▒▒▒▒▒████░░░░░░░░░░░░░░░░████▒▒▒▒▒▒██▓▓░░░░░░████░░░░████░░░░▓▓░░░░██            
    ██████▒▒▒▒▒▒▓▓██░░░░░░░░▓▓██▒▒▒▒▒▒████░░░░░░▓▓██░░░░▓▓▓▓░░░░░░░░░░██░░░░▓▓          
    ██░░░░████▒▒▒▒▒▒████████▒▒▒▒▒▒████░░░░░░██▓▓░░░░████░░░░░░░░░░░░░░░░██░░░░██        
    ██░░░░░░░░████▒▒▒▒▒▒▒▒▒▒▒▒████░░░░░░████░░░░████░░░░░░░░░░░░░░░░░░░░░░██░░░░██      
    ██░░░░░░░░░░░░████████████░░░░░░████░░░░██▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░██    
  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░██  
  ██░░░░░░░░░░░░░░░░░░░░░░░░████░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░██████
  ██░░░░░░░░░░░░░░░░░░░░░░▓▓░░██░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓░░░░▓▓▓▓░░░░██
  ████░░░░░░░░░░░░░░░░░░▓▓░░░░░░██░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░████░░░░░░░░██
      ████░░░░░░░░░░░░░░▓▓░░░░░░░░██░░░░██░░░░░░░░░░░░░░░░░░░░████░░░░████░░░░░░░░░░░░██
          ████░░░░░░░░░░▓▓░░░░░░░░░░██░░░░██░░░░░░░░░░░░░░████░░░░████░░░░░░░░░░░░████  
              ████░░░░░░▓▓░░░░░░░░░░░░██░░░░██░░░░░░░░████░░░░████░░░░░░░░░░░░████      
                  ▓▓██░░▓▓░░░░░░░░░░░░░░██░░░░▓▓░░▓▓▓▓░░░░▓▓██░░░░░░░░░░░░████          
                      ██▓▓░░░░░░░░░░░░░░▒▒▓▓░░░░██░░▒▒▓▓▓▓░░░░░░░░░░░░▓▓██              
                        ░░▓▓▓▓░░░░░░░░░░░░▒▒▒▒░░▒▒▓▓▓▓▒▒░░░░░░░░░░▓▓▒▒░░                
                              ████░░░░░░░░░░▒▒████░░░░░░░░░░░░████                      
                                  ████░░░░░░░░░░░░░░░░░░░░████                          
                                      ████░░░░░░░░░░░░████                              
                                          ▓▓▓▓░░░░▓▓██                                  
                                          ░░░░▓▓▓▓░░                                    `}
        </pre>
      </div>
      <div
        className={`relative z-10 col-span-2 hidden w-full flex-col gap-x-10 rounded-lg px-5 py-10 font-dm-mono text-white lg:flex ${
          isExpanded
            ? "bg-gradient-to-b from-[#1a1a2e] to-[#16213e]"
            : "self-start"
        }`}
      >
        <div className="gap-x-5 lg:flex">
          <button
            className="self-start font-medium text-HCPurpleText lg:text-3xl 2xl:text-4xl"
            disabled={isExpanded}
            onClick={() => setIsExpanded(true)}
            aria-expanded={isExpanded}
          >
            $ <span className="text-white">ssh</span> hackclub.app
          </button>
          {!isExpanded && (
            <div className="flex gap-x-3 self-start transition-all duration-300">
              <Image
                src="/arrow.svg"
                alt="Click me arrow"
                width={85}
                height={85}
              />
              <p className="text-2xl font-medium">click me!</p>
            </div>
          )}
        </div>
        {isExpanded && (
          <pre className="hidden text-xs transition-all duration-300 lg:block xl:text-sm 2xl:text-base">
            {`
 __________________    orpheus@nest 
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
            `}
          </pre>
        )}
      </div>
    </section>
  );
}
