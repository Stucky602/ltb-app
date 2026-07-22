import React from 'react';
import { copyText } from '../utils.js';

// One malformed record used to take the whole PWA down with it: a render throw
// unmounts the entire tree, so a single bad order could blank every tab with
// the business behind it. Two shapes:
//   full    — wraps the app, so a crash shows something honest and recoverable
//   compact — wraps ONE list item, so a bad record quarantines itself and the
//             rest of the list keeps working
// Nothing here touches storage. The data is on the device either way, and
// saying so is the first thing a person needs to read when a screen breaks.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Console only. There is no error service to call, and the app is offline
    // half the time it matters.
    console.error('[ErrorBoundary]', this.props.label || 'app', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const msg = (error && error.message) || String(error);

    if (this.props.compact) {
      return (
        <div style={{
          border: '1px solid #EF9F27', borderRadius: 10, padding: 10, marginBottom: 8,
          background: 'rgba(239,159,39,0.06)',
        }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#EF9F27', marginBottom: 4 }}>
            This one would not render
          </div>
          <div style={{ fontSize: 11.5, color: '#9aa5a0', marginBottom: 6 }}>
            {this.props.label ? this.props.label + ' · ' : ''}{msg}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {this.props.raw ? (
              <button
                onClick={() => copyText(JSON.stringify(this.props.raw, null, 2))}
                style={{
                  padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                  background: 'transparent', color: '#e8ede9', border: '1px solid #3a4441',
                }}
              >
                Copy raw record
              </button>
            ) : null}
            <button
              onClick={() => this.setState({ error: null })}
              style={{
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                background: 'transparent', color: '#e8ede9', border: '1px solid #3a4441',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: 20, maxWidth: 560, margin: '0 auto' }}>
        <div style={{
          border: '1px solid #EF9F27', borderRadius: 12, padding: 16,
          background: 'rgba(239,159,39,0.06)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#EF9F27', marginBottom: 8 }}>
            Something broke while drawing this screen
          </div>
          <div style={{ fontSize: 13, color: '#c9d1cd', lineHeight: 1.55, marginBottom: 10 }}>
            Your data is fine. Everything lives in this device's storage and none of it
            was touched by this error. Reloading usually clears it.
          </div>
          <div style={{
            fontSize: 11.5, color: '#9aa5a0', fontFamily: 'monospace',
            background: '#1a201d', borderRadius: 6, padding: 8, marginBottom: 12,
            wordBreak: 'break-word',
          }}>
            {msg}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
                background: '#2f6f57', color: '#fff', border: 'none', fontSize: 13,
              }}
            >
              Reload
            </button>
            <button
              onClick={() => copyText(msg)}
              style={{
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', color: '#e8ede9', border: '1px solid #3a4441', fontSize: 13,
              }}
            >
              Copy error
            </button>
          </div>
        </div>
      </div>
    );
  }
}
