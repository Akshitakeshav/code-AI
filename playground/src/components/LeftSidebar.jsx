import { useState } from 'react';
import { Zap, Pause, Square, Globe } from 'lucide-react';

export default function LeftSidebar({
    projectName,
    setProjectName,
    urlInput,
    setUrlInput,
    colorTheme,
    setColorTheme,
    onGenerate,
    onPause,
    onStop,
    isGenerating,
    isPaused
}) {
    const themes = [
        'Dark with Blue & Purple',
        'Dark with Green & Cyan',
        'Light with Blue',
        'Light with Purple'
    ];

    return (
        <aside className="w-80 bg-[#12121a] border-r border-white/5 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5">
                <h2 className="text-white font-semibold mb-1">Project Settings</h2>
                <p className="text-gray-500 text-xs">Configure your website</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Project Name */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Project Name</label>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-white/10 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Enter project name"
                    />
                </div>

                {/* URL Input for AI Analysis */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">
                        <Globe className="w-4 h-4 inline mr-1" />
                        Analyze Website URL
                    </label>
                    <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-white/10 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="https://example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">AI will analyze and generate similar code</p>
                </div>

                {/* Color Theme */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Color Theme</label>
                    <select
                        value={colorTheme}
                        onChange={(e) => setColorTheme(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-white/10 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    >
                        {themes.map(theme => (
                            <option key={theme} value={theme}>{theme}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Generate Button */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="w-full py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-all animate-glow disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    <Zap className="w-5 h-5" />
                    <span>{isGenerating ? 'Generating...' : 'Generate Website'}</span>
                </button>

                <div className="flex items-center space-x-2 mt-3">
                    <button
                        onClick={onPause}
                        disabled={!isGenerating}
                        className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors flex items-center justify-center space-x-1"
                    >
                        <Pause className="w-4 h-4" />
                        <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                    <button
                        onClick={onStop}
                        disabled={!isGenerating}
                        className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors flex items-center justify-center space-x-1"
                    >
                        <Square className="w-4 h-4" />
                        <span>Stop</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
