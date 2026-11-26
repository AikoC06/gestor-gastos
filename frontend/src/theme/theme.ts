import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#0756e8', dark: '#0746b8', light: '#e1edff' },
    background: { default: '#eef2f8', paper: '#ffffff' },
    text: { primary: '#10182d', secondary: '#475671' },
    divider: '#dbe3ef',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    h4: { fontWeight: 750, letterSpacing: '-0.04em' },
    h5: { fontWeight: 700, letterSpacing: '-0.025em' },
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 42, paddingInline: 16 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 20, margin: 16, width: 'calc(100% - 32px)' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '16px 24px' } },
    },
  },
})
