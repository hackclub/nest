import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface NestMascotProps {
  hoverImageSrc: string;
  defaultImageSrc: string;
  visible: boolean;
}

const NestMascot: React.FC<NestMascotProps> = ({
  hoverImageSrc,
  defaultImageSrc,
  visible
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverTransition = {
    y: { duration: 0.2 },
    rotate: { duration: 0.2, yoyo: Infinity },
  };

  return (
    <motion.div
      className={`fixed bottom-8 right-8 z-50 cursor-pointer ${visible ? "lg:block" : "hidden"}`}
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
          src={defaultImageSrc}
          alt="Nest Mascot"
          width={200}
          height={200}
          priority
          style={{ display: isHovered ? "none" : "block" }}
        />
        <Image
          src={hoverImageSrc}
          alt="Nest Mascot Hover"
          width={200}
          height={200}
          priority
          style={{ display: isHovered ? "block" : "none" }}
        />
      </motion.div>
    </motion.div>
  );
};

export default NestMascot;
