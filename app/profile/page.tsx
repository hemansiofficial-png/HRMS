'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Calendar, Building2, Camera, X, Key } from 'lucide-react';
import Image from 'next/image';
import { SkillsSection } from '@/components/ui/skills-section';
import { DocumentsSection } from '@/components/ui/documents-section';
import { EmergencyContactsSection } from '@/components/ui/emergency-contacts-section';
import { ChangePasswordModal } from '@/components/profile/change-password-modal';

interface EmployeeProfile {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: { name: string };
  joiningDate: string;
  gender?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  country?: string;
  address: string;
  photoUrl?: string | null;
  reportsTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  personalInfo?: any;
  bankDetails?: any;
  emergencyContacts?: any[];
  skills?: any[];
  documents?: any[];
}

interface EditableField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea';
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

const personalFields: EditableField[] = [
  { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210', required: true },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
  { key: 'city', label: 'City', type: 'text', placeholder: 'Enter city' },
  { key: 'state', label: 'State', type: 'text', placeholder: 'Enter state' },
  { key: 'country', label: 'Country', type: 'text', placeholder: 'Enter country' },
  { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Enter full address' },
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState<Partial<EmployeeProfile>>({});
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Section-specific edit states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionData, setSectionData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check session status
    if (session === undefined) {
      console.log('Session still loading...');
      return;
    }

    if (session?.user?.email) {
      fetchProfile();
    } else if (session === null) {
      // Not authenticated - this will be handled by next-auth
      console.log('Not authenticated');
    }
  }, [session]);

  async function fetchProfile() {
    try {
      console.log('Fetching profile...');
      const profileRes = await fetch('/api/profile');

      console.log('Profile response status:', profileRes.status);

      const profileData = await profileRes.json();

      console.log('Profile data:', profileData);

      if (profileRes.ok && profileData.profile) {
        const profileWithDocs = {
          ...profileData.profile,
          documents: Array.isArray(profileData.profile.documents) ? profileData.profile.documents : [],
          skills: Array.isArray(profileData.profile.skills) ? profileData.profile.skills : [],
          emergencyContacts: Array.isArray(profileData.profile.emergencyContacts) ? profileData.profile.emergencyContacts : []
        };

        console.log('Profile loaded:', profileWithDocs);
        console.log('Skills count:', profileWithDocs.skills?.length);
        console.log('Emergency contacts count:', profileWithDocs.emergencyContacts?.length);
        console.log('Documents count:', profileWithDocs.documents?.length);
        
        setProfile(profileWithDocs);
        setFormData(profileWithDocs);
      } else {
        console.error('Failed to load profile:', profileData);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        const updatedProfile = { ...profile, photoUrl: result.photo.url };
        setProfile(updatedProfile);
        setFormData(updatedProfile);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Photo upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handlePhotoDelete() {
    if (!profile) return;
    
    if (!confirm('Are you sure you want to remove your profile photo?')) return;

    setUploadingPhoto(true);
    try {
      const response = await fetch('/api/profile/photo', {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedProfile = { ...profile, photoUrl: null };
        setProfile(updatedProfile);
        setFormData(updatedProfile);
      } else {
        const result = await response.json();
        alert(`Delete failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Photo delete failed:', err);
      alert('Photo delete failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const { profile: updatedProfile } = await response.json();
        setProfile(updatedProfile);
        setEditingSection(null);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (section: string) => {
    setEditingSection(section);
    setSectionData({
      phone: profile?.phone || '',
      gender: profile?.gender || '',
      dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || '',
      address: profile?.address || '',
    });
  };

  const saveSection = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData)
      });

      if (response.ok) {
        const { profile: updatedProfile } = await response.json();
        setProfile(updatedProfile);
        setEditingSection(null);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setSectionData({});
  };

  const handleAddSkill = async (skill: any) => {
    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skill)
      });

      if (response.ok) {
        const { skill: newSkill } = await response.json();
        const updatedProfile = profile ? {
          ...profile,
          skills: [...(profile.skills || []), newSkill]
        } : null;
        setProfile(updatedProfile);
      } else {
        const result = await response.json();
        alert(`Failed to add skill: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add skill');
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const response = await fetch(`/api/skills?id=${skillId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedProfile = profile ? {
          ...profile,
          skills: (profile.skills || []).filter((s: any) => s.id !== skillId)
        } : null;
        setProfile(updatedProfile);
      } else {
        const result = await response.json();
        alert(`Failed to delete skill: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill');
    }
  };

  const handleUploadDocument = async (file: File, category: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const { document: newDoc } = await response.json();
        const updatedProfile = profile ? {
          ...profile,
          documents: [...(profile.documents || []), {
            id: newDoc.id,
            name: newDoc.name,
            type: newDoc.type,
            uploadedDate: newDoc.uploadedDate,
            url: newDoc.url
          }]
        } : null;
        setProfile(updatedProfile);
      } else {
        const result = await response.json();
        alert(`Failed to upload document: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedProfile = profile ? {
          ...profile,
          documents: (profile.documents || []).filter((d: any) => d.id !== documentId)
        } : null;
        setProfile(updatedProfile);
      } else {
        const result = await response.json();
        alert(`Failed to delete document: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleUpdateEmergencyContacts = async (contacts: any[]) => {
    try {
      const response = await fetch('/api/emergency-contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts })
      });

      if (response.ok) {
        const { contacts: updatedContacts } = await response.json();
        const updatedProfile = profile ? {
          ...profile,
          emergencyContacts: updatedContacts
        } : null;
        setProfile(updatedProfile);
        alert('Emergency contacts updated successfully!');
      } else {
        const result = await response.json();
        alert(`Failed to update emergency contacts: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating emergency contacts:', error);
      alert('Failed to update emergency contacts');
    }
  };

  if (loading) {
    return (
      <AppShell title="My Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="My Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please sign in to view and edit your profile
            </p>
            <a
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="My Profile">
      <div className="space-y-6">
        {/* Profile Header Card */}
        {profile && (
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Profile Photo */}
                <div className="relative">
                  {profile.photoUrl ? (
                    <div className="relative h-16 w-16">
                      <Image
                        src={profile.photoUrl}
                        alt={profile.name}
                        fill
                        className="object-cover rounded-full"
                      />
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-keka-purple text-2xl font-bold text-white">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{profile.designation}</p>
                  <p className="text-sm text-gray-500">{profile.employeeCode}</p>
                </div>
              </div>

              {/* Photo & Password Actions */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                  {profile.photoUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                {profile.photoUrl && (
                  <button
                    onClick={handlePhotoDelete}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                )}
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <Key className="h-4 w-4" />
                  Change Password
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Personal Information Card */}
        {profile && (
          <Card 
            title="Personal Information"
            action={
              <button
                onClick={() => startEditing('personal')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {editingSection === 'personal' ? 'Cancel' : 'Edit'}
              </button>
            }
          >
            {editingSection === 'personal' ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {personalFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={sectionData[field.key] || ''}
                          onChange={(e) => setSectionData({ ...sectionData, [field.key]: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={sectionData[field.key] || ''}
                          onChange={(e) => setSectionData({ ...sectionData, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={sectionData[field.key] || ''}
                          onChange={(e) => setSectionData({ ...sectionData, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={saveSection}
                    disabled={saving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile?.phone || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Employee ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile?.employeeCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Department</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile?.department.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Designation</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile?.designation}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reports To</p>
                  {profile?.reportsTo ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-sm font-bold text-purple-700 dark:text-purple-300">
                        {profile.reportsTo.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{profile.reportsTo.name}</p>
                        <p className="text-xs text-gray-500">{profile.reportsTo.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="font-semibold text-gray-900 dark:text-white">Not assigned</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Joining Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(profile?.joiningDate || '').toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Gender</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile?.gender || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date of Birth</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {[profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') || 'Not set'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {profile?.address || 'Not set'}
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Skills Section */}
        {profile && (
          <SkillsSection
            skills={profile.skills || []}
            onAddSkill={handleAddSkill}
            onDeleteSkill={handleDeleteSkill}
          />
        )}

        {/* Emergency Contacts Section */}
        {profile && (
          <EmergencyContactsSection
            contacts={profile.emergencyContacts || []}
            onUpdate={handleUpdateEmergencyContacts}
          />
        )}

        {/* Documents Section */}
        {profile && (
          <DocumentsSection
            documents={profile.documents || []}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {/* Change Password Modal */}
        {showChangePassword && (
          <ChangePasswordModal
            onClose={() => setShowChangePassword(false)}
            onSuccess={() => setShowChangePassword(false)}
          />
        )}
      </div>
    </AppShell>
  );
}
