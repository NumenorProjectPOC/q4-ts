import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const LoginSuccessAnimation: React.FC = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [animationStep, setAnimationStep] = useState<'q' | 'quantifore' | 'fading-out'>('q');

    useEffect(() => {
        // Sequence remains the same: Q -> Quantifore -> Fade Out -> Navigate
        const timer1 = setTimeout(() => setAnimationStep('quantifore'), 1500);
        const timer2 = setTimeout(() => setAnimationStep('fading-out'), 3500);
        const timer3 = setTimeout(() => navigate('/home'), 4500); // Updated to match your main dashboard

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [navigate]);

    const containerOpacity = animationStep === 'fading-out' ? 'opacity-0' : 'opacity-100';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-1000 ${containerOpacity} ${
            isDarkMode 
                ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black'
                : 'bg-gradient-to-br from-white via-gray-50 to-white'
        }`}>
            {/* THEME-RESPONSIVE Animated Gradient Blob Container */}
            <div className="absolute w-full h-full flex justify-center items-center overflow-hidden">
                <div className="relative w-[600px] h-[600px]">
                    {/* Theme-responsive professional blobs */}
                    {isDarkMode ? (
                        // Dark theme blobs - using brand red colors
                        <>
                            <div className="absolute top-0 -left-24 w-96 h-96 bg-red-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob1"></div>
                            <div className="absolute top-0 -right-24 w-96 h-96 bg-slate-600/50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob2 animation-delay-2000"></div>
                            <div className="absolute -bottom-16 left-10 w-96 h-96 bg-red-500/25 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob3 animation-delay-4000"></div>
                        </>
                    ) : (
                        // Light theme blobs - professional neutral colors
                        <>
                            <div className="absolute top-0 -left-24 w-96 h-96 bg-red-200/60 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob1"></div>
                            <div className="absolute top-0 -right-24 w-96 h-96 bg-gray-300/60 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob2 animation-delay-2000"></div>
                            <div className="absolute -bottom-16 left-10 w-96 h-96 bg-red-100/60 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob3 animation-delay-4000"></div>
                        </>
                    )}
                </div>
            </div>

            {/* ENHANCED Logo Container with Theme-Responsive Styling */}
            <div className="relative z-10 flex items-center justify-center w-full h-full">
                {/* The "Q" Logo - Theme-responsive */}
                <div className={`absolute transition-all duration-700 ease-in-out ${
                    animationStep === 'q' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}>
                    <div className="relative">
                        <img
                            src={isDarkMode ? "/Q-logo.svg" : "/Q-logo.svg"}
                            alt="Q Logo"
                            className="h-60 w-60 drop-shadow-2xl"
                        />
                        {/* Theme-responsive glow effect */}
                        <div className={`absolute inset-0 opacity-30 blur-2xl rounded-full ${
                            isDarkMode ? 'bg-red-500/30' : 'bg-red-500/20'
                        }`} />
                    </div>
                </div>

                {/* The full "Quantifore" Logo - Theme-responsive */}
                <div className={`absolute transition-all duration-700 ease-in-out ${
                    animationStep === 'quantifore' ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                }`}>
                    <div className="relative">
                        <img
                            src={isDarkMode ? "/qf-logo-light.svg" : "/qf-logo-dark.svg"}
                            alt="Quantifore Logo"
                            className="h-44 w-auto drop-shadow-2xl"
                        />
                        {/* Theme-responsive glow effect */}
                        <div className={`absolute inset-0 opacity-20 blur-xl rounded-lg ${
                            isDarkMode ? 'bg-red-500/25' : 'bg-gray-500/10'
                        }`} />
                    </div>
                </div>

                {/* PROFESSIONAL Loading Indicator - Theme-responsive */}
                <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 transition-all duration-500 ${
                    animationStep === 'fading-out' ? 'opacity-0' : 'opacity-100'
                }`}>
                    <div className="flex flex-col items-center space-y-4">
                        {/* Elegant progress bar with theme-responsive colors */}
                        <div className={`w-48 h-1 rounded-full overflow-hidden ${
                            isDarkMode ? 'bg-slate-700/60' : 'bg-gray-200'
                        }`}>
                            <div className={`h-full rounded-full transition-all duration-2000 ${
                                isDarkMode 
                                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                                    : 'bg-gradient-to-r from-red-600 to-gray-700'
                            } ${animationStep === 'quantifore' ? 'w-full' : 'w-1/3'}`} />
                        </div>

                        {/* Theme-responsive status text */}
                        <div className="text-center">
                            <p className={`font-medium text-base leading-relaxed ${
                                isDarkMode ? 'text-white/90' : 'text-gray-600'
                            }`}>
                                {animationStep === 'q' && 'Initializing system...'}
                                {animationStep === 'quantifore' && 'Welcome to Quantifore'}
                                {animationStep === 'fading-out' && 'Loading dashboard...'}
                            </p>
                            <p className={`text-sm mt-1 font-normal ${
                                isDarkMode ? 'text-white/60' : 'text-gray-400'
                            }`}>
                                Preparing your analytics workspace
                            </p>
                        </div>
                    </div>
                </div>

                {/* ENHANCED Particle Effects - Theme-responsive */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-1 h-1 rounded-full animate-pulse ${
                                isDarkMode ? 'bg-red-400/40' : 'bg-red-400/30'
                            }`}
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* PROFESSIONAL Footer Text - Theme-responsive */}
            <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-500 ${
                animationStep === 'fading-out' ? 'opacity-0' : 'opacity-100'
            }`}>
                <p className={`text-sm font-medium text-center leading-relaxed ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                }`}>
                    © {new Date().getFullYear()} QuantiFore Pvt. Ltd. • Data Intelligence Platform
                </p>
            </div>

            {/* Enhanced CSS Animations with theme awareness */}
            <style>{`
                @keyframes blob1 {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                
                @keyframes blob2 {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(-30px, 50px) scale(1.1); }
                    66% { transform: translate(20px, -20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                
                @keyframes blob3 {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(50px, 30px) scale(1.1); }
                    66% { transform: translate(-30px, -30px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                
                .animate-blob1 {
                    animation: blob1 7s infinite;
                }
                
                .animate-blob2 {
                    animation: blob2 8s infinite;
                }
                
                .animate-blob3 {
                    animation: blob3 6s infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                /* Enhanced visual effects for dark mode */
                ${isDarkMode ? `
                    .animate-blob1, .animate-blob2, .animate-blob3 {
                        filter: blur(3xl) saturate(1.1) brightness(1.1);
                    }
                    
                    /* Enhanced glow for dark mode */
                    img {
                        filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.3));
                    }
                ` : `
                    /* Professional subtle enhancement for light mode */
                    img {
                        filter: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.12));
                    }
                `}
            `}</style>
        </div>
    );
};

export default LoginSuccessAnimation;