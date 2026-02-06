import { useState, useMemo } from 'react'
import {
  TrendingUp,
  DollarSign,
  Target,
  PieChart as PieChartIcon,
  AlertTriangle,
  Lightbulb,
  TrendingDown,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { cn } from '@/lib/cn'
import { MOCK_SPEND_INSIGHTS } from '@/mocks/aiOpportunities'
import type { Insight } from '@/mocks/aiOpportunities'
import { ConfidenceIndicator, AiDisclaimer, HandoffCTA } from './shared'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BCBS_COLORS = ['#0057B8', '#003D82', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'] as const
const CATEGORIES = ['Medical', 'Rx', 'Dental', 'Vision'] as const
const CATEGORY_COLORS: Record<string, string> = {
  Medical: BCBS_COLORS[0] ?? '#0057B8',
  Rx: BCBS_COLORS[1] ?? '#003D82',
  Dental: BCBS_COLORS[2] ?? '#60A5FA',
  Vision: BCBS_COLORS[3] ?? '#93C5FD',
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  icon: React.ReactNode
  label: string
  value: string
  detail?: string
}

function SummaryCard({ icon, label, value, detail }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-bcbs-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-bcbs-600">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const config = {
    savings: {
      bg: 'bg-green-50 border-green-200',
      icon: <Lightbulb className="h-5 w-5 text-green-600" />,
      badge: 'bg-green-100 text-green-700',
    },
    alert: {
      bg: 'bg-amber-50 border-amber-200',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      badge: 'bg-amber-100 text-amber-700',
    },
    trend: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <TrendingDown className="h-5 w-5 text-blue-600" />,
      badge: 'bg-blue-100 text-blue-700',
    },
  } as const

  const c = config[insight.type]

  return (
    <div className={cn('rounded-lg border p-4', c.bg)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{c.icon}</div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                c.badge,
              )}
            >
              {insight.type}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
          <ConfidenceIndicator score={82} label="AI Confidence" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chart Data Builders
// ---------------------------------------------------------------------------

interface StackedBarEntry {
  month: string
  Medical: number
  Rx: number
  Dental: number
  Vision: number
}

interface PieEntry {
  name: string
  value: number
}

interface TrendEntry {
  month: string
  total: number
}

function useChartData() {
  return useMemo(() => {
    const { monthlySpend } = MOCK_SPEND_INSIGHTS

    // Build stacked bar data: group by month, sum per category
    const monthMap = new Map<string, StackedBarEntry>()
    for (const entry of monthlySpend) {
      let row = monthMap.get(entry.month)
      if (!row) {
        row = { month: entry.month, Medical: 0, Rx: 0, Dental: 0, Vision: 0 }
        monthMap.set(entry.month, row)
      }
      const cat = entry.category
      if (cat === 'Medical') row.Medical += entry.amount
      else if (cat === 'Rx') row.Rx += entry.amount
      else if (cat === 'Dental') row.Dental += entry.amount
      else if (cat === 'Vision') row.Vision += entry.amount
    }
    const barData = Array.from(monthMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    )

    // Build pie data: totals per category
    const categoryTotals = new Map<string, number>()
    for (const entry of monthlySpend) {
      categoryTotals.set(entry.category, (categoryTotals.get(entry.category) ?? 0) + entry.amount)
    }
    const pieData: PieEntry[] = Array.from(categoryTotals.entries()).map(([name, value]) => ({
      name,
      value,
    }))

    // Build trend line data: monthly total
    const trendData: TrendEntry[] = barData.map((row) => ({
      month: row.month,
      total: row.Medical + row.Rx + row.Dental + row.Vision,
    }))

    return { barData, pieData, trendData }
  }, [])
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function SpendTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-gray-700">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-2 text-xs text-gray-600">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.name}: ${(item.value ?? 0).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatCurrency(n: number): string {
  return `$${n.toLocaleString()}`
}

function formatShortMonth(month: string): string {
  const parts = month.split('-')
  const monthNum = parts[1]
  if (!monthNum) return month
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const idx = parseInt(monthNum, 10) - 1
  return names[idx] ?? month
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function HealthSpendInsightsModule() {
  const { barData, pieData, trendData } = useChartData()
  const [showAllInsights, setShowAllInsights] = useState(false)

  const { totalSpend, projectedAnnual, insights } = MOCK_SPEND_INSIGHTS

  const deductibleMet = 1_125.40
  const deductibleTotal = 1_500
  const deductiblePct = Math.round((deductibleMet / deductibleTotal) * 100)

  const visibleInsights = showAllInsights ? insights : insights.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bcbs-100">
          <TrendingUp className="h-5 w-5 text-bcbs-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">My Health Spend Insights</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total YTD Spend"
          value={formatCurrency(totalSpend)}
          detail="Across all categories"
        />
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Projected Annual"
          value={formatCurrency(projectedAnnual)}
          detail="+6.2% vs last year"
        />
        <SummaryCard
          icon={<Target className="h-4 w-4" />}
          label="Deductible Progress"
          value={`${deductiblePct}%`}
          detail={`${formatCurrency(deductibleMet)} of ${formatCurrency(deductibleTotal)}`}
        />
        <SummaryCard
          icon={<PieChartIcon className="h-4 w-4" />}
          label="Top Category"
          value="Medical"
          detail="68% of total spend"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Spend Stacked Bar Chart */}
        <div className="rounded-lg border border-bcbs-100 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Monthly Spend by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                tickFormatter={formatShortMonth}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <Tooltip content={<SpendTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
                iconSize={8}
              />
              {CATEGORIES.map((cat) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  stackId="spend"
                  fill={CATEGORY_COLORS[cat]}
                  radius={cat === 'Vision' ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="rounded-lg border border-bcbs-100 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] ?? BCBS_COLORS[4]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 12-Month Trend Line Chart */}
      <div className="rounded-lg border border-bcbs-100 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">12-Month Spend Trend</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              tickFormatter={formatShortMonth}
              tick={{ fontSize: 11, fill: '#6B7280' }}
            />
            <YAxis
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
              tick={{ fontSize: 11, fill: '#6B7280' }}
            />
            <Tooltip
              content={<SpendTooltip />}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke={BCBS_COLORS[0]}
              strokeWidth={2.5}
              dot={{ fill: BCBS_COLORS[0], r: 3 }}
              activeDot={{ r: 5, fill: BCBS_COLORS[0] }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights Panel */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">AI-Powered Insights</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visibleInsights.map((insight) => (
            <InsightCard key={insight.title} insight={insight} />
          ))}
        </div>
        {insights.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAllInsights((prev) => !prev)}
            className="text-sm font-medium text-bcbs-600 hover:text-bcbs-700 transition-colors"
          >
            {showAllInsights ? 'Show fewer insights' : `Show all ${insights.length} insights`}
          </button>
        )}
      </div>

      {/* Trust & Handoff */}
      <AiDisclaimer variant="banner" />
      <div className="flex justify-center">
        <HandoffCTA
          label="Want personalized cost-saving advice?"
          context="health-spend-insights"
        />
      </div>
    </div>
  )
}
