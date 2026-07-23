import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ResidentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resident, setResident] = useState(null);
  const [family, setFamily] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [familyForm, setFamilyForm] = useState({ name: '', relation: '', phone: '', email: '' });

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const res = await api.get(`/residents/${id}`);
    setResident(res.data.resident);
    setForm(res.data.resident);

    const famRes = await api.get(`/family-members/${id}`);
    setFamily(famRes.data);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    await api.patch(`/residents/${id}`, form);
    setEditing(false);
    fetchData();
  };

  const addFamilyMember = async (e) => {
    e.preventDefault();
    await api.post('/family-members', { resident_id: id, ...familyForm });
    setFamilyForm({ name: '', relation: '', phone: '', email: '' });
    fetchData();
  };

  const removeFamilyMember = async (fid) => {
    await api.delete(`/family-members/${fid}`);
    fetchData();
  };

  if (!resident) return <div className="page-loading">Loading...</div>;

  return (
    <div className="resident-detail">
      <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="profile-header">
        <div className="resident-avatar large">{resident.name.charAt(0)}</div>
        <div>
          <h2>{resident.name}</h2>
          <Link to={`/resident/${id}`} className="profile-tab-link">View health dashboard →</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="card-header-row">
            <h4>Personal Information</h4>
            {user.role === 'staff' && (
              <button className="btn-secondary btn-sm" onClick={() => setEditing(!editing)}>
                {editing ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>

          {!editing ? (
            <div className="info-list">
              <div><span>Date of birth</span><strong>{resident.date_of_birth ? new Date(resident.date_of_birth).toLocaleDateString() : 'Not recorded'}</strong></div>
              <div><span>Hometown</span><strong>{resident.hometown || 'Not recorded'}</strong></div>
              <div><span>Age</span><strong>{resident.age}</strong></div>
              <div><span>Room</span><strong>{resident.room_no || 'N/A'}</strong></div>
              <div><span>Conditions</span><strong>{resident.conditions || 'None recorded'}</strong></div>
            </div>
          ) : (
            <form onSubmit={saveProfile} className="profile-edit-form">
              <label>Name <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label>Age <input type="number" value={form.age || ''} onChange={(e) => setForm({ ...form, age: e.target.value })} /></label>
              <label>Room No. <input value={form.room_no || ''} onChange={(e) => setForm({ ...form, room_no: e.target.value })} /></label>
              <label>Conditions <input value={form.conditions || ''} onChange={(e) => setForm({ ...form, conditions: e.target.value })} /></label>
              <label>Date of birth <input type="date" value={form.date_of_birth ? form.date_of_birth.split('T')[0] : ''} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></label>
              <label>Hometown <input value={form.hometown || ''} onChange={(e) => setForm({ ...form, hometown: e.target.value })} /></label>
              <button type="submit" className="btn-primary">Save Changes</button>
            </form>
          )}
        </div>

        <div className="card">
          <h4>Family Members</h4>
          {family.length === 0 && <p className="empty-state">No family members added yet.</p>}
          {family.map((f) => (
            <div key={f.id} className="family-member-item">
              <div>
                <strong>{f.name}</strong> <span className="relation-tag">{f.relation}</span>
                <p>{f.phone} {f.email && `· ${f.email}`}</p>
              </div>
              {user.role === 'staff' && (
                <button className="btn-warning btn-sm" onClick={() => removeFamilyMember(f.id)}>Remove</button>
              )}
            </div>
          ))}

          {user.role === 'staff' && (
            <form onSubmit={addFamilyMember} className="add-medicine-form">
              <h5>Add Family Member</h5>
              <input placeholder="Name" value={familyForm.name} onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })} required />
              <input placeholder="Relation (e.g. Son, Daughter)" value={familyForm.relation} onChange={(e) => setFamilyForm({ ...familyForm, relation: e.target.value })} />
              <input placeholder="Phone" value={familyForm.phone} onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })} />
              <input placeholder="Email" value={familyForm.email} onChange={(e) => setFamilyForm({ ...familyForm, email: e.target.value })} />
              <button type="submit" className="btn-secondary btn-sm">Add</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}