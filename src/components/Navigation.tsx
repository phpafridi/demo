'use client'
import Link from 'next/link';
import React from 'react';
import { useSession } from 'next-auth/react';

export default function Navigation() {
  const { data: session } = useSession();
  const roles = (session?.user?.roles as string[]) || [];
   
  // ✅ Show all if no roles assigned
  const showAll = roles.length === 0;

  const hasRole = (value: string) => showAll || roles.includes(value);
  
  return (
    <ul className="sidebar-menu">

      {/* Dashboard */}
      {hasRole('/') && (
        <li>
          <Link href="/"><i className="fa fa-dashboard"></i><span>Dashboard</span></Link>
        </li>
      )}


      {/* Order Process */}
      {hasRole('Order Process') && (
        <li className="treeview">
          <a href="#"><i className="glyphicon glyphicon-shopping-cart"></i><span>Order Process</span><i className="fa fa-angle-left pull-right"></i></a>
          <ul className="treeview-menu">
            {hasRole('/dashboard/order-process/new-order') && (
              <li><Link href="/dashboard/order-process/new-order"><i className="fa fa-cart-plus"></i><span>New Order</span></Link></li>
            )}
            {hasRole('/dashboard/order-process/manage-order') && (
              <li><Link href="/dashboard/order-process/manage-order"><i className="glyphicon glyphicon-th-list"></i><span>Manage Order</span></Link></li>
            )}
            {hasRole('/dashboard/order-process/manage-invoice') && (
              <li><Link href="/dashboard/order-process/manage-invoice"><i className="glyphicon glyphicon-list-alt"></i><span>Manage Invoice</span></Link></li>
            )}
          </ul>
        </li>
      )}

      {/* Manage Purchase */}
      {hasRole('Manage Purchase') && (
        <li className="treeview">
          <a href="#"><i className="fa fa-truck"></i><span>Manage Purchase</span><i className="fa fa-angle-left pull-right"></i></a>
          <ul className="treeview-menu">

            {/* Supplier */}
            {hasRole('Supplier') && (
              <li className="treeview">
                <a href="#"><i className="glyphicon glyphicon-gift"></i><span>Supplier</span><i className="fa fa-angle-left pull-right"></i></a>
                <ul className="treeview-menu">
                  {hasRole('/dashboard/manage-purchase/supplier/add-supplier') && (
                    <li><Link href="/dashboard/manage-purchase/supplier/add-supplier"><i className="glyphicon glyphicon-plus"></i><span>Add Supplier</span></Link></li>
                  )}
                  {hasRole('/dashboard/manage-purchase/supplier/manage-supplier') && (
                    <li><Link href="/dashboard/manage-purchase/supplier/manage-supplier"><i className="glyphicon glyphicon-briefcase"></i><span>Manage Supplier</span></Link></li>
                  )}
                </ul>
              </li>
            )}

            {/* Purchase */}
            {hasRole('Purchase') && (
              <li className="treeview">
                <a href="#"><i className="glyphicon glyphicon-credit-card"></i><span>Purchase</span><i className="fa fa-angle-left pull-right"></i></a>
                <ul className="treeview-menu">
                  {hasRole('/dashboard/manage-purchase/purchase/new-purchase') && (
                    <li><Link href="/dashboard/manage-purchase/purchase/new-purchase"><i className="glyphicon glyphicon-shopping-cart"></i><span>New Purchase</span></Link></li>
                  )}
                  {hasRole('/dashboard/manage-purchase/purchase/purchase-history') && (
                    <li><Link href="/dashboard/manage-purchase/purchase/purchase-history"><i className="glyphicon glyphicon-th-list"></i><span>Purchase History</span></Link></li>
                  )}
                </ul>
              </li>
            )}
          </ul>
        </li>
      )}

      {/* Product */}
      {hasRole('Product') && (
        <li className="treeview">
          <a href="#"><i className="glyphicon glyphicon-th-large"></i><span>Product</span><i className="fa fa-angle-left pull-right"></i></a>
          <ul className="treeview-menu">
            {hasRole('/dashboard/product/add-product') && (
              <li><Link href="/dashboard/product/add-product"><i className="glyphicon glyphicon-plus"></i><span>Add Product</span></Link></li>
            )}
            {hasRole('/dashboard/product/manage-product') && (
              <li><Link href="/dashboard/product/manage-product"><i className="glyphicon glyphicon-th-list"></i><span>Manage Product</span></Link></li>
            )}
            {hasRole('/dashboard/product/barcode-print') && (
              <li><Link href="/dashboard/product/barcode-print"><i className="glyphicon glyphicon-barcode"></i><span>Barcode Print</span></Link></li>
            )}
            {hasRole('/dashboard/product/damage-product') && (
              <li><Link href="/dashboard/product/damage-product"><i className="glyphicon glyphicon-trash"></i><span>Damage Product</span></Link></li>
            )}

            {/* Category */}
            {hasRole('Category') && (
              <li className="treeview">
                <a href="#"><i className="glyphicon glyphicon-indent-left"></i><span>Category</span><i className="fa fa-angle-left pull-right"></i></a>
                <ul className="treeview-menu">
                  {hasRole('/dashboard/product/category/product-category') && (
                    <li><Link href="/dashboard/product/category/product-category"><i className="glyphicon glyphicon-tag"></i><span>Product Category</span></Link></li>
                  )}
                  {hasRole('/dashboard/product/category/sub-category') && (
                    <li><Link href="/dashboard/product/category/sub-category"><i className="glyphicon glyphicon-tags"></i><span>Sub Category</span></Link></li>
                  )}
                </ul>
              </li>
            )}
          </ul>
        </li>
      )}

      {/* Customer */}
      {hasRole('Customer') && (
        <li className="treeview">
          <a href="#"><i className="glyphicon glyphicon-user"></i><span>Customer</span><i className="fa fa-angle-left pull-right"></i></a>
          <ul className="treeview-menu">
            {hasRole('/dashboard/customer/add-customer') && (
              <li><Link href="/dashboard/customer/add-customer"><i className="glyphicon glyphicon-plus"></i><span>Add Customer</span></Link></li>
            )}
            {hasRole('/dashboard/customer/manage-customer') && (
              <li><Link href="/dashboard/customer/manage-customer"><i className="glyphicon glyphicon-th-list"></i><span>Manage Customer</span></Link></li>
            )}
          </ul>
        </li>
      )}

    
       {hasRole('Ledger') && (
        <li className="treeview">
          <a href="#"><i className="glyphicon glyphicon-book"></i><span>Ledger </span><i className="fa fa-angle-left pull-right"></i></a>
          <ul className="treeview-menu">
              <li><Link href="/dashboard/ledger"><i className="glyphicon glyphicon-book"></i><span>New Ledger</span></Link></li>
          
          </ul>
        </li>
      )}

      {/* Reports */}
      {hasRole('Report') && (
        <li className="treeview">
          <a href="#"><i className="glyphicon glyphicon-signal"></i><span>Report</span><i className="fa fa-angle-left pull-right"></i></a>
          <ul className="treeview-menu">
            {hasRole('/dashboard/reports/sales-report') && (
              <li><Link href="/dashboard/reports/sales-report"><i className="fa fa-bar-chart"></i><span>Sales Report</span></Link></li>
            )}
            {hasRole('/dashboard/reports/sales-summery-report') && (
              <li><Link href="/dashboard/reports/sales-summery-report"><i className="fa fa-circle-o"></i><span>Sales Summery Report</span></Link></li>
            )}
            {hasRole('/dashboard/reports/purchase-report') && (
              <li><Link href="/dashboard/reports/purchase-report"><i className="fa fa-line-chart"></i><span>Purchase Report</span></Link></li>
            )}
            {hasRole('/dashboard/reports/stock-report') && (
              <li><Link href="/dashboard/reports/stock-report"><i className="fa fa-file-o"></i><span>Stock Report</span></Link></li>
            )}
          </ul>
        </li>
      )}

      {/* Settings */}
      {hasRole('Settings') && (
        <li className="treeview">
          <a href="#"><i className="fa fa-cogs"></i><span>Settings</span><i className="fa fa-angle-left pull-right"></i></a>
          <ul className="treeview-menu">
            {hasRole('/dashboard/settings/business-profile') && (
              <li><Link href="/dashboard/settings/business-profile"><i className="glyphicon glyphicon-briefcase"></i><span>Business Profile</span></Link></li>
            )}
            {hasRole('/dashboard/settings/localisation') && (
              <li><Link href="/dashboard/settings/localisation"><i className="fa fa-globe"></i><span>Localisation</span></Link></li>
            )}
            {hasRole('/dashboard/settings/manage-tax-rules') && (
              <li><Link href="/dashboard/settings/manage-tax-rules"><i className="glyphicon glyphicon-credit-card"></i><span>Manage Tax Rules</span></Link></li>
            )}
          </ul>
        </li>
      )}

      {/* Employee Management */}
      {hasRole('Employee Management') && (
        <li className="treeview">
          <a href="#"><i className="entypo-users"></i><span>Employee Management</span><i className="fa fa-angle-left pull-right"></i></a>
          <ul className="treeview-menu">
            {hasRole('/dashboard/employee/employee-list') && (
              <li><Link href="/dashboard/employee/employee-list"><i className="fa fa-users"></i><span>Employee List</span></Link></li>
            )}
            {hasRole('/dashboard/employee/add-employee') && (
              <li><Link href="/dashboard/employee/add-employee"><i className="entypo-user-add"></i><span>Add Employee</span></Link></li>
            )}
          </ul>
        </li>
      )}
    </ul>
  );
}
