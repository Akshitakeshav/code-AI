import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({
    activeTab,
    setActiveTab,
    files,
    activeFile,
    setActiveFile,
    onCodeChange,
    isStreaming,
    streamingCode
}) {
    const tabs = [
        { id: 'code', label: 'Generated Code' },
        { id: 'preview', label: 'Live Preview' },
        { id: 'split', label: 'Split View' }
    ];

    const fileExtensions = {
        'index.html': 'html',
        'styles.css': 'css',
        'script.js': 'javascript',
        'app.jsx': 'javascript',
        'main.py': 'python'
    };

    const getLanguage = (filename) => {
        return fileExtensions[filename] || 'html';
    };

    const currentCode = streamingCode || files[activeFile] || '';

    const renderPreview = () => {
        const html = files['index.html'] || '';
        const css = files['styles.css'] || '';
        const js = files['script.js'] || '';

        const previewDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>${css}</style>
      </head>
      <body class="bg-white">
        ${html}
        <script>${js}</script>
      </body>
      </html>
    `;
        return previewDoc;
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center border-b border-white/5 bg-[#12121a] px-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-white border-b-2 border-blue-500'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Code Panel */}
                {(activeTab === 'code' || activeTab === 'split') && (
                    <div className={`${activeTab === 'split' ? 'w-1/2' : 'w-full'} flex flex-col overflow-hidden`}>
                        {/* File Tabs */}
                        <div className="flex items-center space-x-2 px-4 py-2 bg-[#1e1e1e] border-b border-white/5">
                            {Object.keys(files).map(filename => (
                                <button
                                    key={filename}
                                    onClick={() => setActiveFile(filename)}
                                    className={`flex items-center space-x-2 px-3 py-1 rounded text-sm ${activeFile === filename
                                            ? 'bg-[#0a0a0f] text-white'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${filename.endsWith('.html') ? 'bg-orange-500' :
                                            filename.endsWith('.css') ? 'bg-blue-500' :
                                                filename.endsWith('.js') ? 'bg-yellow-500' :
                                                    filename.endsWith('.jsx') ? 'bg-cyan-500' :
                                                        'bg-green-500'
                                        }`} />
                                    <span>{filename}</span>
                                </button>
                            ))}
                        </div>

                        {/* Monaco Editor */}
                        <div className="flex-1 relative">
                            <Editor
                                height="100%"
                                language={getLanguage(activeFile)}
                                theme="vs-dark"
                                value={currentCode}
                                onChange={(value) => onCodeChange(activeFile, value)}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on',
                                    automaticLayout: true,
                                    readOnly: isStreaming
                                }}
                            />
                            {isStreaming && (
                                <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-[#12121a] px-3 py-1.5 rounded-lg border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs text-gray-400">AI is typing...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Preview Panel */}
                {(activeTab === 'preview' || activeTab === 'split') && (
                    <div className={`${activeTab === 'split' ? 'w-1/2 border-l border-white/5' : 'w-full'} overflow-hidden bg-white`}>
                        <iframe
                            srcDoc={renderPreview()}
                            className="w-full h-full"
                            title="Live Preview"
                            sandbox="allow-scripts"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
