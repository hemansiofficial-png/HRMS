'use client';

import { useState } from 'react';
import { Plus, Trash2, Award, Calendar, CheckCircle, X, Zap, Star, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Skill {
  id: string;
  skillName: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExp: number | null;
  lastUsed: string | null;
  verified: boolean;
}

interface SkillsSectionProps {
  skills: Skill[];
  onAddSkill: (skill: Omit<Skill, 'id' | 'verified'>) => Promise<void>;
  onDeleteSkill: (skillId: string) => Promise<void>;
}

const proficiencyConfig = {
  BEGINNER: { label: 'Beginner', color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', level: 1 },
  INTERMEDIATE: { label: 'Intermediate', color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', level: 2 },
  ADVANCED: { label: 'Advanced', color: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', level: 3 },
  EXPERT: { label: 'Expert', color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', level: 4 },
};

export function SkillsSection({ skills, onAddSkill, onDeleteSkill }: SkillsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState({ skillName: '', proficiency: 'BEGINNER' as any, yearsOfExp: '', lastUsed: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddSkill({
      skillName: newSkill.skillName,
      proficiency: newSkill.proficiency,
      yearsOfExp: newSkill.yearsOfExp ? parseFloat(newSkill.yearsOfExp) : null,
      lastUsed: newSkill.lastUsed || null,
    });
    setNewSkill({ skillName: '', proficiency: 'BEGINNER', yearsOfExp: '', lastUsed: '' });
    setIsAdding(false);
  };

  const sortedSkills = [...skills].sort((a, b) => proficiencyConfig[b.proficiency].level - proficiencyConfig[a.proficiency].level);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skills & Expertise</h2>
          <p className="text-xs text-gray-500">Your professional capabilities</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Skill
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mb-4 p-4 bg-purple-50 dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Skill name"
                value={newSkill.skillName}
                onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                required
              />
              <select
                value={newSkill.proficiency}
                onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value })}
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
              <input
                type="number"
                placeholder="Years exp."
                step="0.5"
                value={newSkill.yearsOfExp}
                onChange={(e) => setNewSkill({ ...newSkill, yearsOfExp: e.target.value })}
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700">
                  Add
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-2 border rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Skills List */}
      {skills.length === 0 ? (
        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-500">No skills added yet</p>
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {sortedSkills.map((skill) => {
            const config = proficiencyConfig[skill.proficiency];
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-all"
              >
                <button
                  onClick={() => onDeleteSkill(skill.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-1 h-8 rounded-full ${config.color}`}></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{skill.skillName}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
                      {skill.verified && <CheckCircle className="h-3 w-3 text-green-500" />}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {skill.yearsOfExp && (
                    <span className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {skill.yearsOfExp}y
                    </span>
                  )}
                  {skill.lastUsed && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(skill.lastUsed).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Progress indicator */}
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full ${level <= config.level ? config.color : 'bg-gray-200 dark:bg-gray-700'}`}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
