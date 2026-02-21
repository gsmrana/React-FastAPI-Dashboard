import React, { useState } from 'react';
import { LayoutDashboard, BarChart3, Users, Settings, Bell, Menu, X, TrendingUp, ShoppingCart, DollarSign, User, Upload, FileText } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);

  const menuItems = [
    { text: 'Dashboard', icon: 'dashboard', id: 'dashboard' },
    { text: 'Analytics', icon: 'analytics', id: 'analytics' },
    { text: 'File Upload', icon: 'upload', id: 'upload' },
    { text: 'Users', icon: 'customers', id: 'customers' },
    { text: 'Settings', icon: 'settings', id: 'settings' },
  ];

  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231',
      change: '+12.5%',
      icon: 'dollar',
      bgColor: 'bg-green-500',
      iconColor: 'text-green-500',
    },
    {
      title: 'New Orders',
      value: '1,234',
      change: '+8.2%',
      icon: 'cart',
      bgColor: 'bg-blue-500',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Total Users',
      value: '8,456',
      change: '+5.7%',
      icon: 'user',
      bgColor: 'bg-orange-500',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Growth',
      value: '23.5%',
      change: '+2.1%',
      icon: 'trending',
      bgColor: 'bg-purple-500',
      iconColor: 'text-purple-500',
    },
  ];

  const recentActivities = [
    { user: 'John Doe', action: 'Completed order #1234', time: '2 hours ago', initial: 'JD' },
    { user: 'Jane Smith', action: 'Updated profile', time: '4 hours ago', initial: 'JS' },
    { user: 'Mike Johnson', action: 'Left a review', time: '5 hours ago', initial: 'MJ' },
    { user: 'Sarah Williams', action: 'Made a purchase', time: '6 hours ago', initial: 'SW' },
  ];

  const getMenuIcon = (iconType) => {
    switch (iconType) {
      case 'dashboard':
        return <LayoutDashboard size={20} />;
      case 'analytics':
        return <BarChart3 size={20} />;
      case 'customers':
        return <Users size={20} />;
      case 'upload':
        return <Upload size={20} />;
      case 'settings':
        return <Settings size={20} />;
      default:
        return null;
    }
  };

  const getStatIcon = (iconType) => {
    switch (iconType) {
      case 'dollar':
        return <DollarSign size={32} />;
      case 'cart':
        return <ShoppingCart size={32} />;
      case 'user':
        return <User size={32} />;
      case 'trending':
        return <TrendingUp size={32} />;
      default:
        return null;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus(`Success! File uploaded: ${selectedFile.name}`);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      } else {
        setUploadStatus(`Error: ${response.statusText}`);
      }
    } catch (error) {
      // For demo purposes, simulate a successful upload
      setTimeout(() => {
        setUploadStatus(`Demo: File "${selectedFile.name}" uploaded successfully! (Simulated)`);
        setSelectedFile(null);
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      }, 1500);
    } finally {
      setUploading(false);
    }
  };

  const renderContent = () => {
    if (selectedMenu === 'upload') {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center mb-6">
              <Upload className="text-blue-500 mr-3" size={32} />
              <h3 className="text-2xl font-semibold text-gray-800">File Upload</h3>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
              <FileText className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600 mb-4">Drag and drop your file here or click to browse</p>
              
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <label
                htmlFor="file-input"
                className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
              >
                Select File
              </label>
              
              {selectedFile && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || uploading}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  selectedFile && !uploading
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
              
              {uploadStatus && (
                <p className={`text-sm font-medium ${
                  uploadStatus.includes('Success') || uploadStatus.includes('Demo')
                    ? 'text-green-600'
                    : uploadStatus.includes('Error')
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}>
                  {uploadStatus}
                </p>
              )}
            </div>

          </div>
        </div>
      );
    }

    // Original dashboard content
    return (
      <div className="max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-2">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</h3>
                  <p className={`text-sm font-semibold ${stat.iconColor}`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`${stat.bgColor} bg-opacity-10 p-3 rounded-lg`}>
                  <div className={stat.iconColor}>{getStatIcon(stat.icon)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Overview */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Performance Overview</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Website Traffic</span>
                  <span className="text-sm font-semibold text-gray-800">75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Sales Conversion</span>
                  <span className="text-sm font-semibold text-gray-800">60%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="text-sm font-semibold text-gray-800">90%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {activity.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{activity.user}</p>
                    <p className="text-sm text-gray-600 truncate">{activity.action}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } bg-gradient-to-b from-slate-800 to-slate-900 text-white transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider">DASHBOARD</h1>
        </div>
        <div className="border-t border-slate-700"></div>
        <nav className="px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedMenu(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                selectedMenu === item.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              {getMenuIcon(item.icon)}
              <span className="font-medium">{item.text}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h2 className="text-2xl font-semibold text-gray-800">
                {menuItems.find((item) => item.id === selectedMenu)?.text}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell size={24} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
