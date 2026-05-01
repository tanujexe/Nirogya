import { motion } from "motion/react";
import { Heart } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] p-4 rounded-2xl"
        >
          <Heart className="w-8 h-8 text-white" fill="white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex space-x-1"
        >
          {[0, 1, 2].map(function (i) {
            return (
              <motion.div
                key={i}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)]"
              />
            );
          })}
        </motion.div>

        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}