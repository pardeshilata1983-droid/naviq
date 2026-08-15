import React, { useState } from 'react';

interface LandingProps {
  onGetStarted: () => void;
  onRunDemo: () => void;
  onSignIn: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onRunDemo, onSignIn }) => {
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (inputText.trim()) {
      onGetStarted();
    } else {
      onGetStarted();
    }
  };

  return (
    <div className="landing-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');

        .landing-wrapper {
            background-color: #111113;
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            -webkit-font-smoothing: antialiased;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 100;
        }

        .landing-wrapper * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        /* Ambient background orbs */
        .landing-wrapper .orb {
            position: absolute;
            width: 600px;
            height: 600px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
            filter: blur(80px);
            z-index: 0;
        }
        .landing-wrapper .orb-1 { top: -200px; right: -200px; }
        .landing-wrapper .orb-2 { bottom: -200px; left: -200px; }

        .landing-wrapper header {
            position: relative;
            z-index: 10;
            padding: 1.5rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .landing-wrapper .logo {
            font-family: 'Syne', sans-serif;
            font-weight: 800;
            letter-spacing: 0.1em;
            font-size: 1.2rem;
            text-transform: uppercase;
        }

        .landing-wrapper .top-nav {
            display: flex;
            gap: 1.5rem;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .landing-wrapper .top-nav a {
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            transition: color 0.2s;
        }

        .landing-wrapper .top-nav a:hover {
            color: #ffffff;
        }

        .landing-wrapper main {
            position: relative;
            z-index: 10;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0 2rem;
        }

        .landing-wrapper .hero-text {
            text-align: center;
            max-width: 900px;
            margin-bottom: 4rem;
        }

        .landing-wrapper h1 {
            font-family: 'Syne', sans-serif;
            font-weight: 800;
            font-size: clamp(2.5rem, 5vw, 4.5rem);
            line-height: 1.1;
            letter-spacing: -0.04em;
            margin-bottom: 1.5rem;
            background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.4) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .landing-wrapper .hero-desc {
            font-size: 1.1rem;
            color: rgba(255, 255, 255, 0.5);
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
        }

        .landing-wrapper .composer-shell {
            width: 100%;
            max-width: 750px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 2rem;
            backdrop-filter: blur(20px);
            box-shadow: 0 24px 48px rgba(0,0,0,0.4);
        }

        .landing-wrapper .input-wrap {
            position: relative;
            margin-bottom: 1.5rem;
        }

        .landing-wrapper textarea {
            width: 100%;
            background: transparent;
            border: none;
            color: #ffffff;
            font-family: inherit;
            font-size: 1.25rem;
            outline: none;
            resize: none;
            min-height: 80px;
        }

        .landing-wrapper .tags-row {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            overflow-x: auto;
            padding-bottom: 0.5rem;
        }

        .landing-wrapper .tag-btn {
            white-space: nowrap;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.5);
            padding: 0.5rem 1rem;
            border-radius: 99px;
            font-size: 0.7rem;
            cursor: pointer;
            font-family: 'JetBrains Mono', monospace;
        }

        .landing-wrapper .tag-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }

        .landing-wrapper .shell-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .landing-wrapper .meta-text {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.65rem;
            color: #10b981;
            text-transform: uppercase;
        }

        .landing-wrapper .send-btn {
            background: #10b981;
            color: #000;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .landing-wrapper .send-btn:hover {
            transform: scale(1.02);
        }

        .landing-wrapper footer {
            position: relative;
            z-index: 10;
            padding: 2rem;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .landing-wrapper .panel-title {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .landing-wrapper .dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; }

        .landing-wrapper .empty-content {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .landing-wrapper ::selection { background: #10b981; color: #000; }
        
        @media (max-width: 768px) {
            .landing-wrapper h1 {
                font-size: 2.5rem;
            }
            .landing-wrapper footer {
                grid-template-columns: 1fr;
            }
            .landing-wrapper .top-nav {
                display: none;
            }
        }
      `}</style>

      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      <header>
          <div className="logo" onClick={onGetStarted} style={{ cursor: 'pointer' }}>NAVIQ</div>
          <nav className="top-nav">
              <a href="#" onClick={(e) => { e.preventDefault(); onSignIn(); }}>Agent</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onSignIn(); }}>Customers</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onSignIn(); }}>Issues</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onSignIn(); }}>Meeting Logs</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onSignIn(); }}>Settings</a>
          </nav>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', cursor: 'pointer' }} onClick={onSignIn}>
              [NU] Naviq User
          </div>
      </header>

      <main>
          <div className="hero-text">
              <h1>Navigate every customer conversation.</h1>
              <p className="hero-desc">Ask Naviq anything about your customers. It investigates your account data, finds what matters, and tells you what to do next.</p>
          </div>

          <div className="composer-shell">
              <div className="input-wrap">
                  <textarea 
                      placeholder="How can I assist your workflow?"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                  ></textarea>
              </div>
              <div className="tags-row">
                  <button className="tag-btn" onClick={() => setInputText("What customers are at risk?")}>What customers are at risk?</button>
                  <button className="tag-btn" onClick={() => setInputText("Show me Meridian AgriTech")}>Show Meridian AgriTech</button>
                  <button className="tag-btn" onClick={() => setInputText("Any feature requests linked to high ARR?")}>High ARR features</button>
                  <button className="tag-btn" onClick={() => setInputText("Prepare me for my meeting with Nexus")}>Prepare Nexus meeting</button>
                  <button className="tag-btn" onClick={() => setInputText("What are today's open tasks?")}>Open tasks</button>
                  <button className="tag-btn" onClick={() => setInputText("Check recent issues")}>Recent issues</button>
              </div>
              <div className="shell-footer">
                  <div className="meta-text">// DATA_INTEGRITY_VERIFIED</div>
                  <button className="send-btn" onClick={handleSend}>Send Inquiry</button>
              </div>
          </div>
      </main>

      <footer>
          <div>
              <h3 className="panel-title"><div className="dot"></div> Recent Conversations</h3>
              <p className="empty-content">No activity logs found in the current session.</p>
          </div>
          <div>
              <h3 className="panel-title"><div className="dot"></div> Active Fixes</h3>
              <p className="empty-content">Digital friction zero. All pipelines operating normally.</p>
          </div>
      </footer>
    </div>
  );
};
