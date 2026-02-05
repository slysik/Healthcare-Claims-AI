# BCBS Claims AI - Frontend

React + TypeScript frontend for the BCBS Claims AI Demo, featuring real-time streaming chat with Claude, interactive data visualizations, and document upload capabilities.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **React Markdown** - Markdown rendering

## Project Structure

```
frontend/
├── index.html              # HTML entry point
├── package.json            # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
├── tailwind.config.js     # Tailwind config
└── src/
    ├── main.tsx           # App entry point
    ├── App.tsx            # Root component with tab routing
    ├── index.css          # Global styles + Tailwind
    ├── lib/
    │   └── api.ts         # Typed API client
    ├── hooks/
    │   └── useChat.ts     # SSE streaming chat hook
    └── components/
        ├── Layout.tsx          # Header, footer, navigation
        ├── ChatPanel.tsx       # Main chat interface
        ├── MessageBubble.tsx   # Individual message display
        ├── AgentTrace.tsx      # LangGraph node status badges
        ├── SqlViewer.tsx       # Collapsible SQL query viewer
        ├── ResultsTable.tsx    # Sortable data table
        ├── ChartView.tsx       # Bar/line/pie charts
        ├── Citations.tsx       # RAG source citations
        └── UploadPanel.tsx     # CSV/PDF upload interface
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

Output will be in `dist/`

## Features

### Chat Interface
- Real-time streaming responses with SSE
- Agent execution trace visualization
- Intent badges (NL2SQL, RAG, Clarification)
- Suggested queries for quick start
- Markdown rendering with table support

### Data Visualization
- SQL query viewer with syntax highlighting
- Sortable results tables (50 row limit display)
- Auto-generated charts (bar, line, pie)
- Performance metrics (timing, retry count)

### Document Features
- RAG citation display with source references
- Expandable citation text preview
- Page number and relevance score display

### Upload Interface
- Drag-and-drop file upload
- CSV → DuckDB data loading
- PDF → Vector search indexing
- Real-time dataset/document status

## API Integration

The frontend proxies `/api/*` requests to the backend at `http://localhost:8000` (configured in `vite.config.ts`).

### Key Endpoints Used

- `GET /api/health` - Health check
- `GET /api/config` - Configuration display
- `GET /api/schema` - Database schema
- `POST /api/chat/stream` - SSE streaming chat
- `POST /api/upload/csv` - CSV upload
- `POST /api/upload/pdf` - PDF upload
- `GET /api/datasets` - List loaded datasets
- `GET /api/documents` - List indexed documents

## Development Notes

### TypeScript Validation
The project uses strict TypeScript settings:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noUncheckedIndexedAccess: true`

### Path Aliases
`@/*` maps to `./src/*` for cleaner imports.

### Styling
- Tailwind utility classes
- Custom BCBS blue color scheme (`#0057B8`)
- Responsive design with max-width containers
- Custom scrollbar styling

### SSE Streaming
The `useChat` hook handles Server-Sent Events:
- Parses `event:` and `data:` lines
- Accumulates answer chunks
- Updates trace events in real-time
- Handles cancellation and retry

## Next Steps

1. **Backend Integration**: Ensure the FastAPI backend is running on port 8000
2. **Environment Variables**: No `.env` needed - API proxy is configured in Vite
3. **Testing**: Add Vitest + React Testing Library
4. **E2E Tests**: Add Playwright tests
5. **Deployment**: Configure for production hosting (Vercel, Netlify, etc.)

## Troubleshooting

### Port Already in Use
If port 5173 is taken, Vite will automatically try the next available port.

### API Connection Errors
Ensure the backend is running at `http://localhost:8000`. Check the Vite proxy configuration in `vite.config.ts`.

### Build Errors
Run `npm run build` to check for TypeScript errors before deployment.

## License

Internal Blue Cross Blue Shield project - not for public distribution.
