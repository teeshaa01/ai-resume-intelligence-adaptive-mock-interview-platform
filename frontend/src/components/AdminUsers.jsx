import React, { useState, useEffect } from 'react';
import '../styles/AdminUsers.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function AdminUsers({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Notification states
  const [notification, setNotification] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('candidate');
  const [formStatus, setFormStatus] = useState('active');
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState('');

  // Load initial users
  useEffect(() => {
    loadUsers();
  }, []);

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const loadUsers = async () => {
    try {
      const res = await adminFetch('/api/admin/users');
      if (!res.ok) throw new Error((await res.json()).detail || 'Unable to load users.');
      setUsers(await res.json());
    } catch (error) {
      showNotice(error.message, 'error');
    }
  };

  const adminFetch = (path, options = {}) => fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('resuintel_auth_token') || ''}`,
      ...(options.headers || {})
    }
  });

  const refreshUsers = async () => {
    await loadUsers();
  };

  // Metric Computations
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.status === 'active').length;
  const adminUsersCount = users.filter(u => u.role === 'admin').length;
  const totalScansCount = users.reduce((acc, u) => acc + (u.scansCount || 0), 0);

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const nameMatch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || emailMatch;
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Action Handlers
  const handleOpenAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('candidate');
    setFormStatus('active');
    setFormError('');
    setShowAddModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Valid email address is required.');
      return;
    }
    if (!formPassword || formPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    const normEmail = formEmail.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === normEmail)) {
      setFormError('A user with this email address already exists.');
      return;
    }

    try {
      const response = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: (() => { const body = new FormData(); body.append('full_name', formName.trim()); body.append('email', normEmail); body.append('password', formPassword); body.append('role', formRole); body.append('status', formStatus); return body; })()
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Unable to create user.');
      await refreshUsers();
    } catch (error) {
      setFormError(error.message);
      return;
    }
    setShowAddModal(false);
    showNotice(`User ${formName} successfully created!`, 'success');
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setFormName(user.name || '');
    setFormRole(user.role || 'candidate');
    setFormStatus(user.status || 'active');
    setFormError('');
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formName.trim()) {
      setFormError('Name cannot be empty.');
      return;
    }
    if (String(selectedUser.id) !== String(currentUser?.id) && selectedUser.role === 'admin' && formRole === 'candidate' && !window.confirm(`Remove admin access from ${selectedUser.name}?`)) {
      return;
    }

    try {
      const body = new FormData();
      body.append('full_name', formName.trim());
      const response = await adminFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Unable to update user.');
      const roleBody = new FormData();
      roleBody.append('role', formRole);
      const roleResponse = await adminFetch(`/api/admin/users/${selectedUser.id}/role`, { method: 'PUT', body: roleBody });
      if (!roleResponse.ok) throw new Error((await roleResponse.json()).detail || 'Unable to update user role.');
      const statusBody = new FormData();
      statusBody.append('status', formStatus);
      const statusResponse = await adminFetch(`/api/admin/users/${selectedUser.id}/status`, { method: 'PUT', body: statusBody });
      if (!statusResponse.ok) throw new Error((await statusResponse.json()).detail || 'Unable to update user status.');
      await refreshUsers();
    } catch (error) {
      setFormError(error.message);
      return;
    }
    setShowEditModal(false);
    showNotice(`User details for ${selectedUser.email} updated successfully!`, 'success');
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    if (nextStatus === 'suspended' && !window.confirm(`Suspend ${user.name}'s account?`)) return;
    
    const body = new FormData();
    body.append('status', nextStatus);
    const response = await adminFetch(`/api/admin/users/${user.id}/status`, { method: 'PUT', body });
    if (!response.ok) { showNotice((await response.json()).detail || 'Unable to update account status.', 'error'); return; }
    await refreshUsers();
    showNotice(`Account status for ${user.name} set to ${nextStatus.toUpperCase()}`, nextStatus === 'active' ? 'success' : 'warning');
  };

  const handleOpenResetModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setFormError('');
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword || newPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      const body = new FormData();
      body.append('new_password', newPassword);
      const response = await adminFetch(`/api/admin/users/${selectedUser.id}/password`, { method: 'PUT', body });
      if (!response.ok) throw new Error((await response.json()).detail || 'Unable to reset password.');
      setShowResetModal(false);
      showNotice(`Password for ${selectedUser.name} reset successfully!`, 'success');
    } catch (error) {
      setFormError(error.message);
    }
    return;
    setShowResetModal(false);
    showNotice(`Password for ${selectedUser.name} reset successfully!`, 'success');
  };

  const handleOpenDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Permanently delete ${selectedUser.name}'s account?`)) return;

    const response = await adminFetch(`/api/admin/users/${selectedUser.id}`, { method: 'DELETE' });
    if (!response.ok) { showNotice((await response.json()).detail || 'Unable to delete user.', 'error'); return; }
    await refreshUsers();
    setShowDeleteModal(false);
    showNotice(`User account ${selectedUser.email} permanently removed.`, 'warning');
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      showNotice('No users to export.', 'error');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Scans Count', 'Interviews Count', 'Joined Date'];
    const rows = filteredUsers.map(u => [
      u.id,
      `"${u.name || ''}"`,
      u.email,
      u.role,
      u.status,
      u.scansCount || 0,
      u.interviewsCount || 0,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ResuIntel_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('User list exported as CSV successfully!', 'success');
  };

  return (
    <div className="admin-users-container animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className={`admin-toast ${notification.type}`}>
          {notification.msg}
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="admin-header-banner">
        <div>
          <div className="admin-badge-tag">
            <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            System Administration
          </div>
          <h2 className="admin-page-title">User Management Portal</h2>
          <p className="admin-page-subtitle">
            Manage system users, grant administrative permissions, reset security credentials, and audit candidate platform activity.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="btn-secondary admin-export-btn" onClick={handleExportCSV}>
            <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button className="btn-primary admin-add-btn" onClick={handleOpenAddModal}>
            <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New User
          </button>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="metric-icon-box blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="metric-val">{totalUsersCount}</div>
            <div className="metric-lbl">Total Registered Users</div>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-box green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div className="metric-val">{activeUsersCount}</div>
            <div className="metric-lbl">Active Accounts</div>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-box purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="metric-val">{adminUsersCount}</div>
            <div className="metric-lbl">Administrators</div>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-box orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div>
            <div className="metric-val">{users.filter(user => user.status === 'suspended').length}</div>
            <div className="metric-lbl">Suspended Users</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="admin-controls-card">
        <div className="admin-search-wrapper">
          <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="admin-search-clear" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="admin-filter-group">
          <div className="filter-item">
            <label className="filter-label">Role:</label>
            <select
              className="admin-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="candidate">Candidate</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Status:</label>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="admin-table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Status</th>
                <th>Scans / Mock Tests</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="admin-empty-cell">
                    <div className="admin-empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 42, height: 42, color: 'var(--text-muted)' }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      <p>No matching users found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isPrimaryAdmin = String(user.id) === String(currentUser?.id);
                  const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                  return (
                    <tr key={user.email} className={user.status === 'suspended' ? 'row-suspended' : ''}>
                      <td>
                        <div className="user-cell">
                          <div className={`user-avatar ${user.role === 'admin' ? 'admin-avatar' : ''}`}>
                            {initials}
                          </div>
                          <div className="user-info">
                            <span className="user-name">
                              {user.name || 'Unnamed User'}
                              {isPrimaryAdmin && <span className="primary-admin-tag">Primary Admin</span>}
                            </span>
                            <span className="user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`badge-role ${user.role}`}>
                          {user.role === 'admin' ? (
                            <>
                              <svg style={{ width: 12, height: 12, marginRight: 4 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                              Admin
                            </>
                          ) : 'Candidate'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge-status ${user.status}`}>
                          <span className="status-dot" />
                          {user.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td>
                        <div className="usage-counts">
                          <span><strong>{user.scansCount || 0}</strong> scans</span>
                          <span className="count-sep">•</span>
                          <span><strong>{user.interviewsCount || 0}</strong> interviews</span>
                        </div>
                      </td>

                      <td>
                        <span className="joined-date">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-group">
                          {/* Toggle Active / Suspended */}
                          <button
                            className={`action-btn status-btn ${user.status === 'active' ? 'suspend' : 'activate'}`}
                            title={user.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                            onClick={() => handleToggleStatus(user)}
                            disabled={isPrimaryAdmin}
                          >
                            {user.status === 'active' ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>

                          {/* Edit Details */}
                          <button
                            className="action-btn edit-btn"
                            title="Edit User Details"
                            onClick={() => handleOpenEditModal(user)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          {/* Reset Password */}
                          <button
                            className="action-btn key-btn"
                            title="Reset User Password"
                            onClick={() => handleOpenResetModal(user)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                            </svg>
                          </button>

                          {/* Delete Account */}
                          <button
                            className="action-btn delete-btn"
                            title="Delete Account"
                            onClick={() => handleOpenDeleteModal(user)}
                            disabled={isPrimaryAdmin}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: ADD NEW USER --- */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-scale-up">
            <div className="modal-header">
              <h3>Create New User Account</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            {formError && <div className="admin-modal-error">{formError}</div>}

            <form onSubmit={handleCreateUser} className="admin-modal-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jane Doe"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="jane.doe@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                  >
                    <option value="candidate">Candidate</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label className="form-label">Account Status</label>
                  <select
                    className="form-input"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT USER --- */}
      {showEditModal && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-scale-up">
            <div className="modal-header">
              <h3>Edit User: {selectedUser.email}</h3>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>

            {formError && <div className="admin-modal-error">{formError}</div>}

            <form onSubmit={handleUpdateUser} className="admin-modal-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    disabled={String(selectedUser.id) === String(currentUser?.id)}
                  >
                    <option value="candidate">Candidate</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label className="form-label">Account Status</label>
                  <select
                    className="form-input"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    disabled={String(selectedUser.id) === String(currentUser?.id)}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: RESET PASSWORD --- */}
      {showResetModal && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-scale-up">
            <div className="modal-header">
              <h3>Reset Password for {selectedUser.name}</h3>
              <button className="modal-close-btn" onClick={() => setShowResetModal(false)}>×</button>
            </div>

            {formError && <div className="admin-modal-error">{formError}</div>}

            <form onSubmit={handleResetPassword} className="admin-modal-form">
              <p className="modal-desc">
                Enter a new password below for <strong>{selectedUser.email}</strong>.
              </p>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowResetModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: DELETE USER --- */}
      {showDeleteModal && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-scale-up danger-modal">
            <div className="modal-header">
              <h3>Delete Account Confirmation</h3>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>

            <div className="danger-modal-body">
              <div className="warning-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 32, height: 32, color: '#EF4444' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <p className="danger-modal-msg">
                Are you sure you want to permanently delete the account for <strong>{selectedUser.name}</strong> ({selectedUser.email})?
                This action cannot be undone.
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={handleDeleteUser}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
