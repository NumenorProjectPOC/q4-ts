import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    BarChart3,
    Activity,
    Zap,
    Shield,
    Users,
    ArrowRight,
    CheckCircle,
    Target,
    Globe,
    Lock,
    HeadphonesIcon,
    ChevronDown
} from 'lucide-react';
import LoginModal from '../components/LoginModal';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        const handleSmoothScroll = (e: Event) => {
            const target = e.target as HTMLAnchorElement;
            if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
                const id = target.getAttribute('href');
                if (id && id.length > 1) {
                    const element = document.querySelector(id);
                    if (element) {
                        e.preventDefault();
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }
        };

        document.addEventListener('click', handleSmoothScroll);
        return () => document.removeEventListener('click', handleSmoothScroll);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleLoginClick = () => {
        navigate('/login');
    };
    // const handleLoginClick = () => {
    //     setShowLoginModal(true); // Changed from navigate('/login')
    //   };
    const currentYear = new Date().getFullYear();

    const features = [
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: "Smart Forecasting",
            description: "AI-powered predictions that learn from your data patterns"
        },
        {
            icon: <Activity className="w-6 h-6" />,
            title: "Real-time Monitoring",
            description: "Live data streams with intelligent alerts and notifications"
        },
        {
            icon: <BarChart3 className="w-6 h-6" />,
            title: "Visual Analytics",
            description: "Interactive dashboards that tell your data's story"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900">
            {/* Clean Header */}
            <motion.header
                className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <motion.div
                            className="flex items-center"
                            whileHover={{ scale: 1.02 }}
                        >
                            <img src="/qf-logo0.1.svg" alt="Quantifore logo" className="h-8 select-none" />
                        </motion.div>

                        {/* Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            {['What you get', 'How it works', 'Product', 'Trust', 'FAQ'].map((item, index) => (
                                <motion.a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                                    className="text-gray-600 hover:text-red-700 transition-colors duration-300 text-sm font-medium"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    {item}
                                </motion.a>
                            ))}

                            <motion.button
                                onClick={handleLoginClick}
                                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium shadow-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Login
                            </motion.button>
                        </div>

                        {/* Mobile Login */}
                        <div className="md:hidden">
                            <motion.button
                                onClick={handleLoginClick}
                                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                            >
                                Login
                            </motion.button>
                        </div>
                    </nav>
                </div>
            </motion.header>

            <main>
                {/* Hero Section */}
                <section className="py-20 sm:py-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <motion.div
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 mb-8"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6 }}
                            >
                                Plan better with living numbers
                            </motion.div>

                            <motion.h1
                                className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                Turn scattered updates into{' '}
                                <span className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
                                    clear trends
                                </span>{' '}
                                and simple{' '}
                                <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                                    forecasts
                                </span>
                            </motion.h1>

                            <motion.p
                                className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            >
                                Quantifore brings your important numbers into one place, keeps them fresh, and shows where things are headed.
                                <strong className="text-gray-800"> No complex setup. No data science required.</strong>
                            </motion.p>

                            <motion.div
                                className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                            >
                                <motion.a
                                    href="#features"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold text-lg shadow-xl"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Target className="w-5 h-5" />
                                    Explore what you get
                                    <ArrowRight className="w-5 h-5" />
                                </motion.a>

                                <motion.a
                                    href="#how"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold text-lg"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    See how it works
                                </motion.a>
                            </motion.div>

                            {/* Feature Tags */}
                            <motion.div
                                className="flex flex-wrap justify-center gap-4 mb-20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                            >
                                {['Fast to start', 'Easy to use', 'Made for teams', 'Privacy first'].map((tag, index) => (
                                    <motion.span
                                        key={tag}
                                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 shadow-sm"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.9 + index * 0.1 }}
                                    >
                                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                        {tag}
                                    </motion.span>
                                ))}
                            </motion.div>

                            {/* Value Props Grid */}
                            <div className="grid md:grid-cols-3 gap-8">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        className={`relative p-8 rounded-2xl border transition-all duration-500 cursor-pointer ${activeFeature === index
                                            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-xl transform scale-105'
                                            : 'bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg hover:shadow-xl'
                                            }`}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 1.0 + index * 0.2 }}
                                        onClick={() => setActiveFeature(index)}
                                        whileHover={{ y: -5 }}
                                    >
                                        <div className={`p-3 rounded-xl mb-6 w-fit ${activeFeature === index
                                            ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>

                                        {/* Active indicator */}
                                        {activeFeature === index && (
                                            <motion.div
                                                className="absolute top-4 right-4 w-3 h-3 bg-red-600 rounded-full"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-white/50 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            className="text-center mb-20"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                                What you get
                            </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                                Simple tools that help you track what matters, understand why it's moving, and choose your next step.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    category: "Tracking",
                                    title: "All your key numbers in one place",
                                    description: "Bring in the updates you already receive—from reports, files, or feeds—so everyone sees the same truth.",
                                    icon: <BarChart3 className="w-6 h-6" />,
                                    gradient: "from-blue-500 to-blue-600"
                                },
                                {
                                    category: "Explanations",
                                    title: "What's pushing your results",
                                    description: "See the main drivers behind changes, so you can focus on the few things that matter most.",
                                    icon: <TrendingUp className="w-6 h-6" />,
                                    gradient: "from-green-500 to-green-600"
                                },
                                {
                                    category: "Forecasts",
                                    title: "Where things are headed",
                                    description: "Get a simple view of tomorrow based on yesterday and today. Adjust assumptions and compare scenarios.",
                                    icon: <Target className="w-6 h-6" />,
                                    gradient: "from-purple-500 to-purple-600"
                                },
                                {
                                    category: "Views",
                                    title: "Maps and dashboards",
                                    description: "Watch how signals evolve across regions and topics with clean, interactive visuals your team can share.",
                                    icon: <Globe className="w-6 h-6" />,
                                    gradient: "from-orange-500 to-orange-600"
                                },
                                {
                                    category: "Alerts",
                                    title: "Know when it matters",
                                    description: "Set gentle guardrails. If a number crosses your line, we'll nudge you on the channel you prefer.",
                                    icon: <Zap className="w-6 h-6" />,
                                    gradient: "from-red-500 to-red-600"
                                },
                                {
                                    category: "Collaboration",
                                    title: "Made for teams",
                                    description: "Share views, add notes, and keep everyone aligned without chasing files or screenshots.",
                                    icon: <Users className="w-6 h-6" />,
                                    gradient: "from-indigo-500 to-indigo-600"
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -5 }}
                                >
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-6 w-fit shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        {feature.icon}
                                    </div>
                                    <div className="text-sm text-gray-500 font-semibold mb-2 uppercase tracking-wide">{feature.category}</div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-700 transition-colors">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it Works */}
                <section id="how" className="py-24 bg-gradient-to-br from-gray-50 to-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8">
                                    How it works
                                </h2>
                                <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                                    Connect your numbers, keep them fresh, understand the drivers, and see what's next.
                                </p>
                                <ul className="space-y-6">
                                    {[
                                        { step: "1", title: "Collect", desc: "Pull in the updates you already trust.", color: "bg-blue-500" },
                                        { step: "2", title: "Organize", desc: "Group related signals so they tell one story.", color: "bg-green-500" },
                                        { step: "3", title: "Explain", desc: "Highlight which factors are moving your results.", color: "bg-purple-500" },
                                        { step: "4", title: "Project", desc: "Create simple, adjustable forecasts and compare scenarios.", color: "bg-orange-500" },
                                        { step: "5", title: "Act", desc: "Get timely alerts and share clear views with your team.", color: "bg-red-500" }
                                    ].map((item, index) => (
                                        <motion.li
                                            key={item.step}
                                            className="flex items-start space-x-4 group"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.6, delay: index * 0.1 }}
                                            viewport={{ once: true }}
                                        >
                                            <div className={`flex-shrink-0 w-10 h-10 ${item.color} rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                {item.step}
                                            </div>
                                            <div>
                                                <strong className="text-gray-900 text-lg">{item.title}:</strong>{' '}
                                                <span className="text-gray-600">{item.desc}</span>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>

                            <motion.div
                                className="relative"
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                            >
                                <div className="bg-gradient-to-br from-red-50 to-blue-50 rounded-3xl p-12 h-96 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                                    <div className="text-center relative z-10">
                                        <motion.div
                                            className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl"
                                            animate={{ rotate: [0, 360] }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Activity className="w-10 h-10 text-white" />
                                        </motion.div>
                                        <div className="text-gray-700 font-semibold">Interactive Process Flow</div>
                                        <div className="text-gray-500 text-sm mt-2">Visual workflow representation</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Product Screenshots - Keep this section */}
                <section id="screens" className="py-24 bg-white/80 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            className="text-center mb-20"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                                What it looks like
                            </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                Beautiful, intuitive interfaces designed for clarity and speed
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {[
                                {
                                    title: "Trend Map",
                                    description: "A bird's eye view to spot where things are heating up or cooling down.",
                                    gradient: "from-blue-500 to-blue-600"
                                },
                                {
                                    title: "Team Dashboard",
                                    description: "Your key numbers and their drivers—kept fresh automatically.",
                                    gradient: "from-green-500 to-green-600"
                                },
                                {
                                    title: "Scenario Planner",
                                    description: "Try \"what if?\" choices and compare the outcomes side by side.",
                                    gradient: "from-purple-500 to-purple-600"
                                },
                                {
                                    title: "Alerts & Sharing",
                                    description: "Set friendly guardrails and share clean views in a click.",
                                    gradient: "from-red-500 to-red-600"
                                }
                            ].map((screen, index) => (
                                <motion.div
                                    key={screen.title}
                                    className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.2 }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -5 }}
                                >
                                    <h4 className="text-xl font-bold text-gray-900 mb-6 group-hover:text-red-700 transition-colors">{screen.title}</h4>
                                    <div className={`h-64 bg-gradient-to-br ${screen.gradient} rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center relative overflow-hidden shadow-lg`}>
                                        <div className="text-center text-white">
                                            <motion.div
                                                className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center"
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                <Activity className="w-8 h-8" />
                                            </motion.div>
                                            <span className="font-medium">Interactive {screen.title.toLowerCase()}</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-6 leading-relaxed">
                                        {screen.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Trust & Privacy */}
                <section id="trust" className="py-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            className="text-center mb-20"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                                Trust & Privacy
                            </h2>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                Your data is secure, your privacy is protected, and your trust is earned
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    icon: <Lock className="w-8 h-8" />,
                                    title: "Your data, your rules",
                                    category: "Privacy",
                                    description: "Choose what to bring in and who can see it. We keep your information safe and only use it to power your workspace.",
                                    color: "from-blue-500 to-blue-600"
                                },
                                {
                                    icon: <Shield className="w-8 h-8" />,
                                    title: "Clear roles",
                                    category: "Control",
                                    description: "Admins set who can view, edit, or share. Everyone knows what they can do.",
                                    color: "from-green-500 to-green-600"
                                },
                                {
                                    icon: <Activity className="w-8 h-8" />,
                                    title: "Built to be dependable",
                                    category: "Reliability",
                                    description: "Designed to handle busy days and long histories without slowing you down.",
                                    color: "from-purple-500 to-purple-600"
                                },
                                {
                                    icon: <HeadphonesIcon className="w-8 h-8" />,
                                    title: "We're here to help",
                                    category: "Support",
                                    description: "Friendly onboarding and quick answers when you need them.",
                                    color: "from-orange-500 to-orange-600"
                                }
                            ].map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    className="group text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 border border-white/10"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -5 }}
                                >
                                    <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        {item.icon}
                                    </div>
                                    <div className="text-sm text-gray-400 font-semibold mb-2 uppercase tracking-wide">{item.category}</div>
                                    <h3 className="text-xl font-bold mb-4 group-hover:text-white transition-colors">{item.title}</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section id="faq" className="py-24 bg-white/80 backdrop-blur-sm">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            className="text-center mb-20"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-xl text-gray-600">
                                Everything you need to know about Quantifore
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    question: "What is Quantifore?",
                                    answer: "A simple way to keep your important numbers in one place, understand what's changing, and see what might happen next."
                                },
                                {
                                    question: "Do I need technical skills?",
                                    answer: "No. If you can read a dashboard and click through a report, you're good to go."
                                },
                                {
                                    question: "Where do the numbers come from?",
                                    answer: "From the sources you already use—like regular reports or files—plus optional public data you choose to include."
                                },
                                {
                                    question: "Can my team collaborate?",
                                    answer: "Yes. Share views, add notes, and set alerts so everyone stays aligned."
                                },
                                {
                                    question: "Is my data secure?",
                                    answer: "Absolutely. We use enterprise-grade security and you control who sees what."
                                },
                                {
                                    question: "How quickly can I get started?",
                                    answer: "Most teams are up and running within a day. No complex setup required."
                                }
                            ].map((faq, index) => (
                                <motion.details
                                    key={faq.question}
                                    className="group bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <summary className="cursor-pointer p-8 list-none font-bold text-gray-900 group-open:border-b group-open:border-gray-200 flex items-center justify-between">
                                        {faq.question}
                                        <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform duration-300" />
                                    </summary>
                                    <div className="px-8 pb-8 text-gray-600 leading-relaxed">
                                        {faq.answer}
                                    </div>
                                </motion.details>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Clean Footer */}
            <footer className="border-t border-gray-200 py-16 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <motion.div
                            className="flex items-center mb-6 md:mb-0"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <img src="/qf-logo0.1.svg" alt="Quantifore logo" className="h-8 select-none" style={{ filter: 'contrast(200%) brightness(150%) invert(1) hue-rotate(180deg)' }} />

                        </motion.div>


                        <motion.div
                            className="text-center md:text-right text-gray-400"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <div className="mb-2">© {currentYear} Quantifore. All rights reserved.</div>
                            <div className="text-sm">Built for clarity, speed, and teamwork</div>
                        </motion.div>
                    </div>
                </div>
            </footer>
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={() => {
                    setShowLoginModal(false);
                    // Additional success actions can be added here if needed
                }}
            />
        </div>
    );
};

export default LandingPage;