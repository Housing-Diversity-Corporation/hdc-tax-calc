import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '7.5vw',
  			md: '2rem',
  			lg: '2rem',
  			xl: '2rem',
  			'2xl': '2rem'
  		},
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			'map-green': '#276221',
  			'map-brown': '#73513e',
  			'map-red': '#7C0A02',
  			'map-pink': '#ffc0cb',
  			'gradient-1': 'var(--gradient-1)',
  			'gradient-2': 'var(--gradient-2)',
  			'gradient-3': 'var(--gradient-3)',
  			'gradient-4': 'var(--gradient-4)',
  			shiki: {
  				light: 'var(--shiki-light)',
  				'light-bg': 'var(--shiki-light-bg)',
  				dark: 'var(--shiki-dark)',
  				'dark-bg': 'var(--shiki-dark-bg)'
  			}
  		},
  		backgroundImage: {
  			'entropic-gradient': 'radial-gradient(ellipse at 20% 30%, var(--gradient-1) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, var(--gradient-2) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, var(--gradient-1) 0%, transparent 50%), linear-gradient(180deg, var(--gradient-4) 0%, var(--gradient-3) 50%, var(--gradient-1) 100%)',
  			'entropic-subtle': 'radial-gradient(ellipse at 20% 30%, var(--gradient-1) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, var(--gradient-2) 0%, transparent 40%), linear-gradient(180deg, var(--gradient-4) 0%, var(--gradient-3) 100%)',
  			'shepherd-coat': 'radial-gradient(ellipse at 25% 20%, var(--gradient-shepherd-4) 0%, transparent 45%), radial-gradient(ellipse at 75% 60%, var(--gradient-shepherd-3) 0%, transparent 50%), radial-gradient(ellipse at 40% 80%, var(--gradient-shepherd-2) 0%, transparent 40%), radial-gradient(ellipse at 60% 40%, var(--gradient-shepherd-4) 0%, transparent 35%), linear-gradient(160deg, var(--gradient-shepherd-2) 0%, var(--gradient-shepherd-1) 40%, var(--gradient-shepherd-2) 70%, var(--gradient-shepherd-1) 100%)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'typing-dot-bounce': {
  				'0%,40%': {
  					transform: 'translateY(0)'
  				},
  				'20%': {
  					transform: 'translateY(-0.25rem)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'typing-dot-bounce': 'typing-dot-bounce 1.25s ease-out infinite'
  		}
  	}
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/container-queries'),
  ],
}

export default config
