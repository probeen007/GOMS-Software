import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  Wrench,
  DollarSign,
  Globe,
  Search,
  Printer,
  ChevronRight,
  FileText,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Sliders
} from 'lucide-react';

export default function UserManual() {
  const [activeSection, setActiveSection] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    {
      id: 'admin',
      title: 'Administrator',
      icon: Shield,
      subtitle: 'System governance, security audit logs, staff accounts, and financial oversight.',
      tasks: [
        {
          id: 'admin-staff',
          title: 'Staff Accounts & Access Management',
          description: 'Provisioning system credentials for garage personnel.',
          steps: [
            'Navigate to Staff & Attendance from the primary navigation sidebar.',
            'Click Add Staff Member to open the user registration panel.',
            'Input the staff member\'s full legal name, contact phone number, username, and secure password.',
            'Assign the appropriate system role (Admin, Receptionist, Technician, or Accountant).',
            'Click Save Credentials to commit the user account to the authentication database.'
          ]
        },
        {
          id: 'admin-audit',
          title: 'System Security & Audit Trail Inspection',
          description: 'Monitoring database mutations and operational events.',
          steps: [
            'Select Audit Logs from the management menu.',
            'Review the timestamped ledger showing exact user IDs, request IP addresses, and action types.',
            'Use the search filter to query specific invoice numbers, plate numbers, or staff usernames.'
          ]
        },
        {
          id: 'admin-restock',
          title: 'Inventory Purchasing & Expense Authorization',
          description: 'Logging supplier stock purchases and auto-updating financial ledgers.',
          steps: [
            'Navigate to Inventory & Parts and select Record Restock.',
            'Choose the verified supplier vendor from the dropdown catalog.',
            'Specify replacement part SKUs, quantities received, and unit wholesale purchase costs.',
            'Click Commit Purchase. Inventory quantities increment instantly, and an expense voucher is recorded in the cash flow ledger.'
          ]
        },
        {
          id: 'admin-finance',
          title: 'Financial Cash Flow & Revenue Analytics',
          description: 'Reviewing net margins, revenue streams, and shop overheads.',
          steps: [
            'Access Financial Cash Flow from the main navigation menu.',
            'Inspect total revenue collected against operating expenses and restock expenditures.',
            'Apply date range filters to generate weekly, monthly, or quarterly financial statements.'
          ]
        }
      ]
    },
    {
      id: 'receptionist',
      title: 'Receptionist / Front Desk',
      icon: UserCheck,
      subtitle: 'Web booking verification, client intake, diagnostic quotations, and WhatsApp receipts.',
      tasks: [
        {
          id: 'rec-web',
          title: 'Online Web Booking Verification Queue',
          description: 'Reviewing and confirming appointments submitted through the public website.',
          steps: [
            'Navigate to Appointments and select the Web Bookings Queue tab.',
            'Inspect incoming service requests containing client contact information, vehicle specs, and preferred dates.',
            'Click Verify & Convert to check technician availability for the requested time slot.',
            'Confirm the booking. The system automatically provisions the Customer & Vehicle profile and registers the appointment.'
          ]
        },
        {
          id: 'rec-intake',
          title: 'Physical Vehicle Intake & Damage Documentation',
          description: 'Capturing intake mileage, pre-existing vehicle body damage, and inspection photos.',
          steps: [
            'Locate the scheduled appointment and click Check-In upon vehicle arrival.',
            'Record the exact dashboard odometer reading (in kilometers).',
            'Mark pre-existing scratches, dents, or panel wear on the interactive vehicle diagram.',
            'Upload intake photographs from your camera or tablet device.',
            'Confirm check-in to transition status to Checked In and notify the assigned technician.'
          ]
        },
        {
          id: 'rec-quote',
          title: 'Quotation Estimate Dispatch & Customer Approval',
          description: 'Distributing digital repair estimates for customer sign-off.',
          steps: [
            'Open Quotations and select Create Quotation for the checked-in vehicle.',
            'Select spare parts from the live catalog (unit pricing and stock levels update automatically).',
            'Add labor line items with estimated work hours.',
            'Transition quotation status from Draft to Sent to generate a secure approval token link.',
            'Transmit the link via WhatsApp or SMS for client digital authorization.'
          ]
        },
        {
          id: 'rec-payment',
          title: 'Invoice Settlement & WhatsApp Digital Receipts',
          description: 'Processing payments and issuing direct mobile receipts.',
          steps: [
            'Select Invoices & Payments and locate the completed billing record.',
            'Click Record Payment and select the payment tender (Cash, Card, ConnectIPS, or Bank Transfer).',
            'Toggle Send WhatsApp Receipt and submit payment.',
            'A WhatsApp window launches pre-formatted with the official receipt message directed to country code +977.'
          ]
        }
      ]
    },
    {
      id: 'technician',
      title: 'Technician',
      icon: Wrench,
      subtitle: 'Workshop floor execution, live spare parts allocation, diagnostic logging, and job card closure.',
      tasks: [
        {
          id: 'tech-jobs',
          title: 'Work Orders & Floor Queue Navigation',
          description: 'Accessing assigned vehicle repair cards.',
          steps: [
            'Log into the portal and select Servicing or Job Cards.',
            'Review active vehicles assigned specifically to your technician profile.',
            'Click any job card row to launch the workshop floor workspace.'
          ]
        },
        {
          id: 'tech-parts',
          title: 'Inventory Stock Allocation',
          description: 'Recording replacement components consumed during repair.',
          steps: [
            'Within the active Job Card workspace, click Allocate Parts.',
            'Search for the catalog part description or SKU.',
            'Specify the quantity consumed and click Add to Job Card.',
            'Inventory stock balances update automatically in real time.'
          ]
        },
        {
          id: 'tech-logs',
          title: 'Diagnostic Work Logs & Inspection Findings',
          description: 'Documenting mechanical repairs and road test results.',
          steps: [
            'Scroll to the Inspection Findings section inside the active Job Card.',
            'Record mechanical observations, completed repairs, and maintenance notes.',
            'Click Save Notes to update the service record history.'
          ]
        },
        {
          id: 'tech-close',
          title: 'Post-Repair Test Drive & Job Closure',
          description: 'Finalizing work orders for billing authorization.',
          steps: [
            'Complete post-repair quality testing and road inspection.',
            'Input the final odometer reading in Mileage Out.',
            'Click Close Job Card. The work order transitions to Closed, authorizing front-desk tax invoicing.'
          ]
        }
      ]
    },
    {
      id: 'accountant',
      title: 'Accountant',
      icon: DollarSign,
      subtitle: 'Tax invoice generation, loyalty point redemptions, overhead expense logging, and Day Book reconciliation.',
      tasks: [
        {
          id: 'acc-tax',
          title: 'Tax Invoice Management & Credit Notes',
          description: 'Generating itemized bills with statutory tax calculations.',
          steps: [
            'Navigate to Invoices & Payments.',
            'Closed job cards convert into Tax Invoices containing line-item spares, labor, VAT (13%), and discount credits.',
            'Monitor outstanding accounts receivable flagged with Unpaid badges.'
          ]
        },
        {
          id: 'acc-loyalty',
          title: 'Customer Loyalty Points Redemption',
          description: 'Applying earned points credits against active invoice balances.',
          steps: [
            'When processing payment for a client account, inspect their accumulated loyalty points balance.',
            'Select the Redeem Points option in the payment modal.',
            'The system deducts points and applies a matching credit note discount to the invoice subtotal.'
          ]
        },
        {
          id: 'acc-expenses',
          title: 'Operating Overhead Expense Logging',
          description: 'Recording non-inventory shop operational costs.',
          steps: [
            'Navigate to Financial Cash Flow and click Add Expense.',
            'Select the expense category (e.g., Premises Rent, Utilities, Refreshments, Maintenance).',
            'Input the total disbursement amount and select the funding source (Cash or Bank Account).',
            'Click Submit. The expense is cataloged in cash flow statements.'
          ]
        },
        {
          id: 'acc-daybook',
          title: 'Daily Day Book Balancing & Ledger Lock',
          description: 'Reconciling daily cash drawer and bank balances at end of day.',
          steps: [
            'Open Day Book at the conclusion of daily workshop operations.',
            'Select the current operational date to view automated opening balances, daily sales receipts, and disbursements.',
            'Conduct physical cash counting and verify online bank balance statements.',
            'Input actual figures in Cash Closing and Bank Closing fields.',
            'Evaluate variance discrepancies (if any) and click Lock & Close Day Book to finalize the daily ledger.'
          ]
        }
      ]
    },
    {
      id: 'customer',
      title: 'Public Portal',
      icon: Globe,
      subtitle: 'Online appointment requests and digital estimate approvals.',
      tasks: [
        {
          id: 'cust-book',
          title: 'Online Service Booking',
          description: 'Submitting vehicle service requests via the public website.',
          steps: [
            'Access the public garage portal and select Book Appointment.',
            'Provide contact details, vehicle registration number, preferred service category, and appointment date.',
            'Submit the form. The request enters the receptionist verification queue.'
          ]
        },
        {
          id: 'cust-approve',
          title: 'Digital Estimate Sign-Off',
          description: 'Reviewing and approving proposed repair costs on mobile devices.',
          steps: [
            'Open the tokenized estimate URL delivered via WhatsApp or SMS.',
            'Review itemized parts pricing, labor estimates, applicable discounts, and total tax values.',
            'Click Approve Estimate and enter a digital signature to authorize workshop repair work.'
          ]
        }
      ]
    }
  ];

  const currentSection = sections.find((s) => s.id === activeSection) || sections[0];

  const filteredTasks = currentSection.tasks.filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q) ||
      task.steps.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">
            PM Automobiles Works &mdash; Standard Operating Procedures
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal Staff Operations Guide &amp; System Manual
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-4 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors shrink-0 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Manual</span>
        </button>
      </div>

      {/* Main Grid: Left Navigation Sidebar, Right Documentation Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Role Selector Menu */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-1 sticky top-20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 block">
            Role Documentation
          </span>

          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="truncate">{section.title}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-400' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Column: Documentation Body */}
        <div className="lg:col-span-3 space-y-6">
          {/* Section Banner */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">{currentSection.title} Role Guide</h2>
                <p className="text-xs text-slate-500 mt-0.5">{currentSection.subtitle}</p>
              </div>

              {/* Search Filter */}
              <div className="relative w-full sm:w-60">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Filter procedure steps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 outline-none transition-all placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Procedure Tasks */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
                <p className="text-xs text-slate-500">No procedure tasks match your search query.</p>
              </div>
            ) : (
              filteredTasks.map((task, idx) => (
                <div key={task.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Execution Sequence:
                    </span>
                    <div className="space-y-2">
                      {task.steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
