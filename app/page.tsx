'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, BookOpen, Share2, Sparkles, PenTool, Trash2, Eye, CornerDownRight } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  category: string;
  content: string;
  likes_count: number;
  views_count: number;
  created_at: string;
}

interface Comment {
  id: string;
  story_id: string;
  reader_name: string;
  comment_text: string;
  author_reply?: string | null;
  created_at: string;
}

export default function HomePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [readerName, setReaderName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('అన్నీ');
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [isAuthor, setIsAuthor] = useState(false);

  // Author Reply States
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  useEffect(() => {
    fetchStories();
    const savedLikes = JSON.parse(localStorage.getItem('naveen_liked_stories') || '[]');
    setLikedIds(savedLikes);
    setIsAuthor(localStorage.getItem('naveen_author_unlocked') === 'true');
  }, []);

  async function fetchStories() {
    setLoading(true);
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStories(data);
    }
    setLoading(false);
  }

  function isNewStory(createdAt: string) {
    const publishedDate = new Date(createdAt).getTime();
    const now = Date.now();
    const fourDaysInMs = 4 * 24 * 60 * 60 * 1000;
    return now - publishedDate <= fourDaysInMs;
  }

  async function openStory(story: Story) {
    const newViews = (story.views_count || 0) + 1;
    const updatedStory = { ...story, views_count: newViews };

    setSelectedStory(updatedStory);
    setReplyingToId(null);
    setReplyText('');
    setStories((prev) => prev.map((s) => (s.id === story.id ? updatedStory : s)));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    await supabase.from('stories').update({ views_count: newViews }).eq('id', story.id);

    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('story_id', story.id)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  }

  async function handleLike(story: Story) {
    if (likedIds.includes(story.id)) return;

    const newCount = (story.likes_count || 0) + 1;
    const updatedLikes = [...likedIds, story.id];
    setLikedIds(updatedLikes);
    localStorage.setItem('naveen_liked_stories', JSON.stringify(updatedLikes));

    setStories(stories.map((s) => (s.id === story.id ? { ...s, likes_count: newCount } : s)));
    if (selectedStory?.id === story.id) {
      setSelectedStory({ ...selectedStory, likes_count: newCount });
    }

    await supabase.from('stories').update({ likes_count: newCount }).eq('id', story.id);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStory || !readerName.trim() || !commentText.trim()) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          story_id: selectedStory.id,
          reader_name: readerName.trim(),
          comment_text: commentText.trim(),
        },
      ])
      .select();

    if (!error && data) {
      setComments([data[0], ...comments]);
      setCommentText('');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!isAuthor) return;
    const confirmDelete = window.confirm('ఈ కామెంట్‌ను తొలగించాలా?');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      setComments(comments.filter((c) => c.id !== commentId));
    } else {
      alert('కామెంట్ డిలీట్ అవ్వలేదు: ' + error.message);
    }
  }

  async function handleSaveReply(commentId: string) {
    if (!isAuthor) return;
    setSavingReply(true);
    const cleanReply = replyText.trim();

    const { error } = await supabase
      .from('comments')
      .update({ author_reply: cleanReply || null })
      .eq('id', commentId);

    setSavingReply(false);

    if (!error) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, author_reply: cleanReply || null } : c))
      );
      setReplyingToId(null);
      setReplyText('');
    } else {
      alert('రిప్లై సేవ్ అవ్వలేదు: ' + error.message);
    }
  }

  function handleShare(title: string) {
    const url = window.location.href;
    const shareText = `"${title}" - Writings by Naveen లో ఈ కథ చదవండి:\n\n${url}`;
    if (navigator.share) {
      navigator.share({ title, text: `"${title}" - Writings by Naveen లో ఈ కథ చదవండి:`, url });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('లింక్ కాపీ అయింది! వాట్సాప్‌లో పేస్ట్ చేసి షేర్ చేయండి.');
    }
  }

  const preventCopy = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  const categories = ['అన్నీ', 'కథ', 'ప్రేమ', 'జ్ఞాపకాలు', 'కవిత', 'జీవితం'];
  const filteredStories =
    selectedCategory === 'అన్నీ'
      ? stories
      : stories.filter((s) => s.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-telugu)]">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/75 border-b border-blue-500/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setSelectedStory(null)}
            className="flex items-center gap-3 text-left group"
          >
            {/* TN Monogram Logo */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 p-[2px] shadow-lg shadow-pink-500/20 group-hover:scale-105 transition">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-[family-name:var(--font-english)] font-extrabold text-lg bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent">
                  TN
                </span>
              </div>
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-english)] text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-pink-200 bg-clip-text text-transparent">
                Writings by Naveen
              </h1>
              <p className="text-xs text-blue-300/80">కథలు • జ్ఞాపకాలు • భావాలు</p>
            </div>
          </button>

          <Link
            href="/write"
            className="flex items-center gap-1.5 text-xs sm:text-sm px-3.5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white font-medium shadow-md shadow-pink-500/20 transition"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>రచన చేయి</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {selectedStory ? (
          /* Single Story Reading View */
          <article className="relative overflow-hidden bg-slate-900/70 border border-blue-500/20 rounded-2xl p-6 sm:p-10 shadow-2xl">
            {/* Subtle TN Logo Watermark in Story Background */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none fixed sm:absolute inset-0 flex items-center justify-center z-0"
            >
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-blue-400/10 flex flex-col items-center justify-center opacity-[0.06] -rotate-12">
                <span className="font-[family-name:var(--font-english)] font-black text-8xl sm:text-9xl bg-gradient-to-r from-blue-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent tracking-tighter">
                  TN
                </span>
                <span className="font-[family-name:var(--font-english)] text-xs sm:text-sm tracking-[0.25em] uppercase text-blue-200 mt-1">
                  Writings by Naveen
                </span>
              </div>
            </div>

            <div className="relative z-10">
              <button
                onClick={() => setSelectedStory(null)}
                className="text-sm text-pink-400 hover:text-pink-300 mb-6 inline-flex items-center gap-1 font-medium"
              >
                ← అన్ని కథలకు తిరిగి వెళ్ళండి
              </button>

              {/* Protected Story Title & Body */}
              <div
                onCopy={preventCopy}
                onCut={preventCopy}
                onContextMenu={preventCopy}
                onDragStart={preventCopy}
                className="select-none"
                style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="px-3 py-1 text-xs rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                    {selectedStory.category}
                  </span>
                  {isNewStory(selectedStory.created_at) && (
                    <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase rounded-full bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow-sm">
                      NEW • కొత్త కథ
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(selectedStory.created_at).toLocaleDateString('te-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-blue-300/90">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{selectedStory.views_count || 0} మంది చదివారు</span>
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-6">
                  {selectedStory.title}
                </h2>

                <div className="prose prose-invert max-w-none text-slate-200 text-base sm:text-lg leading-relaxed whitespace-pre-line border-t border-slate-800 pt-6">
                  {selectedStory.content}
                </div>
              </div>

              {/* Author Signature */}
              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">రచన</p>
                  <p className="font-semibold text-blue-300">తుమాటి నవీన్ (Naveen Tumati)</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-800/60 border border-slate-700/80 text-slate-300 text-sm">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span>{selectedStory.views_count || 0}</span>
                  </div>

                  <button
                    onClick={() => handleLike(selectedStory)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                      likedIds.includes(selectedStory.id)
                        ? 'bg-pink-600/20 border-pink-500 text-pink-400'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-pink-500/50'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        likedIds.includes(selectedStory.id) ? 'fill-pink-500 text-pink-500' : ''
                      }`}
                    />
                    <span>{selectedStory.likes_count || 0}</span>
                  </button>

                  <button
                    onClick={() => handleShare(selectedStory.title)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 transition"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>షేర్</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-10 pt-8 border-t border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-pink-400" />
                  <span>పాఠకుల స్పందనలు ({comments.length})</span>
                </h3>

                <form onSubmit={handleAddComment} className="space-y-3 mb-8">
                  <input
                    type="text"
                    placeholder="మీ పేరు..."
                    value={readerName}
                    onChange={(e) => setReaderName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-pink-500 focus:outline-none text-sm text-white"
                    required
                  />
                  <textarea
                    rows={3}
                    placeholder="ఈ కథపై మీ అభిప్రాయం రాయండి..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-pink-500 focus:outline-none text-sm text-white"
                    required
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white text-sm font-medium transition"
                  >
                    అభిప్రాయం పంపండి
                  </button>
                </form>

                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-slate-400">ఇంకా ఎవరూ స్పందించలేదు. మొదటి కామెంట్ మీరే రాయండి!</p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl bg-slate-950/60 border border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-pink-300">{c.reader_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">
                              {new Date(c.created_at).toLocaleDateString('te-IN')}
                            </span>
                            {isAuthor && (
                              <>
                                <button
                                  onClick={() => {
                                    setReplyingToId(replyingToId === c.id ? null : c.id);
                                    setReplyText(c.author_reply || '');
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition"
                                >
                                  {c.author_reply ? 'రిప్లై మార్చు' : 'రిప్లై'}
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  title="కామెంట్ తొలగించండి"
                                  className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed">{c.comment_text}</p>

                        {/* Existing Author Reply Display */}
                        {c.author_reply && replyingToId !== c.id && (
                          <div className="mt-3 ml-3 pl-3 border-l-2 border-blue-500/60 bg-blue-950/25 rounded-r-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 mb-1">
                              <CornerDownRight className="w-3.5 h-3.5 text-pink-400" />
                              <span>✍️ నవీన్ (రచయిత)</span>
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                              {c.author_reply}
                            </p>
                          </div>
                        )}

                        {/* Author Reply Input Box (Only visible to Author when clicked) */}
                        {isAuthor && replyingToId === c.id && (
                          <div className="mt-3 ml-3 pl-3 border-l-2 border-pink-500/60 space-y-2">
                            <textarea
                              rows={2}
                              placeholder="పాఠకుడికి మీ రిప్లై రాయండి..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none text-sm text-white"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={savingReply}
                                onClick={() => handleSaveReply(c.id)}
                                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-pink-600 text-white text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                              >
                                {savingReply ? 'సేవ్ అవుతోంది...' : 'రిప్లై సేవ్ చేయి'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingToId(null);
                                  setReplyText('');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                              >
                                రద్దు
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </article>
        ) : (
          /* Home Feed View */
          <div>
            {/* Hero Banner */}
            <div className="mb-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-pink-900/40 border border-blue-400/20 shadow-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>అక్షర ప్రపంచానికి స్వాగతం</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                మనసును తాకే కథలు, మధురమైన జ్ఞాపకాలు
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                నా ఆలోచనలు, అనుభవాలు, ఊహలకు అక్షర రూపమే ఈ వేదిక. మీకు నచ్చిన కథను చదివి, మీ విలువైన అభిప్రాయాన్ని పంచుకోండి.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-blue-600 to-pink-600 text-white font-medium shadow-md shadow-pink-500/20'
                      : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-blue-500/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Stories List */}
            {loading ? (
              <div className="text-center py-16 text-blue-300">కథలు లోడ్ అవుతున్నాయి...</div>
            ) : filteredStories.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                <BookOpen className="w-10 h-10 text-pink-400 mx-auto mb-3 opacity-80" />
                <h3 className="text-lg font-semibold text-white mb-1">ఇంకా కథలు ప్రచురించలేదు</h3>
                <p className="text-sm text-slate-400 mb-4">
                  పైన ఉన్న &quot;రచన చేయి&quot; బటన్ నొక్కి మీ మొదటి కథను ఇక్కడ పోస్ట్ చేయండి!
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {filteredStories.map((story) => {
                  const isFresh = isNewStory(story.created_at);
                  return (
                    <div
                      key={story.id}
                      onCopy={preventCopy}
                      onContextMenu={preventCopy}
                      className={`relative overflow-hidden select-none group rounded-2xl p-6 transition shadow-lg ${
                        isFresh
                          ? 'bg-gradient-to-br from-slate-900/95 via-indigo-950/50 to-pink-950/30 border-2 border-pink-500/50 shadow-pink-500/10'
                          : 'bg-slate-900/70 hover:bg-slate-900/95 border border-blue-500/15 hover:border-pink-500/40'
                      }`}
                    >
                      {/* Subtle TN Watermark on Card */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-6 bottom-3 font-[family-name:var(--font-english)] font-black text-6xl bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent opacity-[0.06]"
                      >
                        TN
                      </span>

                      <div className="relative z-10">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-0.5 text-xs rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              {story.category}
                            </span>
                            {isFresh && (
                              <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase rounded-full bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow-sm">
                                NEW • కొత్త కథ
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(story.created_at).toLocaleDateString('te-IN')}
                          </span>
                        </div>

                        <h3
                          onClick={() => openStory(story)}
                          className="text-xl font-bold text-white group-hover:text-pink-300 cursor-pointer transition mb-2"
                        >
                          {story.title}
                        </h3>

                        <p className="text-slate-300 text-sm sm:text-base line-clamp-3 leading-relaxed mb-5">
                          {story.content}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                          <button
                            onClick={() => openStory(story)}
                            className="text-sm font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1"
                          >
                            <span>పూర్తిగా చదవండి →</span>
                          </button>

                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1 text-blue-300/80" title="చదివిన వారు">
                              <Eye className="w-4 h-4" />
                              <span>{story.views_count || 0}</span>
                            </span>
                            <button
                              onClick={() => handleLike(story)}
                              className="flex items-center gap-1.5 hover:text-pink-400 transition"
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  likedIds.includes(story.id) ? 'fill-pink-500 text-pink-500' : ''
                                }`}
                              />
                              <span>{story.likes_count || 0}</span>
                            </button>
                            <button
                              onClick={() => handleShare(story.title)}
                              className="hover:text-blue-400 transition"
                              title="షేర్ చేయండి"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        © 2026 Writings by Naveen • తుమాటి నవీన్
      </footer>
    </div>
  );
}