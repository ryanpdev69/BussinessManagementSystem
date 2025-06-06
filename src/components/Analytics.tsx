
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const Analytics = () => {
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const [ordersResult, productsResult, expensesResult] = await Promise.all([
        supabase.from('orders').select('total_amount, status, order_date'),
        supabase.from('products').select('category, stock_quantity, price'),
        supabase.from('expenses').select('amount, category, expense_date')
      ]);

      return {
        orders: ordersResult.data || [],
        products: productsResult.data || [],
        expenses: expensesResult.data || []
      };
    }
  });

  // Sales by status
  const salesByStatus = analytics?.orders.reduce((acc: any, order) => {
    acc[order.status] = (acc[order.status] || 0) + Number(order.total_amount);
    return acc;
  }, {});

  const statusData = Object.entries(salesByStatus || {}).map(([status, amount]) => ({
    status,
    amount
  }));

  // Product categories
  const categoryData = analytics?.products.reduce((acc: any, product) => {
    const category = product.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryData || {}).map(([category, count]) => ({
    category,
    count
  }));

  // Monthly expenses
  const expenseData = analytics?.expenses.reduce((acc: any, expense) => {
    const month = new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short' });
    acc[month] = (acc[month] || 0) + Number(expense.amount);
    return acc;
  }, {});

  const monthlyExpenses = Object.entries(expenseData || {}).map(([month, amount]) => ({
    month,
    amount
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Analytics & Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Expenses']} />
                <Line type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-bold text-green-600">
                  ${analytics?.orders.reduce((sum, order) => sum + Number(order.total_amount), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Products:</span>
                <span className="font-bold">{analytics?.products.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Expenses:</span>
                <span className="font-bold text-red-600">
                  ${analytics?.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Order Value:</span>
                <span className="font-bold">
                  ${analytics?.orders.length 
                    ? (analytics.orders.reduce((sum, order) => sum + Number(order.total_amount), 0) / analytics.orders.length).toFixed(2)
                    : '0.00'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
