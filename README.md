# 🔧 Data Restore Hub - Management System

A modern, professional web application for managing data recovery services, invoices, estimates, and customer records. Built with React, TypeScript, and modern UI components.

## ✨ Key Features

### 📊 **Dashboard & Records Management**
- **Inward Records**: Track incoming devices for recovery (status, customer info, storage details)
- **Outward Records**: Manage returned devices and delivery tracking
- **Job Management**: Monitor job status (Pending → In Progress → Completed)
- **Customer Database**: Store and manage customer information

### 💰 **Billing & Invoices**
- **Invoice Generation**: Create professional GST-compliant invoices
- **Estimate Creation**: Generate detailed cost estimates for customers
- **Print-Ready Documents**: Optimized for printing with company branding
- **GST Calculations**: Automatic tax calculations (CGST/SGST/IGST)
- **Payment Tracking**: Monitor paid/unpaid invoices

### 🏢 **Company Settings**
- **Company Profile**: Manage business details (name, address, GSTIN, contact)
- **Bank Details**: Store bank account information for invoices
- **Custom Templates**: Create reusable Terms & Conditions templates
- **Professional Logo Upload** with advanced processing:
  - **Auto-optimization** to web standards (400x100px, <200KB)
  - **Multi-format support**: PNG, JPEG, WebP with smart detection
  - **Retina/HiDPI support**: Automatic 2x high-resolution versions
  - **Smart compression**: Maintains quality while reducing file size
  - **Thumbnail generation**: Creates optimized previews
  - **File validation**: Prevents invalid uploads (max 5MB)
  - **Real-time stats**: Shows dimensions, size, compression percentage

### 🔐 **Security**
- **Password Protection**: Secure login system
- **Password Management**: Change or reset password
- **Local Storage**: All data stored securely in browser

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works on all devices (desktop, tablet, mobile)
- **Dark Mode Ready**: Modern Tailwind CSS styling
- **Intuitive Navigation**: Easy-to-use dashboard layout
- **Real-time Feedback**: Toast notifications for all actions
- **Loading States**: Visual feedback during operations

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ or Bun runtime
- Modern web browser

### Installation

```bash
# Step 1: Clone the repository
git clone https://github.com/livestudio649-ship-it/data-restore-hub.git

# Step 2: Navigate to the project directory
cd data-restore-hub

# Step 3: Install dependencies
npm install
# or
bun install

# Step 4: Start the development server
npm run dev
# or
bun run dev
```

The application will open at `http://localhost:8080` (or the port shown in terminal).

### Default Login
- **Password**: `admin123`
- Change this in Settings → Security after first login

## 📁 Project Structure

```
data-restore-hub/
├── public/                 # Static assets
│   ├── swaz.png           # Default company logo
│   ├── swaz-logo.png      # Alternative logo
│   └── clear-storage.html # Utility to clear browser storage
├── src/
│   ├── assets/            # Logo utilities
│   │   └── logo.ts        # Logo path constants
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Logo.tsx      # Reusable logo component
│   │   ├── DashboardLayout.tsx
│   │   └── ...
│   ├── lib/              # Utilities & business logic
│   │   ├── storage.ts    # LocalStorage management
│   │   ├── company.tsx   # Company context
│   │   ├── imageProcessor.ts  # Professional image processing
│   │   └── ...
│   ├── pages/            # Application pages
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Settings.tsx
│   │   └── ...
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── LOGO_UPGRADE_COMPLETE.md   # Logo system documentation
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **Image Cropping**: react-image-crop
- **Notifications**: Sonner
- **Storage**: Browser LocalStorage

## 📖 Usage Guide

### Managing Inward Records
1. Navigate to Dashboard → Inward Records
2. Click "Add Inward Record"
3. Fill in customer details, device info, issue description
4. Save record
5. Track status through workflow

### Creating Invoices
1. Go to Dashboard → Invoices
2. Click "Create Invoice"
3. Select customer and add service items
4. System auto-calculates GST
5. Save and print invoice

### Uploading Company Logo
1. Go to Settings → Company Details
2. Upload image file (PNG/JPEG/WebP, max 5MB)
3. Crop the desired area
4. Click "Apply & Optimize"
5. Review optimization stats (size, format, dimensions)
6. Click "Save Company Details"
7. Logo appears on login page, dashboard, and invoices

### Clearing Data
- Open browser console (F12)
- Run: `localStorage.clear()`
- Or visit: `http://localhost:8080/clear-storage.html`

## 🎨 Customization

### Change Company Details
Settings → Company Details → Update fields → Save

### Add Terms & Conditions Templates
Settings → Terms & Conditions → Add Template

### Change Password
Settings → Security → Change Password

## 🔧 Development

### Build for Production
```bash
npm run build
# or
bun run build
```

### Preview Production Build
```bash
npm run preview
# or
bun run preview
```

### Lint Code
```bash
npm run lint
```

## 📝 License

This project is proprietary software for Swaz Data Recovery Lab.

## 🤝 Contributing

Internal project. Contact the development team for contribution guidelines.

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for Swaz Data Recovery Lab**
