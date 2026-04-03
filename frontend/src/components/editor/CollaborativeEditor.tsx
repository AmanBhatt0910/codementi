'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import type { editor } from 'monaco-editor';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { ChevronDown, Code2 } from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'sql', label: 'SQL' },
];

interface CollaborativeEditorProps {
  sessionId: string;
  userId: string;
  userName: string;
  initialContent: string;
  initialLanguage: string;
  onCodeChange: (content: string, language: string) => void;
}

export function CollaborativeEditor({
  sessionId,
  userId,
  userName,
  initialContent,
  initialLanguage,
  onCodeChange,
}: CollaborativeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [language, setLanguage] = useState(initialLanguage || 'javascript');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('off');

  // Initialize Yjs
  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Observe changes from Yjs to broadcast
    const yText = ydoc.getText('monaco');
    const observer = () => {
      if (isRemoteUpdateRef.current) return;
      const content = yText.toString();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onCodeChange(content, language);
      }, 500);
    };
    yText.observe(observer);

    return () => {
      yText.unobserve(observer);
      bindingRef.current?.destroy();
      ydoc.destroy();
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditorMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    const ydoc = ydocRef.current;
    if (!ydoc) return;

    const yText = ydoc.getText('monaco');

    // Set initial content
    if (initialContent && yText.toString() === '') {
      ydoc.transact(() => {
        yText.insert(0, initialContent);
      });
    }

    // Create binding
    const monacoModel = editorInstance.getModel();
    if (monacoModel) {
      bindingRef.current = new MonacoBinding(
        yText,
        monacoModel,
        new Set([editorInstance]),
        undefined
      );
    }

    // Editor settings
    editorInstance.updateOptions({
      fontSize: 14,
      fontFamily: "'DM Mono', 'Fira Code', monospace",
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'line',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      padding: { top: 16, bottom: 16 },
    });
  }, [initialContent]);

  // Apply remote code update
  const applyRemoteUpdate = useCallback((content: string) => {
    const ydoc = ydocRef.current;
    if (!ydoc || !content) return;
    const yText = ydoc.getText('monaco');
    if (yText.toString() === content) return;

    isRemoteUpdateRef.current = true;
    ydoc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, content);
    });
    isRemoteUpdateRef.current = false;
  }, []);

  // Expose remote update for parent via ref... handled in parent's onCode handler instead
  // The parent sets codeSnapshot.content, but the editor only uses it on mount
  // For live sync, onCodeChange broadcasts and applyRemoteUpdate is called externally

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setShowLangDropdown(false);
    onCodeChange(editorRef.current?.getValue() || '', lang);
  };

  const currentLang = LANGUAGES.find(l => l.id === language);

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-900 border-b border-white/6">
        <Code2 size={14} className="text-brand-400" />
        <span className="text-xs text-white/40 font-medium">Editor</span>

        <div className="flex-1" />

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 glass hover:bg-white/8 rounded-lg text-xs text-white/60 hover:text-white/90 transition-all border border-white/8"
          >
            {currentLang?.label || language}
            <ChevronDown size={11} className={`transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 top-full mt-1 w-40 glass-strong rounded-xl border border-white/12 shadow-2xl z-50 py-1 max-h-56 overflow-y-auto">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => handleLanguageChange(lang.id)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/8 ${
                    language === lang.id ? 'text-brand-300' : 'text-white/60'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setWordWrap(w => w === 'on' ? 'off' : 'on')}
          className={`px-2.5 py-1 rounded-lg text-xs transition-all border ${
            wordWrap === 'on'
              ? 'text-brand-300 bg-brand-500/15 border-brand-500/20'
              : 'glass hover:bg-white/8 text-white/40 border-white/8'
          }`}
        >
          Wrap
        </button>
      </div>

      {/* Monaco */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          language={language}
          theme="vs-dark"
          options={{
            wordWrap,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'DM Mono', 'Fira Code', monospace",
            lineHeight: 22,
            padding: { top: 16 },
            renderLineHighlight: 'line',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
          }}
          onMount={handleEditorMount}
        />
      </div>
    </div>
  );
}
