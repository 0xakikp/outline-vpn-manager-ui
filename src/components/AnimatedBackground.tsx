import ParticleField from './ParticleField';

export default function AnimatedBackground() {
  return (
    <>
      <div className="mesh-bg" />
      <div className="grid-pattern" />
      <div className="noise-overlay" />
      <ParticleField />
    </>
  );
}
