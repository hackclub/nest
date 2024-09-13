import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface NestMascotProps {
  hoverImageSrc: string;
  defaultImageSrc: string;
}

const NestMascot: React.FC<NestMascotProps> = ({
  hoverImageSrc,
  defaultImageSrc,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverTransition = {
    y: { duration: 0.2 },
    rotate: { duration: 0.2, yoyo: Infinity },
  };

  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50 hidden cursor-pointer lg:block"
      initial={{ y: "70%" }}
      animate={{ y: isHovered ? "30%" : "70%" }}
      whileHover={{
        y: "30%",
        transition: hoverTransition,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        animate={{ rotate: isHovered ? [0, -5, 5, -5, 5, 0] : 0 }}
        transition={{ duration: 0.5 }}
      >
        <Image
          src={isHovered ? hoverImageSrc : defaultImageSrc}
          alt="Nest Mascot"
          width={200}
          height={200}
          priority
        />
      </motion.div>
    </motion.div>
  );
};

export default NestMascot;
