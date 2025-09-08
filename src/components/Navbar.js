import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  NavbarContainer,
  NavbarContent,
  Logo,
  NavLinks,
  NavLink,
  UserMenu,
  UserButton,
  DropdownMenu,
  DropdownItem,
  MobileMenuButton,
  MobileMenu,
  MobileNavLink
} from '../styles/NavbarStyles';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <NavbarContainer>
      <NavbarContent>
        <Link to="/">
          <Logo>
            <span>🔗</span>
            URL Shortener
          </Logo>
        </Link>

        <NavLinks>
          <NavLink to="/" $isActive={isActive('/')}>
            Home
          </NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" $isActive={isActive('/dashboard')}>
                Dashboard
              </NavLink>
              <NavLink to="/statistics" $isActive={isActive('/statistics')}>
                Statistics
              </NavLink>
            </>
          )}
        </NavLinks>

        <UserMenu>
          {user ? (
            <>
              <UserButton
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)}
              >
                <span>{user.username}</span>
                <span>▼</span>
              </UserButton>
              {isUserMenuOpen && (
                <DropdownMenu>
                  <DropdownItem as={Link} to="/profile">
                    Profile
                  </DropdownItem>
                  <DropdownItem onClick={handleLogout}>
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login" $isActive={isActive('/login')}>
                Login
              </NavLink>
              <NavLink to="/register" $isActive={isActive('/register')}>
                Register
              </NavLink>
            </>
          )}

          <MobileMenuButton
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            ☰
          </MobileMenuButton>
        </UserMenu>
      </NavbarContent>

      {isMobileMenuOpen && (
        <MobileMenu>
          <MobileNavLink to="/" $isActive={isActive('/')} onClick={() => setIsMobileMenuOpen(false)}>
            Home
          </MobileNavLink>
          {user ? (
            <>
              <MobileNavLink to="/dashboard" $isActive={isActive('/dashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink to="/statistics" $isActive={isActive('/statistics')} onClick={() => setIsMobileMenuOpen(false)}>
                Statistics
              </MobileNavLink>
              <MobileNavLink to="/profile" $isActive={isActive('/profile')} onClick={() => setIsMobileMenuOpen(false)}>
                Profile
              </MobileNavLink>
              <MobileNavLink as="button" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                Logout
              </MobileNavLink>
            </>
          ) : (
            <>
              <MobileNavLink to="/login" $isActive={isActive('/login')} onClick={() => setIsMobileMenuOpen(false)}>
                Login
              </MobileNavLink>
              <MobileNavLink to="/register" $isActive={isActive('/register')} onClick={() => setIsMobileMenuOpen(false)}>
                Register
              </MobileNavLink>
            </>
          )}
        </MobileMenu>
      )}
    </NavbarContainer>
  );
};

export default Navbar;
