import React from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useTheme } from '../../theme/ThemeContext';

function CodeEditor({ value, onChange, language = 'cpp', height = '300px', showLabel = true }) {
  const { theme } = useTheme();
  return (
    <div style={{ width: '100%', height: showLabel ? undefined : height, minHeight: 0 }}>
      {showLabel && (
        <label style={{
          display: 'block',
          marginBottom: 6,
          fontWeight: 500,
          color: 'var(--tx-888888)',
          fontSize: '1rem'
        }}>
          {language.toUpperCase()} Code
        </label>
      )}
      <MonacoEditor
        height={showLabel ? height : '100%'}
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
        options={{
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          fontFamily: 'Fira Mono, Consolas, monospace',
          automaticLayout: true,
          padding: { top: 10 },
          tabSize: 4,
        }}
      />
    </div>
  );
}

export default CodeEditor;
