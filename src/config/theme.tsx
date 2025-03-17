// Color palette constants
export const colors = {
  // Light mode colors
  light: {
    primary: '#738fbd',    // Royal blue
    secondary: '#a8c3d6',  // Soft blue
    accent: '#cc6b8e',     // Royal pink
    background: '#f4f1f7',  // Light lavender
    text: '#2d3748',       // Dark gray
    border: '#e2e8f0',     // Light gray
  },
  // Dark mode colors
  dark: {
    primary: '#8ba3d4',    // Lighter royal blue
    secondary: '#2d4a77',  // Dark royal blue
    accent: '#d88ba6',     // Light royal pink
    background: '#1a202c',  // Dark background
    text: '#f7fafc',       // Light text
    border: '#4a5568',     // Dark gray
  },
};

export const transforms = {
  hover: 'transform transition-transform duration-300 hover:scale-105',
  float: 'animate-float',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
};

export const shadows = {
  light: {
    soft: 'shadow-lg hover:shadow-xl transition-shadow duration-300',
    glow: 'shadow-lg hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300',
    colorful: 'shadow-lg hover:shadow-2xl hover:shadow-accent/50 transition-all duration-300',
  },
  dark: {
    soft: 'shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-shadow duration-300',
    glow: 'shadow-lg shadow-primary/20 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300',
    colorful: 'shadow-lg shadow-accent/20 hover:shadow-2xl hover:shadow-accent/40 transition-all duration-300',
  },
};