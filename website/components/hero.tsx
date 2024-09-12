import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { FaCode, FaBook } from "react-icons/fa";

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let nodes: { x: number; y: number; vx: number; vy: number }[] = [];
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

    const drawConnection = (x1: number, y1: number, x2: number, y2: number, opacity: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(197, 123, 229, ${opacity})`;
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#a633d6';
      ctx.strokeStyle = '#C57BE5';
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

    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 hidden lg:block"
      style={{ opacity: 0.4 }}
    />
  );
};

export default function Hero() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="relative grid grid-cols-1 grid-rows-1 place-items-center p-4 lg:grid-cols-3 lg:gap-x-16 2xl:gap-x-20 lg:p-16 2xl:p-32">
      <div className="absolute inset-0 overflow-hidden">
        <AnimatedBackground />
      </div>
      <div className="relative z-10 mb-6 flex flex-col items-start justify-start gap-y-5 font-dm-mono text-white 2xl:mb-32">
        <p className="text-3xl font-medium 2xl:text-4xl">
          <span className="text-HCPurpleText">Nest</span>, a free Linux server
          from{" "}
          <a href="https://hackclub.com" className="text-HCRed underline">
            Hack Club
          </a>
        </p>
        <p className="text-lg 2xl:text-xl">
          Host Discord bots, apps, websites, try out basic computer networking,
          chat with others and more!
        </p>
        <div className="flex items-center justify-start gap-x-5">
          <a
            href="https://guides.hackclub.app/index.php/Quickstart"
            className="group flex items-center gap-x-2 border-2 border-HCPurple rounded-lg bg-HCPurple px-4 py-2 font-dm-mono text-base font-medium text-white transition-all duration-300 hover:bg-HCPurple 2xl:text-xl hover:scale-105 active:scale-95"
          >
            <FaCode className="text-xl" />
            <span>Join Nest!</span>
          </a>

          <a
            href="https://guides.hackclub.app/index.php/Main_Page"
            className="group flex items-center gap-x-2 rounded-lg border-2 border-HCPurple px-4 py-2 font-dm-mono text-base font-medium text-HCPurpleText transition-all duration-300 hover:bg-HCPurple hover:text-white 2xl:text-xl hover:scale-105 active:scale-95"
          >
            <FaBook className="text-xl" />
            <span>Read the Docs</span>
          </a>
        </div>
        <pre className="px-10 font-mono text-[4px] lg:hidden">{`
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
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███░░░░░░████▒▒██                        
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████░░░░░░▓▓▓▓▒▒▒▒▒▒██████                    
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓▓▓▓▓████░░░░░░▓▓▓▓▒▒▒▒▒▒████░░░░░░▓▓                  
    ██░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓██▓▓░░░░░░▓▓▓▓▒▒▒▒▒▒████░░░░░░▓▓▓▓██                  
    ████░░░░░░░░░░░░░░░░██▓▓▓▓████░░░░░░████▒▒▒▒▒▒████░░░░░░████░░░░░░██                
      ██████░░░░░░░░░░░░░░████░░░░░░████▒▒▒▒▒▒████░░░░░░████░░░░████░░░░██              
    ██▒▒▒▒▒▒████░░░░░░░░░░░░░░░░████▒▒▒▒▒▒██▓▓░░░░░░████░░░░████░░░░▓▓░░░░██            
    ██████▒▒▒▒▒▒▓▓██░░░░░░░░▓▓██▒▒▒▒▒▒████░░░░░░▓▓██░░░░▓▓▓▓░░░░░░░░░░██░░░░▓▓          
    ██░░░░████▒▒▒▒▒▒████████▒▒▒▒▒▒████░░░░░░██▓▓░░░░████░░░░░░░░░░░░░░░░██░░░░██        
    ██░░░░░░░░████▒▒▒▒▒▒▒▒▒▒▒▒████░░░░░░████░░░░████░░░░░░░░░░░░░░░░░░░░░░██░░░░██      
    ██░░░░░░░░░░░░████████████░░░░░░████░░░░██▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░██    
  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░██  
  ██░░░░░░░░░░░░░░░░░░░░░░░░░░██░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░██████
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
                                          ░░░░▓▓▓▓░░                                    `}</pre>
      </div>
      <div
        className={`${
          isExpanded ? "bg-gray-900" : "self-start"
        } relative z-10 col-span-2 hidden w-full flex-col gap-x-10 rounded-lg px-5 py-10 font-dm-mono text-white lg:flex`}
      >
        <div className="gap-x-5 lg:flex">
          <button
            className={`text-HCPurpleText self-start font-medium lg:text-3xl 2xl:text-4xl`}
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
          } hidden text-xs transition-all duration-300 lg:block xl:text-sm 2xl:text-base`}
        >{`
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
        `}</pre>
      </div>
    </section>
  );
}