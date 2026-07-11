import React, { useState, useRef, useCallback } from 'react';
import { parseVoiceCommand } from '../voiceCommands.js';
import { ALL_DINNERS } from '../menu.js';
import { ALL_ALWAYS_ITEMS } from '../dishes.js';

const C = { panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0', good: '#5DCAA5', warn: '#EF9F27', bad: '#e0828a' };

// #17 Hands-free kitchen mode. Speech-to-text runs ON DEVICE via the browser's
// SpeechRecognition (free, zero tokens); commands parse deterministically
// (zero tokens); unparsed commands get an honest "didn't catch that", never a
// guess. Status flips + counts auto-apply with a spoken-style toast; add-item
// applies for single-variant items and defers dinners (variant choice) and
// per-lb items (weighing) to the edit screen, because voice should never
// invent a price.
export function VoiceMode({ orders, onUpdate, onAddItem, onArchiveDelivered }) {
  const [state, setState] = useState('idle'); // idle | listening | result
  const [msg, setMsg] = useState(null);       // { text, tone }
  const recRef = useRef(null);

  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const finish = useCallback((text, tone) => {
    setMsg({ text, tone: tone || 'ok' });
    setState('result');
    setTimeout(() => { setState('idle'); setMsg(null); }, 4500);
  }, []);

  const execute = useCallback((action) => {
    switch (action.kind) {
      case 'update':
        onUpdate(action.orderId, action.patch);
        return finish(action.say, 'ok');
      case 'count':
        return finish(action.say, 'ok');
      case 'archiveDelivered':
        onArchiveDelivered();
        return finish('Delivered orders archived', 'ok');
      case 'addItem': {
        const dinner = ALL_DINNERS.find(d => d.name === action.item);
        if (dinner) return finish(`${action.item} has size options. Use the edit screen for dinners.`, 'warn');
        const item = ALL_ALWAYS_ITEMS.find(i => i.name === action.item);
        if (!item) return finish(`Couldn't find ${action.item} on the menu.`, 'warn');
        if (item.perLb) return finish(`${action.item} is priced by weight. Use the edit screen so it can be weighed.`, 'warn');
        const v = (item.variants || [])[0];
        if (!v || (item.variants || []).length !== 1) return finish(`${action.item} has options. Use the edit screen.`, 'warn');
        onAddItem(action.orderId, { name: action.item, variant: v.label, qty: action.qty, price: v.price, cost: v.cost });
        return finish(`${action.say} (${v.label})`, 'ok');
      }
      case 'ambiguous':
        return finish(`More than one match: ${action.names.join(', ')}. Say the full name.`, 'warn');
      case 'noMatch':
        return finish(`Couldn't find "${action.name}". Say it again?`, 'warn');
      default:
        return finish(`Heard: "${action.transcript}". Didn't catch a command. Try "mark Frances delivered" or "how many gumbo left".`, 'warn');
    }
  }, [onUpdate, onAddItem, onArchiveDelivered, finish]);

  const start = useCallback(() => {
    if (!SR) return finish('Voice needs Safari or Chrome with speech support.', 'warn');
    const rec = new SR();
    recRef.current = rec;
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      execute(parseVoiceCommand(transcript, orders));
    };
    rec.onerror = () => finish("Didn't hear anything. Tap and try again.", 'warn');
    rec.onend = () => setState(s => (s === 'listening' ? 'idle' : s));
    setState('listening');
    rec.start();
  }, [SR, orders, execute, finish]);

  const stop = useCallback(() => {
    if (recRef.current) recRef.current.stop();
    setState('idle');
  }, []);

  return (
    <>
      <button
        onClick={state === 'listening' ? stop : start}
        aria-label="Voice command"
        style={{
          position: 'fixed', right: 16, bottom: 84, zIndex: 1500,
          width: 52, height: 52, borderRadius: '50%',
          border: `1px solid ${state === 'listening' ? C.good : C.border}`,
          background: state === 'listening' ? '#1D9E75' : C.panel,
          color: state === 'listening' ? '#0f1513' : C.good,
          fontSize: 22, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        {state === 'listening' ? '■' : '🎤'}
      </button>
      {state === 'listening' && (
        <div style={{ position: 'fixed', left: 16, right: 84, bottom: 90, zIndex: 1500, background: C.panel, border: `1px solid ${C.good}`, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: C.text }}>
          Listening… try "mark Frances delivered", "how many gumbo left", "add two confit to Sara".
        </div>
      )}
      {msg && (
        <div style={{ position: 'fixed', left: 16, right: 84, bottom: 90, zIndex: 1500, background: C.panel, border: `1px solid ${msg.tone === 'ok' ? C.good : C.warn}`, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: msg.tone === 'ok' ? C.good : C.warn, fontWeight: 600 }}>
          {msg.text}
        </div>
      )}
    </>
  );
}
