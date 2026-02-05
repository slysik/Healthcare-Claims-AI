import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = ['#0057B8', '#003D82', '#4A90D9', '#7AB8F5', '#B3D7FF', '#E8F0FE']

interface Props {
  data: Record<string, unknown>[]
  chartType: 'bar' | 'line' | 'pie'
}

export default function ChartView({ data, chartType }: Props) {
  if (data.length === 0) return null

  const keys = Object.keys(data[0]!)
  const xKey = keys[0]!
  const yKey = keys[1] || keys[0]!

  // Format data - ensure numeric values
  const chartData = data.slice(0, 20).map(row => ({
    ...row,
    [yKey]: typeof row[yKey] === 'string' ? parseFloat(row[yKey] as string) || 0 : row[yKey],
  }))

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#0057B8" radius={[4, 4, 0, 0]} />
          </BarChart>
        )
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke="#0057B8" strokeWidth={2} dot={{ fill: '#0057B8' }} />
          </LineChart>
        )
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}
