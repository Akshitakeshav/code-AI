import { BookOpen, Keyboard, Clock } from 'lucide-react';

export default function RightSidebar({ explanations, recentBuilds, onLoadBuild }) {
    return (
        <aside className="w-80 bg-[#12121a] border-l border-white/5 flex flex-col overflow-hidden">
            {/* Learning Mode Header */}
            <div className="p-4 border-b border-white/5">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-white font-semibold">Learning Mode</h2>
                        <p className="text-gray-500 text-xs">Understand every line</p>
                    </div>
                </div>
            </div>

            {/* Explanations Panel */}
            <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-400 leading-relaxed">
                <div className="space-y-4">
                    {explanations.length === 0 ? (
                        <div className="p-4 rounded-lg bg-[#0a0a0f] border border-white/5">
                            <h4 className="text-blue-400 font-medium mb-2">👋 Welcome!</h4>
                            <p>As your website is generated, explanations will appear here explaining:</p>
                            <ul className="mt-2 space-y-1 text-gray-500">
                                <li>• What each section does</li>
                                <li>• Why specific classes are used</li>
                                <li>• How responsiveness works</li>
                                <li>• Layout & design patterns</li>
                            </ul>
                        </div>
                    ) : (
                        explanations.map((exp, index) => (
                            <div key={index} className="p-4 rounded-lg bg-[#0a0a0f] border border-white/5">
                                <h4 className="text-purple-400 font-medium mb-2">{exp.title}</h4>
                                <p className="text-gray-400">{exp.content}</p>
                                {exp.code && (
                                    <pre className="mt-2 p-2 rounded bg-[#1e1e1e] text-xs font-mono text-green-400 overflow-x-auto">
                                        {exp.code}
                                    </pre>
                                )}
                            </div>
                        ))
                    )}

                    {/* Keyboard Shortcuts */}
                    <div className="p-4 rounded-lg bg-[#0a0a0f] border border-white/5">
                        <div className="flex items-center space-x-2 mb-2">
                            <Keyboard className="w-4 h-4 text-purple-400" />
                            <h4 className="text-purple-400 font-medium">Keyboard Shortcuts</h4>
                        </div>
                        <ul className="space-y-1 text-gray-500 text-xs">
                            <li><code className="bg-white/10 px-1 rounded">Ctrl+G</code> Generate</li>
                            <li><code className="bg-white/10 px-1 rounded">Ctrl+E</code> Export</li>
                            <li><code className="bg-white/10 px-1 rounded">Esc</code> Stop</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Recent Builds Section */}
            <div className="border-t border-white/5">
                <div className="p-4 border-b border-white/5 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <h3 className="text-white font-semibold text-sm">Recent Builds</h3>
                </div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                    {recentBuilds.length === 0 ? (
                        <p className="text-gray-500 text-xs text-center py-4">No history yet</p>
                    ) : (
                        recentBuilds.map((build, index) => (
                            <button
                                key={build._id || index}
                                onClick={() => onLoadBuild(build)}
                                className="w-full p-2 rounded-lg bg-[#0a0a0f] border border-white/5 hover:border-white/20 transition-colors text-left"
                            >
                                <p className="text-white text-sm font-medium truncate">{build.projectName}</p>
                                <p className="text-gray-500 text-xs">
                                    {new Date(build.createdAt).toLocaleDateString()}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}
