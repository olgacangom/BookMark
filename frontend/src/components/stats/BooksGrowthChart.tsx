import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LabelList 
} from 'recharts';

interface GrowthData {
  month: string;
  count: string | number; 
}

interface Props {
  data: GrowthData[];
  color?: string;
}

export const BooksGrowthChart = ({ data, color = "#0D9488" }: Props) => {
  const formattedData = data.map(item => ({
    ...item,
    count: Number(item.count)
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 25, right: 20, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1}/>
              <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#a8a29e', fontSize: 11, fontWeight: 'bold' }}
            dy={10}
          />
          <YAxis hide domain={[0, 'dataMax + 2']} />
          <Tooltip 
            cursor={{ fill: '#f5f5f4', radius: 10 }}
            contentStyle={{ 
              borderRadius: '1.2rem', 
              border: 'none', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              backgroundColor: '#1c1917',
              color: '#fff'
            }}
            itemStyle={{ color: color, fontWeight: 'bold' }}
            labelStyle={{ color: '#a8a29e', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
          />
          <Bar dataKey="count" fill="url(#colorBar)" radius={[8, 8, 8, 8]} barSize={32}>
            <LabelList 
              dataKey="count" 
              position="top" 
              style={{ fill: color, fontSize: 12, fontWeight: '900', fontStyle: 'italic' }} 
              offset={10}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};