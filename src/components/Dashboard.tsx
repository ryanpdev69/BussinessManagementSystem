
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, Package, Users, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [ordersResult, productsResult, customersResult, expensesResult] = await Promise.all([
        supabase.from('orders').select('total_amount'),
        supabase.from('products').select('stock_quantity'),
        supabase.from('customers').select('id'),
        supabase.from('expenses').select('amount')
      ]);

      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalProducts = productsResult.data?.length || 0;
      const totalCustomers = customersResult.data?.length || 0;
      const totalExpenses = expensesResult.data?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      return {
        revenue: totalRevenue,
        products: totalProducts,
        customers: totalCustomers,
        expenses: totalExpenses
      };
    }
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          customers(name)
        `)
        .order('order_date', { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .lt('stock_quantity', 10)
        .order('stock_quantity', { ascending: true });
      return data || [];
    }
  });

  const salesData = [
    { month: 'Jan', sales: 2400 },
    { month: 'Feb', sales: 1398 },
    { month: 'Mar', sales: 9800 },
    { month: 'Apr', sales: 3908 },
    { month: 'May', sales: 4800 },
    { month: 'Jun', sales: 3800 }
  ];

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats?.revenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Products',
      value: stats?.products || 0,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Customers',
      value: stats?.customers || 0,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Total Expenses',
      value: `$${stats?.expenses?.toFixed(2) || '0.00'}`,
      icon: ShoppingCart,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="flex items-center p-6">
                <Icon className={`h-8 w-8 ${stat.color}`} />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders?.map((order) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{order.customers?.name || 'Unknown Customer'}</p>
                    <p className="text-sm text-gray-600">{order.status}</p>
                  </div>
                  <p className="font-bold text-green-600">${Number(order.total_amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts?.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <p className="font-bold text-red-600">{product.stock_quantity} left</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
