import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { api } from '../services/api';

import onboardingWelcome from '../assets/images/onboarding_welcome_1786779189319.jpg';
import onboardingScattered from '../assets/images/onboarding_scattered_1786779212610.jpg';
import onboardingThinks from '../assets/images/onboarding_thinks_1786779231410.jpg';
import onboardingResult from '../assets/images/onboarding_result_1786779252567.jpg';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const screens = [
    {
      title: 'Meet Naviq.',
      subtitle: 'Your AI navigator for every customer conversation.',
      image: onboardingWelcome,
    },
    {
      title: 'Your customer data is everywhere.',
      subtitle: 'Accounts. Issues. Tasks. Meetings. Feature requests. Naviq connects the dots.',
      image: onboardingScattered,
    },
    {
      title: 'Just tell Naviq what you need.',
      subtitle: 'Naviq investigates the right information and finds the path to the answer.',
      image: onboardingThinks,
    },
    {
      title: 'Know what matters. Know what to do next.',
      subtitle: 'From scattered customer information to clear actions — in seconds.',
      image: onboardingResult,
    },
  ];

  const handleNext = () => {
    if (step < screens.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      handleFinishOnboarding();
    }
  };

  const handleSkip = () => {
    handleFinishOnboarding();
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      await api.completeOnboarding();
    } catch (err) {
      console.warn('Failed to complete onboarding on server:', err);
    } finally {
      setIsSubmitting(false);
      onComplete();
    }
  };

  const currentScreen = screens[step];

  return (
    <div className="onboarding-wrapper">
      <style>{`
        .onboarding-wrapper {
          min-height: 100vh;
          width: 100vw;
          background-color: #050a08;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
        }

        .onboarding-bg-glow {
          position: absolute;
          width: 80vw;
          height: 80vw;
          max-width: 800px;
          max-height: 800px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 0;
          pointer-events: none;
        }

        .onboarding-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1200px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100vh;
          justify-content: space-between;
        }

        .onboarding-header {
          padding-top: 2rem;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .onboarding-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
          gap: 2rem;
          margin: auto 0;
          transition: opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease;
        }

        .onboarding-content.animating {
          opacity: 0;
          transform: scale(0.98);
          filter: blur(8px);
        }

        .onboarding-image-container {
          width: 100%;
          max-width: 800px;
          aspect-ratio: 16/9;
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.05);
          position: relative;
        }

        .onboarding-image-container::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
          pointer-events: none;
        }

        .onboarding-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 10s ease-out;
        }

        .onboarding-image:hover {
            transform: scale(1.05);
        }

        .onboarding-text {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 600px;
        }

        .onboarding-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .onboarding-subtitle {
          font-size: clamp(1rem, 1.5vw, 1.15rem);
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
        }

        .onboarding-footer {
          width: 100%;
          max-width: 600px;
          padding-bottom: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
        }

        .onboarding-indicators {
          display: flex;
          gap: 0.75rem;
        }

        .onboarding-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .onboarding-dot.active {
          background-color: #10b981;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
          transform: scale(1.2);
        }

        .onboarding-dot.inactive {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .onboarding-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .onboarding-btn-skip {
          color: rgba(255, 255, 255, 0.4);
          background: transparent;
          border: none;
          font-size: 0.9rem;
          cursor: pointer;
          transition: color 0.2s ease;
          padding: 0.5rem 1rem;
          font-family: inherit;
        }

        .onboarding-btn-skip:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .onboarding-btn-next {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.8rem 2rem;
          border-radius: 99px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.0);
          font-family: inherit;
        }

        .onboarding-btn-next:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
        }

        .onboarding-btn-next:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .onboarding-spacer {
          width: 80px;
        }
        
        @media (max-height: 800px) {
          .onboarding-container {
             padding-top: 1rem;
          }
          .onboarding-header {
             padding-top: 1rem;
          }
          .onboarding-footer {
             padding-bottom: 2rem;
             gap: 1.5rem;
          }
          .onboarding-image-container {
             max-width: 600px;
          }
        }
      `}</style>

      <div className="onboarding-bg-glow" />

      <div className="onboarding-container">
        <div className="onboarding-header">
          <Logo size="md" showWordmark={true} />
        </div>

        <div className={`onboarding-content ${isAnimating ? 'animating' : ''}`}>
          <div className="onboarding-image-container">
            <img 
              src={currentScreen.image} 
              alt={currentScreen.title}
              className="onboarding-image"
              loading="eager"
            />
          </div>
          <div className="onboarding-text">
            <h1 className="onboarding-title">{currentScreen.title}</h1>
            <p className="onboarding-subtitle">{currentScreen.subtitle}</p>
          </div>
        </div>

        <div className="onboarding-footer">
          <div className="onboarding-indicators">
            {screens.map((_, idx) => (
              <div 
                key={idx} 
                className={`onboarding-dot ${idx === step ? 'active' : 'inactive'}`} 
              />
            ))}
          </div>

          <div className="onboarding-nav">
            {step < screens.length - 1 ? (
              <button className="onboarding-btn-skip" onClick={handleSkip}>
                Skip
              </button>
            ) : (
              <div className="onboarding-spacer" />
            )}

            <button 
              className="onboarding-btn-next" 
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Loading...' : step < screens.length - 1 ? 'Continue →' : 'Get Started →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


