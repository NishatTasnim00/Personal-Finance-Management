import { useEffect, useState } from 'react';
import api from '@/lib/api';
import useAuthStore from '@/store/useAuthStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase'; // Add storage to firebase.js

const currencyOptions = [
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'INR', label: '₹ INR' },
  { value: 'GBP', label: '£ GBP' },
];

const Profile = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.get('/user/profile');
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((p) => ({
      ...p,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      await api.patch('/user/profile', profile);
      alert('Profile updated!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `avatars/${user.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    setProfile((p) => ({ ...p, avatar: url }));
    await api.patch('/user/profile', { avatar: url });
    setUploading(false);
  };

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="avatar">
              <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366f1&color=fff`} alt="Avatar" />
              </div>
            </div>
            <div>
              <label className="btn btn-primary btn-sm btn-disabled cursor-pointer">
                {uploading ? <span className="loading loading-spinner"></span> : 'Change Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Name</span></label>
              <input type="text" name="name" value={profile.name || ''} onChange={handleChange} className="input input-bordered" />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Email</span></label>
              <input type="email" value={profile.email} disabled className="input input-bordered input-disabled" />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Age</span></label>
              <input type="number" name="age" value={profile.age || ''} onChange={handleChange} className="input input-bordered" min="13" max="120" />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Profession</span></label>
              <input type="text" name="profession" value={profile.profession || ''} onChange={handleChange} className="input input-bordered" />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Currency</span></label>
              <select name="currency" value={profile.currency} onChange={handleChange} className="select select-bordered">
                {currencyOptions.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Theme</span></label>
              <select name="theme" value={profile.theme} onChange={handleChange} className="select select-bordered">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className="form-control">
            <label className="label w-full">
              <span className="label-text">Bio</span>
              <span className="label-text-alt">{(profile.bio || '').length}/160</span>
              </label>
            <textarea name="bio" value={profile.bio || ''} onChange={handleChange} className="w-full textarea textarea-bordered h-24" maxLength={160} />
          </div>

          <div className="form-control">
            <label className="cursor-pointer label">
              <span className="label-text">Email Notifications</span>
              <input type="checkbox" name="notifications" checked={profile.notifications} onChange={handleChange} className="toggle toggle-primary" />
            </label>
          </div>

          <div className="card-actions justify-end">
            <button onClick={handleSave} className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
