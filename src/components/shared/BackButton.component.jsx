import React from 'react';
import styled from 'styled-components';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const StyledButton = styled.button`
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.03em;
  color: #9ca3af;
  gap: 0.35rem;
  margin-bottom: 2rem;
  transition: opacity 150ms ease;
  opacity: 0.85;
  &:hover {
    opacity: 1;
  }
`;

const BackButton = ({ children = 'Back', onClick }) => (
  <StyledButton
    className="border-0 bg-transparent p-0 d-inline-flex align-items-center"
    onClick={onClick}
  >
    <ArrowBackIcon sx={{ fontSize: 13 }} />
    {children}
  </StyledButton>
);

export default BackButton;
