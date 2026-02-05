'use client';

import { useEffect, useState } from 'react';

export default function SkillPage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/skill.md')
      .then(res => res.text())
      .then(text => {
        // Simple markdown to HTML conversion
        const html = text
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
          .replace(/\*(.*)\*/gim, '<em>$1</em>')
          .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
          .replace(/`([^`]+)`/gim, '<code>$1</code>')
          .replace(/^- (.*$)/gim, '<li>$1</li>')
          .replace(/\n/gim, '<br>');
        setContent(html);
      });
  }, []);

  return (
    <div className="min-h-screen bg-scroll-paper p-8">
      <div 
        className="prose prose-slate max-w-4xl mx-auto text-ink-black"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </div>
  );
}
