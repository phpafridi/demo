// /constants/navigationMenus.ts
export type NavItem = {
  title: string;
  path?: string;
  children?: NavItem[];
};

export const navigationMenus: NavItem[] = [
  
  {
    title: 'Order Process',
    children: [
      { title: 'New Order', path: '/dashboard/order-process/new-order' },
      { title: 'Manage Order', path: '/dashboard/order-process/manage-order' },
      { title: 'Manage Invoice', path: '/dashboard/order-process/manage-invoice' },
    ],
  },
  {
    title: 'Manage Purchase',
    children: [
      {
        title: 'Supplier',
        children: [
          { title: 'Add Supplier', path: '/dashboard/manage-purchase/supplier/add-supplier' },
          { title: 'Manage Supplier', path: '/dashboard/manage-purchase/supplier/manage-supplier' },
        ],
      },
      {
        title: 'Purchase',
        children: [
          { title: 'New Purchase', path: '/dashboard/manage-purchase/purchase/new-purchase' },
          { title: 'Purchase History', path: '/dashboard/manage-purchase/purchase/purchase-history' },
        ],
      },
    ],
  },
  {
    title: 'Product',
    children: [
      { title: 'Add Product', path: '/dashboard/product/add-product' },
      { title: 'Manage Product', path: '/dashboard/product/manage-product' },
      { title: 'Barcode Print', path: '/dashboard/product/barcode-print' },
      { title: 'Damage Product', path: '/dashboard/product/damage-product' },
      {
        title: 'Category',
        children: [
          { title: 'Product Category', path: '/dashboard/product/category/product-category' },
          { title: 'Sub Category', path: '/dashboard/product/category/sub-category' },
        ],
      },
    ],
  },
  {
    title: 'Customer',
    children: [
      { title: 'Add Customer', path: '/dashboard/customer/add-customer' },
      { title: 'Manage Customer', path: '/dashboard/customer/manage-customer' },
    ],
  },
  {
    title: 'Ledger',
    children: [
      { title: 'Ledger', path: '/dashboard/ledger' },
    
    ],
  },
  {
    title: 'Report',
    children: [
      { title: 'Sales Report', path: '/dashboard/reports/sales-report' },
      { title: 'Sales Summery Report', path: '/dashboard/reports/sales-summery-report' },
      { title: 'Purchase Report', path: '/dashboard/reports/purchase-report' },
      { title: 'Stock Report', path: '/dashboard/reports/stock-report' },
    ],
  },
  {
    title: 'Settings',
    children: [
      { title: 'Business Profile', path: '/dashboard/settings/business-profile' },
      { title: 'Localisation', path: '/dashboard/settings/localisation' },
      { title: 'Manage Tax Rules', path: '/dashboard/settings/manage-tax-rules' },
    ],
  },
  {
    title: 'Employee Management',
    children: [
      { title: 'Employee List', path: '/dashboard/employee/employee-list' },
      { title: 'Add Employee', path: '/dashboard/employee/add-employee' },
    ],
  },
];
