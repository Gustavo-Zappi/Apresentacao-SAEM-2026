import { createContext, useContext } from 'react'

/** O palco está de fato controlando os celulares? (chave válida e último envio aceito) */
export const SyncContext = createContext(true)
export const useSynced = () => useContext(SyncContext)
