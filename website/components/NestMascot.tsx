import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const NestMascot = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50 cursor-pointer hidden lg:block"
      initial={{ y: '70%' }}
      animate={{ y: isHovered ? '30%' : '70%' }}
      whileHover={{ 
        y: '30%',
        transition: { 
          y: { duration: 0.2 },
          rotate: { duration: 0.2, yoyo: Infinity }
        }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        animate={{ rotate: isHovered ? [0, -5, 5, -5, 5, 0] : 0 }}
        transition={{ duration: 0.5 }}
      >
        <Image
          src={isHovered ? "/favicon.png" : "/nest.png"}
          alt="Nest Mascot"
          width={200}
          height={200}
        />
      </motion.div>
    </motion.div>
  );
};

export default NestMascot;