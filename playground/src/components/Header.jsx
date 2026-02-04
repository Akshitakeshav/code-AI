import { Download } from 'lucide-react';

export default function Header({ progress, status, onExport, canExport }) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center justify-between h-14 px-4">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">AI</span>
                    </div>
                    <span className="text-lg font-bold text-white">BuilderAI</span>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 max-w-md mx-8">
                    <div className="relative">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full gradient-bg transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-center">{status}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onExport}
                        disabled={!canExport}
                        className="px-4 py-1.5 rounded-lg bg-white/10 text-gray-400 text-sm font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export ZIP</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
