import React, { useState, useEffect } from 'react';
import { contactsAPI } from '../services/api';
import ContactModal from './ContactModal';
import { useOutletContext } from 'react-router-dom';
import '../styles/Contacts.css';

function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { user } = useOutletContext();
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await contactsAPI.getAll();
            setContacts(response.data);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateContact = async (contactData) => {
        try {
            await contactsAPI.create(contactData);
            fetchContacts();
            setShowModal(false);
        } catch (error) {
            console.error('Error creating contact:', error);
            alert('Failed to create contact');
        }
    };

    const handleDeleteContact = async (id) => {
        if (window.confirm('Are you sure you want to remove this contact?')) {
            try {
                await contactsAPI.delete(id);
                fetchContacts();
            } catch (error) {
                console.error('Error deleting contact:', error);
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading contacts...</div>;
    }

    return (
        <div className="contacts-page">
            <div className="content-header">
                <h2>Emergency Contacts</h2>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Add Contact
                    </button>
                )}
            </div>

            <div className="contacts-grid">
                {contacts.length === 0 ? (
                    <p className="no-data">No contacts to display</p>
                ) : (
                    contacts.map((contact) => (
                        <div key={contact.id} className="contact-card">
                            <div className="contact-avatar">
                                {contact.name.charAt(0)}
                            </div>
                            <h3>{contact.name}</h3>
                            <p className="contact-role">{contact.role}</p>
                            {contact.department && (
                                <p className="contact-department">{contact.department}</p>
                            )}
                            <div className="contact-info">
                                <div className="contact-info-item">
                                    <span>📞</span>
                                    <span>{contact.phone}</span>
                                </div>
                                <div className="contact-info-item">
                                    <span>✉️</span>
                                    <span>{contact.email}</span>
                                </div>
                            </div>
                            {isAdmin && (
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDeleteContact(contact.id)}
                                >
                                    🗑 Remove
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <ContactModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleCreateContact}
                />
            )}
        </div>
    );
}

export default Contacts;
