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
    <div className={`logo-wrapper ${containerClass}`} style={{ display: 'flex', alignItems: 'center', gap: size === 'large' ? '0px' : '10px', ...style }}>
      <div style={{ width: hologramSize, height: hologramSize, flexShrink: 0 }}>
        <HolographicHero />
      </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="logo-text">
            <span className="logo-b">B</span>
            <span className="logo-i">I</span>
            <span className="logo-o">O</span>
          </span>
          <span className="logo-cursor">█</span>
          <span className="logo-glitch" data-text="V">V</span>
        </div>
    </div>
  );
};

export default Logo;