import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
};

const PageContainer: React.FC<Props> = ({ children, className }) => (
  <div className={`pv-container ${className || ''}`.trim()}>
    {children}
  </div>
);

export default PageContainer;
