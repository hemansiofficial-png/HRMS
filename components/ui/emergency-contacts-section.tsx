'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, User, X, Plus, Save } from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string | null;
  address?: string | null;
}

interface EmergencyContactsSectionProps {
  contacts: EmergencyContact[];
  onUpdate: (contacts: EmergencyContact[]) => Promise<void>;
}

export function EmergencyContactsSection({ contacts, onUpdate }: EmergencyContactsSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editContacts, setEditContacts] = useState<EmergencyContact[]>(
    contacts.length > 0 ? contacts : [{ id: '', name: '', relationship: '', phone: '', email: '', address: '' }]
  );

  const startEditing = () => {
    setEditing(true);
    setEditContacts(contacts.length > 0 ? contacts : [{ id: '', name: '', relationship: '', phone: '', email: '', address: '' }]);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditContacts(contacts);
  };

  const addContact = () => {
    setEditContacts([...editContacts, { id: '', name: '', relationship: '', phone: '', email: '', address: '' }]);
  };

  const removeContact = (index: number) => {
    setEditContacts(editContacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...editContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEditContacts(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out empty contacts
      const validContacts = editContacts.filter(c => c.name && c.phone);
      await onUpdate(validContacts);
      setEditing(false);
    } catch (error) {
      console.error('Failed to save emergency contacts:', error);
      alert('Failed to save emergency contacts');
    } finally {
      setSaving(false);
    }
  };

  if (!editing && contacts.length === 0) {
    return (
      <Card
        title="Emergency Contacts"
        action={
          <button
            onClick={startEditing}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Add Contact
          </button>
        }
      >
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
            <User className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">No emergency contacts added</p>
          <p className="text-sm text-gray-500 mt-1">Add at least one emergency contact for safety purposes</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Emergency Contacts"
      action={
        !editing && (
          <button
            onClick={() => {
              setEditContacts([...contacts, { id: '', name: '', relationship: '', phone: '', email: '', address: '' }]);
              setEditing(true);
            }}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )
      }
    >
      {editing ? (
        <div className="space-y-6">
          {editContacts.map((contact, index) => (
            <div key={index} className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {contact.name || `Contact ${index + 1}`}
                </h4>
                {editContacts.length > 1 && (
                  <button
                    onClick={() => removeContact(index)}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Full name"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Relationship *
                  </label>
                  <select
                    value={contact.relationship}
                    onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Friend">Friend</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+91 98765 43210"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contact.email || ''}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Address
                  </label>
                  <textarea
                    value={contact.address || ''}
                    onChange={(e) => updateContact(index, 'address', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Full address"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={addContact}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Another Contact
            </button>

            <div className="flex-1" />

            <button
              onClick={cancelEditing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <div key={contact.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-lg font-bold text-purple-700 dark:text-purple-300 flex-shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h4>
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full inline-block mt-1">
                      {contact.relationship}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditContacts([{ ...contact }]);
                    setEditing(true);
                  }}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium px-3 py-1 border border-purple-200 dark:border-purple-800 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span>{contact.phone}</span>
                </div>

                {contact.email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span>{contact.email}</span>
                  </div>
                )}

                {contact.address && (
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span>{contact.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
