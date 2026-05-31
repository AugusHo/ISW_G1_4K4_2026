import { createContext, useContext } from 'react';

export type Vista = 'mobile' | 'desktop';

export const VistaContext = createContext<Vista>('mobile');
export const useVista = () => useContext(VistaContext);
