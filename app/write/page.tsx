'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { Lock, Send, ArrowLeft } from 'lucide-react';

export default function WriteStoryPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('కథ');
  const [content, setContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  const SECRET_PASSCODE = 'Naveen1992';

  useEffect(() => {
    if (localStorage.getItem('naveen_author_unlocked') === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (passcode === SECRET_PASSCODE) {
      setIsUnlocked(true);
      localStorage.setItem('naveen_author_unlocked', 'true');
    } else {
      alert('తప్పు పాస్‌వర్డ్! దయచేసి సరైన పాస్‌వర్డ్ ఇవ్వండి.');
    }
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setPublishing(true);
    const { error } = await supabase.from('stories').insert([
      {
        title: title.trim(),
        category,
        content: content.trim(),
      },
    ]);

    setPublishing(false);

    if (error) {
      alert('ఏదో లోపం జరిగింది: ' + error.message);
    } else {
      alert('మీ రచన విజయవంతంగా ప్రచురించబడింది!');
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 font-[family-name:var(--font-telugu)]">
      <div className="max-w-2xl w-full bg-slate-900/80 border border-blue-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-pink-400 hover:text-pink-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>హోమ్ పేజీకి వెళ్ళండి</span>
        </Link>

        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="max-w-sm mx-auto text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-pink-500/15 border border-pink-500/30 flex items-center justify-center mx-auto text-pink-400">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">రచయిత లాగిన్ (Admin)</h1>
            <p className="text-xs text-slate-400">
              కొత్త కథలు ప్రచురించడానికి మీ రహస్య పాస్‌వర్డ్ నమోదు చేయండి.
            </p>
            <input
              type="password"
              placeholder="పాస్‌వర్డ్..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-pink-500 focus:outline-none text-center text-white"
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white font-medium transition"
            >
              ఓపెన్ చేయండి
            </button>
          </form>
        ) : (
          <form onSubmit={handlePublish} className="space-y-5">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-pink-300 bg-clip-text text-transparent">
              కొత్త రచన ప్రచురించండి
            </h1>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">శీర్షిక (Title)</label>
              <input
                type="text"
                placeholder="ఉదా: ప్రియ (థాంక్యూ అర్జున్)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-pink-500 focus:outline-none text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">విభాగం (Category)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-pink-500 focus:outline-none text-white"
              >
                <option value="కథ">కథ</option>
                <option value="ప్రేమ">ప్రేమ</option>
                <option value="జ్ఞాపకాలు">జ్ఞాపకాలు</option>
                <option value="కవిత">కవిత</option>
                <option value="జీవితం">జీవితం</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">మీ రచన (Content)</label>
              <textarea
                rows={12}
                placeholder="మీ కథను ఇక్కడ రాయండి లేదా పేస్ట్ చేయండి..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-pink-500 focus:outline-none text-white leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={publishing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 transition"
            >
              <Send className="w-4 h-4" />
              <span>{publishing ? 'ప్రచురిస్తున్నాము...' : 'ప్రచురించండి (Publish)'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}