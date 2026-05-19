import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  const messages = [
    {
      id: 1,
      guest: "Sarah Chen — Room 205",
      message: "The WiFi password isn't working",
      aiResponse: "I apologize for the WiFi issue. I've reset your connection and the password is: Hotel2024Guest. You should be connected within 2 minutes.",
      task: "WiFi Reset — Room 205 — Tech Team Notified",
      status: "Resolved",
      time: "2 minutes ago"
    },
    {
      id: 2,
      guest: "Marcus Johnson — Suite 312",
      message: "Can we get extra towels and late checkout?",
      aiResponse: "Of course! I've arranged for housekeeping to bring extra towels within 15 minutes. I've also approved late checkout until 2 PM at no charge.",
      task: "Housekeeping — Extra Towels — Suite 312 | Front Desk — Late Checkout Approved",
      status: "In Progress",
      time: "8 minutes ago"
    }
  ];

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--cream)' }}>
      {/* Header */}
      <motion.header 
        className="mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 
            className="text-5xl bodoni"
            style={{ color: 'var(--charcoal)', fontWeight: 400 }}
          >
            Guest Communications
          </h1>
          <Link href="/">
            <button 
              className="px-6 py-3 border transition-all duration-300 hover:scale-105"
              style={{ 
                borderColor: 'var(--stone-dark)',
                color: 'var(--charcoal)'
              }}
            >
              ← Back to Home
            </button>
          </Link>
        </div>
        <p className="font-light text-lg" style={{ color: 'var(--stone)' }}>
          Intelligent responses. Automatic operations.
        </p>
      </motion.header>
      
      {/* Stats */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {[
          { label: "Today", value: "Active" },
          { label: "Response", value: "Instant" },
          { label: "Tasks", value: "Auto" },
          { label: "Intelligence", value: "AI" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            className="group bg-white p-8 border transition-all duration-500 hover:scale-105 hover:shadow-lg cursor-pointer"
            style={{ borderColor: 'var(--stone-light)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
            whileHover={{ borderColor: 'var(--accent)' }}
          >
            {isLoading ? (
              <div className="loading-shimmer h-16 w-full rounded" />
            ) : (
              <>
                <div 
                  className="text-3xl mb-2 bodoni transition-all duration-300"
                  style={{ color: 'var(--charcoal)' }}
                >
                  {stat.value}
                </div>
                <div 
                  className="font-light transition-all duration-300"
                  style={{ color: 'var(--stone)' }}
                >
                  {stat.label}
                </div>
              </>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Messages */}
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {messages.map((msg, i) => (
          <motion.div 
            key={msg.id}
            className="group bg-white p-10 border transition-all duration-500 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
            style={{ borderColor: 'var(--stone-light)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 + i * 0.2 }}
            whileHover={{ borderColor: 'var(--accent)' }}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 
                  className="text-xl mb-2 bodoni transition-all duration-300"
                  style={{ color: 'var(--charcoal)' }}
                >
                  {msg.guest}
                </h3>
                <p className="font-light" style={{ color: 'var(--stone)' }}>
                  {msg.time}
                </p>
              </div>
              <span 
                className={`px-4 py-2 text-sm font-light tracking-wide transition-all duration-300 ${
                  msg.status === 'Resolved' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {msg.status}
              </span>
            </div>
            
            <div className="space-y-6">
              <p className="font-light text-lg" style={{ color: 'var(--charcoal)' }}>
                <span className="font-medium">Guest:</span> "{msg.message}"
              </p>
              <div 
                className="p-6 border-l-4 transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--cream)', 
                  borderColor: 'var(--accent)' 
                }}
              >
                <p className="font-light" style={{ color: 'var(--charcoal)' }}>
                  <span className="font-medium">AI Response:</span> "{msg.aiResponse}"
                </p>
              </div>
              <p className="font-light" style={{ color: 'var(--stone)' }}>
                <span className="font-medium" style={{ color: 'var(--charcoal)' }}>
                  Task Created:
                </span> {msg.task}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Try Demo Section */}
      <motion.div 
        className="mt-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <h2 
          className="text-3xl mb-6 bodoni"
          style={{ color: 'var(--charcoal)' }}
        >
          Try the AI Assistant
        </h2>
        <LiveDemo />
      </motion.div>
    </div>
  );
}

// Simple AI Demo Component
function LiveDemo() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const responses: Record<string, { response: string; task: string }> = {
      'wifi': {
        response: "I apologize for the WiFi issue. I've reset your connection and the password is: Hotel2024Guest. Our tech team has been notified.",
        task: "Tech Support — WiFi Reset — Room 205"
      },
      'towel': {
        response: "Of course! I've requested housekeeping to bring extra towels to your room within 15 minutes.",
        task: "Housekeeping — Extra Towels — Room 205"
      },
      'checkout': {
        response: "Checkout is at 11 AM, but I can arrange a late checkout until 2 PM at no charge. Your bill will be ready at the front desk.",
        task: "Front Desk — Late Checkout Approved — Room 205"
      }
    };
    
    const keyword = Object.keys(responses).find(k => message.toLowerCase().includes(k));
    const result = keyword
      ? responses[keyword]
      : {
          response: "Thank you for your message. I've forwarded this to our staff and someone will assist you shortly.",
          task: "General Request — Staff Follow-up Required"
        };
    
    setResponse(result.response);
    setTask(result.task);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-4">
        <textarea 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-4 border font-light"
          style={{ borderColor: 'var(--stone-light)' }}
          rows={3}
          placeholder="Try: 'The WiFi isn't working' or 'Can I get extra towels?'"
        />
        
        <button 
          onClick={handleSubmit}
          disabled={!message.trim() || loading}
          className="px-8 py-4 transition-all duration-300 hover:scale-105 disabled:opacity-50"
          style={{ 
            backgroundColor: 'var(--charcoal)', 
            color: 'var(--cream)' 
          }}
        >
          {loading ? 'AI Processing...' : 'Generate AI Response'}
        </button>
        
        {response && (
          <motion.div 
            className="space-y-4 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div 
              className="p-6 border-l-4"
              style={{ 
                backgroundColor: 'var(--cream)', 
                borderColor: 'var(--accent)' 
              }}
            >
              <h3 className="font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                AI Response:
              </h3>
              <p className="font-light" style={{ color: 'var(--charcoal)' }}>
                "{response}"
              </p>
            </div>
            
            <div className="p-6 bg-white border" style={{ borderColor: 'var(--stone-light)' }}>
              <h3 className="font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                Task Created:
              </h3>
              <p className="font-light" style={{ color: 'var(--stone)' }}>
                {task}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}