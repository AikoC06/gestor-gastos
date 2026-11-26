import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ThemeProvider,
  StyledEngineProvider,
} from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import { theme } from './theme/theme'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
)