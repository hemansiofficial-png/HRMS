'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Plus, Mail, Phone, FileText, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  appliedDate: string;
  resume: string;
  notes: string;
  rating: number;
}

export default function CandidatesPipelinePage() {
  const params = useParams();
  const jobId = params.id as string;

  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+91 98765 43210',
      stage: 'Interview',
      appliedDate: '2024-02-15',
      resume: 'alice-resume.pdf',
      notes: 'Strong technical skills, good communication',
      rating: 5,
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      phone: '+91 98765 43211',
      stage: 'Screening',
      appliedDate: '2024-02-16',
      resume: 'bob-resume.pdf',
      notes: 'Good experience, needs more clarification on projects',
      rating: 4,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    resume: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCandidate: Candidate = {
      id: String(candidates.length + 1),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      stage: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      resume: formData.resume,
      notes: formData.notes,
      rating: 3,
    };
    setCandidates([...candidates, newCandidate]);
    setFormData({ name: '', email: '', phone: '', resume: '', notes: '' });
    setShowForm(false);
  };

  const updateStage = (id: string, newStage: Candidate['stage']) => {
    setCandidates(candidates.map(c => c.id === id ? { ...c, stage: newStage } : c));
  };

  const updateRating = (id: string, newRating: number) => {
    setCandidates(candidates.map(c => c.id === id ? { ...c, rating: newRating } : c));
  };

  const deleteCandidate = (id: string) => {
    if (confirm('Are you sure?')) {
      setCandidates(candidates.filter(c => c.id !== id));
    }
  };

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'] as const;

  const stats = {
    total: candidates.length,
    hired: candidates.filter(c => c.stage === 'Hired').length,
    rejected: candidates.filter(c => c.stage === 'Rejected').length,
    inProgress: candidates.filter(c => !['Hired', 'Rejected'].includes(c.stage)).length,
  };

  return (
    <AppShell title="Candidates Pipeline">
      <div className="space-y-6">
        <Link href="/recruitment">
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </button>
        </Link>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Total Applicants</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">In Pipeline</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.inProgress}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Hired</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.hired}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Candidates</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Candidate
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Add Form */}
        {showForm && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add Candidate</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Candidate name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume File</label>
                <input
                  type="text"
                  name="resume"
                  value={formData.resume}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="resume.pdf"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Interview notes, impressions, etc."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Add Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Candidates Grid */}
        <div className="space-y-3">
          {filteredCandidates.map(candidate => (
            <Card key={candidate.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{candidate.name}</h3>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => updateRating(candidate.id, i + 1)}
                          className={`text-lg ${i < candidate.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <a href={`mailto:${candidate.email}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Mail className="w-4 h-4" /> {candidate.email}
                    </a>
                    <a href={`tel:${candidate.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Phone className="w-4 h-4" /> {candidate.phone}
                    </a>
                  </div>

                  {candidate.resume && (
                    <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
                      <FileText className="w-4 h-4" /> {candidate.resume}
                    </div>
                  )}

                  {candidate.notes && (
                    <p className="text-sm text-gray-600 mb-3 italic">"{candidate.notes}"</p>
                  )}

                  <p className="text-xs text-gray-500">Applied on {candidate.appliedDate}</p>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <select
                    value={candidate.stage}
                    onChange={(e) => updateStage(candidate.id, e.target.value as Candidate['stage'])}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {stages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => deleteCandidate(candidate.id)}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCandidates.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No candidates found.</p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
