import { Link } from "react-router-dom";
import "./Footer.css";
import FavoriteIcon from '@mui/icons-material/Favorite';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="" className="footer-logo-img" />
          <div>
            <strong>Code<span>Arena</span></strong>
            <p>© {new Date().getFullYear()} CodeArena. All rights reserved.</p>
          </div>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <Link to="/problems">Problems</Link>
          <Link to="/contests">Contests</Link>
          <Link to="/profile">Profile</Link>
        </nav>

        <div className="footer-end">
          <span className="footer-made">
            Made with <FavoriteIcon className="footer-heart" /> for coding competitions
          </span>
          <div className="footer-socials">
            <a href="https://github.com/kuruva-radhakrishna" target="_blank" rel="noopener noreferrer" title="GitHub" aria-label="GitHub">
              <GitHubIcon fontSize="small" />
            </a>
            <a href="https://www.linkedin.com/in/kuruva-radhakrishna-457167260/" target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn">
              <LinkedInIcon fontSize="small" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
