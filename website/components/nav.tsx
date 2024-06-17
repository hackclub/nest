import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaHome, FaSignal, FaBook } from "react-icons/fa";

export default function Nav() {
    return (
        <>
            <nav className="flex flex-wrap justify-between items-center px-16 py-4">
                {/* Animated Orpheus because why not */}
                <Link href={'https://hackclub.com/'}>
                    <motion.div
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        transition={{ duration: 1 }}
                        className="flex-shrink-0"
                    >
                        <Image
                            src={"https://assets.hackclub.com/flag-orpheus-top.svg"}
                            alt="hc logo"
                            width={125}
                            height={125}
                            className="-my-4"
                        />
                    </motion.div></Link>


                {/* Nest Logo */}
                <Link className="flex-shrink-0 mx-8 md:mx-20 xl:mx-36" href={"/"}>
                    <Image
                        src={"/nest.svg"}
                        alt="nest logo"
                        width={85}
                        height={85}
                    />
                </Link>

                {/* Navigation Items */}
                <div className="nav-items flex gap-x-4 md:gap-x-8 lg:gap-x-16 font-dm-mono text-base md:text-lg lg:text-2xl items-center self-end font-medium">
                    <Link className="flex items-center hover:text-HCBlue hover:underline" href={"/"}>
                        <FaHome className="mr-1" /> Home
                    </Link>
                    <Link className="flex items-center hover:text-HCBlue hover:underline" href={"https://guides.hackclub.app/"}>
                        <FaBook className="mr-1" /> Wiki
                    </Link>
                    <Link className="flex items-center hover:text-HCBlue hover:underline" href={"https://status.hackclub.app/"}>
                        <FaSignal className="mr-1" /> Status
                    </Link>
                </div>

                <button className="bg-HCPurple py-1.5 px-2 rounded-lg text-base md:text-lg lg:text-xl font-dm-mono font-medium text-white ml-auto mt-4 md:mt-0 hover:bg-HCBlue hover:shadow-lg transition-all duration-300 hover:scale-110">
                    Join Nest!
                </button>
            </nav>
        </>
    );
}
