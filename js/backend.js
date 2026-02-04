/**
 * AI Website Builder - Backend Simulation
 * ========================================
 * This module simulates backend logic for the AI Website Builder.
 * Everything runs in the browser - no real server required.
 */

// ============================================
// STATE MANAGEMENT
// ============================================

const AppState = {
    currentProject: null,
    projects: [],
    history: [],
    isGenerating: false,
    isPaused: false,
    currentSection: 0,
    
    // Initialize state from localStorage
    init() {
        const savedHistory = localStorage.getItem('aibuilder_history');
        if (savedHistory) {
            this.history = JSON.parse(savedHistory);
        }
        const savedProjects = localStorage.getItem('aibuilder_projects');
        if (savedProjects) {
            this.projects = JSON.parse(savedProjects);
        }
    },
    
    // Save state to localStorage
    save() {
        localStorage.setItem('aibuilder_history', JSON.stringify(this.history));
        localStorage.setItem('aibuilder_projects', JSON.stringify(this.projects));
    },
    
    // Reset current generation
    reset() {
        this.isGenerating = false;
        this.isPaused = false;
        this.currentSection = 0;
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const Utils = {
    // Generate unique ID
    generateId() {
        return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Get current timestamp
    getTimestamp() {
        return new Date().toISOString();
    },
    
    // Simulate network delay
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Validate project input
    validateProjectInput(input) {
        const errors = [];
        if (!input.projectName || input.projectName.trim() === '') {
            errors.push('Project name is required');
        }
        if (!input.sections || input.sections.length === 0) {
            errors.push('At least one section is required');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
};

// ============================================
// SECTION TEMPLATES
// ============================================

const SectionTemplates = {
    // Hero Section Template
    hero: (config) => ({
        html: `
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <!-- Background Glow -->
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div class="inline-flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8">
                <span class="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                <span class="text-sm text-gray-400">${config.badge || 'Welcome'}</span>
            </div>
            
            <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                ${config.headline || 'Your Amazing Headline'}
                <span class="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"> Here</span>
            </h1>
            
            <p class="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10">
                ${config.subheadline || 'Add your compelling description here to engage visitors.'}
            </p>
            
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg hover:opacity-90 transition-all">
                    ${config.primaryCta || 'Get Started'}
                </a>
                <a href="#" class="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/5 transition-all">
                    ${config.secondaryCta || 'Learn More'}
                </a>
            </div>
        </div>
    </section>`,
        explanation: `
**Hero Section Breakdown:**

1. **min-h-screen** - Makes the hero take up the full viewport height for maximum impact
2. **flex items-center justify-center** - Centers content both vertically and horizontally
3. **bg-gradient-to-br** - Creates a diagonal gradient from top-left to bottom-right
4. **blur-3xl** - Creates soft, ambient glow effects in the background
5. **animate-pulse** - Adds a subtle pulsing animation to the status indicator
6. **bg-clip-text text-transparent** - Creates the gradient text effect on the headline
7. **flex-col sm:flex-row** - Buttons stack on mobile, sit side-by-side on larger screens

This hero establishes visual hierarchy and immediately communicates value to visitors.`
    }),

    // Navbar Template
    navbar: (config) => ({
        html: `
    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16 md:h-20">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <span class="text-white font-bold text-sm">${config.logoText || 'AI'}</span>
                    </div>
                    <span class="text-xl font-bold text-white">${config.brandName || 'Brand'}</span>
                </div>
                
                <div class="hidden md:flex items-center space-x-8">
                    ${(config.navLinks || ['Features', 'Pricing', 'About']).map(link => 
                        `<a href="#${link.toLowerCase()}" class="text-gray-400 hover:text-white transition-colors">${link}</a>`
                    ).join('\n                    ')}
                </div>
                
                <div class="flex items-center space-x-4">
                    <a href="#" class="hidden sm:inline-block text-gray-400 hover:text-white transition-colors">Sign In</a>
                    <a href="#" class="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity">
                        ${config.ctaText || 'Get Started'}
                    </a>
                </div>
            </div>
        </div>
    </nav>`,
        explanation: `
**Navbar Breakdown:**

1. **fixed top-0 z-50** - Keeps navbar fixed at top, always visible while scrolling
2. **bg-gray-900/80 backdrop-blur-md** - Semi-transparent background with blur = modern glass effect
3. **border-b border-white/5** - Subtle bottom border for visual separation
4. **hidden md:flex** - Navigation links hidden on mobile, visible on medium+ screens
5. **space-x-8** - Consistent 2rem spacing between nav links
6. **hover:text-white transition-colors** - Smooth color transition on hover

The navbar provides persistent navigation while maintaining the dark theme aesthetic.`
    }),

    // Features Grid Template
    features: (config) => ({
        html: `
    <!-- Features Section -->
    <section id="features" class="py-20 md:py-32 bg-gray-800/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <span class="inline-block px-4 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-4">
                    Features
                </span>
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                    ${config.title || 'Powerful Features'}
                </h2>
                <p class="text-gray-400 text-lg max-w-2xl mx-auto">
                    ${config.subtitle || 'Everything you need to succeed.'}
                </p>
            </div>
            
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                ${(config.features || [
                    { icon: '⚡', title: 'Fast', desc: 'Lightning quick performance' },
                    { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security' },
                    { icon: '📱', title: 'Responsive', desc: 'Works on all devices' }
                ]).map(f => `
                <div class="p-6 rounded-xl border border-white/5 bg-gray-900 hover:bg-gray-900/80 transition-colors">
                    <div class="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-2xl">
                        ${f.icon}
                    </div>
                    <h3 class="text-lg font-semibold text-white mb-2">${f.title}</h3>
                    <p class="text-gray-400 text-sm">${f.desc}</p>
                </div>`).join('')}
            </div>
        </div>
    </section>`,
        explanation: `
**Features Section Breakdown:**

1. **py-20 md:py-32** - Generous vertical padding; more on desktop for breathing room
2. **grid sm:grid-cols-2 lg:grid-cols-3** - 1 col mobile → 2 cols tablet → 3 cols desktop
3. **gap-6** - Consistent 1.5rem gap between cards
4. **border border-white/5** - Very subtle border (5% white opacity)
5. **hover:bg-gray-900/80** - Slight background change on hover for interactivity

The grid automatically adjusts based on screen size, ensuring optimal layout on all devices.`
    }),

    // CTA Section Template
    cta: (config) => ({
        html: `
    <!-- CTA Section -->
    <section class="py-20 md:py-32">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="relative rounded-3xl overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-90"></div>
                
                <div class="relative py-16 md:py-20 px-8 md:px-16 text-center">
                    <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                        ${config.headline || 'Ready to Get Started?'}
                    </h2>
                    <p class="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
                        ${config.subheadline || 'Join thousands of satisfied customers today.'}
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="#" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-blue-600 font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                            ${config.primaryCta || 'Start Free Trial'}
                        </a>
                        <a href="#" class="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-white text-white font-semibold text-lg hover:bg-white/10 transition-colors">
                            ${config.secondaryCta || 'Contact Sales'}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>`,
        explanation: `
**CTA Section Breakdown:**

1. **rounded-3xl overflow-hidden** - Large border radius with content clipping
2. **absolute inset-0** - Gradient fills the entire container as a background
3. **opacity-90** - Slightly transparent gradient for depth
4. **text-white/80** - 80% white opacity for subtitle (softer than headline)
5. **shadow-lg** - Drop shadow on primary button for depth and emphasis

This CTA section creates urgency and provides clear next-step actions for visitors.`
    }),

    // Footer Template
    footer: (config) => ({
        html: `
    <!-- Footer -->
    <footer class="py-16 border-t border-white/5 bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                <div class="lg:col-span-1">
                    <div class="flex items-center space-x-2 mb-4">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <span class="text-white font-bold text-sm">${config.logoText || 'AI'}</span>
                        </div>
                        <span class="text-xl font-bold text-white">${config.brandName || 'Brand'}</span>
                    </div>
                    <p class="text-gray-400 mb-6">
                        ${config.description || 'Building the future, one line at a time.'}
                    </p>
                </div>
                
                ${(config.columns || [
                    { title: 'Product', links: ['Features', 'Pricing', 'FAQ'] },
                    { title: 'Company', links: ['About', 'Blog', 'Careers'] },
                    { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] }
                ]).map(col => `
                <div>
                    <h4 class="text-white font-semibold mb-4">${col.title}</h4>
                    <ul class="space-y-3">
                        ${col.links.map(link => `<li><a href="#" class="text-gray-400 hover:text-white transition-colors">${link}</a></li>`).join('\n                        ')}
                    </ul>
                </div>`).join('')}
            </div>
            
            <div class="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <p class="text-gray-500 text-sm">© ${new Date().getFullYear()} ${config.brandName || 'Brand'}. All rights reserved.</p>
            </div>
        </div>
    </footer>`,
        explanation: `
**Footer Breakdown:**

1. **border-t border-white/5** - Subtle top border separates footer from content
2. **grid lg:grid-cols-4** - 4-column layout on large screens
3. **lg:col-span-1** - Brand column takes 1 of 4 columns
4. **space-y-3** - Consistent vertical spacing between links
5. **flex-col md:flex-row** - Copyright stacks on mobile, inline on desktop

The footer provides important navigation links and company information in a clean, organized layout.`
    }),

    // How It Works Template  
    howItWorks: (config) => ({
        html: `
    <!-- How It Works Section -->
    <section id="how-it-works" class="py-20 md:py-32">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <span class="inline-block px-4 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-4">
                    Process
                </span>
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                    ${config.title || 'How It Works'}
                </h2>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8">
                ${(config.steps || [
                    { num: '1', title: 'Step One', desc: 'Description here' },
                    { num: '2', title: 'Step Two', desc: 'Description here' },
                    { num: '3', title: 'Step Three', desc: 'Description here' }
                ]).map((step, i) => `
                <div class="relative p-8 rounded-2xl border border-white/10 bg-gray-800/50 hover:border-white/20 transition-all group">
                    <div class="w-14 h-14 rounded-xl bg-${['blue', 'purple', 'green'][i % 3]}-500/10 flex items-center justify-center mb-6">
                        <span class="text-2xl font-bold text-${['blue', 'purple', 'green'][i % 3]}-500">${step.num}</span>
                    </div>
                    <h3 class="text-xl font-semibold text-white mb-3">${step.title}</h3>
                    <p class="text-gray-400">${step.desc}</p>
                </div>`).join('')}
            </div>
        </div>
    </section>`,
        explanation: `
**How It Works Breakdown:**

1. **grid md:grid-cols-3** - 3 equal columns on medium+ screens
2. **rounded-2xl** - Large border radius for modern card look
3. **border-white/10 hover:border-white/20** - Border brightens on hover
4. **group** - Enables group-hover effects on child elements
5. Different colors per step (blue, purple, green) create visual variety

This section guides users through your process with clear, numbered steps.`
    }),

    // Testimonials Template
    testimonials: (config) => ({
        html: `
    <!-- Testimonials Section -->
    <section class="py-20 md:py-32 bg-gray-800/30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <span class="inline-block px-4 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium mb-4">
                    Testimonials
                </span>
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                    ${config.title || 'What People Say'}
                </h2>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${(config.testimonials || [
                    { quote: 'Amazing product!', author: 'John Doe', role: 'CEO' },
                    { quote: 'Highly recommend!', author: 'Jane Smith', role: 'Designer' },
                    { quote: 'Game changer!', author: 'Bob Wilson', role: 'Developer' }
                ]).map(t => `
                <div class="p-6 rounded-xl border border-white/5 bg-gray-900">
                    <p class="text-gray-300 mb-6">"${t.quote}"</p>
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        <div>
                            <p class="text-white font-medium">${t.author}</p>
                            <p class="text-gray-500 text-sm">${t.role}</p>
                        </div>
                    </div>
                </div>`).join('')}
            </div>
        </div>
    </section>`,
        explanation: `
**Testimonials Breakdown:**

1. **bg-gray-800/30** - Slightly different background for section separation
2. Responsive grid: 1 col → 2 cols → 3 cols
3. Quote styling with proper attribution
4. Avatar placeholder with gradient (replace with actual images)

Social proof builds trust and encourages conversions.`
    }),

    // Pricing Template
    pricing: (config) => ({
        html: `
    <!-- Pricing Section -->
    <section id="pricing" class="py-20 md:py-32">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <span class="inline-block px-4 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-4">
                    Pricing
                </span>
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                    ${config.title || 'Simple Pricing'}
                </h2>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                ${(config.plans || [
                    { name: 'Free', price: '$0', features: ['Feature 1', 'Feature 2'] },
                    { name: 'Pro', price: '$29', features: ['Everything in Free', 'Feature 3', 'Feature 4'], popular: true },
                    { name: 'Enterprise', price: '$99', features: ['Everything in Pro', 'Feature 5', 'Feature 6'] }
                ]).map(plan => `
                <div class="relative p-8 rounded-2xl border ${plan.popular ? 'border-purple-500 bg-gray-800' : 'border-white/10 bg-gray-900'}">
                    ${plan.popular ? '<span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">Most Popular</span>' : ''}
                    <h3 class="text-xl font-semibold text-white mb-2">${plan.name}</h3>
                    <p class="text-4xl font-bold text-white mb-6">${plan.price}<span class="text-lg text-gray-400">/mo</span></p>
                    <ul class="space-y-3 mb-8">
                        ${plan.features.map(f => `<li class="flex items-center text-gray-400"><svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>${f}</li>`).join('\n                        ')}
                    </ul>
                    <a href="#" class="block w-full py-3 text-center rounded-lg ${plan.popular ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'} font-medium transition-colors">
                        Get Started
                    </a>
                </div>`).join('')}
            </div>
        </div>
    </section>`,
        explanation: `
**Pricing Section Breakdown:**

1. **grid md:grid-cols-3** - 3 pricing tiers side by side on desktop
2. **max-w-5xl** - Constrained width for better readability
3. Popular plan has highlighted border and badge
4. Checkmark icons for feature lists
5. Different button styling for popular plan

Clear pricing builds trust and helps users make decisions quickly.`
    })
};

// ============================================
// API CONTROLLERS (SIMULATED)
// ============================================

const APIController = {
    // Create new project
    async createProject(payload) {
        const validation = Utils.validateProjectInput(payload);
        if (!validation.valid) {
            return {
                status: 'error',
                errors: validation.errors
            };
        }
        
        const project = {
            id: Utils.generateId(),
            ...payload,
            createdAt: Utils.getTimestamp(),
            status: 'created',
            generatedHTML: '',
            sections: []
        };
        
        AppState.currentProject = project;
        AppState.projects.push(project);
        AppState.save();
        
        return {
            status: 'success',
            projectId: project.id,
            message: 'Project created successfully'
        };
    },
    
    // Generate website with streaming
    async *generateWebsite(projectId, callbacks = {}) {
        const project = AppState.projects.find(p => p.id === projectId) || AppState.currentProject;
        
        if (!project) {
            yield {
                type: 'ERROR',
                message: 'Project not found'
            };
            return;
        }
        
        AppState.isGenerating = true;
        
        // Emit INIT event
        yield {
            type: 'INIT',
            data: {
                projectId: project.id,
                projectName: project.projectName,
                totalSections: project.sections.length
            }
        };
        
        await Utils.delay(500);
        
        // Generate each section
        for (let i = 0; i < project.sections.length; i++) {
            if (!AppState.isGenerating) break;
            
            while (AppState.isPaused) {
                await Utils.delay(100);
            }
            
            AppState.currentSection = i;
            const sectionName = project.sections[i].toLowerCase().replace(/\s+/g, '');
            const template = SectionTemplates[sectionName] || SectionTemplates.features;
            const generated = template({});
            
            // Emit SECTION_START
            yield {
                type: 'SECTION_START',
                data: {
                    index: i,
                    name: project.sections[i],
                    total: project.sections.length
                }
            };
            
            await Utils.delay(300);
            
            // Emit SECTION_HTML (stream in chunks for effect)
            const htmlChunks = generated.html.match(/.{1,100}/gs) || [];
            let fullHtml = '';
            
            for (const chunk of htmlChunks) {
                if (!AppState.isGenerating) break;
                fullHtml += chunk;
                
                yield {
                    type: 'SECTION_HTML',
                    data: {
                        chunk,
                        accumulated: fullHtml
                    }
                };
                
                await Utils.delay(20);
            }
            
            // Emit SECTION_EXPLANATION
            yield {
                type: 'SECTION_EXPLANATION',
                data: {
                    explanation: generated.explanation
                }
            };
            
            await Utils.delay(200);
            
            // Emit SECTION_END
            yield {
                type: 'SECTION_END',
                data: {
                    index: i,
                    name: project.sections[i],
                    html: generated.html,
                    explanation: generated.explanation
                }
            };
            
            // Store generated section
            project.generatedHTML += generated.html;
            project.generatedSections = project.generatedSections || [];
            project.generatedSections.push({
                name: project.sections[i],
                html: generated.html,
                explanation: generated.explanation
            });
        }
        
        AppState.isGenerating = false;
        
        // Emit COMPLETE
        yield {
            type: 'COMPLETE',
            data: {
                projectId: project.id,
                totalSections: project.sections.length,
                fullHTML: this.getCompleteHTML(project)
            }
        };
        
        // Save to history
        this.saveToHistory(project);
    },
    
    // Get complete HTML document
    getCompleteHTML(project) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.projectName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-900 text-gray-100 antialiased">
    ${project.generatedHTML}
</body>
</html>`;
    },
    
    // Pause generation
    pauseGeneration() {
        AppState.isPaused = true;
        return { status: 'paused' };
    },
    
    // Resume generation
    resumeGeneration() {
        AppState.isPaused = false;
        return { status: 'resumed' };
    },
    
    // Stop generation
    stopGeneration() {
        AppState.isGenerating = false;
        AppState.isPaused = false;
        return { status: 'stopped' };
    },
    
    // Save to history
    saveToHistory(project) {
        const historyEntry = {
            id: Utils.generateId(),
            projectId: project.id,
            projectName: project.projectName,
            sections: project.sections,
            html: project.generatedHTML,
            createdAt: Utils.getTimestamp()
        };
        
        AppState.history.unshift(historyEntry);
        if (AppState.history.length > 50) {
            AppState.history = AppState.history.slice(0, 50);
        }
        AppState.save();
        
        return historyEntry;
    },
    
    // Get history
    getHistory() {
        return {
            status: 'success',
            history: AppState.history
        };
    },
    
    // Clear history
    clearHistory() {
        AppState.history = [];
        AppState.save();
        return { status: 'success', message: 'History cleared' };
    },
    
    // Delete history item
    deleteHistoryItem(id) {
        AppState.history = AppState.history.filter(h => h.id !== id);
        AppState.save();
        return { status: 'success' };
    },
    
    // Export as ZIP
    async exportZip(projectId) {
        const project = AppState.projects.find(p => p.id === projectId) || AppState.currentProject;
        
        if (!project) {
            return { status: 'error', message: 'Project not found' };
        }
        
        // This would use JSZip in actual implementation
        const files = {
            'index.html': this.getCompleteHTML(project),
            'README.md': `# ${project.projectName}

Generated by AI Website Builder

## Sections
${project.sections.map(s => `- ${s}`).join('\n')}

## Usage
Simply open index.html in your browser.

## Customization
Edit the Tailwind classes to customize the design.
`
        };
        
        return {
            status: 'success',
            files,
            filename: `${project.projectName.toLowerCase().replace(/\s+/g, '-')}.zip`
        };
    }
};

// ============================================
// EVENT EMITTER (Simple Implementation)
// ============================================

class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

// ============================================
// MAIN BACKEND INTERFACE
// ============================================

const AIWebsiteBuilder = {
    state: AppState,
    api: APIController,
    templates: SectionTemplates,
    utils: Utils,
    events: new EventEmitter(),
    
    // Initialize the backend
    init() {
        AppState.init();
        console.log('🚀 AI Website Builder Backend Initialized');
        return this;
    },
    
    // Create and generate a website
    async buildWebsite(config) {
        // Create project
        const createResult = await this.api.createProject(config);
        if (createResult.status === 'error') {
            return createResult;
        }
        
        // Generate with streaming
        const generator = this.api.generateWebsite(createResult.projectId);
        const results = [];
        
        for await (const event of generator) {
            this.events.emit(event.type, event.data);
            this.events.emit('STREAM', event);
            results.push(event);
        }
        
        return {
            status: 'success',
            projectId: createResult.projectId,
            events: results
        };
    },
    
    // Quick build helper
    async quickBuild(sections = ['navbar', 'hero', 'features', 'cta', 'footer']) {
        return this.buildWebsite({
            projectName: 'Quick Build Project',
            theme: 'SaaS Landing',
            sections,
            colorTheme: 'Dark with blue & purple'
        });
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.AIWebsiteBuilder = AIWebsiteBuilder.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIWebsiteBuilder;
}
