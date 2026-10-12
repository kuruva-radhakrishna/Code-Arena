import React from 'react';
import MonacoEditor from '@monaco-editor/react';

function CodeEditor({ value, onChange, language = 'cpp', height = '300px', showLabel = true }) {
  return (
    <div style={{ width: '100%', height: showLabel ? undefined : height, minHeight: 0 }}>
      {showLabel && (
        <label style={{
          display: 'block',
          marginBottom: 6,
          fontWeight: 500,
          color: '#888',
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
        theme="vs-light"
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
