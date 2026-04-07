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
}

export const BooksGrowthChart = ({ data }: Props) => {
  const formattedData = data.map(item => ({
    ...item,
    count: Number(item.count)
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-md w-full h-[400px]">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Libros leídos por mes</h2>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip 
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40}>
            <LabelList dataKey="count" position="top" style={{ fill: '#4f46e5', fontSize: 12, fontWeight: 'bold' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};