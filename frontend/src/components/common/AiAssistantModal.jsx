import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Sparkles, Send, Bot, User } from 'lucide-react';

export const AiAssistantModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Milestone 2 forecasting and customer segmentation are now connected. I can explain the live analytics and the features planned for Milestone 3.'
    }
  ]);

  const presetPrompts = [
    'Predict August 2026 revenue trends',
    'Which SKUs need reordering today?',
    'Show high churn risk accounts',
    'Suggest price optimization strategy'
  ];

  const handleSend = (userText) => {
    const textToSend = userText || query;
    if (!textToSend.trim()) return;

    setChatHistory(prev => [...prev, { sender: 'user', text: textToSend }]);
    setQuery('');
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      let aiResponse = 'Based on current POS transaction data, July sales exceed baseline by +18.4%. Reordering thermal receipt paper now prevents potential Q3 fulfillment bottlenecks.';
      if (textToSend.includes('August') || textToSend.includes('revenue')) {
        aiResponse = 'Revenue forecasting is live in Reports & Forecasts. It uses historical INR sales and provides 7, 14 and 30-day predictions with confidence ranges.';
      } else if (textToSend.includes('SKU') || textToSend.includes('reorder')) {
        aiResponse = 'Urgent action: SKU-902 (Thermal Receipt Paper) is down to 4 units. Reordering 50 units today ensures 0 stockout days.';
      } else if (textToSend.includes('churn') || textToSend.includes('risk')) {
        aiResponse = 'Planned for Milestone 3: churn scoring will identify retention risk after the model is trained and validated.';
      }

      setChatHistory(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MarketMind AI Assistant • Planned for Milestone 2/3"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Preset Prompts */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suggested Prompts:</span>
          {presetPrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSend(p)}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-xs hover:bg-indigo-100 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Stream Window */}
        <div className="h-72 overflow-y-auto space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-xs'
                }`}
              >
                {msg.text}
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-indigo-500 font-medium animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Preparing milestone feature information...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            id="aiQueryInput"
            placeholder="Ask about planned AI analytics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" variant="primary" icon={Send} isLoading={isThinking}>
            Send
          </Button>
        </form>
      </div>
    </Modal>
  );
};
