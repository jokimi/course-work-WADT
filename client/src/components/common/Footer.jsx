import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Footer.css';

const logoPath = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/img/purepawsome.jpg` : '/img/purepawsome.jpg';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <Link to="/" className="footer-logo">
                        <img 
                            src={logoPath}
                            alt="Pure Paw-some!" 
                            className="footer-logo-image"
                        />
                    </Link>
                    <div className="footer-copyright">
                        <p>&copy; {new Date().getFullYear()} Pure Paw-some. Все права защищены.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

