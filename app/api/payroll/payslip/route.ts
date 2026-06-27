import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatMonth } from '@/lib/payroll-calculator';

/**
 * Payslip PDF Generation API
 * Generates HTML/PDF ready payslip for download
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { employee: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const payrollId = searchParams.get('id');

  if (!payrollId) {
    return NextResponse.json({ error: 'Payroll ID is required' }, { status: 400 });
  }

  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
            bankDetails: true,
            personalInfo: true,
          },
        },
      },
    });

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    // Check permissions
    if (
      user.role === 'EMPLOYEE' &&
      payroll.employeeId !== user.employee?.id
    ) {
      return NextResponse.json({ error: 'Unauthorized to view this payslip' }, { status: 403 });
    }

    // Generate payslip HTML
    const payslipHtml = generatePayslipHtml(payroll, user);

    return new NextResponse(payslipHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Error generating payslip:', error);
    return NextResponse.json(
      { error: 'Failed to generate payslip', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML for payslip
 */
function generatePayslipHtml(payroll: any, user: any): string {
  const monthYear = formatMonth(payroll.month);
  const payDate = payroll.paidAt ? new Date(payroll.paidAt).toLocaleDateString('en-IN') : '-';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${payroll.employee.user.name} - ${monthYear}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-info h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .company-info p {
      font-size: 11px;
      opacity: 0.9;
    }
    .payslip-title {
      text-align: right;
    }
    .payslip-title h2 {
      font-size: 20px;
      font-weight: bold;
    }
    .payslip-title p {
      font-size: 11px;
      opacity: 0.9;
    }
    .content {
      padding: 25px;
    }
    .employee-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .employee-info h3, .pay-info h3 {
      font-size: 13px;
      color: #667eea;
      margin-bottom: 10px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 5px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 11px;
    }
    .info-label {
      color: #666;
      font-weight: 500;
    }
    .info-value {
      color: #333;
      font-weight: 600;
    }
    .salary-section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #667eea;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #667eea;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 11px;
    }
    tr:nth-child(even) {
      background: #f8f9fa;
    }
    .text-right {
      text-align: right;
    }
    .total-row {
      background: #667eea !important;
      color: white;
      font-weight: bold;
    }
    .total-row td {
      border-bottom: none;
    }
    .summary-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin-top: 20px;
    }
    .summary-box .label {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .summary-box .amount {
      font-size: 32px;
      font-weight: bold;
    }
    .summary-box .subtext {
      font-size: 11px;
      opacity: 0.8;
      margin-top: 8px;
    }
    .attendance-section {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .attendance-item {
      text-align: center;
      padding: 10px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .attendance-item .value {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    .attendance-item .label {
      font-size: 10px;
      color: #666;
      margin-top: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-note {
      font-size: 10px;
      color: #666;
      max-width: 60%;
    }
    .signature {
      text-align: right;
    }
    .signature-line {
      border-top: 1px solid #333;
      width: 200px;
      margin-top: 5px;
      padding-top: 5px;
      font-size: 11px;
      font-weight: 600;
    }
    .watermark {
      position: fixed;
      bottom: 20px;
      right: 20px;
      font-size: 40px;
      color: rgba(102, 126, 234, 0.1);
      transform: rotate(-45deg);
      pointer-events: none;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>HRMS Company</h1>
        <p>123 Business Park, Tech City</p>
        <p>Email: hr@company.com | Phone: +91 9876543210</p>
      </div>
      <div class="payslip-title">
        <h2>PAYSLIP</h2>
        <p>${monthYear}</p>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Employee & Pay Info -->
      <div class="employee-section">
        <div class="employee-info">
          <h3>Employee Information</h3>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${payroll.employee.user.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Employee Code:</span>
            <span class="info-value">${payroll.employee.employeeCode}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Department:</span>
            <span class="info-value">${payroll.employee.department?.name || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Designation:</span>
            <span class="info-value">${payroll.employee.designation}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Bank Account:</span>
            <span class="info-value">${payroll.employee.bankDetails?.accountNumber || 'XXXX'}</span>
          </div>
        </div>
        <div class="pay-info">
          <h3>Pay Information</h3>
          <div class="info-row">
            <span class="info-label">Pay Period:</span>
            <span class="info-value">${monthYear}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Pay Date:</span>
            <span class="info-value">${payDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">PAN:</span>
            <span class="info-value">${payroll.employee.personalInfo?.panNumber || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">${payroll.status}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Mode:</span>
            <span class="info-value">Bank Transfer</span>
          </div>
        </div>
      </div>

      <!-- Attendance Summary -->
      <div class="section-title">Attendance Summary</div>
      <div class="attendance-section">
        <div class="attendance-item">
          <div class="value">${payroll.presentDays}</div>
          <div class="label">Days Present</div>
        </div>
        <div class="attendance-item">
          <div class="value">${payroll.leaveDays}</div>
          <div class="label">Leave Days</div>
        </div>
        <div class="attendance-item">
          <div class="value">${payroll.absentDays}</div>
          <div class="label">Days Absent</div>
        </div>
        <div class="attendance-item">
          <div class="value">${payroll.overtimeHours}</div>
          <div class="label">Overtime Hours</div>
        </div>
      </div>

      <!-- Earnings -->
      <div class="salary-section">
        <div class="section-title">Earnings</div>
        <table>
          <thead>
            <tr>
              <th>Earnings Component</th>
              <th class="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td class="text-right">${Number(payroll.basicSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>House Rent Allowance (HRA)</td>
              <td class="text-right">${Number(payroll.hra).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Special Allowance</td>
              <td class="text-right">${Number(payroll.specialAllowance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Conveyance Allowance</td>
              <td class="text-right">${Number(payroll.conveyanceAllowance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Medical Allowance</td>
              <td class="text-right">${Number(payroll.medicalAllowance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Overtime Pay</td>
              <td class="text-right">${Number(payroll.overtimePay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Bonus</td>
              <td class="text-right">${Number(payroll.bonus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Incentive</td>
              <td class="text-right">${Number(payroll.incentive).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Arrears</td>
              <td class="text-right">${Number(payroll.arrears).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Leave Encashment</td>
              <td class="text-right">${Number(payroll.leaveEncashment).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Gross Salary (A)</strong></td>
              <td class="text-right"><strong>${Number(payroll.grossSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Deductions -->
      <div class="salary-section">
        <div class="section-title">Deductions</div>
        <table>
          <thead>
            <tr>
              <th>Deduction Component</th>
              <th class="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Provident Fund (PF)</td>
              <td class="text-right">${Number(payroll.pfDeduction).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Employee State Insurance (ESI)</td>
              <td class="text-right">${Number(payroll.esiDeduction).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Income Tax (TDS)</td>
              <td class="text-right">${Number(payroll.taxDeduction).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Professional Tax</td>
              <td class="text-right">${Number(payroll.professionalTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Loan Deduction</td>
              <td class="text-right">${Number(payroll.loanDeduction).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Advance Deduction</td>
              <td class="text-right">${Number(payroll.advanceDeduction).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Leave Deduction (Unpaid Leave)</td>
              <td class="text-right">${Number(payroll.leaveDeduction).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Other Deductions</td>
              <td class="text-right">${Number(payroll.otherDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Deductions (B)</strong></td>
              <td class="text-right"><strong>${Number(payroll.totalDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Net Salary -->
      <div class="summary-box">
        <div class="label">Net Salary (Take Home)</div>
        <div class="amount">₹${Number(payroll.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="subtext">Amount credited to your account</div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-note">
          <p>This is a computer-generated payslip. No signature is required.</p>
          <p style="margin-top: 5px;">For any queries, please contact the HR department within 7 days of receiving this payslip.</p>
        </div>
        <div class="signature">
          <div class="signature-line">Authorized Signatory</div>
          <div style="font-size: 10px; color: #666;">HR Department</div>
        </div>
      </div>
    </div>

    ${payroll.status === 'PAID' ? '<div class="watermark">PAID</div>' : ''}
  </div>

  <script>
    // Auto-print on load (for PDF generation)
    window.onload = function() {
      // Uncomment for auto-print
      // window.print();
    };
  </script>
</body>
</html>
  `.trim();
}
