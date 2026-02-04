import { motion } from 'framer-motion';
import HolographicHero from '../ui/HolographicHero';

const Logo = ({ size = 'large', style = {} }) => {
  // size can be 'large' (home), 'medium' (enroll), 'small' (headers)
  const containerClass = size === 'large' ? 'logo-container-lg' : 'logo-container-sm';

  // Determine hologram size
  let hologramSize = '50px';
  if (size === 'large') hologramSize = '180px';
  if (size === 'medium') hologramSize = '80px';
  if (size === 'small') hologramSize = '40px';

  return (
    <motion.div
      className={`logo-wrapper ${containerClass}`}
      style={{ display: 'flex', alignItems: 'center', gap: size === 'large' ? '0px' : '10px', ...style }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        style={{ width: hologramSize, height: hologramSize, flexShrink: 0 }}
        initial={{ rotate: -180 }}
        animate={{ rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <HolographicHero />
      </motion.div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="logo-text">
          <span className="logo-b">B</span>
          <span className="logo-i">I</span>
          <span className="logo-o">O</span>
        </span>
        <span className="logo-cursor">█</span>
        <span className="logo-glitch" data-text="V">V</span>
      </div>
    </motion.div>
  );
};

export default Logo;