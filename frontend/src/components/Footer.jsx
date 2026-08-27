import React from 'react';
import '../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-text">
        &copy; {new Date().getFullYear()} ResuIntel Platforms. Engineered for developers and professional career placement.
      </p>
      <div className="footer-links">
        <button className="footer-link" onClick={() => alert('Privacy Policy is placeholder only.')}>Privacy Policy</button>
        <button className="footer-link" onClick={() => alert('Terms of Service is placeholder only.')}>Terms of Service</button>
        <button className="footer-link" onClick={() => alert('Contact Support is placeholder only.')}>Contact Support</button>
      </div>
    </footer>
  );
}
