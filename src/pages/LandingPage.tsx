import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
    Shield, ArrowRight, Target, Globe, ChevronDown,
    Play, Pause, Volume2, VolumeX, Sparkles, Rocket, Brain,
    Eye, LineChart, Layers, Database, Cpu, Gauge, Menu, X,
    CheckCircle, Users, Award, TrendingUp, Zap, LogIn
} from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';
import ScrollZoomSection from '../components/ui/animation/ScrollZoomSection';
import { useTheme } from '../context/ThemeContext';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [activeFeature, setActiveFeature] = useState(0);
    const [currentVideo, setCurrentVideo] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

    const videoSets = {
        light: ['/assets/vid/entry07.mp4', '/assets/vid/entry06.mp4'],
        dark: ['/assets/vid/entry.mp4', '/assets/vid/entry05.mp4']
    };

    const currentVideoSet = videoSets[isDarkMode ? 'dark' : 'light'];

    const navItems = [
        { name: 'About', href: '#about' },
        { name: 'Solutions', href: '#solutions' },
        { name: 'Features', href: '#features' },
        // { name: 'Demo', href: '#demo' },
        // { name: 'Pricing', href: '#pricing' }
    ];

    // Responsive breakpoint detection
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // useEffect(() => {
    //     const handleSmoothScroll = (e: Event) => {
    //         const target = e.target as HTMLAnchorElement;
    //         if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
    //             const id = target.getAttribute('href');
    //             if (id && id.length > 1) {
    //                 const element = document.querySelector(id);
    //                 if (element) {
    //                     e.preventDefault();
    //                     element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    //                     setIsMobileMenuOpen(false);
    //                 }
    //             }
    //         }
    //     };
    //     document.addEventListener('click', handleSmoothScroll);
    //     return () => document.removeEventListener('click', handleSmoothScroll);
    // }, []);

    // Reduce animation frequency on mobile for performance
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % 3);
        }, isMobile ? 8000 : 5000); // Longer intervals on mobile
        return () => clearInterval(interval);
    }, [isMobile]);

    // Disable auto video switching on mobile to save bandwidth
    useEffect(() => {
        if (!isMobile) {
            const videoInterval = setInterval(() => {
                setCurrentVideo((prev) => (prev + 1) % currentVideoSet.length);
            }, 20000);
            return () => clearInterval(videoInterval);
        }
    }, [currentVideoSet.length, isMobile]);

    useEffect(() => {
        setCurrentVideo(0);
    }, [isDarkMode]);

    const handleVideoControl = () => {
        if (videoRef.current) {
            if (isVideoPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsVideoPlaying(!isVideoPlaying);
        }
    };

    const handleMuteToggle = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    const scrollToSection = (href: string) => {
        const el = document.querySelector(href) as HTMLElement | null;
        if (!el) return;

        // your header is fixed: mobile h-16 (64px), desktop h-20 (80px)
        const headerOffset = isMobile ? 72 : 96; // give a bit of breathing space
        const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;

        window.scrollTo({ top, behavior: "smooth" });
    };


    const currentYear = new Date().getFullYear();

    const features = [
        {
            icon: <Brain className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'}`} />,
            title: "AI-Powered Insights",
            description: isMobile
                ? "Advanced ML algorithms for intelligent predictions."
                : "Advanced machine learning algorithms that understand your data patterns and provide intelligent predictions with remarkable accuracy.",
            gradient: isDarkMode ? "from-sky-500 via-sky-600 to-sky-700" : "from-red-600 via-red-700 to-red-800"
        },
        {
            icon: <Gauge className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'}`} />,
            title: "Real-time Analytics",
            description: isMobile
                ? "Live data processing with instant updates."
                : "Live data processing with millisecond updates and instant notifications for critical changes in your business metrics.",
            gradient: "from-neutral-600 via-neutral-700 to-neutral-800"
        },
        {
            icon: <Rocket className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'}`} />,
            title: "Predictive Modeling",
            description: isMobile
                ? "Forecasting models for proactive decisions."
                : "State-of-the-art forecasting models that help you stay ahead of trends and make proactive business decisions.",
            gradient: isDarkMode ? "from-sky-600 via-sky-700 to-neutral-800" : "from-red-700 via-red-800 to-neutral-800"
        }
    ];

    const solutions = [
        {
            icon: <TrendingUp className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />,
            title: "Financial Services",
            description: isMobile
                ? "Risk assessment and fraud detection."
                : "Risk assessment, fraud detection, and regulatory compliance with real-time market analytics.",
            stats: "99.9% accuracy",
            color: "bg-red-600"
        },
        {
            icon: <Users className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />,
            title: "Healthcare & Life Sciences",
            description: isMobile
                ? "Patient outcome prediction and trial optimization."
                : "Patient outcome prediction, clinical trial optimization, and medical research acceleration.",
            stats: "40% faster trials",
            color: "bg-neutral-600"
        },
        {
            icon: <Zap className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />,
            title: "Manufacturing & IoT",
            description: isMobile
                ? "Predictive maintenance and optimization."
                : "Predictive maintenance, supply chain optimization, and quality control automation.",
            stats: "60% less downtime",
            color: isDarkMode ? "bg-sky-700" : "bg-neutral-700"
        },
        {
            icon: <Globe className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />,
            title: "E-commerce & Retail",
            description: isMobile
                ? "Customer behavior and inventory optimization."
                : "Customer behavior analysis, inventory optimization, and personalized recommendation systems.",
            stats: "25% revenue increase",
            color: "bg-red-700"
        },
        {
            icon: <Database className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />,
            title: "Technology & SaaS",
            description: isMobile
                ? "User engagement and churn prediction."
                : "User engagement analytics, churn prediction, and product optimization insights.",
            stats: "35% retention boost",
            color: "bg-neutral-800"
        },
        {
            icon: <Award className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />,
            title: "Government & Public Sector",
            description: isMobile
                ? "Policy analysis and resource optimization."
                : "Policy impact analysis, resource allocation optimization, and citizen service improvement.",
            stats: "50% efficiency gain",
            color: isDarkMode ? "bg-sky-800" : "bg-red-800"
        }
    ];

    // Reduce particle count on mobile for performance
    const particleCount = isMobile ? 8 : isTablet ? 15 : 25;

    return (
        <div className={`min-h-screen font-inter transition-all duration-500 ${isDarkMode
            ? 'dark bg-gradient-to-br from-slate-900 via-slate-950 to-black'
            : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900'
            }`}>
            {/* Video Hero Section */}
            <section className={`relative ${isMobile ? 'h-screen' : 'h-screen'} flex items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 z-0">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover scale-105 transition-opacity duration-500"
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        key={`${isDarkMode ? 'dark' : 'light'}-${currentVideo}`}
                        // Reduce video quality on mobile
                        preload={isMobile ? "metadata" : "auto"}
                    >
                        <source src={currentVideoSet[currentVideo]} type="video/mp4" />
                    </video>
                    <div className={`absolute inset-0 transition-all duration-500 ${isDarkMode
                        ? 'bg-slate-950/75'
                        : 'bg-brand-secondary-950/80'
                        }`} />
                    {/* Reduce particles on mobile */}
                    <div className="absolute inset-0">
                        {[...Array(particleCount)].map((_, i) => (
                            <motion.div
                                key={`${isDarkMode}-${i}`}
                                className={`absolute w-0.5 h-0.5 rounded-full ${isDarkMode ? 'bg-sky-400/30' : 'bg-neutral-700/20'
                                    }`}
                                initial={{
                                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                                    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
                                }}
                                animate={!isMobile ? {
                                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                                    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
                                } : {}}
                                transition={{
                                    duration: Math.random() * 30 + 20,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* NAVBAR - Different styles for mobile vs desktop */}
                <motion.header
                    className={`absolute z-50 transition-all duration-500 backdrop-blur-md ${isMobile
                        ? // Mobile: Attached header at top
                        'top-0 left-0 right-0 border-b'
                        : // Desktop: Detached floating header  
                        'top-4 left-4 right-4 rounded-2xl navbar-detached border'
                        } ${isDarkMode
                            ? 'bg-slate-900/80 border-slate-700/50 shadow-2xl'
                            : 'bg-brand-secondary-950/90 border-neutral-300/40 shadow-2xl'
                        }`}
                    style={!isMobile ? {
                        position: 'fixed',
                        top: '1rem',
                        left: '1rem',
                        right: '1rem',
                        zIndex: 9999,
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)'
                    } : {
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)'
                    }}
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-6 sm:px-8 lg:px-12'}`}>
                        <nav className={`flex items-center justify-between ${isMobile ? 'h-16' : 'h-20'}`}>
                            <motion.div className="flex items-center z-50" whileHover={{ scale: isMobile ? 1 : 1.02 }}>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <img
                                            src={isDarkMode ? "/qf-logo-light.svg" : "/qf-logo-dark.svg"}
                                            alt="Quantifore"
                                            className={`${isMobile ? 'h-8' : 'h-12'} w-auto drop-shadow-lg`}
                                        />
                                        <div className={`absolute inset-0 blur-lg rounded-full opacity-30 ${isDarkMode ? 'bg-sky-500/20' : 'bg-red-500/20'
                                            }`} />
                                    </div>
                                    {!isMobile && (
                                        <div className="hidden sm:block">
                                            <h1 className={`text-xl font-semibold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                                                }`}>Quantifore</h1>
                                            <p className={`text-xs tracking-wide font-medium leading-tight ${isDarkMode ? 'text-white/75' : 'text-neutral-600'
                                                }`}>DATA INTELLIGENCE</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center space-x-8">
                                {navItems.map((item, index) => (
                                    <motion.a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            scrollToSection(item.href);
                                        }}
                                        className={`relative px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 group ${isDarkMode ? 'text-white/85 hover:text-white' : 'text-neutral-700/90 hover:text-neutral-900'
                                            }`}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 + 0.5 }} whileHover={{ scale: 1.03 }}
                                    >
                                        <span className="relative z-10">{item.name}</span>
                                        <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ${isDarkMode ? 'bg-white/12 border border-white/20' : 'bg-neutral-100/60 border border-neutral-300/40'
                                            }`} />
                                        <motion.div className={`absolute bottom-0 left-1/2 w-0 h-0.5 rounded-full group-hover:w-full group-hover:left-0 transition-all duration-300 ${isDarkMode ? 'bg-sky-400' : 'bg-red-700'
                                            }`} />
                                    </motion.a>
                                ))}
                            </div>

                            <div className="flex items-center space-x-3">
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}>
                                    <ThemeToggle />
                                </motion.div>

                                {/* Login Button - Icon only on mobile, full button on desktop */}
                                <motion.button
                                    onClick={handleLoginClick}
                                    className={`group relative ${isMobile
                                        ? // Mobile: Icon only button
                                        'p-2.5 rounded-lg backdrop-blur-sm border transition-all duration-300'
                                        : // Desktop: Full button with text
                                        'px-7 py-3.5 text-sm rounded-xl font-medium shadow-lg overflow-hidden transition-all duration-300'
                                        } ${isDarkMode
                                            ? isMobile
                                                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                                : 'bg-red-700 hover:bg-red-600 text-white'
                                            : isMobile
                                                ? 'bg-neutral-100/60 border-neutral-300/40 text-neutral-800 hover:bg-neutral-200/60'
                                                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                                        }`}
                                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}
                                    whileHover={{ scale: isMobile ? 1.03 : 1.03, y: isMobile ? 0 : -1 }} whileTap={{ scale: 0.97 }}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <LogIn className="w-4 h-4" />
                                        {!isMobile && (
                                            <>
                                                Get Started
                                            </>
                                        )}
                                    </span>
                                    {!isMobile && (
                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDarkMode ? 'bg-red-600' : 'bg-neutral-800'
                                            }`} />
                                    )}
                                </motion.button>

                                {/* Mobile Menu Button */}
                                <motion.button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className={`md:hidden p-2.5 rounded-lg backdrop-blur-sm border transition-all duration-300 ${isDarkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-neutral-100/60 border-neutral-300/40 text-neutral-800 hover:bg-neutral-200/60'
                                        }`}
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                >
                                    {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                                </motion.button>
                            </div>
                        </nav>

                        {/* Mobile Navigation Menu */}
                        <motion.div
                            className={`md:hidden backdrop-blur-xl border-b transition-all duration-500 ${isMobile ? '' : 'mt-2 rounded-xl'
                                } ${isDarkMode ? 'bg-slate-900/95 border-slate-700/30' : 'bg-brand-secondary-950/9 border-neutral-300/40'
                                } ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                            initial={false} animate={{ height: isMobileMenuOpen ? 'auto' : 0, opacity: isMobileMenuOpen ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="px-4 py-4 space-y-1">
                                {navItems.map((item, index) => (
                                    <motion.a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsMobileMenuOpen(false);

                                            // wait a tick so menu starts closing, then scroll
                                            setTimeout(() => scrollToSection(item.href), 50);
                                        }}
                                        className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/85 hover:text-white hover:bg-white/10' : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/60'
                                            }`}
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: isMobileMenuOpen ? 1 : 0, x: isMobileMenuOpen ? 0 : -20 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {item.name}
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.header>

                {/* HERO CONTENT */}
                <motion.div
                    className={`relative z-30 text-center ${isMobile ? 'px-4 max-w-md mt-16' : 'px-4 max-w-6xl'} ${isDarkMode ? 'text-white' : 'text-neutral-900'
                        }`}
                    style={{ opacity: heroOpacity, scale: heroScale }}
                >
                    <motion.div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-6 shadow-md ${isDarkMode ? 'bg-white/10 border-white/25' : 'bg-white/40 border-neutral-300/50'
                            }`}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Sparkles className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        {isMobile ? 'Future of Analytics' : 'Experience the Future of Data Analytics'}
                    </motion.div>

                    <motion.h1
                        className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-6xl lg:text-7xl'} font-bold mb-4 leading-[1.15] tracking-tight drop-shadow-lg`}
                        style={{ lineHeight: 1.15 }} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                    >
                        Transform Data Into{' '}
                        <span className={`bg-gradient-to-r bg-clip-text text-transparent drop-shadow-sm ${isDarkMode ? 'from-red-400 via-red-500 to-red-600' : 'from-red-600 via-red-700 to-red-800'
                            }`}>
                            Intelligence
                        </span>
                    </motion.h1>

                    <motion.p
                        className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} max-w-4xl mx-auto mb-8 leading-relaxed font-medium drop-shadow-sm ${isDarkMode ? 'text-white/90' : 'text-neutral-700'
                            }`}
                        style={{ lineHeight: 1.6 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        {isMobile
                            ? "Harness AI-driven analytics to unlock patterns and make data-driven decisions."
                            : "Harness the power of AI-driven analytics to unlock hidden patterns, predict future trends, and make data-driven decisions with confidence."
                        }
                    </motion.p>

                    <motion.div
                        className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row gap-5'} justify-center mb-10`}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        <motion.button
                            onClick={handleLoginClick}
                            className={`group relative ${isMobile ? 'px-6 py-3 text-base' : 'px-8 py-4 text-lg'} rounded-xl font-semibold shadow-lg overflow-hidden backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                                }`}
                            whileHover={{ scale: isMobile ? 1 : 1.03, y: isMobile ? 0 : -2 }} whileTap={{ scale: 0.97 }}
                        >
                            <span className="relative z-10 flex items-center gap-3 justify-center">
                                <Rocket className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                Get Started
                                <ArrowRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} group-hover:translate-x-0.5 transition-transform`} />
                            </span>
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDarkMode ? 'bg-red-600' : 'bg-neutral-800'
                                }`} />
                        </motion.button>

                        {/* {!isMobile && (
                            <motion.button
                                className={`px-8 py-4 backdrop-blur-md border rounded-xl transition-all duration-300 font-semibold text-lg shadow-md ${isDarkMode ? 'bg-white/12 border-white/30 hover:bg-white/20 text-white' : 'bg-white/50 border-neutral-400/40 hover:bg-white/70 text-neutral-800'
                                    }`}
                                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                            >
                                <Eye className="w-5 h-5 inline mr-2" />Watch Demo
                            </motion.button>
                        )} */}
                    </motion.div>

                    <motion.div
                        className={`grid ${isMobile ? 'grid-cols-1 gap-4' : isTablet ? 'grid-cols-2 gap-4' : 'md:grid-cols-3 gap-5'} max-w-5xl mx-auto`}
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1.2 }}
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className={`group relative ${isMobile ? 'p-4' : 'p-6'} backdrop-blur-xl rounded-xl border transition-all duration-500 shadow-lg ${isDarkMode ? 'bg-white/8 border-white/20 hover:bg-white/12' : 'bg-white/60 border-neutral-300/30 hover:bg-white/80'
                                    } ${activeFeature === index ? (isDarkMode ? 'ring-1 ring-sky-400/40 shadow-xl scale-[1.02]' : 'ring-1 ring-red-400/40 shadow-xl scale-[1.02]') : ''}`}
                                whileHover={{ y: isMobile ? -4 : -8 }} onHoverStart={() => setActiveFeature(index)}
                            >
                                <div className={`p-2.5 rounded-lg bg-gradient-to-r ${feature.gradient} w-fit mb-3 shadow-md`}>{feature.icon}</div>
                                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2 drop-shadow-sm leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                                    {feature.title}
                                </h3>
                                <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed drop-shadow-sm ${isDarkMode ? 'text-white/80' : 'text-neutral-700'}`} style={{ lineHeight: 1.5 }}>
                                    {feature.description}
                                </p>
                                <div className={`absolute inset-0 bg-gradient-to-r rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDarkMode ? 'from-sky-500/5 to-sky-600/5' : 'from-red-500/5 to-red-600/5'}`} />
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Video Controls - Hide on mobile to reduce clutter */}
                {!isMobile && (
                    <div className="absolute bottom-8 right-8 z-40 flex gap-3">
                        <motion.button onClick={handleVideoControl} className={`p-3 backdrop-blur-xl rounded-full border transition-all duration-300 shadow-md ${isDarkMode ? 'bg-white/15 border-white/25 hover:bg-white/20 text-white' : 'bg-white/60 border-neutral-300/40 hover:bg-white/80 text-neutral-800'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            {isVideoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </motion.button>
                        <motion.button onClick={handleMuteToggle} className={`p-3 backdrop-blur-xl rounded-full border transition-all duration-300 shadow-md ${isDarkMode ? 'bg-white/15 border-white/25 hover:bg-white/20 text-white' : 'bg-white/60 border-neutral-300/40 hover:bg-white/80 text-neutral-800'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </motion.button>
                    </div>
                )}

                {/* Video Indicators - Simplified on mobile */}
                {!isMobile && (
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 flex gap-2">
                        {currentVideoSet.map((_, index) => (
                            <button key={index} onClick={() => setCurrentVideo(index)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentVideo === index ? isDarkMode ? 'bg-white scale-125 shadow-md' : 'bg-neutral-800 scale-125 shadow-md' : isDarkMode ? 'bg-white/60 hover:bg-white/80 hover:scale-110' : 'bg-neutral-600/60 hover:bg-neutral-800/80 hover:scale-110'}`} />
                        ))}
                    </div>
                )}

                <motion.div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 ${isDarkMode ? 'text-white/85' : 'text-neutral-700'}`} animate={{ y: [0, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                    <ChevronDown className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'} drop-shadow-sm`} />
                </motion.div>
            </section>

            {/* Solutions Section - Optimized for mobile */}
            <section id="solutions" className={`${isMobile ? 'py-16' : 'py-32'} transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white'
                : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
                }`}>
                <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}`}>
                    <motion.div
                        className={`text-center max-w-4xl mx-auto ${isMobile ? 'mb-12' : 'mb-20'}`}
                        initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }} viewport={{ once: true }}
                    >
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${isMobile ? 'mb-4' : 'mb-8'} ${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-500/10 border-red-500/20'
                            }`}>
                            <TrendingUp className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-red-500`} />
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}>
                                Comprehensive Solutions
                            </span>
                        </div>
                        <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-bold mb-4 leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                            Built for Every{' '}
                            <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode ? 'from-red-400 to-red-600' : 'from-red-600 to-red-700'
                                }`}>Industry</span>
                        </h2>
                        <p className={`${isMobile ? 'text-base' : 'text-xl'} leading-relaxed font-medium ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`} style={{ lineHeight: 1.65 }}>
                            {isMobile
                                ? "Our platform adapts to your unique business needs with industry-specific solutions."
                                : "From startups to enterprise, our platform adapts to your unique business needs with industry-specific solutions and customizable workflows."
                            }
                        </p>
                    </motion.div>

                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : isTablet ? 'grid-cols-2 gap-6' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'} ${isMobile ? 'mb-12' : 'mb-20'}`}>
                        {solutions.map((solution, index) => (
                            <motion.div
                                key={solution.title}
                                className={`group relative backdrop-blur-xl rounded-2xl ${isMobile ? 'p-6' : 'p-8'} shadow-lg hover:shadow-xl transition-all duration-500 border overflow-hidden ${isDarkMode ? 'bg-slate-900/60 border-slate-700/50 hover:bg-slate-900/80' : 'bg-white/80 border-neutral-200/50 hover:bg-white/95'
                                    }`}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }} viewport={{ once: true }}
                                whileHover={{ y: isMobile ? -4 : -8, scale: isMobile ? 1.01 : 1.02 }}
                            >
                                <div className={`${solution.color} ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-xl flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                                    {solution.icon}
                                </div>
                                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-3 leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                                    {solution.title}
                                </h3>
                                <p className={`mb-4 leading-relaxed font-medium ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`} style={{ lineHeight: 1.6 }}>
                                    {solution.description}
                                </p>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} font-semibold ${isDarkMode ? 'bg-sky-500/20 text-sky-400 border border-slate-700/30' : 'bg-red-50 text-red-700 border border-gray-200'
                                    }`}>
                                    <CheckCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />{solution.stats}
                                </div>
                                <div className={`absolute inset-0 bg-gradient-to-br from-sky-500/5 to-sky-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Stats Section - Simplified for mobile */}
                    {/* <motion.div
                        className={`rounded-3xl ${isMobile ? 'p-8' : 'p-12'} shadow-xl border ${isDarkMode ? 'bg-gradient-to-r from-slate-900/80 to-slate-950/80 border-slate-700/50' : 'bg-gradient-to-r from-white/90 to-brand-secondary-900/90 border-neutral-200/50'
                            }`}
                        initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }}
                    >
                        <div className={`grid ${isMobile ? 'grid-cols-2 gap-6' : 'grid-cols-2 md:grid-cols-4 gap-8'}`}>
                            {[
                                {
                                    value: "In Dev",
                                    label: isMobile ? "Development" : "In Development",
                                    icon: <Rocket className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />,
                                  },
                                  {
                                    value: "100+",
                                    label: isMobile ? "Features" : "Planned Features",
                                    icon: <Database className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />,
                                  },
                                  {
                                    value: "24/7",
                                    label: isMobile ? "Building" : "Always Building",
                                    icon: <Award className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />,
                                  },
                                  {
                                    value: "2025",
                                    label: isMobile ? "Launch" : "Coming Soon",
                                    icon: <Target className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />,
                                  }
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label} className="text-center"
                                    initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 + 0.5 }} viewport={{ once: true }} whileHover={{ scale: isMobile ? 1.02 : 1.05 }}
                                >
                                    <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} mx-auto mb-3 rounded-xl flex items-center justify-center shadow-md ${isDarkMode ? 'bg-sky-600' : 'bg-neutral-800'
                                        }`}>
                                        <div className="text-white">{stat.icon}</div>
                                    </div>
                                    <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-2 ${isDarkMode ? 'bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-neutral-700 to-neutral-900 bg-clip-text text-transparent'
                                        }`}>{stat.value}</div>
                                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div> */}
                </div>
            </section>

            {/* ScrollZoomSection - Hide on mobile for performance */}
            {!isMobile && (
                <ScrollZoomSection
                    images={["/assets/seq/01.jpg", "/assets/seq/09.jpg"]} sectionVh={1.9}
                    fromScale={1.0} toScale={2.0} fromTranslateY={0} toTranslateY={-140}
                    stepSensitivity={0.6} smoothing={0.18} className="bg-black"
                >
                    <div className="max-w-5xl mx-auto text-center">
                        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-xl border shadow-lg mb-6 bg-white/10 border-white/15 text-white/90`}>
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />Scroll to Dive In
                        </div>
                        <h2 className="text-white text-4xl sm:text-6xl font-bold tracking-tight drop-shadow-lg leading-tight">
                            Zoom into <span className="bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent">True Insight</span>
                        </h2>
                        <p className={`mt-4 text-lg sm:text-xl drop-shadow-sm font-medium leading-relaxed text-white/85`} style={{ lineHeight: 1.6 }}>
                            Experience the depth of our analytics platform through immersive visual storytelling.
                        </p>
                    </div>
                </ScrollZoomSection>
            )}

            {/* About Section */}
            <section id="about" className={`scroll-mt-16 ${isMobile ? 'py-16' : 'py-24'} transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white'
                : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
                }`}>
                <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}`}>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-12' : 'lg:grid-cols-2 gap-16'} items-center`}>
                        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${isMobile ? 'mb-6' : 'mb-8'} ${isDarkMode ? 'bg-sky-500/10 border-slate-700/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <Target className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${isDarkMode ? 'text-sky-500' : 'text-red-600'}`} />
                                <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold ${isDarkMode ? 'text-sky-400' : 'text-red-600'}`}>About Quantifore</span>
                            </div>
                            <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-bold mb-4 leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                                Revolutionizing Data{' '}<span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode ? 'from-sky-400 to-sky-600' : 'from-red-600 to-red-700'}`}>Intelligence</span>
                            </h2>
                            <p className={`${isMobile ? 'text-base' : 'text-lg'} mb-6 leading-relaxed font-medium ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`} style={{ lineHeight: 1.65 }}>
                                {isMobile
                                    ? "At Quantifore, we transform complex datasets into clear, actionable intelligence that drives growth."
                                    : "At Quantifore, we believe that every piece of data holds the key to extraordinary insights. Our cutting-edge platform transforms complex datasets into clear, actionable intelligence that drives business growth and innovation."
                                }
                            </p>
                            <div className="space-y-4">
                                {[
                                    { icon: <Globe className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />, title: "Causal Foresight Engine", desc: "Model feedback loops and dynamic interdependencies to anticipate how today’s decisions shape tomorrow’s outcomes." },
                                    { icon: <Shield className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />, title: "Adaptive Learning Models", desc: "Continuously refine predictive accuracy through evolving data patterns and contextual intelligence." },
                                    { icon: <Rocket className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />, title: "Transparent Decision Framework", desc: "Reveal the “why” behind every insight through clear, explainable visual intelligence." }
                                ].map((item, index) => (
                                    <motion.div key={item.title} className="flex items-start gap-3 group" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: index * 0.15 }} viewport={{ once: true }}>
                                        <div className={`flex-shrink-0 p-2 rounded-lg text-white group-hover:scale-105 transition-all duration-300 shadow-md ${isDarkMode ? 'bg-sky-600 hover:bg-sky-700' : 'bg-neutral-800 hover:bg-neutral-700'}`}>{item.icon}</div>
                                        <div>
                                            <h4 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-1 leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{item.title}</h4>
                                            <p className={`${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'} ${isMobile ? 'text-sm' : 'text-base'} leading-relaxed`} style={{ lineHeight: 1.6 }}>{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Video section - Simplified for mobile */}
                        <motion.div className="relative" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
                            <div className="relative">
                                <div className={`relative rounded-2xl ${isMobile ? 'p-4' : 'p-8'} shadow-xl ${isDarkMode ? 'bg-gradient-to-br from-slate-900 to-slate-950' : 'bg-gradient-to-br from-neutral-100 to-neutral-200'}`}>
                                    <video className={`w-full ${isMobile ? 'h-48' : 'h-64'} object-cover rounded-xl shadow-md`} autoPlay muted loop playsInline preload={isMobile ? "metadata" : "auto"}>
                                        <source src="/assets/vid/entry.mp4" type="video/mp4" />
                                    </video>
                                </div>

                                {/* Floating stats - Hide on mobile to reduce clutter */}
                                {!isMobile && (
                                    <>
                                        <motion.div className={`absolute -top-6 -right-6 p-4 rounded-xl shadow-lg backdrop-blur-sm border ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/95 border-neutral-200'}`} animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                                            <div className="text-center">
                                                <div className={`text-2xl font-bold ${isDarkMode ? 'bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-neutral-800 to-neutral-900 bg-clip-text text-transparent'}`}>99.9%</div>
                                                <div className={`text-sm font-medium ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>Uptime</div>
                                            </div>
                                        </motion.div>
                                        <motion.div className={`absolute -bottom-6 -left-6 p-4 rounded-xl shadow-lg backdrop-blur-sm border ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/95 border-neutral-200'}`} animate={{ y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                                            <div className="text-center">
                                                <div className={`text-2xl font-bold ${isDarkMode ? 'bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-neutral-800 to-neutral-900 bg-clip-text text-transparent'}`}>100ms</div>
                                                <div className={`text-sm font-medium ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>Response</div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className={`scroll-mt-20 ${isMobile ? 'py-16' : 'py-24'} transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-tr from-slate-900 via-slate-950 to-black text-white'
                : 'bg-gradient-to-tr from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
                }`}>
                <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}`}>
                    <motion.div className={`text-center ${isMobile ? 'mb-12' : 'mb-20'}`} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
                        <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-bold mb-4 leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>Powerful Features</h2>
                        <p className={`${isMobile ? 'text-base' : 'text-xl'} max-w-3xl mx-auto leading-relaxed font-medium ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`} style={{ lineHeight: 1.6 }}>
                            {isMobile
                                ? "Transform raw data into actionable intelligence"
                                : "Everything you need to transform raw data into actionable intelligence"
                            }
                        </p>
                    </motion.div>

                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : isTablet ? 'grid-cols-2 gap-6' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
                        {[
                            { icon: <Database className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} />, title: "Universal Data Integration", description: isMobile ? "Connect to any data source with universal connectors." : "Connect to any data source - databases, APIs, files, or real-time streams with our universal connectors and seamless integration protocols.", gradient: isDarkMode ? "from-sky-600/90 to-sky-700/90" : "from-red-600/90 to-red-700/90" },
                            { icon: <Cpu className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} />, title: "AI-Powered Processing", description: isMobile ? "ML algorithms detect patterns and trends automatically." : "Advanced machine learning algorithms automatically detect patterns, anomalies, and trends in your data with unprecedented accuracy.", gradient: "from-neutral-600/90 to-neutral-700/90" },
                            { icon: <LineChart className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} />, title: "Predictive Analytics", description: isMobile ? "Forecast future trends with predictive modeling." : "Forecast future trends with confidence using our state-of-the-art predictive modeling engine and statistical algorithms.", gradient: isDarkMode ? "from-sky-700/90 to-sky-800/90" : "from-red-700/90 to-red-800/90" },
                            { icon: <Eye className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} />, title: "Interactive Visualizations", description: isMobile ? "Create stunning interactive dashboards." : "Create stunning, interactive dashboards that tell your data's story with clarity, impact, and professional presentation.", gradient: "from-neutral-600/90 to-neutral-700/90" },
                            { icon: <Shield className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} />, title: "Enterprise Security", description: isMobile ? "Bank-level security with comprehensive compliance." : "Bank-level security with end-to-end encryption, role-based access controls, and comprehensive compliance certifications.", gradient: "from-red-600/90 to-red-700/90" },
                            { icon: <Layers className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} />, title: "Collaborative Workflows", description: isMobile ? "Share insights and collaborate seamlessly." : "Share insights, collaborate on analyses, and build data-driven cultures across your organization with seamless team integration.", gradient: "from-neutral-700/90 to-neutral-800/90" }
                        ].map((feature, index) => (
                            <ProfessionalFeatureCard key={feature.title} feature={feature} index={index} isDarkMode={isDarkMode} isMobile={isMobile} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Demo Section */}
            <section id="demo" className={`${isMobile ? 'py-16' : 'py-24'} overflow-hidden transition-all duration-500 ${isDarkMode
                ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white'
                : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
                }`}>
                <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}`}>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-12' : 'lg:grid-cols-2 gap-16'} items-center`}>
                        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
                            <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-bold mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>See It In Action</h2>
                            <p className={`${isMobile ? 'text-base' : 'text-xl'} mb-8 leading-relaxed font-medium ${isDarkMode ? 'text-neutral-200' : 'text-neutral-600'}`} style={{ lineHeight: 1.6 }}>
                                {isMobile
                                    ? "Experience our platform through interactive demos and real-world use cases."
                                    : "Experience the power of our platform through interactive demos and real-world use cases that showcase true business impact."
                                }
                            </p>
                            <div className="space-y-4">
                                {[
                                    { step: "01", title: "Connect Your Data", desc: isMobile ? "Integrate 200+ data sources instantly" : "Seamlessly integrate with 200+ data sources instantly" },
                                    { step: "02", title: "AI Analysis", desc: isMobile ? "AI finds patterns and insights" : "Our AI automatically finds patterns and actionable insights" },
                                    { step: "03", title: "Visualize & Share", desc: isMobile ? "Create dashboards and share" : "Create beautiful dashboards and share with your team" },
                                    { step: "04", title: "Predict & Optimize", desc: isMobile ? "Plan ahead strategically" : "Use predictive models to plan ahead strategically" }
                                ].map((item, index) => (
                                    <motion.div key={item.step} className="flex items-start gap-4 group" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: index * 0.15 }} viewport={{ once: true }}>
                                        <div className={`flex-shrink-0 ${isMobile ? 'w-8 h-8' : 'w-11 h-11'} rounded-full flex items-center justify-center text-white font-bold ${isMobile ? 'text-xs' : 'text-sm'} group-hover:scale-105 transition-all duration-300 shadow-lg ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                            {item.step}
                                        </div>
                                        <div>
                                            <h4 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-1 leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{item.title}</h4>
                                            <p className={`${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'} ${isMobile ? 'text-sm' : 'text-base'}`} style={{ lineHeight: 1.6 }}>{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div className="relative" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
                            <div className={`relative rounded-2xl ${isMobile ? 'p-4' : 'p-8'} shadow-xl ${isDarkMode ? 'bg-gradient-to-br from-neutral-800 to-neutral-900' : 'bg-gradient-to-br from-neutral-100 to-neutral-200'}`}>
                                <video className={`w-full ${isMobile ? 'h-48' : 'h-auto'} object-cover rounded-xl shadow-md`} autoPlay muted loop playsInline preload={isMobile ? "metadata" : "auto"}>
                                    <source src="/assets/vid/entry.mp4" type="video/mp4" />
                                </video>

                                {/* Decorative elements - Hide on mobile */}
                                {isDarkMode && !isMobile && (
                                    <>
                                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-red-500/20 rounded-full opacity-30 animate-pulse blur-lg" />
                                        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-red-600/20 rounded-full opacity-30 animate-pulse blur-lg" />
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="pricing" className={`${isMobile ? 'py-16' : 'py-24'} text-white relative overflow-hidden ${isDarkMode
                ? 'bg-gradient-to-tr from-slate-900 via-slate-950 to-black text-white'
                : 'bg-gradient-to-tr from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
                }`}>
                {/* Reduce particle count on mobile */}
                <div className="absolute inset-0 opacity-20">
                    {[...Array(isMobile ? 6 : 12)].map((_, i) => (
                        <motion.div key={i} className="absolute rounded-full bg-white" style={{ width: Math.random() * 3 + 1.5, height: Math.random() * 3 + 1.5, filter: 'blur(0.5px)' }} initial={{ x: Math.random() * (window.innerWidth ?? 1920), y: Math.random() * (window.innerHeight ?? 1080) }} animate={!isMobile ? { x: Math.random() * (window.innerWidth ?? 1920), y: Math.random() * (window.innerHeight ?? 1080) } : {}} transition={{ duration: Math.random() * 25 + 20, repeat: Infinity, ease: "linear" }} />
                    ))}
                </div>

                <div className={`max-w-4xl mx-auto text-center ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'} relative z-10`}>
                    <motion.h2 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-bold mb-4 leading-tight`} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
                        Ready to Transform Your Data?
                    </motion.h2>
                    <motion.p className={`${isMobile ? 'text-base' : 'text-xl'} mb-8 leading-relaxed opacity-95 font-medium`} style={{ lineHeight: 1.6 }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }}>
                        {isMobile
                            ? "Join thousands of companies using Quantifore to make smarter decisions."
                            : "Join thousands of companies using Quantifore to make smarter, faster decisions with confidence and precision."
                        }
                    </motion.p>
                    <motion.div className="flex justify-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} viewport={{ once: true }}>
                        <motion.button onClick={handleLoginClick} className={`${isDarkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-neutral-900 hover:bg-neutral-800 text-white'} group relative ${isMobile ? 'px-8 py-4 text-base' : 'px-10 py-5 text-lg'} rounded-xl font-bold shadow-lg overflow-hidden transition-all duration-300`} whileHover={{ scale: isMobile ? 1.02 : 1.03, y: isMobile ? 0 : -2 }} whileTap={{ scale: 0.97 }}>
                            <span className="relative z-10 flex items-center gap-3 justify-center">
                                <Rocket className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                Get Started
                                <ArrowRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} group-hover:translate-x-1 transition-transform`} />
                            </span>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.button>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className={`${isMobile ? 'py-16' : 'pt-18 pb-4'} transition-all duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-brand-secondary-950 text-neutral-800 border-t border-neutral-200'}`}>
                <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}`}>
                    {/* Grid Container */}
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-12' : 'md:grid-cols-2 gap-12'}`}>

                        {/* Left Side: Logo and Intro */}
                        <div className={isMobile ? 'text-center' : ''}>
                            <img
                                src={isDarkMode ? "/qf-logo-light.svg" : "/qf-logo-dark.svg"}
                                alt="Quantifore"
                                className={`h-10 ${isMobile ? 'mx-auto' : ''} mb-4 drop-shadow-sm`}
                                loading="lazy"
                            />
                            <p className={`leading-relaxed font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'} ${isMobile ? 'text-sm' : 'text-base'}`} style={{ maxWidth: '400px', margin: isMobile ? '0 auto' : '0' }}>
                                {isMobile
                                    ? "Transform your data into intelligence with AI-powered analytics."
                                    : "Transform your data into intelligence with AI-powered analytics and predictive insights for better business decisions."
                                }
                            </p>
                        </div>

                        {/* Right Side: Navigation Links (Visible on mobile too based on your request) */}
                        <div className={isMobile ? 'text-center' : 'md:pl-20'}>
                            <h4 className={`font-bold text-lg mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                                Product
                            </h4>
                            <nav className={`flex flex-col space-y-3 ${isMobile ? 'items-center' : ''}`}>
                                {['About', 'Solutions', 'Features'].map((link) => (
                                    <a
                                        key={link}
                                        href={`#${link.toLowerCase()}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById(link.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`block transition-all hover:translate-x-1 leading-relaxed cursor-pointer ${isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                                            }`}
                                    >
                                        {link}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Bottom Copyright Section */}
                    <div className={`border-t ${isMobile ? 'mt-12 pt-6' : 'mt-16 pt-8'} text-center ${isDarkMode ? 'border-slate-700/30 text-neutral-400' : 'border-neutral-200 text-neutral-600'}`}>
                        <p className={`leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
                            © {new Date().getFullYear()} Quantifore. All rights reserved. Built with passion for data-driven teams.
                        </p>
                    </div>
                </div>
            </footer>

        </div>
    );
};

// Updated Professional Feature Card component with mobile optimization
const ProfessionalFeatureCard: React.FC<{
    feature: any;
    index: number;
    isDarkMode: boolean;
    isMobile?: boolean;
}> = ({ feature, index, isDarkMode, isMobile = false }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    return (
        <motion.div
            ref={ref}
            className={`group relative backdrop-blur-xl rounded-2xl ${isMobile ? 'p-6' : 'p-8'} shadow-lg hover:shadow-xl transition-all duration-500 border overflow-hidden ${isDarkMode ? 'bg-slate-900/80 border-slate-700/50 hover:bg-slate-900/90' : 'bg-white/90 border-neutral-200/50 hover:bg-white/95'
                }`}
            initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, delay: index * 0.15 }} whileHover={{ y: isMobile ? -4 : -8, scale: isMobile ? 1.01 : 1.02 }}
        >
            <div className="relative z-10">
                <motion.div
                    className={`${isMobile ? 'p-2.5' : 'p-3.5'} rounded-xl bg-gradient-to-r ${feature.gradient} w-fit mb-4 shadow-md`}
                    whileHover={{ rotate: isMobile ? 0 : 360 }} transition={{ duration: 0.6 }}
                >
                    {feature.icon}
                </motion.div>
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all duration-300 leading-tight ${isDarkMode ? 'text-white group-hover:from-sky-400 group-hover:to-sky-600' : 'text-neutral-900 group-hover:from-red-600 group-hover:to-red-700'
                    }`}>
                    {feature.title}
                </h3>
                <p className={`leading-relaxed font-medium ${isMobile ? 'text-sm' : 'text-base'} ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`} style={{ lineHeight: 1.6 }}>
                    {feature.description}
                </p>
            </div>
            <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500 blur-xl`} />
        </motion.div>
    );
};

export default LandingPage;