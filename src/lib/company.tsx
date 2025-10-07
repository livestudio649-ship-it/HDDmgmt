import React, { createContext, useContext, useEffect, useState } from 'react';
import { CompanyDetails, getCompanyDetails, saveCompanyDetails } from './storage';

interface CompanyContextValue {
  company: CompanyDetails;
  setCompany: (c: CompanyDetails) => void;
  reload: () => void;
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompanyState] = useState<CompanyDetails>(getCompanyDetails());

  useEffect(() => {
    // when mounted, ensure state matches storage
    setCompanyState(getCompanyDetails());
  }, []);

  const setCompany = (c: CompanyDetails) => {
    saveCompanyDetails(c);
    setCompanyState(c);
  };

  const reload = () => setCompanyState(getCompanyDetails());

  return (
    <CompanyContext.Provider value={{ company, setCompany, reload }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
};

export default CompanyContext;
