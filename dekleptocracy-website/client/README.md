# Dekleptocracy Client

A React-based web application that tracks and visualizes consumer price impacts and cost of living changes across US states.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Environment Variables

| Variable                  | Required | Description                                        |
| ------------------------- | -------- | -------------------------------------------------- |
| `VITE_API_URL`            | No       | Backend API URL (default: `http://localhost:5000`) |
| `VITE_API_URL_PRODUCTION` | No       | Production API URL                                 |
| `VITE_GOOGLE_CLIENT_ID`   | No       | Google OAuth Client ID for social login            |

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed setup instructions.

## Project Structure

```
client/
├── src/
│   ├── api/                    # API client functions
│   │   └── homepage.js         # Homepage data endpoints
│   ├── components/
│   │   ├── charts/             # Data visualization components
│   │   │   └── InteractiveMap/ # US map with state data
│   │   ├── common/             # Shared UI components
│   │   │   ├── AnimatedSection/
│   │   │   ├── Breadcrumbs/
│   │   │   ├── ErrorBoundary/
│   │   │   ├── ErrorMessage/
│   │   │   ├── LoadingSpinner/
│   │   │   ├── LoadingStates/
│   │   │   ├── OfflineIndicator/
│   │   │   ├── ScreenReaderOnly/
│   │   │   ├── SEO/
│   │   │   └── StateDropdown/
│   │   ├── data-display/       # Data presentation components
│   │   │   ├── CostDriverBar/
│   │   │   ├── SocialPostCard/
│   │   │   ├── StatCard/
│   │   │   └── WalletShockCard/
│   │   ├── inputs/             # Form and input components
│   │   │   ├── ProductSearch/
│   │   │   └── TimelineSlider/
│   │   ├── modals/             # Modal dialogs
│   │   │   ├── ProductImpactModal/
│   │   │   └── StateComparison/
│   │   └── skeletons/          # Loading skeleton components
│   ├── context/                # React context providers
│   │   └── HomepageContext.jsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useDebounce.js
│   │   ├── useFocusTrap.js
│   │   ├── useHomepageData.js
│   │   ├── useMediaQuery.js
│   │   ├── useOnlineStatus.js
│   │   └── useStateSelection.js
│   ├── pages/                  # Page components
│   │   ├── Home/               # Homepage with sections
│   │   ├── AboutUs.jsx
│   │   ├── Chatbot.jsx
│   │   ├── ContactUs.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Profile.jsx
│   │   ├── Reports.jsx
│   │   └── ...
│   ├── styles/                 # Global styles
│   │   ├── alerts.css
│   │   ├── cards.css
│   │   └── tokens.css          # Design system tokens
│   └── utils/                  # Utility functions
│       ├── apiUrl.js
│       ├── auth.js
│       ├── googleAuth.js
│       └── preferences.js
├── .env.example                # Environment template
├── ENV_SETUP.md                # Environment setup guide
├── package.json
└── vite.config.js
```

## Available Scripts

| Script                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start development server with hot reload |
| `npm run build`         | Build for production                     |
| `npm run preview`       | Preview production build locally         |
| `npm run lint`          | Run ESLint checks                        |
| `npm run test`          | Run tests in watch mode                  |
| `npm run test:run`      | Run tests once                           |
| `npm run test:coverage` | Run tests with coverage report           |
| `npm run test:ui`       | Run tests with Vitest UI                 |

## Design System

The application uses a custom design system with CSS custom properties defined in `src/styles/tokens.css`:

### Colors

- **Primary**: Orange (`--color-primary: #ff6b35`)
- **Secondary**: Olive (`--color-secondary: #4A5D3F`)
- **Neutrals**: Warm grays with slight tinting

### Typography

- **Font Family**: System font stack
- **Scale**: 12px to 48px with responsive adjustments

### Spacing

- **Base unit**: 4px
- **Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

### Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Tech Stack

| Category   | Technology                   |
| ---------- | ---------------------------- |
| Framework  | React 19                     |
| Routing    | React Router v7              |
| Build Tool | Vite 7                       |
| Styling    | CSS Modules + Tailwind CSS   |
| Maps       | react-simple-maps + TopoJSON |
| Charts     | D3 (scales)                  |
| Testing    | Vitest + Testing Library     |
| Linting    | ESLint 9                     |

## Key Features

- **Interactive US Map**: Choropleth visualization of price impacts by state
- **Wallet Shocks**: Real-time price change notifications
- **Cost Drivers**: Category breakdown of inflation contributors
- **State Comparison**: Side-by-side comparison of up to 4 states
- **Product Search**: Search for specific product price impacts
- **Timeline Slider**: Historical data exploration
- **AI Chatbot**: Natural language queries about price data
- **Offline Support**: Service worker with cached data fallback

## Contributing

1. Create a feature branch from `main`
2. Follow existing code patterns and style
3. Add tests for new functionality
4. Run `npm run lint` and `npm run test` before submitting
5. Submit a pull request with clear description

## API Integration

See [docs/API.md](./docs/API.md) for backend API documentation.

## License

Proprietary - All rights reserved
