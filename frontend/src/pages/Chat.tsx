import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi, teamsApi, type Message, type Team } from '../lib/api';
import { motion } from 'framer-motion';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Chat() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load user's teams
  useEffect(() => {
    teamsApi.myTeams().then((teams) => {
      setMyTeams(teams);
      const initial = teamId ? teams.find((t) => t.id === teamId) : teams[0];
      if (initial) setSelectedTeam(initial);
    });
  }, [teamId]);

  // Load messages when team changes & poll every 5s
  useEffect(() => {
    if (!selectedTeam) return;
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedTeam]);

  const loadMessages = async () => {
    if (!selectedTeam) return;
    try {
      const data = await chatApi.getMessages(selectedTeam.id);
      setMessages(data);
    } catch (e) {
      console.error('fetch messages', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedTeam) return;
    setSending(true);
    const content = newMsg;
    setNewMsg('');
    try {
      const msg = await chatApi.sendMessage({ team_id: selectedTeam.id, content });
      setMessages((prev) => [...prev, msg]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Message failed');
      setNewMsg(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar />
      <main className="md:ml-64 flex-1 flex h-full">
        {/* Team list */}
        <div className="w-72 border-r border-white/10 bg-zinc-950 hidden md:flex flex-col">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-lg font-bold">Team Chats</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {myTeams.length === 0 ? (
              <p className="p-5 text-zinc-600 text-sm">Join a team to start chatting</p>
            ) : myTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => { setSelectedTeam(team); setLoading(true); }}
                className={`w-full text-left p-4 flex items-center gap-3 border-b border-white/5 hover:bg-white/5 transition-colors ${selectedTeam?.id === team.id ? 'bg-purple-600/10 border-l-2 border-l-purple-500' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-sm">
                  {team.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{team.name}</p>
                  <p className="text-xs text-zinc-500">{team.hackathon_name || 'Team Chat'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        {selectedTeam ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center px-6 bg-zinc-950/70 backdrop-blur gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-sm">
                {selectedTeam.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-sm">{selectedTeam.name}</h3>
                <p className="text-xs text-zinc-500">{selectedTeam.hackathon_name || 'Team Chat'}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-purple-400" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-zinc-600 mt-20">No messages yet. Say hello! 👋</p>
              ) : messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}
                  >
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                        {(msg.sender_name || '?')[0]}
                      </div>
                    )}
                    <div className="max-w-[70%]">
                      {!isMe && <p className="text-xs text-zinc-500 mb-1 ml-1">{msg.sender_name}</p>}
                      <div className={`p-3.5 rounded-2xl text-sm ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-white/5'} ${msg.is_flagged ? 'opacity-50' : ''}`}>
                        {msg.is_flagged ? (
                          <span className="flex items-center gap-2 text-amber-400 italic">
                            <AlertTriangle className="h-4 w-4" /> Message removed (policy violation)
                          </span>
                        ) : msg.content}
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1 text-right">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-zinc-950/50">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/70 text-sm"
                />
                <button
                  type="submit"
                  disabled={sending || !newMsg.trim()}
                  className="w-11 h-11 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
              <p className="text-[10px] text-zinc-700 mt-1 ml-1">Messages are moderated for community safety.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600">
            <div className="text-center">
              <p className="text-lg">No team selected</p>
              <p className="text-sm mt-1">Join a team to start chatting</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
