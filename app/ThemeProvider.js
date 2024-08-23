"use client";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "Poppins, sans-serif",
    h1: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#2B2E3A",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 500,
      color: "#2B2E3A",
    },
    body1: {
      fontSize: "1rem",
      color: "#2B2E3A",
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  palette: {
    text: {
      primary: "#2B2E3A",
      secondary: "#757575",
    },
    primary: {
      main: "#2B2E3A",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#E4E6EF",
      contrastText: "#2B2E3A",
    },
    action: {
      hover: "#1a1d27",
      selected: "#f5f5f5",
    },
    divider: "#e0e0e0",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: "#2B2E3A",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "10px 20px",
          "&:hover": {
            backgroundColor: "#1a1d27",
          },
          "&:active": {
            backgroundColor: "#000000",
          },
        },
        containedSecondary: {
          backgroundColor: "#E4E6EF",
          color: "#2B2E3A",
          "&:hover": {
            backgroundColor: "#d1d3d9",
          },
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          marginBottom: "1rem",
        },
      },
    },
  },
});

export default function MuiThemeProvider({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
