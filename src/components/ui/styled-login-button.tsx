import React from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
     button {
    position: relative;
    overflow: hidden;
    border: 1px solid #3b82f6;
    color: white;
    display: inline-block;
    font-size: 15px;
    line-height: 15px;
    padding: 18px 18px 17px;
    text-decoration: none;
    cursor: pointer;
    background: #3b82f6;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    transition: border-color 600ms cubic-bezier(0.48, 0, 0.12, 1);
   }

  button span:first-child {
   position: relative;
   transition: color 600ms cubic-bezier(0.48, 0, 0.12, 1);
   z-index: 10;
  }

  button span:last-child {
   color: white;
   display: block;
   position: absolute;
   bottom: 0;
   transition: all 500ms cubic-bezier(0.48, 0, 0.12, 1);
   z-index: 100;
   opacity: 0;
   top: 50%;
   left: 50%;
   transform: translateY(225%) translateX(-50%);
   height: 14px;
   line-height: 13px;
  }

  button:after {
   content: "";
   position: absolute;
   bottom: -50%;
   left: 0;
   width: 100%;
   height: 100%;
   background-color: black;
   transform-origin: bottom center;
   transition: transform 600ms cubic-bezier(0.48, 0, 0.12, 1);
   transform: skewY(9.3deg) scaleY(0);
   z-index: 50;
  }

     button:hover {
    border-color: black;
   }

   button:hover:after {
    transform-origin: bottom center;
    transform: skewY(9.3deg) scaleY(2);
   }

  button:hover span:last-child {
   transform: translateX(-50%) translateY(-50%);
   opacity: 1;
   transition: all 900ms cubic-bezier(0.48, 0, 0.12, 1);
  }`;

interface StyledLoginButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const StyledLoginButton: React.FC<StyledLoginButtonProps> = ({ onClick, disabled, isLoading }) => {
  return (
    <StyledWrapper>
      <button onClick={onClick} disabled={disabled}>
        <span className="text">
          {isLoading ? 'Signing in...' : 'Login with Google Calendar'}
        </span>
        <span>Thanks!</span>
      </button>
    </StyledWrapper>
  );
}

export default StyledLoginButton;
