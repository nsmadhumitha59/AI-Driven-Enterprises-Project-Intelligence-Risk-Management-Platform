import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';

const QUICK_PROMPTS = [
  'Are we on track?',
  'What are our biggest risks?',
  'Which milestones are delayed?',
  'What are the current blockers?',
  'What actions are pending?',
  'Who is responsible for each task?',
  'What is the overall project health?',
  'Which dependencies are unresolved?',
];

export default function ChatAssistantView() {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "👋 Hello! I am your AI Project Intelligence Assistant. I am grounded in your indexed project documents, risks, scope, and deliverables. Ask me any question about project status, risks, blockers, or milestones.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const chatBottomRef = useRef(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build lightweight session history for context
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await sendChatMessage(query, conversationId, historyPayload);
      if (res.conversation_id && !conversationId) {
        setConversationId(res.conversation_id);
      }

      const botMsg = {
        sender: 'assistant',
        text: res.answer || res.response || 'No relevant information could be retrieved from the current project documents.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources || res.grounding_sources || res.source_references || [],
        confidence: res.confidence,
        intent: res.detected_intent,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = {
        sender: 'assistant',
        text: `⚠️ Error retrieving answer: ${err.message || 'Unable to connect to RAG assistant backend.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: [],
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: "Conversation reset. How can I assist you with your project intelligence today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: [],
      },
    ]);
  };

  return (
    <div className="chat-assistant-view card-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: '680px' }}>
      {/* 1. Chat Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🤖</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#ffffff' }}>
              Conversational Project Intelligence Assistant
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Document-grounded RAG assistant with verified citations and zero hallucinated project facts
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={handleClearChat}
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          🗑️ Clear Conversation
        </button>
      </div>

      {/* 2. Suggested Prompts Chips Bar */}
      <div style={{ marginBottom: '14px' }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
          Suggested Project Intelligence Inquiries:
        </span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                color: '#c7d2fe',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '0.76rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Messages Scroll Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.45)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '100%',
            }}
          >
            <div
              style={{
                maxWidth: '82%',
                background: m.sender === 'user'
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'rgba(30, 41, 59, 0.85)',
                color: '#ffffff',
                border: m.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                padding: '12px 16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '14px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: m.sender === 'user' ? '#e0e7ff' : 'var(--primary)' }}>
                  {m.sender === 'user' ? 'You' : 'Project Intelligence Assistant'}
                </span>
                <span style={{ fontSize: '0.68rem', color: m.sender === 'user' ? '#c7d2fe' : 'var(--text-dim)' }}>
                  {m.timestamp}
                </span>
              </div>

              <div style={{ fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {m.text}
              </div>

              {/* Source Document Citations */}
              {m.sources && m.sources.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    📚 Verified Grounding Sources:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {m.sources.map((src, sIdx) => {
                      const docName = typeof src === 'string' ? src : (src.document_name || src.source || src.doc_id || 'Document');
                      const excerpt = typeof src === 'object' ? src.snippet || src.excerpt || '' : '';
                      return (
                        <span
                          key={sIdx}
                          title={excerpt}
                          style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#86efac',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                          }}
                        >
                          📄 {docName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontSize: '0.84rem', padding: '8px 12px' }}>
            <div className="dashboard-spinner" style={{ fontSize: '1.2rem' }}>⚙️</div>
            <span>Searching vector knowledge base &amp; evaluating project evidence...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 4. Input Area */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Ask a question about project health, schedule risks, blockers, or owners..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isLoading}
          style={{ flex: 1, padding: '12px 16px', fontSize: '0.9rem' }}
        />
        <button
          className="btn-primary"
          onClick={() => handleSend()}
          disabled={isLoading || !inputText.trim()}
          style={{ padding: '12px 24px', fontSize: '0.9rem' }}
        >
          {isLoading ? 'Thinking...' : 'Send 🚀'}
        </button>
      </div>
    </div>
  );
}
