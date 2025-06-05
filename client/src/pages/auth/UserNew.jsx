import React, { useState } from 'react';
import Settings from './Settings';
import SettingsPosts from './SettingsPosts';
import './User.css';

export default function User() {
    const [myEmails, setMyEmails] = useState([]);

    return (
        <div className="user-container">
            <div className="settings">
                <Settings myEmails={myEmails} setMyEmails={setMyEmails} />
            </div>
            <div className="settings-posts">
                <SettingsPosts />
            </div>
        </div>
    );
}
