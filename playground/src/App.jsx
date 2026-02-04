import { useState, useEffect } from 'react';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import CodeEditor from './components/CodeEditor';
import RightSidebar from './components/RightSidebar';

function App() {
  // Project settings
  const [projectName, setProjectName] = useState('My AI Website');
  const [urlInput, setUrlInput] = useState('');
  const [colorTheme, setColorTheme] = useState('Dark with Blue & Purple');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Ready to build');

  // Code editor state
  const [activeTab, setActiveTab] = useState('code');
  const [activeFile, setActiveFile] = useState('index.html');
  const [files, setFiles] = useState({
    'index.html': '<!-- Your generated code will appear here -->\n\n<!-- Click "Generate Website" to start building! -->',
    'styles.css': '/* Your CSS will appear here */',
    'script.js': '// Your JavaScript will appear here'
  });

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingCode, setStreamingCode] = useState('');

  // Learning mode
  const [explanations, setExplanations] = useState([]);

  // Recent builds
  const [recentBuilds, setRecentBuilds] = useState([]);

  // Load recent builds from localStorage (MongoDB integration can be added later)
  useEffect(() => {
    const saved = localStorage.getItem('recentBuilds');
    if (saved) {
      setRecentBuilds(JSON.parse(saved));
    }
  }, []);

  // Simulate typing animation
  const typeCode = async (fullCode, filename) => {
    setIsStreaming(true);
    setStreamingCode('');

    const words = fullCode.split('');
    for (let i = 0; i < words.length; i++) {
      if (isPaused) {
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!isPaused) {
              clearInterval(checkPause);
              resolve();
            }
          }, 100);
        });
      }

      setStreamingCode(prev => prev + words[i]);
      await new Promise(resolve => setTimeout(resolve, 10)); // Typing speed

      // Update progress
      const newProgress = Math.floor((i / words.length) * 100);
      setProgress(newProgress);
    }

    setFiles(prev => ({ ...prev, [filename]: fullCode }));
    setStreamingCode('');
    setIsStreaming(false);
  };

  // Generate sample website
  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setStatus('Generating HTML structure...');
    setExplanations([]);

    // Add initial explanation
    setTimeout(() => {
      setExplanations([{
        title: '🚀 Starting Generation',
        content: 'Creating a responsive website with Tailwind CSS. Each section will be explained as it\'s generated.'
      }]);
    }, 500);

    // Generate HTML
    const sampleHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <!-- Navbar -->
    <nav class="bg-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <h1 class="text-2xl font-bold text-blue-600">${projectName}</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="#" class="text-gray-700 hover:text-blue-600">Home</a>
                    <a href="#" class="text-gray-700 hover:text-blue-600">About</a>
                    <a href="#" class="text-gray-700 hover:text-blue-600">Contact</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <h2 class="text-5xl font-bold text-white mb-4">Welcome to ${projectName}</h2>
            <p class="text-xl text-white/90 mb-8">Built with AI-powered code generation</p>
            <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
                Get Started
            </button>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4">
            <h3 class="text-3xl font-bold text-center mb-12">Features</h3>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="p-6 bg-white rounded-lg shadow-md">
                    <h4 class="text-xl font-bold mb-2">Fast</h4>
                    <p class="text-gray-600">Lightning-fast performance and load times</p>
                </div>
                <div class="p-6 bg-white rounded-lg shadow-md">
                    <h4 class="text-xl font-bold mb-2">Responsive</h4>
                    <p class="text-gray-600">Works perfectly on all devices</p>
                </div>
                <div class="p-6 bg-white rounded-lg shadow-md">
                    <h4 class="text-xl font-bold mb-2">Modern</h4>
                    <p class="text-gray-600">Built with latest technologies</p>
                </div>
            </div>
        </div>
    </section>
</body>
</html>`;

    await typeCode(sampleHTML, 'index.html');

    // Add explanations after generation
    setTimeout(() => {
      setExplanations(prev => [...prev,
      {
        title: '📱 Responsive Navbar',
        content: 'Using Tailwind\'s flex utilities for a responsive navigation bar that adapts to screen sizes.',
        code: 'class="flex justify-between h-16"'
      },
      {
        title: '🎨 Gradient Hero',
        content: 'The hero section uses Tailwind\'s gradient utilities to create a vibrant background.',
        code: 'class="bg-gradient-to-r from-blue-500 to-purple-600"'
      },
      {
        title: '📦 Grid Layout',
        content: 'Features are displayed using CSS Grid with responsive columns (1 on mobile, 3 on desktop).',
        code: 'class="grid md:grid-cols-3 gap-8"'
      }
      ]);
    }, 1000);

    // Save to recent builds
    const newBuild = {
      projectName,
      html: sampleHTML,
      css: '',
      js: '',
      theme: colorTheme,
      sourceUrl: urlInput,
      createdAt: new Date().toISOString()
    };

    const updatedBuilds = [newBuild, ...recentBuilds.slice(0, 9)];
    setRecentBuilds(updatedBuilds);
    localStorage.setItem('recentBuilds', JSON.stringify(updatedBuilds));

    setStatus('Generation complete!');
    setProgress(100);
    setIsGenerating(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsGenerating(false);
    setIsStreaming(false);
    setIsPaused(false);
    setProgress(0);
    setStatus('Stopped');
  };

  const handleCodeChange = (filename, newCode) => {
    setFiles(prev => ({ ...prev, [filename]: newCode }));
  };

  const handleExport = () => {
    // Simple export - download HTML file
    const blob = new Blob([files['index.html']], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadBuild = (build) => {
    setProjectName(build.projectName);
    setFiles({
      'index.html': build.html,
      'styles.css': build.css || '',
      'script.js': build.js || ''
    });
    setColorTheme(build.theme);
    setUrlInput(build.sourceUrl || '');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header
        progress={progress}
        status={status}
        onExport={handleExport}
        canExport={files['index.html'].includes('<!DOCTYPE html>')}
      />

      <main className="pt-14 flex h-screen">
        <LeftSidebar
          projectName={projectName}
          setProjectName={setProjectName}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          colorTheme={colorTheme}
          setColorTheme={setColorTheme}
          onGenerate={handleGenerate}
          onPause={handlePause}
          onStop={handleStop}
          isGenerating={isGenerating}
          isPaused={isPaused}
        />

        <CodeEditor
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          files={files}
          activeFile={activeFile}
          setActiveFile={setActiveFile}
          onCodeChange={handleCodeChange}
          isStreaming={isStreaming}
          streamingCode={streamingCode}
        />

        <RightSidebar
          explanations={explanations}
          recentBuilds={recentBuilds}
          onLoadBuild={handleLoadBuild}
        />
      </main>
    </div>
  );
}

export default App;
